'use client';

interface Props {
  page: number;
  limit: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function PaginationControls({ page, limit, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  // Build page numbers to display (max 5 visible)
  const pageNumbers: number[] = [];
  const maxVisible = 5;
  let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
  const endPage = Math.min(totalPages, startPage + maxVisible - 1);
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(1, endPage - maxVisible + 1);
  }
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="flex justify-between items-center px-6 py-4 border-t border-slate-200">
      <span className="text-sm text-slate-500">
        {total === 0
          ? 'No results'
          : `Showing ${from} to ${to} of ${total} entries`}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm disabled:opacity-50"
        >
          Previous
        </button>
        {pageNumbers.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={
              p === page
                ? 'px-3 py-1 rounded bg-[#4848e5] text-white text-sm'
                : 'px-3 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm'
            }
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
