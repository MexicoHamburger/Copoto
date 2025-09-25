import os
import pandas as pd
from dotenv import load_dotenv
from openai import OpenAI
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from tqdm import tqdm
import time

# .env 파일에서 환경 변수 로드
load_dotenv()

# 환경변수로부터 API 키 가져오기
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY 환경 변수가 설정되지 않았습니다. .env 파일을 확인해주세요.")

client = OpenAI(api_key=openai_api_key)

def detect_hate_speech(user_input):
    """
    OpenAI API를 사용하여 주어진 문장이 혐오 표현인지 판단합니다.
    혐오 표현이면 '1', 아니면 '0'을 반환합니다.
    """
    # 프롬프트 예시 (튜닝 가능)
    prompt = (
        f"""
        당신은 문장에서 혐오 표현을 탐지해서, 혐오 표현이 있다면 '1', 없다면 '0'을 출력하는 모델입니다.
        혐오 표현 :
        1. 직접적인 욕설, 멸칭, Slur (우회표현 포함)
        2. 인종/민족/국적/종교/성별/장애/연령/출신지/외모/경제상태 등 특성을 근거로 한 비하 유포
        3. 특정 개인/집단에 대한 폭력/해악/배제 등 제거 박탈 요구 및 위협
        4. 특정 직업군/지역/커뮤니티 전체에 대한 일반화된 조롱 및 폄하
        
        다음은 혐오가 아닙니다.
        1. 성별/연령 등의 단순한 언급만 있을 때
        2. 일반적 불만/감탄/중립적 사실 서술, 비판적 인용
        문장: "{user_input}"
        """
    )

    messages = [
        {"role": "system", "content": "당신은 혐오 표현 감지 AI입니다."},
        {"role": "user", "content": prompt}
    ]
    
    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",      # 최신 모델 사용 (또는 gpt-4o 등)
            messages=messages,
            temperature=0,           # 일관된 결과를 위해 0으로 설정
            max_tokens=2             # '0' 또는 '1'만 반환하도록 제한
        )
        result = response.choices[0].message.content.strip()
        # API 응답이 '1' 또는 '0'이 아닐 경우를 대비한 안전장치
        if result == "1":
            return "1"
        elif result == "0":
            return "0"
        else:
            print("0과 1이 아닌 다른 것이 들어왔습니다. 0을 반환합니다.")
            print(f"result: {result}")
            return "0"
    except Exception as e:
        print(f"API 호출 중 오류 발생: {e}")
        # 오류 발생 시 안전하게 '0' (혐오 표현 아님)으로 처리하거나, 다른 방식으로 처리 가능
        return "0"

def evaluate_performance(csv_path, num_samples=None):
    """
    CSV 파일의 데이터를 사용하여 혐오 발언 탐지 모델의 성능을 평가합니다.
    """
    print(f"'{csv_path}' 파일을 로드합니다.")
    try:
        df = pd.read_csv(csv_path)
    except FileNotFoundError:
        print(f"오류: '{csv_path}' 파일을 찾을 수 없습니다.")
        return

    # 데이터셋의 상위 num_samples 개수만큼 샘플링
    if num_samples is None:
        print("전체 데이터셋에 대해 평가를 진행합니다.")
        num_samples = len(df)
    elif len(df) < num_samples:
        print(f"경고: 데이터셋의 전체 행({len(df)})이 {num_samples}보다 작습니다. 전체 데이터로 평가합니다.")
        num_samples = len(df)

    sample_df = df.head(num_samples)

    true_labels = []
    predicted_labels = []

    print(f"총 {num_samples}개의 문장에 대해 혐오 표현 탐지를 시작합니다...")
    
    # tqdm을 사용하여 진행 상황 표시
    for index, row in tqdm(sample_df.iterrows(), total=num_samples, desc="평가 진행 중"):
        sentence = row['text']
        true_label = int(row['labels'])
        
        # API 호출 및 예측
        prediction_str = detect_hate_speech(sentence)
        predicted_label = int(prediction_str)
        
        true_labels.append(true_label)
        predicted_labels.append(predicted_label)
        
        # API 속도 제한을 피하기 위해 약간의 지연 추가
        # time.sleep(0.5)

    print("\n성능 평가 결과를 계산합니다...")

    # 성능 지표 계산
    accuracy = accuracy_score(true_labels, predicted_labels)
    precision = precision_score(true_labels, predicted_labels, zero_division=0)
    recall = recall_score(true_labels, predicted_labels, zero_division=0)
    f1 = f1_score(true_labels, predicted_labels, zero_division=0)

    # 결과 출력
    print("\n--- 최종 성능 평가 결과 ---")
    print(f"  - 평가 샘플 수: {num_samples}개")
    print(f"  - 정확도 (Accuracy):  {accuracy:.4f}")
    print(f"  - 정밀도 (Precision): {precision:.4f}")
    print(f"  - 재현율 (Recall):    {recall:.4f}")
    print(f"  - F1 점수 (F1-Score):  {f1:.4f}")
    print("---------------------------\n")

if __name__ == "__main__":
    # 사용자가 업로드한 파일 경로
    CSV_FILE_PATH = 'test_combined_dataset.csv'
    evaluate_performance(CSV_FILE_PATH, num_samples=20000)
