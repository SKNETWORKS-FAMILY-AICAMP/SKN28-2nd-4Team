# Membership Subscription Lifecycle EDA Workspace

이 디렉토리는 Branch B용 EDA 작업 공간이다.

현재는 `saas_subscription_churn` 단일 데이터셋으로,
현재 고객 상태를 보고 앞으로 30일 안에 떠날지 보는 가장 단순한 분석 흐름을 먼저 고정하는 것이 목표다.

중요:

- 결론을 먼저 정하지 않는다.
- 먼저 raw dataset을 실제로 로딩하고 row 수 / column 구조 / null pattern을 확인한다.
- 그 다음 Branch B 관점에서 어떤 column을 살릴지 근거를 붙여 결정한다.
- panel builder는 그 다음 단계다.

작업 기준 문서:

- `../saas_subscription_churn_mapping_sheet.md`

우선 대상 데이터셋:

- `saas_subscription_churn`

## 지금 먼저 정의할 것

지금은 복잡한 Branch score보다 먼저,
현재 subscription + usage 상태를 보고 30일 안에 떠날지 보는 것이 목적이다.

지금 이 workspace에서 먼저 고정해야 하는 질문은 아래다.

- 현재 고객 상태를 보면 30일 안에 떠날지
- monthly 와 annual 이 실제로 차이가 나는지
- plan tier 가 높을수록 이탈이 달라지는지
- expiry / renewal failure / usage drop 이 실제 이탈과 연결되는지

즉 현재 saas-only 1차 분석은 아래 신호를 우선적으로 본다.

- relationship age / tenure
- renewal / expiry / cancel pressure
- current plan / billing value / contract signature
- recent usage intensity와 usage drop
- current plan / billing frequency / auto-renew / mrr / seats

반대로 아래는 Branch B에서 직접 feature로 쓰기보다 보조로 분리해서 본다.

- 단순 identifier
- free-text 컬럼
- support 품질 / complaint / CSAT 중심 신호
- 예측 시점 이후를 포함하는 future result 컬럼

## 이 workspace의 올바른 순서

Branch B EDA는 아래 순서를 따른다.

1. `saas_subscription_churn` raw source를 실제로 로딩한다.
2. row 수 / column 구조 / null pattern을 확인한다.
3. Branch B에서 살릴 column과 제외할 column을 근거와 함께 결정한다.
4. account-month row를 어떻게 만들지 고정한다.
5. renewal / expiry / usage drop을 현재 상태 컬럼으로 내린다.
6. `leave_next_30d` 라벨을 정의한다.
7. EDA와 모델링에 바로 쓸 기본 테이블을 고정한다.

즉 notebook은 아래 질문에 답해야 한다.

- 이 데이터셋에서 어떤 raw column이 join anchor / renewal / expiry / plan / usage signal에 해당하는가
- 어떤 current-state feature를 만들 것인가
- 어떤 규칙으로 `leave_next_30d` 라벨을 만들 것인가
- 어떤 heuristic이 아직 임시 draft이고, 무엇을 다음에 검증해야 하는가

현재 notebook/workbook:

- `01_saas_raw_inventory_and_column_selection.ipynb`
  - raw loading, table inventory, column inventory, 그리고 원본 컬럼 -> 현재 상태 / 이탈 라벨 매핑을 정리하는 시작 notebook
- `02_saas_branch_b_panel_builder_draft.ipynb`
  - `01`에서 정한 column selection을 바탕으로, 먼저 `account-month` OLAP 테이블을 만들고 그 위에서 `leave_next_30d` 기본 데이터셋을 만드는 notebook
- `03_saas_feature_inventory_and_filtering.ipynb`
  - `02` 의 `saas_leave_next_30d_modeling_base` 에서 정말 필요한 컬럼만 남겨 `saas_leave_next_30d_eda_ready` 를 저장하는 notebook
- `04_saas_branch_b_eda_overview.ipynb`
  - `03` 의 `saas_leave_next_30d_eda_ready` 를 읽고 monthly vs annual / plan tier / 현재 상태 feature와 이탈 관계를 보는 실제 EDA notebook
