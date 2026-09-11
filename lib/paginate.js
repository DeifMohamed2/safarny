function paginateList(items = [], page = 1, perPage = 10, { min = 5, max = 50 } = {}) {
  const safePerPage = Math.min(max, Math.max(min, Number(perPage) || 10));
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / safePerPage));
  const currentPage = Math.min(totalPages, Math.max(1, Number(page) || 1));
  const start = (currentPage - 1) * safePerPage;
  const end = Math.min(total, start + safePerPage);
  return {
    items: items.slice(start, end),
    pagination: {
      page: currentPage,
      perPage: safePerPage,
      total,
      totalPages,
      start: total ? start + 1 : 0,
      end,
      hasPrev: currentPage > 1,
      hasNext: currentPage < totalPages,
    },
  };
}

function paginateSimple(list, page = 1, perPage = 12) {
  const current = Math.max(1, Number(page) || 1);
  const start = (current - 1) * perPage;
  return {
    items: list.slice(start, start + perPage),
    currentPage: current,
    totalPages: Math.max(1, Math.ceil(list.length / perPage)),
    total: list.length,
  };
}

module.exports = { paginateList, paginateSimple };
