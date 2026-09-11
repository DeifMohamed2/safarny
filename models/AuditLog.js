const mongoose = require('mongoose');
const { applyIdVirtual } = require('./_options');

const auditSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    at: { type: Date, default: Date.now, index: true },
    actorId: { type: String, default: 'system', index: true },
    actorName: { type: String, default: 'System' },
    action: { type: String, required: true },
    entity: { type: String, default: 'platform' },
    entityId: { type: String, default: '' },
    summary: { type: String, default: '' },
  },
  { timestamps: false }
);

auditSchema.index({ at: -1 });
applyIdVirtual(auditSchema);

module.exports = mongoose.models.AuditLog || mongoose.model('AuditLog', auditSchema);
