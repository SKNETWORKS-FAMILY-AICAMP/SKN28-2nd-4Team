from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from be.engines.chat import ChatService
from be.engines.mdp import ScenarioRepository, SessionService
from be.engines.prediction import PredictionService
from be.schemas import (
    ArchitectureResponse,
    ChatRequest,
    PredictionRequest,
    PredictionResponse,
    SessionStartRequest,
    SessionStartResponse,
    TurnRequest,
    TurnResponse,
)
from be.settings import settings


def create_app() -> FastAPI:
    scenario_repository = ScenarioRepository(settings.scenario_dir)
    session_service = SessionService(settings, scenario_repository)
    prediction_service = PredictionService(settings.prediction_model_path)
    chat_service = ChatService(settings)

    app = FastAPI(title=settings.service_name, version=settings.service_version)
    app.state.session_service = session_service
    app.state.scenario_repository = scenario_repository
    app.state.prediction_service = prediction_service
    app.state.chat_service = chat_service

    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=list(settings.cors_origins),
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok", "service": settings.service_name, "version": settings.service_version}

    @app.get("/api/system/architecture", response_model=ArchitectureResponse)
    def architecture() -> ArchitectureResponse:
        return ArchitectureResponse(
            service_name=settings.service_name,
            service_version=settings.service_version,
            repo_root=str(settings.repo_root),
            docs_dir=str(settings.docs_dir),
            scenario_dir=str(settings.scenario_dir),
            replay_dir=str(settings.replay_dir),
            mdp_engine="Pure Python scenario-driven turn engine loaded from repo-root scenario packages.",
            prediction_engine="In-process prediction adapter with heuristic fallback and a reserved model artifact hook.",
            research_workspace=str(settings.repo_root / "back_research"),
            deployment_note=(
                "Keep MDP and lightweight prediction inference in one FastAPI service now. "
                "Move prediction to a dedicated model server only when artifact size or latency makes in-process serving a bottleneck."
            ),
        )

    @app.get("/api/scenarios")
    def list_scenarios() -> list[dict[str, object]]:
        return [
            {
                "scenario_id": scenario.scenario_id,
                "label": scenario.label,
                "description": scenario.description,
                "max_turns": scenario.max_turns,
            }
            for scenario in scenario_repository.list_scenarios()
        ]

    @app.post("/api/session/start", response_model=SessionStartResponse)
    def start_session(request: SessionStartRequest) -> SessionStartResponse:
        try:
            return session_service.start(request.scenario_id, request.seed)
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @app.get("/api/session/{session_id}/state")
    def get_session_state(session_id: str) -> dict[str, object]:
        try:
            record = session_service.get(session_id)
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        return {
            "scenario_id": record.scenario.scenario_id,
            "current_event": record.current_event.model_dump(mode="json") if record.current_event else None,
            "state": record.state.model_dump(mode="json"),
            "available_actions": [action.model_dump(mode="json") for action in session_service.available_actions(record)],
        }

    @app.post("/api/session/{session_id}/turn", response_model=TurnResponse)
    def submit_turn(session_id: str, request: TurnRequest) -> TurnResponse:
        try:
            packet = session_service.turn(session_id, request.action_id)
            record = session_service.get(session_id)
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        return TurnResponse(
            turn_result=packet,
            next_available_actions=session_service.available_actions(record),
            current_event=record.current_event,
            replay_snippet=packet,
        )

    @app.get("/api/session/{session_id}/replay")
    def get_replay(session_id: str) -> dict[str, object]:
        try:
            return {"session_id": session_id, "replay": session_service.replay(session_id)}
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc

    @app.post("/api/prediction/churn", response_model=PredictionResponse)
    def predict_churn(request: PredictionRequest) -> PredictionResponse:
        return prediction_service.score(request)

    @app.post("/api/chat")
    async def chat(request: ChatRequest) -> StreamingResponse:
        return StreamingResponse(
            chat_service.stream_reply(request.messages),
            media_type="text/plain; charset=utf-8",
        )

    return app


app = create_app()
