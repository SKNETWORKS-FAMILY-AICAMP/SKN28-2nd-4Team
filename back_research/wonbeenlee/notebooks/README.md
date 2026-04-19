# wonbeenlee Dataset Notebook Catalog

이 디렉토리는 프로젝트의 churn / retention / uplift / sequence 후보 데이터셋을 데이터셋별로 정리한 작업 공간이다.

현재 구조:

- `dataset_analysis/`: 데이터셋별 메타데이터/컬럼/representation 문서
- `branch_workspaces/`: Branch A/B/C별 EDA 및 모델링 작업 공간
- 각 데이터셋 디렉토리: 실제 `eda/`, `training_exporting/` 작업 디렉토리

여기서 먼저 확인하려는 것은 모델 자체보다 아래 항목들이다.

- 이 데이터셋이 어떤 기업 도메인을 대표하는가
- classification / regression 중 무엇을 바로 할 수 있는가
- direct `y`가 있는가, 아니면 우리가 만들어야 하는가
- time-series / sequence 해석이 가능한가
- state variable / reward proxy / intervention effect를 어디서 읽을 수 있는가

## 기업 도메인별 분류

| 기업 도메인 | 데이터셋 | 데이터 성격 | 먼저 보는 포인트 |
| --- | --- | --- | --- |
| E-commerce / membership commerce | `ecommerce_customer_data`, `churn_preprocessed` | 학습용 / 내부 가공 benchmark | direct churn baseline, 구매/혜택/만족도 기반 churn |
| E-commerce / logistics client | `ecommerce_company_client_churn_data` | 준실제 익명화 client data | RFM + revenue + support + trust proxy |
| Telecom subscription | `ibm_telco_customer_churn`, `orange_belgium_churn_uplift`, `megafon` | 공개 샘플 / uplift benchmark / synthetic | contract / lock-in / intervention effect |
| Banking / finance | `churn_modelling` | 학습용 benchmark | 금융형 churn baseline |
| Streaming / music subscription | `streaming_subscription_churn_model`, `kkbox_churn_prediction_challenge` | competition data / 실제 대규모 sequence | usage + payment + renewal 기반 churn |
| Retail / loyalty / campaign | `hillstrom`, `lenta`, `x5` | 실제 campaign uplift / multi-table retail | treatment-response, promo effect, loyalty state |
| Marketplace / order fulfillment | `olist` | 실제 multi-table commerce data | 주문/배송/리뷰 기반 churn proxy |
| Event log / recommender funnel | `retailrocket_raw`, `retailrocket_processed` | 실제 event log / engineered benchmark | next-event, inactivity, revenue/value proxy |
| Ad-tech / marketing intervention | `criteo` | 대규모 uplift benchmark | treatment / exposure / conversion effect |
| SaaS subscription | `saas_subscription_churn` | synthetic multi-table | usage / billing / support / churn flag |

## 태스크 비율 요약

전체 기준 데이터셋 수: **17개**

| 항목 | 개수 | 비율 | 해석 |
| --- | ---: | ---: | --- |
| classification 가능 | 17 | 100.0% | 전 데이터셋에서 direct 또는 derived classification 가능 |
| regression 가능 | 5 | 29.4% | direct 제공 또는 자연스러운 파생 regression 가능 |
| classification only 중심 | 12 | 70.6% | 우선 direct churn / response 분류에 적합 |
| direct `y` 제공 | 15 | 88.2% | 바로 supervised setup 가능 |
| direct `y` 없음 | 2 | 11.8% | `olist`, `retailrocket_raw`는 proxy label 설계 필요 |

### classification / regression 해석

- **classification 중심 데이터셋**
  - `ecommerce_customer_data`
  - `ecommerce_company_client_churn_data`
  - `ibm_telco_customer_churn`
  - `churn_modelling`
  - `churn_preprocessed`
  - `streaming_subscription_churn_model`
  - `orange_belgium_churn_uplift`
  - `criteo`
  - `lenta`
  - `megafon`
  - `x5`
  - `kkbox_churn_prediction_challenge`

- **classification + regression 둘 다 가능한 데이터셋**
  - `hillstrom`: `visit` / `conversion` 분류, `spend` 회귀
  - `retailrocket_processed`: `target_event` 분류, `target_revenue` / `target_customer_value` / `target_actual_profit` 회귀
  - `olist`: review score, delivery delay, future purchase proxy 등 파생 가능
  - `retailrocket_raw`: next purchase / inactivity 분류, future revenue 회귀 파생 가능
  - `saas_subscription_churn`: churn 분류, `mrr_amount` / `arr_amount` / `refund_amount_usd` / `resolution_time_hours` 회귀 가능

## Time-Series / Time-Aware 데이터셋 정리

### 비율

| 항목 | 개수 | 비율 | 해석 |
| --- | ---: | ---: | --- |
| time-aware 데이터셋 | 11 | 64.7% | 날짜 / 기간 / rolling window가 feature에 반영됨 |
| strict sequence backbone | 5 | 29.4% | raw event 또는 multi-event join이 핵심 |

### strict sequence backbone

| 데이터셋 | 시간 표현 | 바로 보는 `y` | 어떻게 볼지 |
| --- | --- | --- | --- |
| `olist` | 주문/승인/배송/리뷰 시점 | direct `y` 없음 | 재구매 부재, 배송 지연, 저평점 proxy 설계 |
| `retailrocket_raw` | raw event timestamp | direct `y` 없음 | next purchase / inactivity / future revenue |
| `x5` | issue / redeem / transaction datetime | `target` + `treatment_flg` | 고객별 purchase aggregation 후 uplift |
| `saas_subscription_churn` | signup / subscription / usage / support / churn_date | `churn_flag` | account timeline aggregation |
| `kkbox_churn_prediction_challenge` | registration / transaction / expire / user log date | `is_churn` | member + payment + usage sequence join |

### time-aware summary table

| 데이터셋 | 시간 표현 | 기본 태스크 | 해석 |
| --- | --- | --- | --- |
| `ecommerce_company_client_churn_data` | creation / purchase / integration datetime | classification | 고객 lifecycle snapshot |
| `churn_preprocessed` | tenure / recency / yearly delta | classification | recency-aware churn summary |
| `streaming_subscription_churn_model` | 상대 오프셋형 `signup_date` | classification | snapshot이지만 가입 선후관계 포함 |
| `hillstrom` | 캠페인 전 12개월 / 후 2주 window | classification + regression | intervention effect summary |
| `lenta` | `15d`, `1m`, `3m`, `6m`, `12m` rolling summary | classification | retail promo response |
| `retailrocket_processed` | lag / moving average / recency feature | classification + regression | engineered time summary |

## 특히 time-series 데이터에서 우리가 뽑아야 하는 것

프로젝트 문서 기준으로, time-series 데이터는 단순 예측보다 **state variable**과 **transition signal**을 만드는 데 더 중요하다.

대표적으로 먼저 볼 항목:

- recency / inactivity
- usage intensity trend
- renewal / cancel pattern
- purchase frequency / AOV trend
- support / complaint timing
- delivery delay / trust deterioration
- intervention 이후 반응 변화

즉 time-series 데이터에서는 보통 아래 식으로 간다.

1. raw event 또는 multi-table join 구성
2. 고객 기준 집계 단위 정의
3. window feature 생성
4. direct `y`가 없으면 proxy `y` 설계
5. classification 또는 regression으로 연결

## 읽는 순서

1. 도메인부터 고른다.
2. 그 도메인 안에서 direct `y`가 있는지 확인한다.
3. time-aware인지, strict sequence인지 구분한다.
4. 각 데이터셋 `README.md`에서 전체 컬럼과 representation을 확인한다.
5. 그 다음 `eda/`에서 실제 loading / column screening / target candidate 검토를 진행한다.

## 작업 시작 위치

- 데이터셋 개별 문서: `dataset_analysis/*.md`
- 브랜치별 작업 기준: `branch_workspaces/`
- 브랜치 grouping 근거: `model_branch_grouping.md`
