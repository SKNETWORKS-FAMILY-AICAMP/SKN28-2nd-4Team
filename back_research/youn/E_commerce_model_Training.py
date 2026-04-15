import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, classification_report,
    confusion_matrix
)

from lightgbm import LGBMClassifier
from xgboost import XGBClassifier
from catboost import CatBoostClassifier


# =========================================================
# 1. 데이터 불러오기
# =========================================================
# 엑셀 파일의 실제 데이터 시트("E Comm")를 불러온다.
df = pd.read_excel("E Commerce Dataset.xlsx", sheet_name="E Comm")

# 데이터 기본 확인
print("데이터 크기:", df.shape)
print(df.head())
print("\n컬럼 목록:")
print(df.columns.tolist())


# =========================================================
# 2. 데이터 간단 정리
# =========================================================
# 같은 의미인데 표기가 다른 값이 있으면 통일해준다.
# 예: Phone / Mobile Phone
if 'PreferredLoginDevice' in df.columns:
    df['PreferredLoginDevice'] = df['PreferredLoginDevice'].replace({
        'Phone': 'Mobile Phone'
    })

# 범주형 값 분포 확인이 필요하면 아래 주석 해제
# for col in df.select_dtypes(include='object').columns:
#     print(f"\n[{col}]")
#     print(df[col].value_counts(dropna=False))


# =========================================================
# 3. 결측 여부 indicator 변수 추가
# =========================================================
# 결측 자체가 타겟과 관련 있을 가능성이 있으므로
# 원래 결측값은 그대로 두고, 결측 여부만 별도 변수로 추가한다.
missing_cols = [
    'Tenure',
    'WarehouseToHome',
    'HourSpendOnApp',
    'OrderAmountHikeFromlastYear',
    'CouponUsed',
    'OrderCount',
    'DaySinceLastOrder'
]

for col in missing_cols:
    df[col + '_missing'] = df[col].isnull().astype(int)

print("\n결측 여부 변수 추가 후 컬럼 수:", len(df.columns))


# =========================================================
# 4. X, y 분리
# =========================================================
# CustomerID는 고객 식별용이라 예측에 쓰지 않는다.
# Churn은 타겟 변수다.
X = df.drop(columns=['CustomerID', 'Churn'])
y = df['Churn']

print("\n타겟 분포:")
print(y.value_counts())
print(y.value_counts(normalize=True))


# =========================================================
# 5. 범주형 / 수치형 컬럼 구분
# =========================================================
categorical_cols = X.select_dtypes(include='object').columns.tolist()
numeric_cols = X.select_dtypes(include=np.number).columns.tolist()

print("\n범주형 컬럼:")
print(categorical_cols)

print("\n수치형 컬럼:")
print(numeric_cols)


# =========================================================
# 6. 원-핫 인코딩
# =========================================================
# LightGBM / XGBoost / CatBoost를 같은 입력 형태로 비교하기 위해
# 우선 pd.get_dummies()로 범주형 변수를 인코딩한다.
# drop_first=False로 두어 정보 손실을 줄인다.
X_encoded = pd.get_dummies(X, columns=categorical_cols, drop_first=False)

print("\n인코딩 후 데이터 크기:", X_encoded.shape)


# =========================================================
# 7. 학습 / 테스트 데이터 분리
# =========================================================
# stratify=y를 사용해 train/test에 이탈 비율이 비슷하게 유지되도록 한다.
X_train, X_test, y_train, y_test = train_test_split(
    X_encoded, y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

print("\n학습 데이터 크기:", X_train.shape)
print("테스트 데이터 크기:", X_test.shape)


# =========================================================
# 8. 불균형 비율 계산
# =========================================================
# 이탈 고객(1)이 상대적으로 적으므로
# 모델에 클래스 불균형 정보를 반영하기 위해 사용한다.
neg = (y_train == 0).sum()
pos = (y_train == 1).sum()

scale_pos_weight = neg / pos

print("\n음성 클래스(0) 개수:", neg)
print("양성 클래스(1) 개수:", pos)
print("scale_pos_weight:", round(scale_pos_weight, 4))


# =========================================================
# 9. 평가 함수 정의
# =========================================================
def evaluate_model(model, X_train, X_test, y_train, y_test, model_name="Model"):
    """
    모델 학습 후 주요 분류 성능 지표를 출력하는 함수
    """
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)

    # 일부 모델은 predict_proba 지원
    if hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(X_test)[:, 1]
    else:
        y_prob = None

    print("\n" + "=" * 60)
    print(f"[{model_name}]")
    print("=" * 60)

    print("Accuracy :", round(accuracy_score(y_test, y_pred), 4))
    print("Precision:", round(precision_score(y_test, y_pred), 4))
    print("Recall   :", round(recall_score(y_test, y_pred), 4))
    print("F1-score :", round(f1_score(y_test, y_pred), 4))

    if y_prob is not None:
        print("ROC-AUC  :", round(roc_auc_score(y_test, y_prob), 4))

    print("\n[Classification Report]")
    print(classification_report(y_test, y_pred))

    print("[Confusion Matrix]")
    print(confusion_matrix(y_test, y_pred))

    # 결과 저장용 dict 반환
    result = {
        "Model": model_name,
        "Accuracy": accuracy_score(y_test, y_pred),
        "Precision": precision_score(y_test, y_pred),
        "Recall": recall_score(y_test, y_pred),
        "F1-score": f1_score(y_test, y_pred),
        "ROC-AUC": roc_auc_score(y_test, y_prob) if y_prob is not None else np.nan
    }

    return result


# =========================================================
# 10. LightGBM 모델
# =========================================================
# LightGBM은 결측치를 자체 처리할 수 있다.
# n_estimators를 너무 크게 두지 않고 먼저 200 정도로 시작한다.
lgbm_model = LGBMClassifier(
    n_estimators=200,
    learning_rate=0.05,
    num_leaves=31,
    max_depth=-1,
    subsample=0.8,
    colsample_bytree=0.8,
    class_weight='balanced',
    random_state=42
)


# =========================================================
# 11. XGBoost 모델
# =========================================================
# XGBoost도 결측치를 자체 처리할 수 있다.
xgb_model = XGBClassifier(
    n_estimators=200,
    learning_rate=0.05,
    max_depth=5,
    subsample=0.8,
    colsample_bytree=0.8,
    eval_metric='logloss',
    random_state=42,
    scale_pos_weight=scale_pos_weight
)


# =========================================================
# 12. CatBoost 모델
# =========================================================
# CatBoost도 결측치를 처리할 수 있다.
# 여기서는 get_dummies된 데이터를 그대로 넣는 비교 버전으로 작성한다.
cat_model = CatBoostClassifier(
    iterations=200,
    learning_rate=0.05,
    depth=6,
    loss_function='Logloss',
    eval_metric='AUC',
    random_seed=42,
    verbose=0
)


# =========================================================
# 13. 모델 학습 및 평가
# =========================================================
results = []

result_lgbm = evaluate_model(
    lgbm_model, X_train, X_test, y_train, y_test, "LightGBM"
)
results.append(result_lgbm)

result_xgb = evaluate_model(
    xgb_model, X_train, X_test, y_train, y_test, "XGBoost"
)
results.append(result_xgb)

result_cat = evaluate_model(
    cat_model, X_train, X_test, y_train, y_test, "CatBoost"
)
results.append(result_cat)


# =========================================================
# 14. 결과 비교표
# =========================================================
result_df = pd.DataFrame(results).sort_values(by='ROC-AUC', ascending=False)

print("\n모델 비교표")
print(result_df)


# =========================================================
# 15. 가장 좋은 모델 선택
# =========================================================
best_model_name = result_df.iloc[0]['Model']
print("\n가장 성능이 좋은 모델:", best_model_name)


# =========================================================
# 16. Feature Importance 확인
# =========================================================
# 트리 기반 모델은 변수 중요도를 확인할 수 있다.
# 가장 좋은 모델에 따라 importance를 출력한다.
if best_model_name == "LightGBM":
    best_model = lgbm_model
elif best_model_name == "XGBoost":
    best_model = xgb_model
else:
    best_model = cat_model

importances = best_model.feature_importances_

feature_importance_df = pd.DataFrame({
    'feature': X_train.columns,
    'importance': importances
}).sort_values(by='importance', ascending=False)

print("\n상위 20개 중요 변수")
print(feature_importance_df.head(20))


# =========================================================
# 17. 중요 변수 시각화
# =========================================================
import matplotlib.pyplot as plt
import seaborn as sns

plt.figure(figsize=(10, 8))
sns.barplot(
    data=feature_importance_df.head(20),
    x='importance',
    y='feature'
)
plt.title(f"Top 20 Feature Importances - {best_model_name}")
plt.show()