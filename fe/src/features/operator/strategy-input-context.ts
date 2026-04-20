import type {
  EcommerceCustomerModelInput,
  ModelFeatureField,
} from '@/shared/api/contracts'

type FeatureName = keyof EcommerceCustomerModelInput

type StrategyInputKind = 'range' | 'enum' | 'binary'
type StrategyFeatureGroup = 'core' | 'advanced' | 'context'
type StrategyChangeDirection = 'increase' | 'decrease' | 'hold'
type StrategyStatus = 'good' | 'watch' | 'risk' | 'neutral'

type FeatureMetadata = {
  label: string
  description: string
  group: StrategyFeatureGroup
  editable: boolean
  editableReason: string
  inputKind: StrategyInputKind
  minimum?: number
  maximum?: number
  step?: number
  categories?: string[]
  preferredDirection: StrategyChangeDirection
  targetHint: string
  whyHelpful: string
  caution?: string
  actionExamples?: string[]
}

export type StrategyInputSnapshotField = {
  name: FeatureName
  label: string
  description: string
  group: StrategyFeatureGroup
  editable: boolean
  editableReason: string
  inputKind: StrategyInputKind
  currentValue: string | number
  minimum?: number
  maximum?: number
  step?: number
  budgetStep?: number
  unitBudgetCost?: number
  categories: string[]
  preferredDirection: StrategyChangeDirection
  targetHint: string
  whyHelpful: string
  caution?: string
  actionExamples: string[]
  incidentRelevant: boolean
  status: StrategyStatus
  statusReason: string
}

export type StrategyInfluenceRule = {
  label: string
  condition: string
  effect: string
  recommendedResponse: string
}

export type StrategyInputSnapshot = {
  editableInputs: StrategyInputSnapshotField[]
  lockedInputs: StrategyInputSnapshotField[]
  focusInputs: StrategyInputSnapshotField[]
  influenceRules: StrategyInfluenceRule[]
}

const FEATURE_METADATA: Record<FeatureName, FeatureMetadata> = {
  Tenure: {
    label: '고객 유지 기간',
    description: '현재 플레이 중인 대표 고객 코호트의 유지 기간이다.',
    group: 'context',
    editable: false,
    editableReason: '전략 옵션이 아니라 코호트 컨텍스트 값이다.',
    inputKind: 'range',
    minimum: 0,
    maximum: 61,
    step: 1,
    preferredDirection: 'hold',
    targetHint: '세그먼트 설명용으로만 사용',
    whyHelpful: '장기 유지 고객인지 신규 고객인지 해석하는 데 도움된다.',
  },
  PreferredLoginDevice: {
    label: '주 로그인 기기',
    description: '대표 고객이 주로 사용하는 로그인 기기 유형이다.',
    group: 'context',
    editable: false,
    editableReason: '월간 전략 레버가 아니라 고객 세그먼트 특성이다.',
    inputKind: 'enum',
    categories: ['Computer', 'Mobile'],
    preferredDirection: 'hold',
    targetHint: '세그먼트 설명용으로만 사용',
    whyHelpful: '모바일 중심인지 데스크톱 중심인지 해석하는 데 도움된다.',
  },
  CityTier: {
    label: '도시 티어',
    description: '대표 고객이 속한 지역 티어다.',
    group: 'context',
    editable: false,
    editableReason: '전략 입력이 아니라 세그먼트 맥락 값이다.',
    inputKind: 'range',
    minimum: 1,
    maximum: 3,
    step: 1,
    preferredDirection: 'hold',
    targetHint: '세그먼트 설명용으로만 사용',
    whyHelpful: '지역 성격과 배송 기대치를 함께 해석할 수 있다.',
  },
  WarehouseToHome: {
    label: '배송/처리 마찰',
    description: '배송 체감 거리와 처리 지연으로 읽을 수 있는 운영 마찰 지표다.',
    group: 'core',
    editable: true,
    editableReason: '배송/운영 안정화 전략으로 직접 개선할 수 있는 핵심 레버다.',
    inputKind: 'range',
    minimum: 5,
    maximum: 127,
    step: 1,
    preferredDirection: 'decrease',
    targetHint: '가능하면 5-14 구간으로 낮추기',
    whyHelpful: '값이 낮아질수록 배송 마찰과 처리 지연 리스크를 줄이는 방향이다.',
    caution: '값을 낮추는 제안은 운영 여력과 처리 안정화 조치가 뒷받침돼야 한다.',
    actionExamples: [
      '지연 구간 주문을 우선 처리하도록 fulfillment 우선순위를 재조정한다.',
      '출고 지연 고객에게 예상 배송일 재안내와 대체 배송 옵션을 제공한다.',
      '물류 병목 SKU 를 임시 분산 배치하거나 가까운 창고로 재할당한다.',
    ],
  },
  PreferredPaymentMode: {
    label: '선호 결제 수단',
    description: '대표 고객 코호트가 선호하는 결제 방식이다.',
    group: 'advanced',
    editable: false,
    editableReason: '현재 strategy options 의 직접 입력이 아니라 코호트 성향 값이다.',
    inputKind: 'enum',
    categories: ['Cash on Delivery', 'Credit Card', 'Debit Card', 'E wallet', 'UPI'],
    preferredDirection: 'hold',
    targetHint: '맥락 설명용으로만 사용',
    whyHelpful: '결제 실패나 결제 신뢰 이슈를 어떤 코호트 맥락에서 봐야 하는지 해석할 수 있다.',
  },
  Gender: {
    label: '성별',
    description: '대표 고객 코호트의 성별 값이다.',
    group: 'context',
    editable: false,
    editableReason: '운영 전략 레버로 취급하면 안 되는 세그먼트 정보다.',
    inputKind: 'enum',
    categories: ['Female', 'Male'],
    preferredDirection: 'hold',
    targetHint: '추천 변경 금지',
    whyHelpful: '세그먼트 설명에만 제한적으로 사용해야 한다.',
  },
  HourSpendOnApp: {
    label: '앱 체류 시간',
    description: '대표 고객의 앱 내 engagement 수준을 나타낸다.',
    group: 'core',
    editable: true,
    editableReason: '경험 개선과 리텐션 전략으로 직접 높일 수 있는 핵심 레버다.',
    inputKind: 'range',
    minimum: 0,
    maximum: 5,
    step: 1,
    preferredDirection: 'increase',
    targetHint: '가능하면 3-5 구간으로 높이기',
    whyHelpful: '값이 높아질수록 앱 이용 engagement 방어에 유리하다.',
    caution: '무리한 체류 유도보다 온보딩/경험 개선과 함께 제안하는 것이 안전하다.',
    actionExamples: [
      '앱 첫 화면 추천과 탐색 동선을 단순화해 원하는 상품까지 도달 시간을 줄인다.',
      '장애가 난 기능 대신 사용할 수 있는 우회 경로를 앱 내 공지와 배너로 안내한다.',
      '이탈 조짐 코호트에 맞춤 리마인드나 개인화 추천 캠페인을 집행한다.',
    ],
  },
  NumberOfDeviceRegistered: {
    label: '등록 디바이스 수',
    description: '대표 고객이 등록한 디바이스 수다.',
    group: 'advanced',
    editable: false,
    editableReason: '현재 strategy options 의 직접 조절 레버가 아니라 관계/정착 신호다.',
    inputKind: 'range',
    minimum: 1,
    maximum: 6,
    step: 1,
    preferredDirection: 'hold',
    targetHint: '맥락 설명용으로만 사용',
    whyHelpful: '정착도나 충성도 해석에는 도움되지만 직접 조정 추천은 부적절하다.',
  },
  PreferedOrderCat: {
    label: '선호 주문 카테고리',
    description: '대표 고객 코호트가 선호하는 주문 카테고리다.',
    group: 'advanced',
    editable: false,
    editableReason: '전략 입력이 아니라 코호트 성향 값이다.',
    inputKind: 'enum',
    categories: ['Fashion', 'Grocery', 'Laptop & Accessory', 'Mobile', 'Others'],
    preferredDirection: 'hold',
    targetHint: '맥락 설명용으로만 사용',
    whyHelpful: '이탈 리스크를 어떤 상품군 맥락에서 읽을지 보조한다.',
  },
  SatisfactionScore: {
    label: '만족도 점수',
    description: '고객 만족도를 나타내는 핵심 긍정 신호다.',
    group: 'core',
    editable: true,
    editableReason: '관계 회복과 서비스 개선 전략으로 직접 끌어올릴 수 있는 핵심 레버다.',
    inputKind: 'range',
    minimum: 1,
    maximum: 5,
    step: 1,
    preferredDirection: 'increase',
    targetHint: '최소 3 이상, 가능하면 4-5 구간으로 올리기',
    whyHelpful: '값이 높아질수록 low satisfaction 패널티를 줄이는 데 유리하다.',
    caution: '만족도 상승은 단순 보상보다 공지/복구/경험 개선과 연결해 제안하는 것이 좋다.',
    actionExamples: [
      '장애 원인과 복구 계획을 명확하게 공지하고 고객 응답 시간을 단축한다.',
      '피해 고객에게 재시도 가이드, 사과 메시지, 제한적 보상 패키지를 함께 제공한다.',
      '주요 불편 구간의 UX 를 즉시 수정하고 변경 내용을 고객에게 알려 신뢰를 회복한다.',
    ],
  },
  MaritalStatus: {
    label: '결혼 상태',
    description: '대표 고객 코호트의 결혼 상태 값이다.',
    group: 'context',
    editable: false,
    editableReason: '운영 전략 레버로 다루면 안 되는 세그먼트 정보다.',
    inputKind: 'enum',
    categories: ['Divorced', 'Married', 'Single'],
    preferredDirection: 'hold',
    targetHint: '추천 변경 금지',
    whyHelpful: '세그먼트 설명에만 제한적으로 사용해야 한다.',
  },
  NumberOfAddress: {
    label: '등록 주소 수',
    description: '고객 정착도와 배송 접점 다양성을 일부 반영하는 값이다.',
    group: 'advanced',
    editable: false,
    editableReason: '현재 strategy options 의 직접 입력이 아니라 장기 고객 특성이다.',
    inputKind: 'range',
    minimum: 1,
    maximum: 22,
    step: 1,
    preferredDirection: 'hold',
    targetHint: '맥락 설명용으로만 사용',
    whyHelpful: 'VIP/정착 고객 신호를 보조적으로 해석할 수 있다.',
  },
  Complain: {
    label: '불만 발생',
    description: '불만 제기 여부를 나타내는 직접적인 리스크 신호다.',
    group: 'core',
    editable: true,
    editableReason: '서비스 복구, 커뮤니케이션 정비, 장애 완화로 직접 낮출 수 있는 핵심 레버다.',
    inputKind: 'binary',
    minimum: 0,
    maximum: 1,
    step: 1,
    preferredDirection: 'decrease',
    targetHint: '가능하면 0 유지 또는 1에서 0으로 낮추기',
    whyHelpful: '1이면 complaint penalty 와 complain_high driver 가 동시에 붙는다.',
    caution: '값 자체를 낮추라고만 말하지 말고, 어떤 복구 조치로 낮출지 함께 제안해야 한다.',
    actionExamples: [
      '불만 접수 고객을 전담 큐로 분리해 응답 SLA 를 단축한다.',
      '환불·교환·쿠폰 재발급 같은 즉시 해결 권한을 CS 팀에 임시 위임한다.',
      '반복 문의가 많은 이슈는 FAQ 와 공지 문구를 즉시 수정해 재유입 불만을 줄인다.',
    ],
  },
  OrderAmountHikeFromlastYear: {
    label: '전년 대비 주문 금액 상승폭',
    description: '가격/매출 변화 신호로 읽을 수 있는 값이다.',
    group: 'advanced',
    editable: false,
    editableReason: '현재 strategy options 의 직접 입력이 아니라 상황 설명용 지표다.',
    inputKind: 'range',
    minimum: 11,
    maximum: 26,
    step: 1,
    preferredDirection: 'hold',
    targetHint: '맥락 설명용으로만 사용',
    whyHelpful: '가격 민감도와 혜택 전략의 부작용을 읽는 보조 정보다.',
  },
  CouponUsed: {
    label: '쿠폰 사용량',
    description: '혜택 푸시 강도와 가격 민감 churn 방어를 반영하는 값이다.',
    group: 'core',
    editable: true,
    editableReason: '혜택 전략으로 직접 조절 가능한 핵심 입력이다.',
    inputKind: 'range',
    minimum: 0,
    maximum: 16,
    step: 1,
    preferredDirection: 'increase',
    targetHint: '중간 구간부터 점진적으로 높이기',
    whyHelpful: '단기 churn 방어에는 도움이 될 수 있다.',
    caution: '과도한 인상은 할인 의존도와 마진 훼손 리스크를 키울 수 있다.',
    actionExamples: [
      '이탈 위험 코호트에만 재방문 쿠폰을 선별 발송한다.',
      '장바구니 이탈 고객에게 유효기간이 짧은 복귀 쿠폰을 노출한다.',
      '불만 해소 직후 후속 구매를 유도하는 사후 보상 쿠폰을 지급한다.',
    ],
  },
  OrderCount: {
    label: '주문 수',
    description: '활성도와 재구매 강도를 보여주는 핵심 행동 신호다.',
    group: 'core',
    editable: true,
    editableReason: '경험 개선, 프로모션, 리텐션 액션으로 직접 끌어올릴 수 있는 핵심 레버다.',
    inputKind: 'range',
    minimum: 1,
    maximum: 16,
    step: 1,
    preferredDirection: 'increase',
    targetHint: '최소 2 이상, 가능하면 3 이상 확보',
    whyHelpful: '낮은 주문 수는 order_count_soft driver 와 연결된다.',
    caution: '주문 수만 올리는 제안보다 재구매 품질과 만족도 유지 방안을 함께 제시해야 한다.',
    actionExamples: [
      '재구매 주기가 짧은 상품군 중심으로 리오더 캠페인을 운영한다.',
      '구매 후 후속 추천과 번들 제안을 붙여 다음 주문까지의 마찰을 줄인다.',
      '장기 미주문 고객에게 복귀용 큐레이션과 제한 혜택을 함께 제시한다.',
    ],
  },
  DaySinceLastOrder: {
    label: '최근 주문 공백',
    description: '마지막 주문 이후 경과일을 나타내는 recency 지표다.',
    group: 'core',
    editable: true,
    editableReason: '재방문/재구매 유도 전략으로 직접 줄일 수 있는 핵심 레버다.',
    inputKind: 'range',
    minimum: 0,
    maximum: 46,
    step: 1,
    preferredDirection: 'decrease',
    targetHint: '가능하면 0-3 구간으로 낮추기',
    whyHelpful: '값이 커질수록 recency penalty 와 recency_worsening driver 에 가깝다.',
    caution: '단기 재구매 유도만 강조하면 할인 의존도 증가와 충돌할 수 있다.',
    actionExamples: [
      '최근 주문 공백이 길어진 고객에게 재구매 리마인드 메시지를 보낸다.',
      '구매 주기 예상 시점에 맞춰 개인화된 상품 추천과 쿠폰을 함께 노출한다.',
      '재주문 경로를 단순화한 원클릭 재구매 동선을 우선 노출한다.',
    ],
  },
  CashbackAmount: {
    label: '캐시백 금액',
    description: '혜택 강도와 보상 수준을 나타내는 값이다.',
    group: 'core',
    editable: true,
    editableReason: '단기 방어형 혜택 전략에서 직접 조절 가능한 핵심 레버다.',
    inputKind: 'range',
    minimum: 0,
    maximum: 324.99,
    step: 0.01,
    preferredDirection: 'increase',
    targetHint: '필요 시 점진적으로 높이되 과도한 증액은 피하기',
    whyHelpful: '가격 민감 코호트의 단기 churn 방어에 보조적으로 도움이 될 수 있다.',
    caution: '쿠폰/캐시백 동시 증액은 프로모션 의존도를 키울 수 있어 리스크를 같이 언급해야 한다.',
    actionExamples: [
      '고가 주문 또는 VIP 코호트에만 조건부 캐시백 프로모션을 적용한다.',
      '주문 완료 후 다음 구매에 사용할 수 있는 후속 캐시백을 설계한다.',
      '광범위 증액 대신 특정 이탈 위험 세그먼트에 한정해 보상 강도를 올린다.',
    ],
  },
}

const INFLUENCE_RULES: StrategyInfluenceRule[] = [
  {
    label: '불만 패널티',
    condition: 'Complain = 1',
    effect: 'effective_loss_rate 가 직접 가산되고 complain_high driver 로 잡힌다.',
    recommendedResponse: '서비스 복구, 공지 정비, 응대 속도 개선으로 0 방향을 제안한다.',
  },
  {
    label: '만족도 패널티',
    condition: 'SatisfactionScore <= 2',
    effect: 'satisfaction_low driver 와 함께 loss penalty 가 커진다.',
    recommendedResponse: '최소 3 이상, 가능하면 4-5 구간을 목표로 올리는 제안을 한다.',
  },
  {
    label: '최근 주문 공백 패널티',
    condition: 'DaySinceLastOrder >= 4',
    effect: 'recency_worsening driver 와 함께 loss penalty 가 커진다.',
    recommendedResponse: '0-3 구간으로 낮추는 재구매 유도 전략을 우선 제안한다.',
  },
  {
    label: '주문 수 약세',
    condition: 'OrderCount <= 1',
    effect: 'order_count_soft driver 로 잡혀 churn 방어력이 약해진다.',
    recommendedResponse: '2 이상, 가능하면 3 이상을 만드는 경험/재구매 전략을 제안한다.',
  },
]

function deriveStatus(
  name: FeatureName,
  value: string | number,
): Pick<StrategyInputSnapshotField, 'status' | 'statusReason'> {
  if (typeof value !== 'number') {
    return {
      status: 'neutral',
      statusReason: 'enum/context 값이라 직접 위험도 판정 대상이 아니다.',
    }
  }

  switch (name) {
    case 'Complain':
      return value >= 1
        ? { status: 'risk', statusReason: '불만 발생 상태라 complaint penalty 가 직접 붙는다.' }
        : { status: 'good', statusReason: '불만이 없는 상태라 complaint penalty 가 없다.' }
    case 'SatisfactionScore':
      if (value <= 2) return { status: 'risk', statusReason: '낮은 만족도라 satisfaction penalty 가 큰 구간이다.' }
      if (value === 3) return { status: 'watch', statusReason: '중립 구간이라 추가 개선 여지가 있다.' }
      return { status: 'good', statusReason: '만족도가 안정 구간이라 방어력에 유리하다.' }
    case 'DaySinceLastOrder':
      if (value >= 4) return { status: 'risk', statusReason: '최근 주문 공백이 길어 recency penalty 가 붙는 구간이다.' }
      if (value >= 2) return { status: 'watch', statusReason: '공백이 짧지는 않아 더 줄일 여지가 있다.' }
      return { status: 'good', statusReason: '재구매 공백이 짧아 recency 관점에서 양호하다.' }
    case 'OrderCount':
      if (value <= 1) return { status: 'risk', statusReason: '주문 수가 낮아 order_count_soft driver 에 걸리기 쉽다.' }
      if (value === 2) return { status: 'watch', statusReason: '기준선 수준이라 추가 상승 여지가 있다.' }
      return { status: 'good', statusReason: '주문 수가 방어 구간에 들어와 있다.' }
    case 'WarehouseToHome':
      if (value > 20) return { status: 'risk', statusReason: '배송/처리 마찰이 높은 편이라 운영 안정화가 시급하다.' }
      if (value > 14) return { status: 'watch', statusReason: '기준선보다 높아 마찰 완화 여지가 있다.' }
      return { status: 'good', statusReason: '배송/처리 마찰이 비교적 안정 구간이다.' }
    case 'HourSpendOnApp':
      if (value <= 1) return { status: 'risk', statusReason: '체류 시간이 낮아 engagement 약세로 해석된다.' }
      if (value === 2) return { status: 'watch', statusReason: '체류 시간이 낮은 편이라 개선 여지가 있다.' }
      return { status: 'good', statusReason: '체류 시간이 방어 구간에 있다.' }
    default:
      return {
        status: 'neutral',
        statusReason: '현재 값은 참고 맥락으로만 쓰고 직접 driver 판정 대상은 아니다.',
      }
  }
}

export function buildStrategyInputSnapshot({
  currentInput,
  incidentAffectedFeatures,
  modelSchema,
}: {
  currentInput: Partial<Record<FeatureName, string | number>>
  incidentAffectedFeatures: string[]
  modelSchema: ModelFeatureField[]
}): StrategyInputSnapshot {
  const schemaByName = new Map(modelSchema.map((field) => [field.name, field]))

  const allInputs = (Object.entries(currentInput) as Array<[FeatureName, string | number]>).map(
    ([name, rawCurrentValue]) => {
      const metadata = FEATURE_METADATA[name]
      const backendSchema = schemaByName.get(name)
      const categories = backendSchema?.categories?.length
        ? backendSchema.categories
        : metadata.categories ?? []
      const currentValue = backendSchema?.dtype === 'numeric' && typeof rawCurrentValue === 'string'
        ? Number(rawCurrentValue)
        : rawCurrentValue
      const { status, statusReason } = deriveStatus(name, currentValue)

      return {
        name,
        label: backendSchema?.label ?? metadata.label,
        description: backendSchema?.description ?? metadata.description,
        group: backendSchema?.group ?? metadata.group,
        editable: backendSchema?.editable ?? metadata.editable,
        editableReason: backendSchema?.editable_reason ?? metadata.editableReason,
        inputKind: metadata.inputKind,
        currentValue,
        minimum: backendSchema?.minimum ?? metadata.minimum,
        maximum: backendSchema?.maximum ?? metadata.maximum,
        step: backendSchema?.step ?? metadata.step,
        budgetStep: backendSchema?.budget_step ?? undefined,
        unitBudgetCost: backendSchema?.unit_budget_cost ?? undefined,
        categories,
        preferredDirection: metadata.preferredDirection,
        targetHint: metadata.targetHint,
        whyHelpful: metadata.whyHelpful,
        caution: metadata.caution,
        actionExamples: metadata.actionExamples ?? [],
        incidentRelevant: incidentAffectedFeatures.includes(name),
        status,
        statusReason,
      } satisfies StrategyInputSnapshotField
    },
  )

  const editableInputs = allInputs.filter((field) => field.editable)
  const lockedInputs = allInputs.filter((field) => !field.editable)
  const focusInputs = editableInputs
    .filter((field) => field.incidentRelevant || field.status === 'risk' || field.status === 'watch')
    .sort((left, right) => Number(right.incidentRelevant) - Number(left.incidentRelevant))

  return {
    editableInputs,
    lockedInputs,
    focusInputs,
    influenceRules: INFLUENCE_RULES,
  }
}
