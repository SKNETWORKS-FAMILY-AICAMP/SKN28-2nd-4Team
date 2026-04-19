# aprkapxkf Research Notes

## 목적

이 디렉터리는 전자상거래 고객 이탈(`Churn`) 예측 실험을 정리하는 작업 공간이다.
실험 흐름은 `notebooks/sanghyun_E_commerce_model_Training.ipynb`에 있다.

## 디렉터리 구성

```text
aprkapxkf/
├── artifacts/   # 학습 후 저장한 모델 파일
├── datasets/    # 실험에 사용하는 원본 데이터셋
└── notebooks/   # 모델링/평가 노트북
```

## Approach

이 실험은 아래 순서로 진행된다.

1. `ecommerce_customer_data.csv`를 불러와 기본 구조와 타깃 분포를 확인한다.
2. `Customer_ID`를 제외하고, `Gender`를 원-핫 인코딩해 모델 입력 형태로 정리한다.
3. 데이터를 `train/validation/test = 70/15/15` 비율로 분리하고, 클래스 비율은 `stratify`로 유지한다.
4. `Logistic Regression`, `Decision Tree`, `Random Forest`를 학습하고 평가한다.
5. `VotingClassifier`, `XGBoost`, `CatBoost`를 추가로 학습하고 평가한다.
6. `XGBoost`는 threshold를 바꿔가며 예측 결과를 확인한다.
7. 모델 파일을 `artifacts/`에 저장하고 다시 불러온다.

## 실행 메모

노트북은 `back_research/aprkapxkf/notebooks/` 기준 상대경로를 사용한다.
따라서 Jupyter 실행 시 작업 디렉터리가 바뀌면 데이터셋/아티팩트 경로가 맞지 않을 수 있다.
