import pickle

with open('back_research/myungbin/models/model_rf.pkl', 'rb') as f:
    model = pickle.load(f)
import pandas as pd

# 데이터 불러오기
df = pd.read_csv('back_research/myungbin/data/churn_preprocessed.csv')

# 샘플 하나
X = df.drop('Churn', axis=1)
sample = X.iloc[[0]]

# 예측
pred = model.predict(sample)

print("예측:", pred)
proba = model.predict_proba(sample)
print("이탈 확률:", proba[0][1])