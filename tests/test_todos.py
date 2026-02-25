from fastapi.testclient import TestClient

from app.main import app, reset_store


client = TestClient(app)


def setup_function() -> None:
    reset_store()


def test_create_and_list_todos() -> None:
    response = client.post(
        "/todos",
        json={"title": "Buy milk", "description": "2%", "completed": False},
    )
    assert response.status_code == 201
    assert response.json() == {
        "id": 1,
        "title": "Buy milk",
        "description": "2%",
        "completed": False,
    }

    response = client.get("/todos")
    assert response.status_code == 200
    assert response.json() == [
        {"id": 1, "title": "Buy milk", "description": "2%", "completed": False}
    ]


def test_get_update_and_delete_todo() -> None:
    create = client.post("/todos", json={"title": "Task", "description": None, "completed": False})
    assert create.status_code == 201

    response = client.get("/todos/1")
    assert response.status_code == 200
    assert response.json()["title"] == "Task"

    update = client.put(
        "/todos/1",
        json={"title": "Task done", "description": "updated", "completed": True},
    )
    assert update.status_code == 200
    assert update.json() == {
        "id": 1,
        "title": "Task done",
        "description": "updated",
        "completed": True,
    }

    delete = client.delete("/todos/1")
    assert delete.status_code == 204

    missing = client.get("/todos/1")
    assert missing.status_code == 404
    assert missing.json() == {"detail": "Todo not found"}


def test_validation_and_not_found_errors() -> None:
    invalid_title = client.post("/todos", json={"title": "   "})
    assert invalid_title.status_code == 422

    invalid_id = client.get("/todos/0")
    assert invalid_id.status_code == 422

    missing_update = client.put("/todos/999", json={"title": "x", "description": None, "completed": False})
    assert missing_update.status_code == 404
    assert missing_update.json() == {"detail": "Todo not found"}

    missing_delete = client.delete("/todos/999")
    assert missing_delete.status_code == 404
    assert missing_delete.json() == {"detail": "Todo not found"}
