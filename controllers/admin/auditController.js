const { filterAuditLog, paginateAudit } = require('../../services/audit');
const { withLayout } = require('./_helpers');

async function page(req, res) {
  const filters = {
    q: req.query.q,
    action: req.query.action || 'all',
    entity: req.query.entity || 'all',
  };
  const items = await filterAuditLog(filters);
  const { items: pageItems, pagination } = paginateAudit(items, req.query.page, req.query.perPage || 20);
  withLayout(res, 'pages/admin/audit', {
    title: res.locals.t('admin.audit.title', 'Audit log'),
    adminActive: 'audit',
    entries: pageItems,
    pagination,
    filters,
    hasActiveFilters: filters.q || filters.action !== 'all' || filters.entity !== 'all',
  });
}

module.exports = { page };
