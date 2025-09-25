import pandas as pd

def run_preprocessing():
    """
    세 개의 혐오 발언 데이터셋을 불러와 병합하고,
    이진 분류를 위한 CSV 파일로 전처리하여 저장합니다.
    """
    # 1. 처리할 파일 목록 정의
    files_to_process = [
        'kmhas_train.txt',
        'kmhas_valid.txt',
        'kmhas_test.txt'
    ]
    
    output_filename = 'hate_speech_dataset.csv'

    print("데이터 전처리를 시작합니다...")

    # 2. 파일 불러오기
    try:
        df_list = [pd.read_csv(file, sep='\t') for file in files_to_process]
        print(f"{len(df_list)}개의 데이터 파일을 성공적으로 불러왔습니다.")
    except FileNotFoundError as e:
        print(f"\n[오류] 파일을 찾을 수 없습니다: {e.filename}")
        print("스크립트와 동일한 위치에 데이터 파일들이 있는지 확인해주세요.")
        return # 파일이 없으면 함수 종료

    # 3. 데이터프레임 하나로 합치기
    combined_df = pd.concat(df_list, ignore_index=True)
    print(f"총 {len(combined_df)}개의 데이터로 병합되었습니다.")

    # 4. 'label'을 'is_hate' (0 또는 1)로 변환하는 함수
    def convert_to_binary_hate_label(label_str):
        """
        '8'(해당사항없음)만 있으면 0, 그 외의 숫자가 하나라도 있으면 1을 반환합니다.
        """
        labels = str(label_str).split(',')
        # '8'이 아닌 유효한 레이블이 하나라도 있는지 확인
        if any(l.strip() and l.strip() != '8' for l in labels):
            return 1
        return 0

    # 5. 전처리 적용
    # 'document' 열의 이름을 'sentence'로 변경
    combined_df = combined_df.rename(columns={'document': 'sentence'})
    # 'label' 열을 사용해 'is_hate' 열 생성
    combined_df['is_hate'] = combined_df['label'].apply(convert_to_binary_hate_label)

    # 6. 최종적으로 필요한 열만 선택
    final_df = combined_df[['sentence', 'is_hate']]

    # 7. CSV 파일로 저장
    try:
        # Excel에서 한글이 깨지지 않도록 'utf-8-sig' 인코딩 사용
        final_df.to_csv(output_filename, index=False, encoding='utf-8-sig')
        print(f"\n전처리가 완료되었습니다. 결과가 '{output_filename}' 파일로 저장되었습니다.")
        
        # 결과 확인
        print("\n--- 생성된 파일 정보 ---")
        print("파일 샘플 (상위 5개):")
        print(final_df.head())
        print("\n'is_hate' 컬럼 분포:")
        print(final_df['is_hate'].value_counts())
        print("--------------------")

    except Exception as e:
        print(f"\n[오류] 파일을 저장하는 중 문제가 발생했습니다: {e}")

# 스크립트 실행
if __name__ == "__main__":
    run_preprocessing()