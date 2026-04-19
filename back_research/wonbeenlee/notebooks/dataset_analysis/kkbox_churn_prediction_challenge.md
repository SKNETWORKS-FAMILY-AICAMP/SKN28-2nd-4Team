# kkbox_churn_prediction_challenge

## 1. 예측 태스크

- 기본 태스크: **binary classification**
- 직접 제공되는 `y`: `is_churn` in `train_v2.csv.7z`
- 기본 입력 `X`: `members_v3`, `transactions_v2`, `user_logs_v2`를 `msno` 기준으로 join / aggregate 해서 생성
- 한 줄 해석: 음악 구독 서비스의 회원/결제/사용 로그를 기반으로 실제 churn 여부를 예측하는 대규모 sequence competition 데이터셋이다.

## 2. 전체 컬럼

### `train_v2.csv.7z`

```text
msno
is_churn
```

### `members_v3.csv.7z`

```text
msno
city
bd
gender
registered_via
registration_init_time
```

### `transactions_v2.csv.7z`

```text
msno
payment_method_id
payment_plan_days
plan_list_price
actual_amount_paid
is_auto_renew
transaction_date
membership_expire_date
is_cancel
```

### `user_logs_v2.csv.7z`

```text
msno
date
num_25
num_50
num_75
num_985
num_100
num_unq
total_secs
```

### `sample_submission_v2.csv.7z`

```text
msno
is_churn
```

## 3. 데이터셋 메타데이터

- 데이터 성격: **실제 음악 구독 서비스 기반 공개 competition 데이터**다.
- 출처 성격: WSDM / KKBox churn prediction challenge
- 도메인: **music streaming subscription service**
- 비즈니스 모델 관점:
  - 회원이 구독을 결제하고 자동갱신 / 취소를 반복한다.
  - 사용 로그(`num_25`, `num_50`, `num_100`, `total_secs`)가 실제 consumption signal 역할을 한다.
  - churn은 단순 snapshot이 아니라 결제/만료/사용량 흐름 속에서 결정된다.

## 4. 컨텍스트

- 시간축: **명시적인 날짜 컬럼이 있는 대규모 sequence 데이터**다.
- time 관련 컬럼:
  - `registration_init_time`
  - `transaction_date`
  - `membership_expire_date`
  - `date` in user logs
- 현재 저장은 `.7z` 원본 유지 상태이므로, full scan 기반 절대 min/max는 아직 추후 EDA에서 확인하는 것이 좋다.
- 다만 데이터 구조상, 회원 등록 -> 결제/갱신/취소 -> usage log를 따라가는 **subscription timeline modeling**이 핵심이다.

## 5. 결론: 데이터 representation

- representation 단위:
  - raw level: 회원 / 결제 / 사용 로그 / label 파일 분리
  - modeling level: **한 행 = 특정 기준 시점 직전의 회원 상태 요약**으로 다시 만들어야 한다.
- 추천 `X`:
  - 회원 속성 (`city`, `bd`, `gender`, `registered_via`)
  - 결제/갱신 구조 (`payment_plan_days`, `actual_amount_paid`, `is_auto_renew`, `is_cancel`, 만료일 관련 집계)
  - 사용량 구조 (`num_25`, `num_50`, `num_75`, `num_985`, `num_100`, `num_unq`, `total_secs`)
- 추천 `y`: `is_churn`
- 비즈니스 도메인 해석:
  - 구독 만료가 다가오고 usage가 줄고 취소/비갱신이 늘어나는 패턴을 바탕으로
  - 실제로 이탈할 회원을 분류하는 구조다.
  - 프로젝트에서는 sequence backbone과 state transition 설계를 검증하는 가장 강한 reference 중 하나다.
