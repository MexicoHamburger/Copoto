import os
import pandas as pd
from dotenv import load_dotenv
import requests
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
from tqdm import tqdm
import time

# .env 파일에서 환경 변수 로드
load_dotenv()
clova_api_key = os.getenv("CLOVA_API_KEY")  # 네이버 클로바 스튜디오 API 키
if not clova_api_key:
    raise ValueError("CLOVA_API_KEY 환경 변수가 설정되지 않았습니다. .env 파일을 확인해 주세요.")

# 네이버 클로바 스튜디오 최신 API 엔드포인트 및 모델명
API_URL = "https://clovastudio.stream.ntruss.com/v3/chat-completions/HCX-DASH-002"  # 최신 API URL
MODEL = "HCX-DASH-002"  # 실제 사용 모델명은 콘솔 및 문서 참고

def detect_hate_speech_clova(user_input):
    prompt = (
        f"""당신은 문장에서 혐오 표현을 탐지해서, 혐오 표현이 있다면 '1', 없다면 '0'을 출력하는 모델입니다.
        혐오 표현 :
        1. 직접적인 욕설, 멸칭, Slur (우회표현 포함)
        2. 인종/민족/국적/종교/성별/장애/연령/출신지/외모/경제상태 등 특성을 근거로 한 비하 유포
        3. 특정 개인/집단에 대한 폭력/해악/배제 등 제거 박탈 요구 및 위협
        4. 특정 직업군/지역/커뮤니티 전체에 대한 일반화된 조롱 및 폄하
        
        다음은 혐오가 아닙니다.
        1. 성별/연령 등의 단순한 언급만 있을 때
        2. 일반적 불만/감탄/중립적 사실 서술, 비판적 인용
        문장: "{user_input}" """
    )
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 2,
        "temperature": 0
    }
    headers = {
        "Authorization": f"Bearer {clova_api_key}",
        "Content-Type": "application/json"
    }
    try:
        response = requests.post(API_URL, json=payload, headers=headers)
        response.raise_for_status()
        content = response.json().get("result", {}).get("message", {}).get("content", "").strip()
        return "1" if content == "1" else "0"
    except Exception as e:
        print(f"API 호출 중 오류 발생: {e}")
        return "0"


def evaluate_performance(csv_path, num_samples=100):
    print(f"'{csv_path}' 파일을 로드합니다.")
    try:
        df = pd.read_csv(csv_path)
    except FileNotFoundError:
        print(f"오류: '{csv_path}' 파일을 찾을 수 없습니다.")
        return
    if len(df) < num_samples:
        print(f"경고: 데이터셋의 전체 행({len(df)})이 {num_samples}보다 작습니다. 전체 데이터로 평가합니다.")
        num_samples = len(df)
    sample_df = df.head(num_samples)
    true_labels, predicted_labels = [], []
    print(f"총 {num_samples}개의 문장에 대해 혐오 표현 탐지를 시작합니다...")

    for index, row in tqdm(sample_df.iterrows(), total=num_samples, desc="평가 진행 중"):
        sentence = row['text']
        true_label = int(row['labels'])
        prediction_str = detect_hate_speech_clova(sentence)
        predicted_label = int(prediction_str)
        true_labels.append(true_label)
        predicted_labels.append(predicted_label)
        time.sleep(0.5)  # API rate limit 회피

    print("\n성능 평가 결과를 계산합니다...")
    accuracy = accuracy_score(true_labels, predicted_labels)
    precision = precision_score(true_labels, predicted_labels, zero_division=0)
    recall = recall_score(true_labels, predicted_labels, zero_division=0)
    f1 = f1_score(true_labels, predicted_labels, zero_division=0)
    print("\n--- 최종 성능 평가 결과 ---")
    print(f" - 평가 샘플 수: {num_samples}개")
    print(f" - 정확도 (Accuracy): {accuracy:.4f}")
    print(f" - 정밀도 (Precision): {precision:.4f}")
    print(f" - 재현율 (Recall): {recall:.4f}")
    print(f" - F1 점수 (F1-Score): {f1:.4f}")
    print("---------------------------\n")

if __name__ == "__main__":
    CSV_FILE_PATH = 'test_combined_dataset.csv'
    evaluate_performance(CSV_FILE_PATH, num_samples=100)
