'use client';

import '@/components/content-pagination.css';

function paginationState(itemCount: number, page: number, pageSize: number) {
  const totalPages = Math.max(1, Math.ceil(itemCount / pageSize));
  const currentPage = Math.min(Math.max(1, Math.trunc(page)), totalPages);

  return { currentPage, totalPages };
}

export function paginateItems<T>(items: T[], page: number, pageSize: number) {
  const { currentPage, totalPages } = paginationState(
    items.length,
    page,
    pageSize,
  );

  return {
    currentPage,
    totalPages,
    items: items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
  };
}

export function ContentPagination({
  ariaLabel,
  itemCount,
  itemLabel,
  page,
  pageSize,
  onPageChange,
}: {
  ariaLabel: string;
  itemCount: number;
  itemLabel: string;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  if (itemCount === 0) return null;

  const { currentPage, totalPages } = paginationState(
    itemCount,
    page,
    pageSize,
  );

  return (
    <nav className="content-pagination" aria-label={ariaLabel}>
      <span>
        {itemCount} {itemLabel} · 第 {currentPage} / {totalPages} 页
      </span>
      <div>
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          上一页
        </button>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          下一页
        </button>
      </div>
    </nav>
  );
}
