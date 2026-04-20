from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from be.prediction import PredictionService
from be.schemas import (
    ArchitectureResponse,
    PredictionRequest,
    PredictionResponse,
    PredictionSessionStartRequest,
    PredictionSessionStartResponse,
    SimulatorDashboardResponse,
)
from be.settings import settings


def create_app() -> FastAPI:
    prediction_service = PredictionService(settings)

    app = FastAPI(title=settings.service_name, version=settings.service_version)
    app.state.prediction_service = prediction_service

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
        return {
            "status": "ok",
            "service": settings.service_name,
            "version": settings.service_version,
        }

    @app.get("/api/system/architecture", response_model=ArchitectureResponse)
    def architecture() -> ArchitectureResponse:
        return ArchitectureResponse(
            service_name=settings.service_name,
            service_version=settings.service_version,
            repo_root=str(settings.repo_root),
            docs_dir=str(settings.docs_dir),
            scenario_dir=str(settings.scenario_dir),
            replay_dir=str(settings.replay_dir),
            mdp_engine="Lightweight sessionless simulation with frontend-driven state and backend-managed random events.",
            prediction_engine=(
                "In-process XGBoost inference over the Ecommerce_Customer serving schema, "
                "with company-level policy decisions translated into customer-level feature shifts."
            ),
            research_workspace=str(settings.repo_root / "back_research"),
            deployment_note=(
                "Live prediction stays in this FastAPI service for the MVP. "
                "Strategy LLM selection and prompting are handled in the frontend via AI SDK."
            ),
        )

    @app.post(
        "/api/prediction/session/start", response_model=PredictionSessionStartResponse
    )
    def start_prediction_session(
        request: PredictionSessionStartRequest,
    ) -> PredictionSessionStartResponse:
        return prediction_service.start_session(request)

    @app.post("/api/prediction/churn", response_model=PredictionResponse)
    def predict_churn(request: PredictionRequest) -> PredictionResponse:
        try:
            return prediction_service.score(request)
        except KeyError as exc:
            raise HTTPException(status_code=404, detail=str(exc)) from exc
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    @app.get("/api/simulator/dashboard", response_model=SimulatorDashboardResponse)
    def simulator_dashboard() -> SimulatorDashboardResponse:
        return prediction_service.dashboard()

    return app


app = create_app()
