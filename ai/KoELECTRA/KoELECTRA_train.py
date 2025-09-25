# 1. 라이브러리 설치
# pip install transformers torch datasets scikit-learn accelerate peft

# 2. 필요한 라이브러리 임포트
import torch
import evaluate
import pandas as pd
from datasets import Dataset
from sklearn.model_selection import train_test_split
from transformers import AutoTokenizer, AutoModelForSequenceClassification, TrainingArguments, Trainer
from peft import LoraConfig, get_peft_model
import numpy as np

# 3. 데이터 불러오기 및 분할
# 'hate_speech_dataset.csv' 파일이 현재 디렉토리에 있다고 가정
try:
    df = pd.read_csv('combined_hate_speech_dataset.csv')
    print("데이터셋을 성공적으로 불러왔습니다.")
    print("데이터셋 샘플:")
    print(df.head())
except FileNotFoundError:
    print("오류: 'hate_speech_dataset.csv' 파일을 찾을 수 없습니다.")
    exit()

# 'sentence' 컬럼을 'text'로, 'is_hate' 컬럼을 'labels'로 이름 변경
# Hugging Face Trainer가 표준적으로 사용하는 컬럼명에 맞추기 위함
df = df.rename(columns={'sentence': 'text', 'is_hate': 'labels'})

# (수정) 데이터를 학습+검증 세트와 평가 세트로 먼저 분할 (9:1 비율)
train_val_df, test_df = train_test_split(df, test_size=0.1, random_state=42, stratify=df['labels'])

# (수정) 학습+검증 세트를 다시 학습 세트와 검증 세트로 분할 (8:1 비율)
# 이렇게 하면 전체 데이터 대비 대략 학습 80%, 검증 10%, 평가 10%가 됩니다.
train_df, val_df = train_test_split(train_val_df, test_size=1/9, random_state=42, stratify=train_val_df['labels'])

# Pandas DataFrame을 Hugging Face Dataset 형식으로 변환
train_dataset = Dataset.from_pandas(train_df)
val_dataset = Dataset.from_pandas(val_df)

# 4. 토크나이저 및 기본 모델 로드
model_name = "monologg/koelectra-base-discriminator"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=2)

def tokenize_function(examples):
    # 'text' 컬럼을 토큰화하고 필요한 모든 입력(input_ids, attention_mask 등)을 반환
    return tokenizer(examples['text'], padding=True, truncation=True)

tokenized_train_dataset = train_dataset.map(tokenize_function, batched=True)
tokenized_val_dataset = val_dataset.map(tokenize_function, batched=True)

# 5. LoRA 설정 및 모델 적용 (핵심)
lora_config = LoraConfig(
    r=8,
    lora_alpha=16,
    target_modules=["query", "value"], # LoRA를 적용할 모델의 레이어
    lora_dropout=0.1,
    bias="none",
    task_type="SEQ_CLS",
)
peft_model = get_peft_model(model, lora_config)

print("\n--------------------------")
print("LoRA가 적용된 학습 가능 파라미터:")
peft_model.print_trainable_parameters()
print("--------------------------")

# 6. 학습 파라미터 및 평가 지표 정의
training_args = TrainingArguments(
    output_dir="./koelectra_hate_speech_lora",
    learning_rate=2e-5,
    per_device_train_batch_size=16,
    per_device_eval_batch_size=16,
    num_train_epochs=3,
    weight_decay=0.01,
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
)

# 평가 지표 함수 정의 (F1-score)
metric = evaluate.load("f1")
def compute_metrics(eval_pred):
    predictions, labels = eval_pred
    predictions = np.argmax(predictions, axis=1)
    return metric.compute(predictions=predictions, references=labels, average="binary")

# 7. Trainer 객체 생성 및 학습 시작
trainer = Trainer(
    model=peft_model,
    args=training_args,
    train_dataset=tokenized_train_dataset,
    eval_dataset=tokenized_val_dataset,
    tokenizer=tokenizer,
    compute_metrics=compute_metrics,
)

print("\n모델 학습을 시작합니다...\n")
trainer.train()

# 8. 학습된 모델 저장
trainer.save_model("final_koelectra_lora_model")
print("\n모델 학습이 완료되었으며 'final_koelectra_lora_model' 디렉토리에 저장되었습니다.")