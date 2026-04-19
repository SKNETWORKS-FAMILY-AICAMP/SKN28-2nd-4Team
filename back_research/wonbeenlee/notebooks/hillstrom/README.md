# hillstrom

## 1. 예측 태스크

- 기본 태스크: **binary classification**
- 직접 제공되는 `y`: `visit` 또는 `conversion`
- 회귀 태스크 후보: `spend`
- treatment 컬럼: `segment`
- 기본 입력 `X`: `recency`, `history_segment`, `history`, `mens`, `womens`, `zip_code`, `newbie`, `channel`
- 한 줄 해석: 이메일 캠페인 개입 후 고객이 방문/구매/지출하는지를 예측하는 대표적인 uplift benchmark다.

## 2. 전체 컬럼

```text
recency
history_segment
history
mens
womens
zip_code
newbie
channel
segment
visit
conversion
spend
```

## 3. 데이터셋 메타데이터

- 데이터 성격: **실제 캠페인 실험 기반 공개 데이터셋**이다.
- 출처 성격: Kevin Hillstrom / MineThatData email analytics challenge 계열
- 도메인: **retail e-commerce / catalog commerce / email marketing**
- 비즈니스 모델 관점:
  - 고객에게 이메일 캠페인을 발송하고
  - 이후 웹 방문, 구매, 지출이 어떻게 달라지는지 측정한다.
  - 단순 churn보다는 **개입 후 반응(response)**을 관측하는 구조다.

## 4. 컨텍스트

- 시간축: **상대 기간 기반 실험 데이터**다.
- 확인 가능한 window:
  - 과거 12개월 구매 이력 요약: `recency`, `history_segment`, `history`, `mens`, `womens`, `channel`
  - 이메일 발송 후 다음 2주 반응: `visit`, `conversion`, `spend`
- 절대 calendar date는 없지만, 개입 전/후 기간 구분이 분명하다.

## 5. 결론: 데이터 representation

- representation 단위: **한 행 = 한 고객의 캠페인 직전 상태 + 처리군 + 직후 반응**
- 추천 `X`: 과거 구매/채널/고객 속성 컬럼
- 추천 `y`:
  - 분류: `visit`, `conversion`
  - 회귀: `spend`
- treatment: `segment`
- 비즈니스 도메인 해석:
  - 이메일 액션을 했을 때 고객이 다시 방문하거나 구매하는지를 예측할 수 있어,
  - 프로젝트의 **action effect / retention intervention prior**를 설명하기 좋다.
