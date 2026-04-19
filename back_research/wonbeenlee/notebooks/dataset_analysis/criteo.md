# criteo

## 1. 예측 태스크

- 기본 태스크: **binary classification**
- 직접 제공되는 `y`: `conversion` 또는 `visit`
- treatment 컬럼: `treatment`
- exposure 컬럼: `exposure`
- 기본 입력 `X`: `f0`~`f11`
- 한 줄 해석: 광고 노출 개입이 방문/전환에 미치는 효과를 예측하는 대규모 uplift benchmark다.

## 2. 전체 컬럼

```text
f0
f1
f2
f3
f4
f5
f6
f7
f8
f9
f10
f11
treatment
conversion
visit
exposure
```

## 3. 데이터셋 메타데이터

- 데이터 성격: **실제 ad-tech incrementality 실험을 반영한 공개 대규모 benchmark**다.
- 출처 성격: Criteo AI Lab uplift prediction dataset
- 도메인: **online advertising / RTB / display ad platform**
- 비즈니스 모델 관점:
  - 광고 플랫폼이 특정 사용자에게 광고 입찰/노출을 수행하고
  - 그 결과 방문이나 전환이 증가하는지 측정한다.
  - `treatment`는 광고 타게팅 여부, `exposure`는 실제 노출 여부를 나타낸다.

## 4. 컨텍스트

- 시간축: **명시적 timestamp는 제공되지 않는 처리-반응 테이블**이다.
- 따라서 시계열 modeling보다는
  - treatment / exposure / response 관계
  - 개입 효과 추정
에 초점을 맞춰 읽어야 한다.

## 5. 결론: 데이터 representation

- representation 단위: **한 행 = 한 사용자-광고 기회의 익명 feature + 처리 여부 + 반응**
- 추천 `X`: `f0`~`f11`
- 추천 `y`: `conversion` 또는 `visit`
- treatment / exposure: `treatment`, `exposure`
- 비즈니스 도메인 해석:
  - 광고 개입이 실제 전환을 만드는지를 보는 구조이므로,
  - 프로젝트에서는 **정책 개입의 효과 추정**을 설명하는 대용량 benchmark로 유용하다.
