# SKN28 2nd 4team Monorepo

![Repository](https://img.shields.io/badge/repository-private-FC6D26?style=flat-square&logo=gitlab&logoColor=white)
![Structure](https://img.shields.io/badge/structure-monorepo-181717?style=flat-square)
![Frontend](https://img.shields.io/badge/frontend-Vite%20%2B%20React%20%2B%20Tailwind%20%2B%20shadcn-646CFF?style=flat-square)
![Backend](https://img.shields.io/badge/backend-Python%203.12%20%2B%20uv-3776AB?style=flat-square&logo=python&logoColor=white)
![Research](https://img.shields.io/badge/research-Python%203.12%20%2B%20uv-4B8BBE?style=flat-square&logo=python&logoColor=white)

이 저장소는 프로젝트 전체를 하나의 루트에서 관리하기 위한 모노레포다.
프론트엔드, 백엔드, 리서치 코드, 문서를 한 저장소 안에서 분리해 관리하면서도 공통 컨텍스트를 유지하는 것이 목적이다.

## 왜 이렇게 구성했는가

- `fe`, `be`, `back_research`, `docs`를 역할별로 분리해 작업 충돌을 줄인다.
- Python 계열 작업은 모두 `uv` 기준으로 통일해 의존성과 실행 방식을 단순화한다.
- 프론트엔드는 `Vite + React + Tailwind v4 + shadcn/ui` 기반으로 빠르게 UI를 확장할 수 있게 둔다.
- 문서는 `docs/`로 분리해 코드와 산출물을 함께 관리하되 역할은 분명히 나눈다.
- Git 저장소는 루트 하나만 사용하고, 하위 디렉터리는 모두 이 루트 저장소에 포함된다.

## 디렉터리 구조

```text
.
├── fe/               # Vite + React + Tailwind + shadcn/ui 프론트엔드
├── be/               # uv 기반 Python 백엔드
├── back_research/    # uv 기반 Python 리서치/실험 환경
├── docs/             # 기획/기술/산출물 문서
└── .gitignore        # 로컬 개발 환경 무시 규칙
```

## 각 디렉터리 역할

### `fe/`

- 사용자에게 보여지는 웹 애플리케이션 영역
- 현재 기본 스캐폴드는 `Vite + React + TypeScript`
- `Tailwind v4`와 `shadcn/ui` 초기 설정이 반영되어 있어 바로 UI 개발을 시작할 수 있다.

### `be/`

- 서비스 로직, API, 엔진 실행 인터페이스 등을 담당할 백엔드 영역
- `uv`로 프로젝트와 의존성을 관리한다.
- 기본 테스트와 타입체크 흐름이 잡혀 있어 이후 FastAPI 등으로 확장하기 쉽다.

### `back_research/`

- 모델링, 시뮬레이션 실험, 데이터 분석, 검증용 코드를 두는 영역
- `be/`와 분리하여 실험 코드와 서비스 코드를 섞지 않도록 설계했다.

### `docs/`

- 프로젝트 설명서, 기술 설계, 최종 산출물 정의 문서를 관리하는 공간
- 기존 루트 문서들은 모두 이 폴더 아래로 정리되어 있다.

## 개발 환경 원칙

### Python

- Python 버전 기준: `3.12`
- 패키지/의존성 관리: `uv`
- 실행 예시:

```bash
cd be
uv sync
uv run python -m be
```

```bash
cd back_research
uv sync
uv run python -m back_research
```

### Frontend

- 패키지 관리: `npm`
- 실행 예시:

```bash
cd fe
npm install
npm run dev
```

프로덕션 빌드 확인:

```bash
cd fe
npm run build
```

## 검증 방법

### Backend 검증

```bash
cd be
uv run pytest
uv run ty check
```

### Research 검증

```bash
cd back_research
uv run pytest
uv run ty check
```

### Frontend 검증

```bash
cd fe
npm run build
```

## 로컬 IDE 설정 정책

- `.zed/`, `.vscode/`, `.idea/` 같은 IDE 전용 설정은 Git에 포함하지 않는다.
- 개인별 에디터 설정은 로컬에서만 유지하고, 저장소에는 커밋하지 않는다.
- 따라서 팀 공통 정책은 문서로 남기고, 실제 IDE 설정 파일은 `.gitignore`로 제외한다.

## 시작 순서 제안

1. `docs/` 문서를 먼저 읽고 프로젝트 범위와 엔진 구조를 이해한다.
2. `be/`에서 API 또는 엔진 실행 단위를 정의한다.
3. `back_research/`에서 시뮬레이션/분석 코드를 분리해 실험한다.
4. `fe/`에서 사용자 흐름과 시각 인터페이스를 구현한다.
5. 각 레이어를 루트 저장소 기준으로 함께 버전 관리한다.

## 현재 상태

- 모노레포 루트 구조 생성 완료
- Python 워크스페이스 `be`, `back_research` 초기화 완료
- `uv`, `pytest`, `ty`, `ruff` 기반 기본 개발 흐름 준비 완료
- 프론트엔드 `Vite + Tailwind + shadcn/ui` 초기화 완료
- 문서 폴더 분리 완료
- 루트 Git 저장소 초기화 완료
