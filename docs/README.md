# Docs

`docs/` 는 이 저장소의 공용 문서 루트다.

이 디렉토리는 아래 두 영역으로 나눈다.

- `docs/project_specific/`: 프로젝트 내부 기준, 기술 설계, 운영 규칙 문서
- `docs/prds/`: 제품 요구사항과 산출물 요구 문서

## 디렉토리 구조

```text
docs/
  README.md
  project_specific/
    README.md
    01_engine_technical_design.md
    05_agent_workspace_guidelines.md
  prds/
    README.md
    02_project_description_and_plan.md
    03_final_deliverables_spec.md
    04_frontend_requirements_structure.md
```

## 문서 분류 기준

- `project_specific/`
  - 기술 구조, 운영 규칙, 에이전트 협업 규칙처럼 이 저장소의 내부 기준이 되는 문서
- `prds/`
  - 프로젝트 설명, 제품 요구사항, 최종 산출물 요구처럼 구현과 시연의 기준이 되는 문서

## 작성 규칙

- `docs/` 아래 문서는 기본적으로 Markdown 파일로 관리한다.
- `docs/prds/` 아래 PRD 성격 문서는 한국어 작성을 기본 원칙으로 한다.
- 문서를 새로 만들 때는 먼저 어느 디렉토리에 속하는지 결정한 뒤 추가한다.
- 문서 경로를 코드나 다른 문서에서 참조할 때는 현재 구조를 기준으로 정확한 경로를 적는다.

## 권장 읽기 순서

1. `docs/prds/02_project_description_and_plan.md`
2. `docs/project_specific/01_engine_technical_design.md`
3. `docs/prds/04_frontend_requirements_structure.md`
4. `docs/prds/03_final_deliverables_spec.md`
5. `docs/project_specific/05_agent_workspace_guidelines.md`
