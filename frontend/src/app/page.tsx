"use client";

import { createTask, deleteTask, listTasks, toggleTask, updateTask } from "@/lib/api";
import { TaskForm } from "./components/tasks/TaskForm";
import { TaskListPanel } from "./components/tasks/TaskListPanel";
import { Modal } from "./components/ui/Modal";
import { escapeCsvValue, parseCsvLine } from "@/lib/csv";
import type { TaskRead, TaskStatusFilter } from "@/lib/types";
import { useEffect, useMemo, useRef, useState } from "react";

export default function Home() {
  const [status, setStatus] = useState<TaskStatusFilter>("all");
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [items, setItems] = useState<TaskRead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [descriptionDetail, setDescriptionDetail] = useState<{ title: string; description: string } | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const selectAllRef = useRef<HTMLInputElement | null>(null);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);
  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);
  const allVisibleSelected =
    items.length > 0 && items.every((item) => selectedTaskIds.includes(item.id));
  const someVisibleSelected = !allVisibleSelected && selectedTaskIds.length > 0;

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await listTasks({
        status,
        q: debouncedQ.trim() || undefined,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      if (res.items.length === 0 && res.total > 0 && page > 1) {
        setPage((prev) => Math.max(prev - 1, 1));
        return;
      }
      setItems(res.items);
      setTotal(res.total);
      const visibleIds = new Set(res.items.map((item) => item.id));
      setSelectedTaskIds((prev) => prev.filter((id) => visibleIds.has(id)));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedQ(q);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    setPage(1);
  }, [status, debouncedQ, pageSize]);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, debouncedQ, page, pageSize]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(t);
  }, [notice]);

  useEffect(() => {
    if (!selectAllRef.current) return;
    selectAllRef.current.indeterminate = someVisibleSelected;
  }, [someVisibleSelected]);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  async function submitCreate() {
    setError(null);
    const title = newTitle.trim();
    if (!title) {
      setError("タイトルを入力してください。");
      return;
    }
    try {
      await createTask({ title, description: newDescription.trim() || null });
      setIsCreateModalOpen(false);
      setNewTitle("");
      setNewDescription("");
      setNotice("タスクを追加しました。");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function startEdit(task: TaskRead) {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description ?? "");
  }

  async function onSaveEdit(taskId: number) {
    setError(null);
    const title = editTitle.trim();
    if (!title) {
      setError("タイトルを入力してください。");
      return;
    }
    try {
      await updateTask(taskId, { title, description: editDescription.trim() || null });
      setEditingId(null);
      setEditTitle("");
      setEditDescription("");
      setNotice("タスクを更新しました。");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onToggle(taskId: number) {
    setError(null);
    try {
      await toggleTask(taskId);
      setNotice("状態を更新しました。");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onDelete(taskId: number) {
    setError(null);
    const ok = window.confirm("このタスクを削除しますか？");
    if (!ok) return;
    try {
      await deleteTask(taskId);
      setNotice("タスクを削除しました。");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function toggleSelectTask(taskId: number) {
    setSelectedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId],
    );
  }

  function toggleSelectAllVisible() {
    const visibleIds = items.map((item) => item.id);
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedTaskIds.includes(id));
    setSelectedTaskIds(allSelected ? [] : visibleIds);
  }

  async function onDeleteSelected() {
    if (selectedTaskIds.length === 0) return;
    const ok = window.confirm(`選択した ${selectedTaskIds.length} 件のタスクを削除しますか？`);
    if (!ok) return;

    setError(null);
    const results = await Promise.allSettled(selectedTaskIds.map((id) => deleteTask(id)));
    const failed = results.filter((r) => r.status === "rejected").length;
    const success = results.length - failed;

    if (failed > 0) {
      setError(`${failed} 件の削除に失敗しました。`);
    }
    if (success > 0) {
      setNotice(`${success} 件のタスクを削除しました。`);
    }
    setSelectedTaskIds([]);
    await refresh();
  }

  function applyPageInput() {
    const raw = Number.parseInt(pageInput, 10);
    if (Number.isNaN(raw)) {
      setPageInput(String(page));
      return;
    }
    const next = Math.min(Math.max(raw, 1), totalPages);
    setPage(next);
    setPageInput(String(next));
  }

  function closeEditModal() {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  }

  async function exportCsv() {
    setError(null);
    try {
      const exportLimit = 200;
      let exportOffset = 0;
      let exportTotal = 0;
      const exportItems: TaskRead[] = [];

      while (true) {
        const res = await listTasks({
          status,
          q: q.trim() || undefined,
          limit: exportLimit,
          offset: exportOffset,
        });
        if (exportOffset === 0) {
          exportTotal = res.total;
        }
        exportItems.push(...res.items);
        if (exportItems.length >= exportTotal || res.items.length === 0) {
          break;
        }
        exportOffset += res.items.length;
      }

      const header = ["title", "description", "user_id", "finish_date", "status"];
      const rows = exportItems.map((item) => [
        escapeCsvValue(item.title),
        escapeCsvValue(item.description ?? ""),
        String(item.user_id ?? ""),
        escapeCsvValue(item.finish_date ?? ""),
        String(item.status ?? (item.is_done ? 1 : 0)),
      ]);
      const csv = [header.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tasks-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setNotice(`CSV を出力しました（${exportItems.length} 件）。`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  async function onImportCsv(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length <= 1) {
        setError("CSV にデータ行がありません。");
        return;
      }
      const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
      const titleIndex = header.indexOf("title");
      const descriptionIndex = header.indexOf("description");
      const userIdIndex = header.indexOf("user_id");
      const finishDateIndex = header.indexOf("finish_date");
      const statusIndex = header.indexOf("status");
      if (titleIndex === -1) {
        setError("CSV ヘッダーに title が必要です。");
        return;
      }

      let imported = 0;
      for (const line of lines.slice(1)) {
        const cols = parseCsvLine(line);
        const title = (cols[titleIndex] ?? "").trim();
        if (!title) continue;
        const description =
          descriptionIndex >= 0 ? (cols[descriptionIndex] ?? "").trim() || null : null;
        const userIdRaw = userIdIndex >= 0 ? (cols[userIdIndex] ?? "").trim() : "";
        const userIdParsed = userIdRaw ? Number.parseInt(userIdRaw, 10) : undefined;
        const userId = Number.isNaN(userIdParsed) ? undefined : userIdParsed;
        const finishDate =
          finishDateIndex >= 0 ? (cols[finishDateIndex] ?? "").trim() || null : null;
        const statusRaw = statusIndex >= 0 ? (cols[statusIndex] ?? "").trim() : "";
        const statusParsed = statusRaw ? Number.parseInt(statusRaw, 10) : 0;
        const status = statusParsed === 1 ? 1 : 0;

        await createTask({
          title,
          description,
          user_id: userId,
          finish_date: finishDate,
          status,
        });
        imported += 1;
      }

      setNotice(`${imported} 件のタスクを取り込みました。`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto w-full max-w-4xl px-6 py-10">
        <header className="flex flex-col gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Todo管理アプリ</h1>
        </header>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            タスク追加
          </button>
          <button
            onClick={exportCsv}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            CSV 出力
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex h-10 items-center justify-center rounded-lg border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
          >
            CSV 取込
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={onImportCsv}
            className="hidden"
          />
        </div>

        {notice && (
          <div className="mt-6">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-50">
              {notice}
            </div>
          </div>
        )}

        <section className="mt-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              {(["all", "todo", "done"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setStatus(v)}
                  className={[
                    "h-9 rounded-lg px-3 text-sm font-medium",
                    v === status
                      ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                      : "border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900",
                  ].join(" ")}
                >
                  {v === "all" ? "全て" : v === "todo" ? "未完了" : "完了"}
                </button>
              ))}
              <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">{total} 件</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="タイトル検索"
                className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600 sm:w-64"
              />
            </div>
          </div>

          <TaskListPanel
            items={items}
            total={total}
            loading={loading}
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            page={page}
            totalPages={totalPages}
            pageInput={pageInput}
            pageSize={pageSize}
            selectedTaskIds={selectedTaskIds}
            selectAllRef={selectAllRef}
            allVisibleSelected={allVisibleSelected}
            onToggleSelectAllVisible={toggleSelectAllVisible}
            onPageSizeChange={setPageSize}
            onPageInputChange={setPageInput}
            onApplyPageInput={applyPageInput}
            onPrevPage={() => setPage((prev) => Math.max(prev - 1, 1))}
            onNextPage={() => setPage((prev) => Math.min(prev + 1, totalPages))}
            onDeleteSelected={() => void onDeleteSelected()}
            onToggleSelectTask={toggleSelectTask}
            onToggleDone={(taskId) => void onToggle(taskId)}
            onStartEdit={startEdit}
            onDelete={(taskId) => void onDelete(taskId)}
            onShowDetail={(task) =>
              setDescriptionDetail({
                title: task.title,
                description: task.description ?? "",
              })
            }
          />
        </section>
      </main>

      {isCreateModalOpen && (
        <Modal title="新規タスク" onClose={() => setIsCreateModalOpen(false)}>
          <TaskForm
            title={newTitle}
            description={newDescription}
            onTitleChange={setNewTitle}
            onDescriptionChange={setNewDescription}
            onCancel={() => setIsCreateModalOpen(false)}
            onSubmit={() => void submitCreate()}
            submitLabel="保存"
          />
        </Modal>
      )}

      {editingId !== null && (
        <Modal title="タスク編集" onClose={closeEditModal}>
          <TaskForm
            title={editTitle}
            description={editDescription}
            onTitleChange={setEditTitle}
            onDescriptionChange={setEditDescription}
            onCancel={closeEditModal}
            onSubmit={() => void onSaveEdit(editingId)}
            submitLabel="保存"
          />
        </Modal>
      )}

      {descriptionDetail && (
        <Modal title={`詳細: ${descriptionDetail.title}`} onClose={() => setDescriptionDetail(null)}>
          <div className="space-y-4">
            <p className="max-w-full whitespace-pre-wrap break-words rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
              {descriptionDetail.description}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setDescriptionDetail(null)}
                className="h-9 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                閉じる
              </button>
            </div>
          </div>
        </Modal>
      )}

      {error && (
        <Modal title="エラー" onClose={() => setError(null)}>
          <div className="space-y-4">
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-50">
              {error}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setError(null)}
                className="h-9 rounded-lg bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
              >
                OK
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
