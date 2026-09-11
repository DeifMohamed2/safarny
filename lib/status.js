const STATUS_MAP = {
  confirmed: { label: 'Confirmed', class: 'confirmed' },
  pending: { label: 'Pending', class: 'pending' },
  cancelled: { label: 'Cancelled', class: 'cancelled' },
  refunded: { label: 'Refunded', class: 'refunded' },
  active: { label: 'Active', class: 'active' },
  draft: { label: 'Draft', class: 'draft' },
  'sold-out': { label: 'Sold out', class: 'sold-out' },
  rejected: { label: 'Rejected', class: 'rejected' },
  open: { label: 'Open', class: 'open' },
  resolved: { label: 'Resolved', class: 'resolved' },
  closed: { label: 'Closed', class: 'closed' },
  verified: { label: 'Verified', class: 'verified' },
  suspended: { label: 'Suspended', class: 'suspended' },
  published: { label: 'Published', class: 'published' },
  hidden: { label: 'Hidden', class: 'hidden' },
  flagged: { label: 'Flagged', class: 'flagged' },
  traveler: { label: 'Traveler', class: 'traveler' },
  company: { label: 'Company', class: 'company' },
  admin: { label: 'Admin', class: 'admin' },
  low: { label: 'Low', class: 'low' },
  normal: { label: 'Normal', class: 'normal' },
  high: { label: 'High', class: 'high' },
  urgent: { label: 'Urgent', class: 'urgent' },
};

function normalizeStatus(value) {
  return String(value || '').trim().toLowerCase();
}

function statusMeta(value) {
  const key = normalizeStatus(value);
  return STATUS_MAP[key] || { label: value || 'Unknown', class: key || 'unknown' };
}

function statusLabel(value) {
  return statusMeta(value).label;
}

function statusClass(value, prefix = 'admin-status') {
  return `${prefix} ${prefix}--${statusMeta(value).class}`;
}

function titleCaseStatus(value) {
  const key = normalizeStatus(value);
  if (key === 'sold-out') return 'Sold-out';
  return key.charAt(0).toUpperCase() + key.slice(1);
}

module.exports = {
  STATUS_MAP,
  normalizeStatus,
  statusMeta,
  statusLabel,
  statusClass,
  titleCaseStatus,
};
