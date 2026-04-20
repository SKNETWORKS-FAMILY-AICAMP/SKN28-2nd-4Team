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
    assert body["available_actions"]
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
    assert body["initialPolicies"][0]["decision"]["actionId"]
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
            "decision": {"action_id": "service_recovery", "intensity": 0.8},
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["engine_id"] == "live_customer_churn_inference_xgb_v2"
    assert body["event"]["label"]
    assert body["predicted_users_next"] <= started["state"]["current_users"]
    assert body["next_state"]["turn_index"] == started["state"]["turn_index"] + 1
    assert body["trend_point"]["actual_users"] == started["state"]["current_users"]
    assert body["risk_band"] in {"low", "medium", "high"}
