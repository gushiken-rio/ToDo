### todo-backend (FastAPI)

This is the backend API for a simple Todo app.

### Implemented

- **Task CRUD**: create / list (with filter) / get / update / toggle done / delete
- **Persistence**: SQLite
- **Validation**: title required (min length 1)
- **Docs**: OpenAPI available at `/docs`

### Requirements

- Python 3.10+ recommended
- On Ubuntu/Debian, you may need `python3-venv`:
  - `sudo apt update && sudo apt install -y python3-venv`

### Setup & Run

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Environment Variables

- `DATABASE_URL` (default: `sqlite:///./app.db`)
- `CORS_ORIGINS` (default: `http://localhost:3000`)

### API Quick Reference

- `GET /health`
- `GET /v1/tasks?status=all|done|todo&q=...&limit=100&offset=0`
- `POST /v1/tasks` body: `{ "title": "...", "description": "..." }`
- `GET /v1/tasks/{id}`
- `PATCH /v1/tasks/{id}` body: `{ "title"?: "...", "description"?: "...", "is_done"?: true }`
- `PATCH /v1/tasks/{id}/toggle`
- `DELETE /v1/tasks/{id}`


