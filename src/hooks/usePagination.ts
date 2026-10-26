import { useEffect, useState } from 'react';

export function usePagination(total: number, pageSize: number) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const start = (page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);

  return {
    page,
    setPage,
    totalPages,
    start,
    end,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    prev: () => setPage((p) => Math.max(p - 1, 1)),
    next: () => setPage((p) => Math.min(p + 1, totalPages)),
    reset: () => setPage(1),
  };
}