"""End-to-end flow in replay mode, plus permission checks (R9)."""

from fastapi.testclient import TestClient

from tests.conftest import as_

NUSRAT = "/api/v1/leaves/leave-nusrat"


def test_health(client: TestClient) -> None:
    assert client.get("/healthz").json()["status"] == "ok"


def test_persona_required(client: TestClient) -> None:
    assert client.get("/api/v1/leaves").status_code == 401


def test_cover_person_cannot_approve(client: TestClient) -> None:
    assert client.post(f"{NUSRAT}/cover/approve", headers=as_("karim")).status_code == 403


def test_manager_cannot_run_the_employee_interview(client: TestClient) -> None:
    assert client.post(f"{NUSRAT}/interview/start", headers=as_("rafiq")).status_code == 403


def test_full_flow_interview_cover_change_return(client: TestClient) -> None:
    me, boss = as_("nusrat"), as_("rafiq")

    # Interview: the replay extractor returns quotes that are not in this transcript,
    # so R1 must downgrade them to suggested.
    r = client.post(f"{NUSRAT}/interview/start", headers=me)
    assert r.status_code == 200 and r.json()["turns"][0]["speaker"] == "shetu"
    r = client.post(
        f"{NUSRAT}/interview/reply",
        headers=me,
        json={"text": "protimash er 10 tarikh er age Donor A er expense reconcile kori"},
    )
    duties = r.json()["duties"]
    by_title = {d["title"]: d for d in duties}
    assert by_title["Monthly donor reconciliation (Donor A)"]["evidence"] == "said"
    assert by_title["Bank relationship contact"]["evidence"] == "suggested"
    assert "R1" in by_title["Bank relationship contact"]["flag"]

    # She confirms every suggestion, so all six duties enter the plan (R2).
    for d in duties:
        r = client.patch(f"/api/v1/duties/{d['id']}", headers=me, json={"confirmed": True})
    assert r.status_code == 200

    # Cover: the replay planner gives Karim 9 h a week. Karim has no availability yet.
    detail = client.post(f"{NUSRAT}/cover/propose", headers=boss).json()
    r4 = next(f for f in detail["findings"] if f["rule"] == "R4")
    assert not r4["ok"] and "Karim Hossain: no availability answer" in r4["message"]
    assert client.post(f"{NUSRAT}/cover/approve", headers=boss).status_code == 409

    detail = client.put(
        f"{NUSRAT}/availability/karim", headers=boss, json={"hours_per_week": 6}
    ).json()
    r4 = next(f for f in detail["findings"] if f["rule"] == "R4")
    assert not r4["ok"] and "9 h a week needed, 6 h available" in r4["message"]

    # The manager moves the donor reconciliation (4 h) to Tanvir: Karim 5/6, Tanvir 5/6.
    recon = next(d for d in detail["duties"] if d["title"].startswith("Monthly donor"))
    a = next(x for x in detail["assignments"] if x["duty_id"] == recon["id"])
    client.patch(f"/api/v1/assignments/{a['id']}", headers=boss, json={"cover_person_id": "tanvir"})
    r = client.post(f"{NUSRAT}/cover/approve", headers=boss)
    assert r.status_code == 200, r.json()
    assert r.json()["status"] == "active"

    # Change during leave, reported by a covering colleague, approved by the manager.
    change = client.post(
        f"{NUSRAT}/changes",
        headers=as_("karim"),
        json={"text": "Ami ar donor reconciliation korte parbo na"},
    ).json()
    assert change["parsed"]["kind"] == "cover_unavailable"
    client.post(f"/api/v1/changes/{change['id']}/decision", headers=boss, json={"approve": True})

    # Return: the scripted fast-forward leaves one duty kept without her agreement (R8).
    view = client.post(f"{NUSRAT}/demo/fast-forward", headers=boss).json()
    assert view["can_close"] is False
    assert client.post(f"{NUSRAT}/close", headers=boss).status_code == 409
    explain = client.post(f"{NUSRAT}/return/explain", headers=me).json()
    assert explain["summary_bn"]

    blocked = next(
        i
        for i in view["items"]
        if i["outcome"] == "stays_with_cover" and i["employee_agreed"] is None
    )
    view = client.post(
        f"/api/v1/return-items/{blocked['id']}/decision", headers=me, json={"decision": "return"}
    ).json()
    assert view["can_close"] is True
    assert client.post(f"{NUSRAT}/close", headers=boss).json()["status"] == "closed"

    log = client.get(f"{NUSRAT}/audit", headers=as_("farzana")).json()
    assert "cover.approved" in [e["action"] for e in log]


def test_status_page_at_root(client: TestClient) -> None:
    r = client.get("/")
    assert r.status_code == 200 and "Shetu API" in r.text and "/docs" in r.text


def test_health_json_reports_checks(client: TestClient) -> None:
    body = client.get("/healthz").json()
    assert body["status"] == "ok"
    assert {c["name"] for c in body["checks"]} >= {"Database", "Primary AI"}


def test_health_page_for_browsers(client: TestClient) -> None:
    r = client.get("/healthz", headers={"Accept": "text/html"})
    assert r.headers["content-type"].startswith("text/html") and "All systems operational" in r.text


def test_api_reference_page(client: TestClient) -> None:
    r = client.get("/docs")
    assert r.status_code == 200 and "Shetu API reference" in r.text
