### Todo App (FastAPI + Next.js)

Todo管理アプリ

### 構成

- **backend/**: Python / FastAPI / SQLModel / SQLite（または MySQL）
- **frontend/**: React / Next.js (App Router) / Tailwind

---

### 実装済み機能

#### バックエンド（優先）

- **CRUD**: タスクの作成 / 一覧 / 取得 / 更新 / 削除
- **状態管理**: 完了/未完了の切り替え（`toggle`）
- **フィルタ**: `all | todo | done` + タイトル検索 `q`
- **永続化**: MySQL
- **バリデーション**: タイトル必須（空は422）
- **ドキュメント**: `/docs` (OpenAPI)
- **テスト**: 最小のAPIテスト（CRUDフロー）

#### フロントエンド（最低限）

- **タスクリスト表示**（フィルタ・検索）
- **追加 / 編集 / 完了切替 / 削除（confirmあり）**
- **視覚的フィードバック**（成功/エラーのメッセージ表示）

---

### セットアップ & 起動

#### Docker（MySQL + Backend + Frontend をまとめて起動）

```bash
docker compose up --build
```

アクセス先:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`

停止:

```bash
docker compose down
```
