# streaming_subscription_churn_model

## 1. 예측 태스크

- 기본 태스크: **binary classification**
- 직접 제공되는 `y`: `churned` in `train.csv`
- 기본 입력 `X`: `customer_id`를 제외한 demographic / payment / support inquiry / listening behavior 컬럼
- 한 줄 해석: 음악 스트리밍 서비스 사용자의 구독/사용 행태를 기반으로 이탈 여부를 예측하는 competition용 churn 데이터셋이다.

## 2. 전체 컬럼

### `train.csv`

```text
customer_id
age
location
subscription_type
payment_plan
num_subscription_pauses
payment_method
customer_service_inquiries
signup_date
weekly_hours
average_session_length
song_skip_rate
weekly_songs_played
weekly_unique_songs
num_favorite_artists
num_platform_friends
num_playlists_created
num_shared_playlists
notifications_clicked
churned
```

### `test.csv`

```text
customer_id
age
location
subscription_type
payment_plan
num_subscription_pauses
payment_method
customer_service_inquiries
signup_date
weekly_hours
average_session_length
song_skip_rate
weekly_songs_played
weekly_unique_songs
num_favorite_artists
num_platform_friends
num_playlists_created
num_shared_playlists
notifications_clicked
```

### `sample_submission.csv`

```text
customer_id
churned
```

## 3. 데이터셋 메타데이터

- 데이터 성격: **community competition용 공개 데이터셋**이다.
- 실제 서비스 raw export라기보다는 competition / 학습용으로 정리된 예시 데이터로 보는 편이 안전하다.
- 도메인: **music streaming subscription service**
- 비즈니스 모델 관점:
  - 무료 / 프리미엄 / 패밀리 같은 구독 플랜을 제공
  - 재생 시간, 스킵 비율, 플레이리스트 생성, 친구 수, 문의 횟수 같은 engagement 신호가 churn과 연결됨

## 4. 컨텍스트

- 시간축: **직접적인 event log는 아니고 고객 snapshot 구조**다.
- 주의할 점:
  - `signup_date`는 실제 calendar date 문자열이 아니라 **상대 오프셋 정수값**으로 들어 있다.
  - 확인된 범위는 `-2922` ~ `-1` 이다.
- 즉 이 컬럼은 절대 시점보다는 **가입 시점의 상대적 선후관계** 또는 age-like duration feature로 해석하는 편이 안전하다.

## 5. 결론: 데이터 representation

- representation 단위: **한 행 = 한 스트리밍 고객의 현재 구독/사용 상태 요약**
- 추천 `X`:
  - 구독/결제: `subscription_type`, `payment_plan`, `payment_method`, `num_subscription_pauses`
  - 지원/불만: `customer_service_inquiries`
  - 사용량/engagement: `weekly_hours`, `average_session_length`, `song_skip_rate`, `weekly_songs_played`, `weekly_unique_songs`, `num_playlists_created`, `notifications_clicked`
- 추천 `y`: `churned`
- 비즈니스 도메인 해석:
  - 구독 방식, 사용량, 곡 소비 패턴, social/playlist engagement를 바탕으로
  - 사용자가 스트리밍 서비스를 떠날지 분류하는 구조다.
  - 프로젝트에서는 **subscription 도메인 churn baseline**으로 활용할 수 있다.
