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


def test_session_flow_and_replay() -> None:
    start_response = client.post(
        "/api/session/start",
        json={"scenario_id": "lockin_strong_saas", "seed": 7, "mode": "playable"},
    )
    assert start_response.status_code == 200
    started = start_response.json()
    assert started["available_actions"]

    action_id = started["available_actions"][0]["action_id"]
    session_id = started["session_id"]

    turn_response = client.post(f"/api/session/{session_id}/turn", json={"action_id": action_id})
    assert turn_response.status_code == 200
    turn_body = turn_response.json()
    assert turn_body["turn_result"]["shadow_policy"]["recommended_action"]

    state_response = client.get(f"/api/session/{session_id}/state")
    assert state_response.status_code == 200
    assert state_response.json()["state"]["turn"] == 2

    replay_response = client.get(f"/api/session/{session_id}/replay")
    assert replay_response.status_code == 200
    assert len(replay_response.json()["replay"]) == 1


def test_prediction_endpoint_returns_risk_band() -> None:
    response = client.post(
        "/api/prediction/churn",
        json={
            "scenario_id": "lockin_weak_saas",
            "retention_score": 0.32,
            "paying_ratio": 0.08,
            "lock_in_score": 0.21,
            "trust_score": 0.35,
            "incident_pressure": 0.62,
            "competitive_pressure": 0.70,
            "budget_stress": 0.58,
            "action_fatigue": 0.45,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["engine_id"] == "heuristic_churn_v1"
    assert body["risk_band"] in {"low", "medium", "high"}


def test_chat_endpoint_streams_text_response() -> None:
    response = client.post(
        "/api/chat",
        json={
            "messages": [
                {
                    "role": "user",
                    "parts": [{"type": "text", "text": "Draft a retention policy for the highest-risk VIP users."}],
                }
            ]
        },
    )

    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/plain")
    assert "retention policy" in response.text.lower() or "mock operator response" in response.text.lower()
