from flask import Flask, request, jsonify
from transformers import AutoTokenizer, AutoModelForSequenceClassification
# from peft import LoraConfig, get_peft_model
from peft import PeftConfig, PeftModel
import torch
import numpy as np

# --- 1. Flask 앱 초기화 ---
app = Flask(__name__)

# --- 2. 모델 및 토크나이저 로드 ---
MODEL_DIR = "KcELECTRA/final_kcelectra_lora_model"
model = None
tokenizer = None

def load_model():
    """서버 시작 시 모델을 메모리에 로드하는 함수"""
    global model, tokenizer
    try:
        print(f"'{MODEL_DIR}'에서 모델을 로드합니다...")
        
        # (수정) LoraConfig 대신 PeftConfig 사용
        config = PeftConfig.from_pretrained(MODEL_DIR)
        
        # (수정) 설정에 명시된 "베이스" 모델을 정확히 로드
        base_model = AutoModelForSequenceClassification.from_pretrained(
            config.base_model_name_or_path, 
            num_labels=2
        )
        
        # (수정) 베이스 모델과 LoRA 어댑터를 결합하여 최종 모델 생성
        model = PeftModel.from_pretrained(base_model, MODEL_DIR)
        tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
        
        # 모델을 평가 모드로 설정
        model.eval()
        
        print("모델 로딩이 완료되었습니다.")
        
    except Exception as e:
        print(f"모델 로딩 중 오류 발생: {e}")
        model = None
        tokenizer = None

# --- 3. 예측 함수 정의 ---
def predict(text):
    """입력된 텍스트를 모델로 예측하는 함수"""
    if not model or not tokenizer:
        return "모델이 로드되지 않았습니다."

    try:
        # 텍스트 토큰화
        inputs = tokenizer(
            text, 
            return_tensors="pt", 
            padding=True, 
            truncation=True, 
            max_length=128
        )

        # 예측 수행
        with torch.no_grad():
            outputs = model(**inputs)
            
        # 결과 해석 (소프트맥스를 통해 확률값으로 변환)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        prediction = np.argmax(probs.numpy())
        
        # 결과 반환 (0: 혐오 아님, 1: 혐오)
        result = {
            'is_hate': int(prediction),
            'probability': {
                'not_hate': probs[0][0].item(),
                'hate': probs[0][1].item()
            }
        }
        return result

    except Exception as e:
        return f"예측 중 오류 발생: {e}"

# --- 4. API 엔드포인트 생성 ---
@app.route('/predict', methods=['POST'])
def handle_prediction():
    if not request.is_json:
        return jsonify({"error": "요청 형식이 JSON이 아닙니다."}), 400

    data = request.get_json()
    text = data.get('text', '')

    if not text:
        return jsonify({"error": "JSON 데이터에 'text' 필드가 없습니다."}), 400

    # 예측 실행
    prediction_result = predict(text)
    
    # 예측 결과에 따라 응답 반환
    if isinstance(prediction_result, str): # 오류 발생 시
        return jsonify({"error": prediction_result}), 500
    else:
        return jsonify(prediction_result)

# --- 5. 서버 실행 ---
if __name__ == '__main__':
    load_model() # 서버 실행 전 모델 로드
    app.run(port=5000)