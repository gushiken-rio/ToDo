"use client";

import { PaginationControls } from "../ui/PaginationControls";
import type { TaskRead } from "@/lib/types";
import type { RefObject } from "react";
import { TaskDescription } from "./TaskDescription";

type TaskListPanelProps = {
  items: TaskRead[];
  total: number;
  loading: boolean;
  rangeStart: number;
  rangeEnd: number;
  page: number;
  totalPages: number;
  pageInput: string;
  pageSize: number;
  selectedTaskIds: number[];
  selectAllRef: RefObject<HTMLInputElement | null>;
  allVisibleSelected: boolean;
  onToggleSelectAllVisible: () => void;
  onPageSizeChange: (value: number) => void;
  onPageInputChange: (value: string) => void;
  onApplyPageInput: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onDeleteSelected: () => void;
  onToggleSelectTask: (taskId: number) => void;
  onToggleDone: (taskId: number) => void;
  onStartEdit: (task: TaskRead) => void;
  onDelete: (taskId: number) => void;
  onShowDetail: (task: TaskRead) => void;
};

export function TaskListPanel({
  items,
  total,
  loading,
  rangeStart,
  rangeEnd,
  page,
  totalPages,
  pageInput,
  pageSize,
  selectedTaskIds,
  selectAllRef,
  allVisibleSelected,
  onToggleSelectAllVisible,
  onPageSizeChange,
  onPageInputChange,
  onApplyPageInput,
  onPrevPage,
  onNextPage,
  onDeleteSelected,
  onToggleSelectTask,
  onToggleDone,
  onStartEdit,
  onDelete,
  onShowDetail,
}: TaskListPanelProps) {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-zinc-200 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2">
            <input
              ref={selectAllRef}
              type="checkbox"
              checked={allVisibleSelected}
              onChange={onToggleSelectAllVisible}
              className="h-4 w-4"
            />
            <span>Task</span>
          </label>
          <span className="text-xs text-zinc-400">
            {loading ? "読み込み中…" : `${rangeStart}-${rangeEnd} / ${total}`}
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <select
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950"
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>
          <PaginationControls
            page={page}
            totalPages={totalPages}
            pageInput={pageInput}
            onPageInputChange={onPageInputChange}
            onApplyPageInput={onApplyPageInput}
            onPrev={onPrevPage}
            onNext={onNextPage}
          />
          <button
            onClick={onDeleteSelected}
            disabled={selectedTaskIds.length === 0}
            className="inline-flex h-8 items-center justify-center rounded-lg border border-rose-200 px-3 text-xs font-medium text-rose-700 enabled:hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-900/50 dark:text-rose-300 dark:enabled:hover:bg-rose-950/40"
          >
            選択削除 ({selectedTaskIds.length})
          </button>
        </div>
      </div>

      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {items.length === 0 && (
          <li className="px-4 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">タスクがありません</li>
        )}
        {items.map((t) => (
          <li key={t.id} className="px-4 py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <label className="m-auto inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.includes(t.id)}
                    onChange={() => onToggleSelectTask(t.id)}
                    className="h-4 w-4"
                  />
                </label>
                <div className="min-w-0">
                  <div
                    className={[
                      "truncate text-sm font-medium",
                      t.is_done ? "line-through text-zinc-400 dark:text-zinc-500" : "",
                    ].join(" ")}
                  >
                    {t.title}
                  </div>
                  {t.description && (
                    <TaskDescription
                      description={t.description}
                      done={t.is_done}
                      onShowDetail={() => onShowDetail(t)}
                    />
                  )}
                  <div className="mt-2 text-xs text-zinc-400">
                    作成日:{" "}
                    {new Date(t.created_at).toLocaleDateString("ja-JP", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </div>

              <div className="my-auto flex shrink-0 items-center gap-2">
                <label className="inline-flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <input
                    type="checkbox"
                    checked={t.is_done}
                    onChange={() => onToggleDone(t.id)}
                    className="h-4 w-4"
                  />
                  完了
                </label>
                <button
                  onClick={() => onStartEdit(t)}
                  className="h-9 rounded-lg border border-zinc-200 px-3 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                >
                  編集
                </button>
                <button
                  onClick={() => onDelete(t.id)}
                  className="h-9 rounded-lg border border-rose-200 px-3 text-sm font-medium text-rose-700 hover:bg-rose-50 dark:border-rose-900/50 dark:text-rose-300 dark:hover:bg-rose-950/40"
                >
                  削除
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {total === 0 ? "0 件" : `${rangeStart}-${rangeEnd} 件を表示中（合計 ${total} 件）`}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950"
          >
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>
          <PaginationControls
            page={page}
            totalPages={totalPages}
            pageInput={pageInput}
            onPageInputChange={onPageInputChange}
            onApplyPageInput={onApplyPageInput}
            onPrev={onPrevPage}
            onNext={onNextPage}
          />
        </div>
      </div>
    </div>
  );
}
