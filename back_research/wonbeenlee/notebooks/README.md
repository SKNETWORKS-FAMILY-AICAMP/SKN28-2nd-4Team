# wonbeenlee Dataset Notebook Catalog

이 디렉터리는 프로젝트의 churn / retention / uplift / sequence 후보 데이터셋을 데이터셋별로 나눠 정리하는 작업 공간이다.

프로젝트 문서 기준으로, 이 데이터셋들은 최종 모델 그 자체보다도 다음 판단을 위해 먼저 본다.

- direct churn 예측용 baseline이 가능한가
- intervention / uplift 정보를 줄 수 있는가
- state variable 보정에 쓸 수 있는가
- event / transaction log로부터 churn proxy를 유도할 수 있는가

## 데이터셋 분류

| 디렉토리 | 데이터 성격 | direct y | 기본 태스크 | 먼저 보는 용도 |
| --- | --- | --- | --- | --- |
| `ecommerce_customer_data` | 학습용 단일 테이블 churn benchmark | `Churn` | binary classification | 가장 빠른 baseline |
| `ecommerce_company_client_churn_data` | 준실제 가공 churn benchmark | `status` | binary classification | RFM + support 기반 churn 해석 |
| `ibm_telco_customer_churn` | 실무형 공개 샘플 | `Churn` | binary classification | telecom baseline |
| `churn_modelling` | 공개 학습용 banking churn benchmark | `Exited` | binary classification | banking baseline |
| `churn_preprocessed` | 내부 가공 학습용 데이터 | `Churn` | binary classification | 전처리 완료 baseline |
| `streaming_subscription_churn_model` | community competition용 공개 데이터 | `churned` | binary classification | 구독형 churn 비교 |
| `hillstrom` | 실제 캠페인 실험 기반 uplift 데이터 | `visit` / `conversion` / `spend` | uplift classification / regression | retention action prior |
| `orange_belgium_churn_uplift` | 준실제 통신 uplift benchmark | `y` + `t` | uplift classification | anonymized uplift baseline |
| `criteo` | 대규모 광고 uplift benchmark | `conversion` / `visit` + treatment | uplift classification | intervention effect benchmark |
| `lenta` | 실제 리테일 uplift 데이터 | `response_att` + `group` | uplift classification | retail campaign effect |
| `megafon` | synthetic uplift benchmark | `conversion` + `treatment_group` | uplift classification | uplift model smoke test |
| `x5` | 실제 리테일 multi-table uplift 데이터 | `target` + `treatment_flg` | uplift classification | join + aggregate 파이프라인 확인 |
| `olist` | 실제 e-commerce multi-table 거래 데이터 | 없음 | derived classification / regression | review / delivery / repeat purchase proxy |
| `retailrocket_raw` | 실제 event log | 없음 | derived sequence classification / regression | session / inactivity / purchase proxy |
| `retailrocket_processed` | event log 기반 가공 benchmark | `target_event` 등 | classification + regression | engineered feature benchmark |
| `saas_subscription_churn` | synthetic SaaS multi-table 데이터 | `churn_flag` | binary classification | SaaS churn 구조 연습 |
| `kkbox_churn_prediction_challenge` | 실제 대규모 subscription sequence 데이터 | `is_churn` | binary classification | sequence backbone |

## 읽는 순서

1. 각 데이터셋 디렉토리의 `README.md`에서 `y`, `X`, 데이터 성격을 먼저 확인한다.
2. `eda/`에서 loading / column screening / target candidate 검토를 진행한다.
3. direct y가 없는 데이터는 churn proxy 또는 reward/state proxy를 먼저 정의한다.
4. 전처리와 모델링은 그 다음 단계에서 진행한다.
