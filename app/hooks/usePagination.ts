import { useMemo } from 'react'

export default function usePagination(
  length: number,
  { page, size }: { page: number; size: number },
) {
  const count = Math.ceil(length / size)
  const between = useMemo(
    () =>
      count > 2
        ? Array(count - 2)
            .fill(0)
            .map((_, index) => index + 2)
        : [],
    [count],
  )

  const state = useMemo(() => {
    const index = between.indexOf(page)
    const pages =
      page === 1
        ? between.slice(0, 3)
        : page > count - 3
        ? between.slice(-3, count)
        : page === 2
        ? between.slice(index, index + 3)
        : [page - 1, page, page + 1]

    const before = pages[0] > 2
    const after = pages[2] < count - 1

    return {
      gap: count > 5 ? { before, after } : null,
      noNextPage: page === count,
      noPreviousPage: page === 1,
      pages,
      range: [
        (page - 1) * size,
        Math.min((page - 1) * size + size, length),
      ] as const,
    }
  }, [between, count, length, page, size])

  return { count, length, page, size, ...state }
}
