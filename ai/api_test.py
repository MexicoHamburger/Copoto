import requests
import json

# --- 설정 ---
# Flask 서버가 실행 중인 주소와 포트
API_URL = "http://127.0.0.1:5000/predict"

# 테스트할 문장
test_sentence = "댓글에 빠순이들 몰려와서 즈그 주인님 쉴드치는 꼴 좀 봐"
not_hate_sentence = "쉴드가 아니라 국가가 면제해준거야."

# --- API 요청 함수 ---
def test_api(text_to_test):
    """
    주어진 텍스트로 API에 POST 요청을 보내고 응답을 출력합니다.
    """
    # 서버에 보낼 데이터 (JSON 형식)
    data = {"text": text_to_test}
    
    # 요청 헤더
    headers = {"Content-Type": "application/json"}

    try:
        print(f"▶ 요청 문장: \"{text_to_test}\"")
        
        # POST 요청 보내기
        response = requests.post(API_URL, headers=headers, data=json.dumps(data))
        
        # 응답 상태 코드 확인
        response.raise_for_status() # 200번대가 아닐 경우 예외 발생
        
        # 응답 결과 출력
        print("◀ 응답 결과:")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))

    except requests.exceptions.RequestException as e:
        print(f"오류: API 요청 중 문제가 발생했습니다 - {e}")

# --- 테스트 실행 ---
if __name__ == "__main__":
    print("--- 혐오 발언 분류 API 테스트 시작 ---\n")
    
    # 첫 번째 문장 테스트
    test_api(test_sentence)
    
    print("\n" + "-"*30 + "\n") # 구분선
    
    # 두 번째 문장 테스트
    test_api(not_hate_sentence)
    
    print("\n--- 테스트 종료 ---")