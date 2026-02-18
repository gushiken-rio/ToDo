"use client";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  pageInput: string;
  onPageInputChange: (value: string) => void;
  onApplyPageInput: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export function PaginationControls({
  page,
  totalPages,
  pageInput,
  onPageInputChange,
  onApplyPageInput,
  onPrev,
  onNext,
}: PaginationControlsProps) {
  return (
    <>
      <button
        onClick={onPrev}
        disabled={page <= 1}
        className="h-8 rounded-lg border border-zinc-200 px-3 text-xs font-medium enabled:hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:enabled:hover:bg-zinc-900"
      >
        前へ
      </button>
      <div className="flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300">
        <input
          type="number"
          min={1}
          max={totalPages}
          value={pageInput}
          onChange={(e) => onPageInputChange(e.target.value)}
          onBlur={onApplyPageInput}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onApplyPageInput();
            }
          }}
          className="h-8 w-14 rounded-lg border border-zinc-200 bg-white px-2 text-center text-xs outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-zinc-600"
        />
        <span>/ {totalPages}</span>
      </div>
      <button
        onClick={onNext}
        disabled={page >= totalPages}
        className="h-8 rounded-lg border border-zinc-200 px-3 text-xs font-medium enabled:hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:enabled:hover:bg-zinc-900"
      >
        次へ
      </button>
    </>
  );
}
