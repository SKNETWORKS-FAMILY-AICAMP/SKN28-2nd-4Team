# 프론트엔드 요구사항 문서: Frontend Requirements & Structure

## 0. 문서 목적

본 문서는 프론트엔드 구현을 **시각 스타일**이 아니라 **정보 구조와 상호작용 구조** 기준으로 정의한다.

목적:
- 프론트엔드가 반드시 보여줘야 하는 정보를 정리한다.
- 기능 단위를 component 단위로 쪼갠다.
- 페이지/섹션을 semantic HTML 기준으로 정리한다.
- 디자인 테마, 분위기, 브랜딩 단어가 요구사항을 흐리지 않도록 막는다.

이 문서는 아래 질문에 답해야 한다.

1. 사용자는 무엇을 봐야 하는가?
2. 사용자는 무엇을 선택해야 하는가?
3. 시스템은 어떤 결과를 바로 돌려줘야 하는가?
4. 한 세션이 끝난 뒤 무엇을 다시 볼 수 있어야 하는가?

---

## 1. 비범위

이 문서는 아래 내용을 다루지 않는다.

- 색상, 폰트, 그래픽 스타일
- “대시보드 같다”, “워룸 같다” 같은 분위기 표현
- 브랜딩 카피
- 장식용 애니메이션
- 미적 레이아웃 상세

즉 프론트엔드 문서에서 중요한 것은 “어떻게 보여줄까”가 아니라  
“무엇을 보여줘야 하며, 어떤 순서로 상호작용이 일어나야 하는가”다.

---

## 2. 프론트엔드의 핵심 책임

프론트엔드는 엔진 위에 놓이는 **Experience Layer** 로서 아래 책임을 가진다.

1. 세션 시작 조건을 입력받는다.
2. 현재 턴의 상태와 맥락을 보여준다.
3. 현재 턴에 가능한 action을 선택하게 한다.
4. action 결과를 상태 변화와 함께 즉시 보여준다.
5. 기준 정책과 사용자 선택의 차이를 설명 가능한 형태로 보여준다.
6. 턴 기록과 세션 요약을 다시 볼 수 있게 한다.

이 책임을 벗어나는 장식적 요소는 요구사항 우선순위에서 제외한다.

---

## 3. 프론트엔드가 반드시 지원해야 하는 사용자 흐름

### 3.1 Session Entry
- 시나리오를 선택하거나 고정된 시나리오 정보를 확인한다.
- 세션 시작에 필요한 최소 입력을 받는다.
- 세션을 시작한다.

### 3.2 Turn Play
- 현재 턴 번호와 세션 진행 상태를 본다.
- 현재 visible state를 읽는다.
- 현재 event와 turn context를 확인한다.
- available action 중 하나를 선택한다.
- action을 제출한다.

### 3.3 Turn Result Review
- 이번 턴에 무엇을 선택했는지 확인한다.
- 어떤 state 변화가 일어났는지 확인한다.
- reward와 주요 구성요소를 확인한다.
- 기준 정책이 무엇을 추천했는지 확인한다.

### 3.4 Session End
- 전체 결과 요약을 본다.
- 주요 turning point 또는 누적 경향을 확인한다.
- replay 또는 turn history를 다시 본다.

### 3.5 Replay / Retrospective
- 특정 턴의 event / action / result를 다시 확인한다.
- 사람 선택과 shadow policy 차이를 추적한다.

---

## 4. 필수 페이지/영역 정의

프론트엔드는 최소 아래 4개 화면 또는 영역 구조를 가져야 한다.

1. Session Start View
2. Main Play View
3. Session Summary View
4. Replay View

별도 route로 분리해도 되고, 한 화면 안에서 상태 전환으로 처리해도 된다.  
중요한 것은 **구조적 책임이 분리되어야 한다**는 점이다.

---

## 5. Component Unit 정의

아래는 디자인 컴포넌트가 아니라 **기능 단위 컴포넌트** 정의다.

| Component Unit | 역할 | 반드시 보여줘야 하는 내용 | 핵심 포인트 |
|---|---|---|---|
| `AppShell` | 전체 앱 공통 골격 | 앱 제목, 현재 뷰, 공통 navigation 또는 session context | 모든 화면에서 컨텍스트를 잃지 않게 한다 |
| `ScenarioIntro` | 시작 전 시나리오 설명 | 시나리오 이름, 설명, 핵심 전제 | 장식적 소개가 아니라 플레이 전제 요약이어야 한다 |
| `SessionStartForm` | 세션 시작 입력 | scenario_id, seed, mode 등 시작 파라미터 | 최소 입력만 받고 바로 시작 가능해야 한다 |
| `SessionStatusBar` | 현재 세션 상태 표시 | session_id, turn index, 남은 턴 또는 종료 조건 | 플레이 흐름 기준점 역할 |
| `StateSummaryPanel` | 현재 visible state 요약 | user_base, retention_score, paying_ratio, lock_in_score, incident_pressure 등 | 플레이어가 “현재 상태”를 읽는 기본 영역 |
| `EventPanel` | 현재 event와 맥락 표시 | event_id 또는 event label, 상황 설명, 영향 요약 | action 선택 전 맥락을 제공해야 한다 |
| `ActionList` | 현재 턴 선택지 목록 | available actions, disabled reason 또는 mask 상태 | 한 턴에 하나만 선택 가능하다는 규칙이 드러나야 한다 |
| `ActionDetailPanel` | 선택한 action 설명 | action 설명, 비용, 기대 효과, 제약조건 | action 비교를 돕는 보조 영역 |
| `TurnSubmitBar` | 행동 확정 | submit action control, 현재 선택값 | 제출 가능 상태가 명확해야 한다 |
| `TurnResultPanel` | 방금 턴의 결과 표시 | action_taken, next_state_summary, 주요 delta | 결과가 action과 연결되어 보여야 한다 |
| `RewardBreakdownPanel` | reward 설명 | total reward, component별 값 | 총점만 보여주지 말고 분해값을 같이 보여야 한다 |
| `PolicyComparisonPanel` | 기준 정책 비교 | recommended_action, q_gap, regret, 판단 차이 | 이 프로젝트의 핵심 메시지를 담당하는 영역 |
| `TurnHistoryList` | 누적 턴 기록 | turn별 event, action, result summary | 세션 누적 흐름을 다시 볼 수 있어야 한다 |
| `SessionOutcomePanel` | 세션 종료 요약 | 최종 상태, 핵심 지표 변화, 플레이 결과 해석 | 발표/회고에 바로 쓸 수 있는 요약이어야 한다 |
| `ReplayViewer` | replay 탐색 | turn-by-turn log, state/action/result 재확인 | 특정 세션 재해석이 가능해야 한다 |
| `AdvisorPanel` | 해설 질의 | 질문 입력, engine-grounded explanation 응답 | 있으면 좋지만 core flow보다 뒤에 둔다 |

---

## 6. 핵심 정보 구조

프론트엔드의 핵심 정보 구조는 아래 순서를 따라야 한다.

1. 지금 어떤 세션인가
2. 지금 몇 턴인가
3. 지금 상태가 어떤가
4. 무슨 사건이 발생했는가
5. 지금 무엇을 선택할 수 있는가
6. 내가 무엇을 선택했는가
7. 그 결과 무엇이 바뀌었는가
8. 기준 정책은 무엇을 했을 것인가
9. 이 세션 전체를 어떻게 해석할 수 있는가

이 순서가 흐려지면 프론트가 엔진의 메시지를 전달하지 못한다.

---

## 7. Main Play View의 권장 구조

Main Play View는 아래 정보 블록을 기준으로 구성한다.

### 필수 상단 블록
- 세션 제목 또는 시나리오 이름
- 턴 번호
- 진행 상태

### 필수 본문 블록
- 현재 상태 요약
- 현재 이벤트
- action 목록
- 선택한 action 상세

### 필수 결과 블록
- 직전 또는 방금 제출한 action 결과
- reward 분해
- 기준 정책 비교

### 필수 누적 블록
- turn history
- 세션 종료 시 요약 링크 또는 결과 영역

중요한 점:
- `상태 -> 이벤트 -> 선택 -> 결과 -> 비교` 순서가 유지되어야 한다.
- prediction 정보가 있더라도 core flow를 가리는 위치에 두지 않는다.

### 7.1 Monthly Strategy Dashboard 변형 해석

`Monthly Strategy Dashboard` 는 별도 제품 유형이 아니라 `Main Play View` 를 월간 운영 브리핑 형태로 표현한 변형이다.

이 변형이 사용자가 느껴야 하는 핵심은 아래와 같다.

- 지금 나는 월 단위 운영 보고를 받고 있다.
- 지금 나는 조언과 맥락을 참고하되 직접 정책을 선택해야 한다.
- 지금 이 선택이 다음 달 상태 변화로 이어진다는 책임감을 느껴야 한다.

중요:
- 이 느낌은 색상이나 세계관 카피만으로 만들지 않는다.
- 반드시 `상태 요약 -> 맥락/조언 -> 정책 선택 -> 결과/비교` 정렬로 만들어야 한다.
- `Village`, `Council`, `Elder` 같은 명칭은 표현 레이어일 뿐이며 구조적 책임을 바꾸지 않는다.

| Stitch 표현 블록 | 실제 의미 | 대응 컴포넌트 | 배치 규칙 |
|---|---|---|---|
| 상단 월간 헤더 | 현재 세션 식별과 진행 상태 | `AppShell`, `SessionStatusBar` | 화면 최상단에 고정하거나 항상 보이는 위치에 둔다 |
| 메인 hero 지표/차트 | 현재 visible state와 최근 추세 | `StateSummaryPanel` | 본문에서 가장 먼저 읽히는 블록이어야 한다 |
| 전략 상담/대화 영역 | 현재 이벤트 맥락, 해설, 질의응답 | `EventPanel`, `AdvisorPanel` | 상태 요약 다음에 오며 action 선택 직전 맥락을 제공해야 한다 |
| 정책 선택 패널 | 선택 가능한 action, 선택값, 제출 | `ActionList`, `ActionDetailPanel`, `TurnSubmitBar` | 상담/맥락 영역과 같은 시야 안에 두어 바로 결정 가능해야 한다 |
| 이해관계자/mandate 보조 레일 | 압박 요인, 보조 맥락, 제약 조건 | `EventPanel` 의 보조 표현 또는 별도 context panel | 우측 rail 또는 보조 열에 둘 수 있지만 core flow를 대체하면 안 된다 |
| 결과/보상/비교/히스토리 영역 | 선택 이후 학습 루프 | `TurnResultPanel`, `RewardBreakdownPanel`, `PolicyComparisonPanel`, `TurnHistoryList` | 메인 결정 블록 바로 아래, 혹은 같은 화면의 tab/accordion 안에서 즉시 접근 가능해야 한다 |

LLM 구현 지침:
- `Village Elder` 같은 명칭을 쓰더라도 구현 설명에서는 반드시 `AdvisorPanel` 이라고 함께 적는다.
- `Council Chamber` 같은 명칭을 쓰더라도 구현 설명에서는 반드시 `ActionList/TurnSubmitBar` 로 해석한다.
- `월간 브리핑` 이라는 느낌을 살리고 싶다면 서사 이름을 늘리는 대신 상단 상태, 중앙 상태 요약, 우측 결정 패널의 정렬을 먼저 맞춘다.

---

## 8. Semantic HTML 구조 초안

### 8.1 Session Start View

```html
<main>
  <header>
    <h1>Retention Strategy Simulator</h1>
    <p>프로젝트와 시나리오의 핵심 전제를 요약한다.</p>
  </header>

  <section aria-labelledby="scenario-heading">
    <h2 id="scenario-heading">Scenario Introduction</h2>
    <p>시나리오 설명</p>
    <ul>
      <li>기업 특성</li>
      <li>핵심 리스크</li>
      <li>종료 조건</li>
    </ul>
  </section>

  <section aria-labelledby="session-start-heading">
    <h2 id="session-start-heading">Start Session</h2>
    <form>
      <label>Scenario</label>
      <select></select>

      <label>Mode</label>
      <select></select>

      <label>Seed</label>
      <input type="text" />

      <button type="submit">Start</button>
    </form>
  </section>
</main>
```

### 8.2 Main Play View

```html
<main>
  <header>
    <h1>Session Overview</h1>
    <p>현재 시나리오와 턴 정보를 보여준다.</p>
  </header>

  <section aria-labelledby="session-status-heading">
    <h2 id="session-status-heading">Session Status</h2>
  </section>

  <section aria-labelledby="state-summary-heading">
    <h2 id="state-summary-heading">Current State</h2>
  </section>

  <section aria-labelledby="event-heading">
    <h2 id="event-heading">Current Event</h2>
  </section>

  <section aria-labelledby="action-heading">
    <h2 id="action-heading">Choose Action</h2>
    <form>
      <fieldset>
        <legend>Available Actions</legend>
      </fieldset>
      <button type="submit">Submit Action</button>
    </form>
  </section>

  <aside aria-labelledby="action-detail-heading">
    <h2 id="action-detail-heading">Action Detail</h2>
  </aside>

  <section aria-labelledby="turn-result-heading">
    <h2 id="turn-result-heading">Turn Result</h2>
  </section>

  <section aria-labelledby="reward-heading">
    <h2 id="reward-heading">Reward Breakdown</h2>
  </section>

  <section aria-labelledby="comparison-heading">
    <h2 id="comparison-heading">Policy Comparison</h2>
  </section>

  <section aria-labelledby="history-heading">
    <h2 id="history-heading">Turn History</h2>
  </section>
</main>
```

### 8.2.1 Monthly Strategy Dashboard 변형 예시

아래 예시는 `Main Play View` 를 월간 브리핑 형태로 번역한 구조다.
이 예시는 분위기 이름이 아니라 `무엇이 어디에 있어야 하는가` 를 보여주기 위한 것이다.

```html
<main>
  <header>
    <h1>Monthly Strategy Dashboard</h1>
    <p>현재 세션, 현재 월, 핵심 상태를 요약한다.</p>
  </header>

  <nav aria-label="Session sections">
    <button>Overview</button>
    <button>Growth</button>
    <button>Strategy</button>
    <button>Archive</button>
  </nav>

  <section aria-labelledby="monthly-state-heading">
    <h2 id="monthly-state-heading">Monthly State Summary</h2>
    <p>현재 사용자 상태와 최근 추세를 보여준다.</p>
  </section>

  <section aria-labelledby="briefing-heading">
    <div>
      <section aria-labelledby="event-context-heading">
        <h2 id="event-context-heading">Event and Advisory Context</h2>
        <p>현재 이벤트, 이해관계자 신호, advisor 설명을 제공한다.</p>
      </section>

      <section aria-labelledby="policy-heading">
        <h2 id="policy-heading">Choose Monthly Policy</h2>
        <form>
          <fieldset>
            <legend>Available Policies</legend>
          </fieldset>
          <aside aria-labelledby="policy-detail-heading">
            <h3 id="policy-detail-heading">Policy Detail</h3>
          </aside>
          <button type="submit">Advance to Next Month</button>
        </form>
      </section>
    </div>

    <aside aria-labelledby="context-rail-heading">
      <h2 id="context-rail-heading">Stakeholders and Mandates</h2>
      <p>보조 맥락과 압박 요인을 보여준다.</p>
    </aside>
  </section>

  <section aria-labelledby="result-heading">
    <h2 id="result-heading">Latest Turn Result</h2>
  </section>

  <section aria-labelledby="reward-heading">
    <h2 id="reward-heading">Reward Breakdown</h2>
  </section>

  <section aria-labelledby="comparison-heading">
    <h2 id="comparison-heading">Policy Comparison</h2>
  </section>

  <section aria-labelledby="history-heading">
    <h2 id="history-heading">Turn History</h2>
  </section>
</main>
```

### 8.3 Session Summary View

```html
<main>
  <header>
    <h1>Session Summary</h1>
    <p>세션 전체 결과를 요약한다.</p>
  </header>

  <section aria-labelledby="outcome-heading">
    <h2 id="outcome-heading">Final Outcome</h2>
  </section>

  <section aria-labelledby="metric-heading">
    <h2 id="metric-heading">Metric Summary</h2>
  </section>

  <section aria-labelledby="comparison-summary-heading">
    <h2 id="comparison-summary-heading">Policy Comparison Summary</h2>
  </section>

  <section aria-labelledby="replay-access-heading">
    <h2 id="replay-access-heading">Replay Access</h2>
  </section>
</main>
```

### 8.4 Replay View

```html
<main>
  <header>
    <h1>Replay Viewer</h1>
    <p>턴별 기록을 다시 확인한다.</p>
  </header>

  <section aria-labelledby="replay-list-heading">
    <h2 id="replay-list-heading">Turn List</h2>
  </section>

  <section aria-labelledby="replay-detail-heading">
    <h2 id="replay-detail-heading">Turn Detail</h2>
  </section>
</main>
```

---

## 9. 엔진 계약과 프론트 연결

프론트 요구사항은 엔진의 API/packet 구조에 직접 매핑되어야 한다.

| 엔진 출력/엔드포인트 | 프론트 책임 |
|---|---|
| `POST /api/session/start` | Session Entry 이후 초기 상태/첫 턴 context 렌더 |
| `POST /api/session/{session_id}/turn` | turn result, next actions, replay snippet 렌더 |
| `GET /api/session/{session_id}/state` | 현재 상태 재조회 및 동기화 |
| `GET /api/session/{session_id}/replay` | replay viewer 또는 history detail 렌더 |
| `POST /api/session/{session_id}/advisor` | 선택적 해설 패널 제공 |

프론트 문서는 mock 화면이 아니라,  
위 계약을 어떤 컴포넌트가 소비하는지까지 연결해서 설명해야 한다.

---

## 10. 우선순위 재정의

현재 프론트엔드 요구사항의 우선순위는 아래와 같다.

### P0
- 세션 시작
- 현재 상태 표시
- 이벤트 제시
- action 선택 및 제출
- turn 결과 표시
- 기준 정책 비교

### P1
- turn history
- session summary
- replay 확인

### P2
- advisor/explanation panel
- 추가 분석 뷰
- prediction 보조 화면

즉, `prediction view` 는 있을 수 있지만 core gameplay requirement보다 앞에 두지 않는다.

---

## 11. 문서 작성 규칙

앞으로 프론트 관련 문서는 아래 형식으로 서술한다.

### 좋은 서술 방식
- 무엇을 보여줘야 하는가
- 어떤 데이터가 필요한가
- 사용자가 무엇을 할 수 있는가
- 어떤 결과가 다음 단계로 이어지는가

### LLM 구현 친화 서술 방식
- 비유나 감정 단어를 쓸 때는 반드시 실제 기능 이름을 같이 적는다. 예: `Village Elder (AdvisorPanel)`
- 화면 이름이 `Dashboard` 여도 먼저 적어야 하는 것은 장식이 아니라 판단 순서다.
- 각 영역 설명에는 최소한 `역할`, `필요 데이터`, `사용자 행동`, `다음 연결` 중 2개 이상이 들어가야 한다.
- 세계관 카피와 엔진 계약을 분리해서 적는다. 카피는 바뀔 수 있지만 컴포넌트 책임은 유지되어야 한다.
- `느낌` 을 설명할 때는 추상 형용사 대신 정렬 규칙으로 풀어쓴다. 예: `월간 운영 브리핑 느낌 = 상단 세션 상태 + 중앙 상태 요약 + 우측 정책 선택 + 하단 결과 비교`

### 피해야 할 서술 방식
- 막연한 무드 설명
- 비유 중심의 공간 이름
- 기능과 무관한 테마 장식
- “뭔가 있어 보이는” 대시보드 표현

예:

- 나쁜 예: `워룸 느낌의 강한 운영자 대시보드`
- 좋은 예: `현재 상태, 이벤트, 선택 가능한 action, turn 결과를 한 흐름으로 보여주는 메인 플레이 뷰`
- 더 좋은 예: `월간 운영 브리핑 형태의 메인 플레이 뷰. 상단에는 세션/월 상태, 중앙에는 현재 상태와 이벤트 맥락, 우측에는 정책 선택과 제출, 하단에는 결과와 기준 정책 비교를 둔다.`
- 나쁜 예 추가: `마을 회의와 원로의 조언이 중심인 감성형 대시보드`

---

## 12. 한 줄 정의

> 프론트엔드는 엔진의 상태·이벤트·선택·결과·비교를 세션 단위로 보여주고 조작하게 만드는 구조여야 하며, 시각 테마보다 정보 구조가 먼저 정의되어야 한다.
