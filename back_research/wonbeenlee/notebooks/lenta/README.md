# lenta

## 1. 예측 태스크

- 기본 태스크: **binary classification**
- 직접 제공되는 `y`: `response_att`
- treatment 컬럼: `group`
- 기본 입력 `X`: 고객 속성 + 할인/프로모션 + 구매 변동성 + 상품군 집계 피처
- 한 줄 해석: 리테일 캠페인에 대한 고객 반응 여부를 예측하는 실제 리테일 uplift 데이터셋이다.

## 2. 전체 컬럼

```text
age
cheque_count_12m_g20
cheque_count_12m_g21
cheque_count_12m_g25
cheque_count_12m_g32
cheque_count_12m_g33
cheque_count_12m_g38
cheque_count_12m_g39
cheque_count_12m_g41
cheque_count_12m_g42
cheque_count_12m_g45
cheque_count_12m_g46
cheque_count_12m_g48
cheque_count_12m_g52
cheque_count_12m_g56
cheque_count_12m_g57
cheque_count_12m_g58
cheque_count_12m_g79
cheque_count_3m_g20
cheque_count_3m_g21
cheque_count_3m_g25
cheque_count_3m_g42
cheque_count_3m_g45
cheque_count_3m_g52
cheque_count_3m_g56
cheque_count_3m_g57
cheque_count_3m_g79
cheque_count_6m_g20
cheque_count_6m_g21
cheque_count_6m_g25
cheque_count_6m_g32
cheque_count_6m_g33
cheque_count_6m_g38
cheque_count_6m_g39
cheque_count_6m_g40
cheque_count_6m_g41
cheque_count_6m_g42
cheque_count_6m_g45
cheque_count_6m_g46
cheque_count_6m_g48
cheque_count_6m_g52
cheque_count_6m_g56
cheque_count_6m_g57
cheque_count_6m_g58
cheque_count_6m_g79
children
crazy_purchases_cheque_count_12m
crazy_purchases_cheque_count_1m
crazy_purchases_cheque_count_3m
crazy_purchases_cheque_count_6m
crazy_purchases_goods_count_12m
crazy_purchases_goods_count_6m
disc_sum_6m_g34
food_share_15d
food_share_1m
gender
group
k_var_cheque_15d
k_var_cheque_3m
k_var_cheque_category_width_15d
k_var_cheque_group_width_15d
k_var_count_per_cheque_15d_g24
k_var_count_per_cheque_15d_g34
k_var_count_per_cheque_1m_g24
k_var_count_per_cheque_1m_g27
k_var_count_per_cheque_1m_g34
k_var_count_per_cheque_1m_g44
k_var_count_per_cheque_1m_g49
k_var_count_per_cheque_3m_g24
k_var_count_per_cheque_3m_g27
k_var_count_per_cheque_3m_g32
k_var_count_per_cheque_3m_g34
k_var_count_per_cheque_3m_g41
k_var_count_per_cheque_3m_g44
k_var_count_per_cheque_6m_g24
k_var_count_per_cheque_6m_g27
k_var_count_per_cheque_6m_g32
k_var_count_per_cheque_6m_g44
k_var_days_between_visits_15d
k_var_days_between_visits_1m
k_var_days_between_visits_3m
k_var_disc_per_cheque_15d
k_var_disc_share_12m_g32
k_var_disc_share_15d_g24
k_var_disc_share_15d_g34
k_var_disc_share_15d_g49
k_var_disc_share_1m_g24
k_var_disc_share_1m_g27
k_var_disc_share_1m_g34
k_var_disc_share_1m_g40
k_var_disc_share_1m_g44
k_var_disc_share_1m_g49
k_var_disc_share_1m_g54
k_var_disc_share_3m_g24
k_var_disc_share_3m_g26
k_var_disc_share_3m_g27
k_var_disc_share_3m_g32
k_var_disc_share_3m_g33
k_var_disc_share_3m_g34
k_var_disc_share_3m_g38
k_var_disc_share_3m_g40
k_var_disc_share_3m_g41
k_var_disc_share_3m_g44
k_var_disc_share_3m_g46
k_var_disc_share_3m_g48
k_var_disc_share_3m_g49
k_var_disc_share_3m_g54
k_var_disc_share_6m_g24
k_var_disc_share_6m_g27
k_var_disc_share_6m_g32
k_var_disc_share_6m_g34
k_var_disc_share_6m_g44
k_var_disc_share_6m_g46
k_var_disc_share_6m_g49
k_var_disc_share_6m_g54
k_var_discount_depth_15d
k_var_discount_depth_1m
k_var_sku_per_cheque_15d
k_var_sku_price_12m_g32
k_var_sku_price_15d_g34
k_var_sku_price_15d_g49
k_var_sku_price_1m_g24
k_var_sku_price_1m_g26
k_var_sku_price_1m_g27
k_var_sku_price_1m_g34
k_var_sku_price_1m_g40
k_var_sku_price_1m_g44
k_var_sku_price_1m_g49
k_var_sku_price_1m_g54
k_var_sku_price_3m_g24
k_var_sku_price_3m_g26
k_var_sku_price_3m_g27
k_var_sku_price_3m_g32
k_var_sku_price_3m_g33
k_var_sku_price_3m_g34
k_var_sku_price_3m_g40
k_var_sku_price_3m_g41
k_var_sku_price_3m_g44
k_var_sku_price_3m_g46
k_var_sku_price_3m_g48
k_var_sku_price_3m_g49
k_var_sku_price_3m_g54
k_var_sku_price_6m_g24
k_var_sku_price_6m_g26
k_var_sku_price_6m_g27
k_var_sku_price_6m_g32
k_var_sku_price_6m_g41
k_var_sku_price_6m_g42
k_var_sku_price_6m_g44
k_var_sku_price_6m_g48
k_var_sku_price_6m_g49
main_format
mean_discount_depth_15d
months_from_register
perdelta_days_between_visits_15_30d
promo_share_15d
response_att
response_sms
response_viber
sale_count_12m_g32
sale_count_12m_g33
sale_count_12m_g49
sale_count_12m_g54
sale_count_12m_g57
sale_count_3m_g24
sale_count_3m_g33
sale_count_3m_g57
sale_count_6m_g24
sale_count_6m_g25
sale_count_6m_g32
sale_count_6m_g33
sale_count_6m_g44
sale_count_6m_g54
sale_count_6m_g57
sale_sum_12m_g24
sale_sum_12m_g25
sale_sum_12m_g26
sale_sum_12m_g27
sale_sum_12m_g32
sale_sum_12m_g44
sale_sum_12m_g54
sale_sum_3m_g24
sale_sum_3m_g26
sale_sum_3m_g32
sale_sum_3m_g33
sale_sum_6m_g24
sale_sum_6m_g25
sale_sum_6m_g26
sale_sum_6m_g32
sale_sum_6m_g33
sale_sum_6m_g44
sale_sum_6m_g54
stdev_days_between_visits_15d
stdev_discount_depth_15d
stdev_discount_depth_1m
```

## 3. 데이터셋 메타데이터

- 데이터 성격: **실제 리테일 기업의 campaign uplift 데이터**다.
- 출처 성격: Lenta 리테일 / BigTarget hackathon 계열
- 도메인: **grocery / hypermarket retail chain**
- 비즈니스 모델 관점:
  - 고객의 장보기 이력과 프로모션 반응을 바탕으로
  - 특정 마케팅 액션이 실제 방문/반응으로 이어지는지를 본다.
  - 컬럼 이름에 `15d`, `1m`, `3m`, `6m`, `12m`가 직접 들어 있어 과거 행동 요약 윈도우가 노출된다.

## 4. 컨텍스트

- 시간축: **절대 날짜가 아닌 retrospective window 기반 time-aware feature table**다.
- 명시적으로 드러나는 관측 window:
  - 최근 15일: `15d`
  - 최근 1개월: `1m`
  - 최근 3개월: `3m`
  - 최근 6개월: `6m`
  - 최근 12개월: `12m`
- 따라서 이 데이터는 sequence raw log가 아니라, **시간 구간별 고객 행동을 요약한 uplift-ready tabular representation**으로 읽어야 한다.

## 5. 결론: 데이터 representation

- representation 단위: **한 행 = 한 리테일 고객의 과거 행동 요약 + treatment group + 반응 여부**
- 추천 `X`:
  - 방문 변동성 / 체크 변동성 / 할인 깊이 / 상품군별 구매량 / 프로모션 반응 관련 피처
- 추천 `y`: `response_att`
- treatment: `group`
- 비즈니스 도메인 해석:
  - 어떤 고객이 캠페인에 실제로 반응할지를 예측하는 구조이며,
  - 프로젝트에서는 `promo sensitivity`, `visit stability`, `discount response` 같은 state 변수 보정에 특히 쓸 만하다.
