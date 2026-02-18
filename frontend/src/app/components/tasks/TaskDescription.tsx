"use client";

const PREVIEW_LENGTH = 30;

type TaskDescriptionProps = {
  description: string;
  done: boolean;
  onShowDetail: () => void;
};

export function TaskDescription({ description, done, onShowDetail }: TaskDescriptionProps) {
  const isLong = description.length > PREVIEW_LENGTH;

  return (
    <>
      <div
        className={[
          "mt-1 whitespace-pre-wrap text-sm",
          done ? "text-zinc-400 dark:text-zinc-500" : "text-zinc-600 dark:text-zinc-400",
        ].join(" ")}
      >
        {isLong ? `${description.slice(0, PREVIEW_LENGTH)}...` : description}
      </div>
      {isLong && (
        <button
          type="button"
          onClick={onShowDetail}
          className="mt-1 text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          詳細を見る
        </button>
      )}
    </>
  );
}
