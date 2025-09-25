import pandas as pd
from datasets import Dataset
import numpy as np
import evaluate
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from peft import PeftModel

# 1. 모델과 토크나이저 로드
base_model_name = "beomi/KcELECTRA-base-v2022"
tokenizer = AutoTokenizer.from_pretrained(base_model_name)
base_model = AutoModelForSequenceClassification.from_pretrained(base_model_name, num_labels=2)

# 저장된 LoRA 모델 로드
lora_model_dir = "final_kcelectra_lora_model"
model = PeftModel.from_pretrained(base_model, lora_model_dir)

# 2. 테스트 데이터셋 준비 (이전 단계에서 분리한 test_df를 사용)
test_df = pd.read_csv('test_combined_dataset.csv') # 테스트 데이터가 따로 있다면 이 코드 사용
test_df = test_df.head(20000)
test_df = test_df.rename(columns={'sentence': 'text', 'is_hate': 'labels'})
test_dataset = Dataset.from_pandas(test_df)
test_dataset = test_dataset.map(lambda examples: tokenizer(examples['text'], padding=True, truncation=True), batched=True)
test_dataset.set_format(type="torch", columns=["input_ids", "attention_mask", "labels"])

# test_dataset = val_dataset.map(lambda examples: tokenizer(examples['text'], padding=True, truncation=True), batched=True)

# 3. Trainer 객체 생성 (평가용)
# TrainingArguments는 필수 인자이므로, 평가용으로 간단히 정의
eval_args = TrainingArguments(output_dir="./eval_output", remove_unused_columns=False)
trainer = Trainer(model=model, args=eval_args)

# 4. 예측 수행
predictions = trainer.predict(test_dataset)
logits = predictions.predictions
preds = np.argmax(logits, axis=1)
labels = predictions.label_ids

# 5. 성능 지표 계산
accuracy_metric = evaluate.load("accuracy")
f1_metric = evaluate.load("f1")
precision_metric = evaluate.load("precision")
recall_metric = evaluate.load("recall")

accuracy = accuracy_metric.compute(predictions=preds, references=labels)
f1_score = f1_metric.compute(predictions=preds, references=labels, average="binary")
precision = precision_metric.compute(predictions=preds, references=labels, average="binary")
recall = recall_metric.compute(predictions=preds, references=labels, labels=[0, 1], average="binary")

print("\n--- 모델 성능 평가 ---")
print(f"Accuracy: {accuracy['accuracy']:.4f}")
print(f"F1-Score: {f1_score['f1']:.4f}")
print(f"Precision: {precision['precision']:.4f}")
print(f"Recall: {recall['recall']:.4f}")