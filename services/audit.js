const { AuditLog } = require('../models');
const { toDoc, toDocs } = require('../lib/document');
const { paginateList } = require('../lib/paginate');

async function logAction({ actorId, actorName, action, entity, entityId, summary }) {
  const entry = {
    _id: String(Date.now()) + Math.random().toString(36).slice(2, 6),
    at: new Date(),
    actorId: String(actorId || 'system'),
    actorName: actorName || 'System',
    action: String(action || 'update'),
    entity: String(entity || 'platform'),
    entityId: String(entityId || ''),
    summary: String(summary || 'Platform update'),
  };
  const created = await AuditLog.create(entry);
  return toDoc(created);
}

async function filterAuditLog(filters = {}) {
  const q = String(filters.q || '').trim().toLowerCase();
  const action = String(filters.action || 'all');
  const entity = String(filters.entity || 'all');
  const query = {};
  if (entity !== 'all') query.entity = entity;
  if (action !== 'all') query.action = new RegExp(`^${action}`);
  let items = toDocs(await AuditLog.find(query).sort({ at: -1 }).lean());
  if (q) {
    items = items.filter((item) => {
      const haystack = `${item.summary} ${item.actorName} ${item.entityId} ${item.action}`.toLowerCase();
      return haystack.includes(q);
    });
  }
  return items;
}

function paginateAudit(items, page = 1, perPage = 20) {
  return paginateList(items, page, perPage, { min: 10, max: 50 });
}

async function getRecentAudit(limit = 8) {
  return toDocs(await AuditLog.find().sort({ at: -1 }).limit(limit).lean());
}

module.exports = {
  logAction,
  filterAuditLog,
  paginateAudit,
  getRecentAudit,
};
