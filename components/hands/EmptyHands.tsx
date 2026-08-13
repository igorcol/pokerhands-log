// Estado vazio da lista. Burro de propósito: quem sabe POR QUE está vazio é o
// HandsExplorer, então ele monta o texto e a ação — aqui só existe a apresentação.

export function EmptyHands({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
      <p className="text-[15px] font-medium">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-[13.5px] leading-relaxed text-ink-2">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 cursor-pointer rounded-full bg-white/5 px-4 py-2 text-[13.5px] text-ink-2 transition-colors hover:bg-white/10 hover:text-ink"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}