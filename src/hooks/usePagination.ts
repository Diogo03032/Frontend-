import { useState } from 'react';

export function usePagination(total: number, pageSize: number) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, totalPages);

  const start = (current - 1) * pageSize;
  const end = Math.min(start + pageSize, total);

  return {
    page: current,
    setPage,
    totalPages,
    start,
    end,
    hasPrev: current > 1,
    hasNext: current < totalPages,
    prev: () => setPage(Math.max(current - 1, 1)),
    next: () => setPage(Math.min(current + 1, totalPages)),
    reset: () => setPage(1),
  };
}