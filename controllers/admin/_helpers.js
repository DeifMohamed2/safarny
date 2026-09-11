function withLayout(res, view, data) {
  return res.render(view, { layout: 'layouts/admin', ...data });
}

async function audit(req, action, entity, entityId, summary) {
  const { logAction } = require('../../services/audit');
  await logAction({
    actorId: req.session.user.id,
    actorName: req.session.user.userName,
    action,
    entity,
    entityId,
    summary,
  });
}

module.exports = { withLayout, audit };
