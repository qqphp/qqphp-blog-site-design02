'use client';

export const ADMIN_PAGE_SIZE = 10;

export function pageRows<T>(rows: T[], page: number) {
  const pages = Math.max(1, Math.ceil(rows.length / ADMIN_PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);
  return {
    current,
    pages,
    rows: rows.slice(
      (current - 1) * ADMIN_PAGE_SIZE,
      current * ADMIN_PAGE_SIZE,
    ),
  };
}

export function AdminTablePagination({
  page,
  total,
  onChange,
}: {
  page: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE));
  const current = Math.min(Math.max(1, page), pages);
  return (
    <nav className="admin-table-pagination" aria-label="表格分页">
      <span>
        第 {current} / {pages} 页 · 每页 {ADMIN_PAGE_SIZE} 条
      </span>
      <button
        type="button"
        disabled={current <= 1}
        onClick={() => onChange(current - 1)}
      >
        上一页
      </button>
      <button
        type="button"
        disabled={current >= pages}
        onClick={() => onChange(current + 1)}
      >
        下一页
      </button>
    </nav>
  );
}
