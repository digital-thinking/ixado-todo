from fastapi import FastAPI, HTTPException, Path, Response, status
from pydantic import BaseModel, Field, field_validator


class TodoCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=1000)
    completed: bool = False

    @field_validator("title")
    @classmethod
    def title_must_not_be_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("title must not be blank")
        return cleaned


class TodoUpdate(TodoCreate):
    pass


class Todo(TodoCreate):
    id: int = Field(gt=0)


app = FastAPI(title="Ixado Todo API")

_todos: dict[int, Todo] = {}
_next_id = 1


def reset_store() -> None:
    global _todos, _next_id
    _todos = {}
    _next_id = 1


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/todos", response_model=list[Todo])
def list_todos() -> list[Todo]:
    return [_todos[todo_id] for todo_id in sorted(_todos)]


@app.post("/todos", response_model=Todo, status_code=status.HTTP_201_CREATED)
def create_todo(payload: TodoCreate) -> Todo:
    global _next_id

    todo = Todo(id=_next_id, **payload.model_dump())
    _todos[todo.id] = todo
    _next_id += 1
    return todo


@app.get("/todos/{todo_id}", response_model=Todo)
def get_todo(todo_id: int = Path(gt=0)) -> Todo:
    todo = _todos.get(todo_id)
    if todo is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")
    return todo


@app.put("/todos/{todo_id}", response_model=Todo)
def update_todo(payload: TodoUpdate, todo_id: int = Path(gt=0)) -> Todo:
    if todo_id not in _todos:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")

    updated = Todo(id=todo_id, **payload.model_dump())
    _todos[todo_id] = updated
    return updated


@app.delete("/todos/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_todo(todo_id: int = Path(gt=0)) -> Response:
    if todo_id not in _todos:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Todo not found")

    del _todos[todo_id]
    return Response(status_code=status.HTTP_204_NO_CONTENT)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=False)
