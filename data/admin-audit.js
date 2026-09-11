const auditLog = [
  {
    id: '1',
    at: '2026-08-26T14:30:00.000Z',
    actorId: 'a1',
    actorName: 'Safarny Admin',
    action: 'ticket.reply',
    entity: 'ticket',
    entityId: 'CMP-1042',
    summary: 'Replied to company ticket CMP-1042',
  },
  {
    id: '2',
    at: '2026-08-25T09:15:00.000Z',
    actorId: 'a1',
    actorName: 'Safarny Admin',
    action: 'trip.review',
    entity: 'trip',
    entityId: 'ct-4',
    summary: 'Reviewed pending trip Luxor Temple Tour',
  },
];

function logAction({ actorId, actorName, action, entity, entityId, summary }) {
  const entry = {
    id: String(Date.now()),
    at: new Date().toISOString(),
    actorId: String(actorId || 'system'),
    actorName: actorName || 'System',
    action: String(action || 'update'),
    entity: String(entity || 'platform'),
    entityId: String(entityId || ''),
    summary: String(summary || 'Platform update'),
  };
  auditLog.unshift(entry);
  return entry;
}

function filterAuditLog(filters = {}) {
  const q = String(filters.q || '').trim().toLowerCase();
  const action = String(filters.action || 'all');
  const entity = String(filters.entity || 'all');
  let items = [...auditLog];
  if (action !== 'all') items = items.filter((item) => item.action.startsWith(action));
  if (entity !== 'all') items = items.filter((item) => item.entity === entity);
  if (q) {
    items = items.filter((item) => {
      const haystack = `${item.summary} ${item.actorName} ${item.entityId} ${item.action}`.toLowerCase();
      return haystack.includes(q);
    });
  }
  return items;
}

function paginateAudit(items, page = 1, perPage = 20) {
  const safePerPage = Math.min(50, Math.max(10, Number(perPage) || 20));
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

function getRecentAudit(limit = 8) {
  return auditLog.slice(0, limit);
}

module.exports = {
  auditLog,
  logAction,
  filterAuditLog,
  paginateAudit,
  getRecentAudit,
};
