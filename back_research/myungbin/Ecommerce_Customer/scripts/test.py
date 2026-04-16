import pickle
from pathlib import Path

import pandas as pd

PROJECT_DIR = Path(__file__).resolve().parents[1]

with (PROJECT_DIR / "artifacts" / "model_rf.pkl").open("rb") as f:
    model = pickle.load(f)

# 데이터 불러오기
df = pd.read_csv(PROJECT_DIR / "datasets" / "churn_preprocessed.csv")

# 샘플 하나
X = df.drop("Churn", axis=1)
sample = X.iloc[[0]]

# 예측
pred = model.predict(sample)

print("예측:", pred)
proba = model.predict_proba(sample)
print("이탈 확률:", proba[0][1])
