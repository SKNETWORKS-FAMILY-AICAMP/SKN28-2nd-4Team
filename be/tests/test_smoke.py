from fastapi.testclient import TestClient

from be import app, main


client = TestClient(app)


def test_main_runs(monkeypatch) -> None:
    called: dict[str, object] = {}

    def fake_run(app_path: str, *, host: str, port: int, reload: bool) -> None:
        called["app_path"] = app_path
        called["host"] = host
        called["port"] = port
        called["reload"] = reload

    monkeypatch.setattr("be.uvicorn.run", fake_run)
    main()
    assert called == {
        "app_path": "be.app:app",
        "host": "127.0.0.1",
        "port": 8000,
        "reload": True,
    }


def test_architecture_endpoint_exposes_repo_context() -> None:
    response = client.get("/api/system/architecture")
    assert response.status_code == 200
    body = response.json()
    assert body["repo_root"].lower().endswith("skn28-2nd-4team")
    assert body["scenario_dir"].endswith("scenarios")
    assert "frontend" in body["deployment_note"].lower()


def test_prediction_session_start_returns_live_state() -> None:
    response = client.post(
        "/api/prediction/session/start",
        json={"system_id": "growth", "initial_users": 15420, "random_seed": 7},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["session_id"]
    assert body["random_seed"] == 7
    assert body["business_model_id"] == "ecommerce_customer_xgb_v2_no_customer_id"
    assert body["state"]["current_users"] == 15420
    assert body["model_schema"]
    assert body["model_schema"][0]["name"] == "Tenure"
    assert "CustomerID" not in body["state"]["model_input"]
    assert body["initial_trend_point"]["predicted_users"] == 15420


def test_dashboard_endpoint_returns_live_dashboard_contract() -> None:
    response = client.get("/api/simulator/dashboard")
    assert response.status_code == 200
    body = response.json()
    assert body["workspace"]["monthlyLabel"]
    assert body["systems"]
    assert len(body["incidents"]) >= 14
    assert body["incidents"][0]["eventId"]
    assert body["focusBySystem"]["growth"]["title"]
    assert body["trendBySystem"]["growth"][0]["label"]


def test_prediction_endpoint_returns_event_and_next_state() -> None:
    start_response = client.post(
        "/api/prediction/session/start",
        json={"system_id": "support", "initial_users": 13250, "random_seed": 11},
    )
    assert start_response.status_code == 200
    started = start_response.json()

    response = client.post(
        "/api/prediction/churn",
        json={
            "session_id": started["session_id"],
            "state": started["state"],
            "incident_id": "incident-support-1",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["engine_id"] == "live_customer_churn_inference_xgb_v2"
    assert body["event"]["label"]
    assert body["degraded_model_input"]
    assert body["strategy_budget"]["remaining_budget"] >= 0
    assert body["spent_budget_this_turn"] >= 0
    assert body["applied_adjustments"] is not None
    assert body["predicted_users_next"] <= started["state"]["current_users"]
    assert body["next_incident_id"]
    assert body["next_incident_id"] != "incident-support-1"
    assert body["next_incident"]["id"] == body["next_incident_id"]
    assert body["next_incident"]["eventId"]
    assert len(body["next_incident_options"]) == 4
    assert body["next_incident_options"][0]["id"] == body["next_incident_id"]
    assert body["next_state"]["turn_index"] == started["state"]["turn_index"] + 1
    assert body["trend_point"]["actual_users"] == started["state"]["current_users"]
    assert body["risk_band"] in {"low", "medium", "high"}


def test_prediction_endpoint_rotates_incident_even_for_single_incident_system() -> None:
    start_response = client.post(
        "/api/prediction/session/start",
        json={"system_id": "trust", "initial_users": 14000, "random_seed": 5},
    )
    assert start_response.status_code == 200
    started = start_response.json()

    response = client.post(
        "/api/prediction/churn",
        json={
            "session_id": started["session_id"],
            "state": started["state"],
            "incident_id": "incident-trust-1",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["next_incident_id"]
    assert body["next_incident_id"] != "incident-trust-1"
    assert body["next_incident"]["systemId"] == "trust"
    assert body["next_incident"]["eventId"] != "trust_payment_retry_spike"
    assert len(body["next_incident_options"]) == 4


def test_prediction_endpoint_accepts_synthetic_incident_id() -> None:
    start_response = client.post(
        "/api/prediction/session/start",
        json={"system_id": "growth", "initial_users": 14000, "random_seed": 7},
    )
    assert start_response.status_code == 200
    started = start_response.json()

    response = client.post(
        "/api/prediction/churn",
        json={
            "session_id": started["session_id"],
            "state": started["state"],
            "incident_id": "incident-growth-seasonal_softness",
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["event"]["event_id"] == "seasonal_softness"
    assert len(body["next_incident_options"]) == 4
    assert body["next_state"]["turn_index"] == started["state"]["turn_index"] + 1
