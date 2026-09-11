const { Ticket, Company, nextSeq } = require('../models');
const { toDoc, toDocs } = require('../lib/document');
const { summarizeReply } = require('../lib/ticket-attachments');
const { presentTicket, getThread, getThreadItems, presentMessage } = require('../presenters/ticket');
const { paginateList } = require('../lib/paginate');

const SUPPORT_AVATAR = '/assets/logo.svg';
const SUPPORT_NAME = 'Safarny Support';
const TICKET_CATEGORIES = [
  'Account & Verification',
  'Payments & Payouts',
  'Trip Listings',
  'Bookings',
  'Technical',
  'General',
];
const VALID_STATUSES = ['open', 'pending', 'resolved', 'closed'];
const VALID_PRIORITIES = ['low', 'normal', 'high', 'urgent'];

function ticketId(source, seq) {
  return `${source}-${seq}`;
}

function parseGlobalId(globalId) {
  const raw = decodeURIComponent(String(globalId || ''));
  if (raw.includes(':')) {
    const [source, id] = raw.split(':');
    if (id && (id.startsWith('traveler-') || id.startsWith('company-'))) return id;
    return ticketId(source, id);
  }
  return raw;
}

async function getTicket(id) {
  if (!id) return null;
  const doc = toDoc(await Ticket.findById(parseGlobalId(id)).lean());
  return doc ? presentTicket(doc) : null;
}

async function getRawTicket(id) {
  return toDoc(await Ticket.findById(parseGlobalId(id)).lean());
}

async function listTickets(filter = {}) {
  return toDocs(await Ticket.find(filter).sort({ updatedAt: -1 }).lean());
}

async function getTicketsByUser(userId) {
  const items = await listTickets({ source: 'traveler', userId: String(userId) });
  return items.map((item) => presentTicket(item));
}

async function getTicketsByCompany(companyId) {
  const items = await listTickets({ source: 'company', companyId: String(companyId) });
  return items.map((item) => presentTicket(item));
}

async function getCompanyTicket(id, companyId) {
  const ticket = await getRawTicket(id);
  if (!ticket || ticket.source !== 'company' || String(ticket.companyId) !== String(companyId)) return null;
  return presentTicket(ticket);
}

async function getReplies(id) {
  const ticket = await getRawTicket(id);
  return (ticket?.messages || []).map((message) => presentMessage(message));
}

async function getTicketThread(id) {
  const ticket = await getRawTicket(id);
  return getThread(ticket?.messages || []);
}

async function getThreadItemsFor(id) {
  const ticket = await getRawTicket(id);
  return getThreadItems(ticket?.messages || []);
}

function countByStatusFactory(tickets) {
  return function countByStatus(status) {
    if (!status || status === 'all') return tickets.length;
    return tickets.filter((t) => t.status === status).length;
  };
}

async function filterTicketsByCompany(companyId, filters = {}) {
  const q = String(filters.q || '').trim().toLowerCase();
  const status = String(filters.status || 'all');
  const category = String(filters.category || 'all');
  const priority = String(filters.priority || 'all');
  const sort = String(filters.sort || 'newest');
  let items = await getTicketsByCompany(companyId);
  items = items.filter((ticket) => {
    if (status !== 'all' && ticket.status !== status) return false;
    if (category !== 'all' && ticket.category !== category) return false;
    if (priority !== 'all' && ticket.priority !== priority) return false;
    if (!q) return true;
    const haystack = [ticket.ticketNo, ticket.subject, ticket.category, ticket.lastReply].join(' ').toLowerCase();
    return haystack.includes(q);
  });
  const sorters = {
    newest: (a, b) => new Date(a.createdAtRaw || a.createdAt) - new Date(b.createdAtRaw || b.createdAt),
    oldest: (a, b) => new Date(a.createdAtRaw || a.createdAt) - new Date(b.createdAtRaw || b.createdAt),
    updated: (a, b) => (b.unread - a.unread) || new Date(b.updatedAtRaw || 0) - new Date(a.updatedAtRaw || 0),
    priority: (a, b) => {
      const rank = { urgent: 4, high: 3, normal: 2, low: 1 };
      return (rank[b.priority] || 0) - (rank[a.priority] || 0);
    },
  };
  if (sort === 'newest') items.sort((a, b) => new Date(b.createdAtRaw || 0) - new Date(a.createdAtRaw || 0));
  else items.sort(sorters[sort] || sorters.newest);
  return items;
}

async function getTicketListMeta(companyId) {
  const items = await getTicketsByCompany(companyId);
  const statusCounts = {
    all: items.length,
    open: items.filter((item) => item.status === 'open').length,
    pending: items.filter((item) => item.status === 'pending').length,
    resolved: items.filter((item) => item.status === 'resolved').length,
    closed: items.filter((item) => item.status === 'closed').length,
  };
  const categories = [...new Set([...TICKET_CATEGORIES, ...items.map((item) => item.category)])];
  const unread = items.reduce((sum, item) => sum + Number(item.unread || 0), 0);
  return { total: items.length, statusCounts, categories, unread };
}

async function createTicket({ subject, category, message, userId, userName }) {
  const seq = await nextSeq('ticket-traveler');
  const num = await nextSeq('ticket-tkt');
  const id = ticketId('traveler', seq);
  const now = new Date();
  const autoReply = {
    from: 'admin',
    author: SUPPORT_NAME,
    text: 'Thank you for contacting Safarny Support. We have received your ticket and will respond as soon as possible.',
    createdAt: now,
  };
  const created = await Ticket.create({
    _id: id,
    ticketNo: `TKT-${num}`,
    source: 'traveler',
    userId: userId ? String(userId) : null,
    subject,
    category: category || 'General',
    status: 'open',
    priority: 'normal',
    unread: 0,
    lastReply: message,
    lastFrom: 'user',
    messages: [
      { from: 'user', author: userName || 'You', text: message, createdAt: now },
      autoReply,
    ],
  });
  return presentTicket(toDoc(created));
}

async function createCompanyTicket(companyId, companyName, payload = {}) {
  const subject = String(payload.subject || '').trim();
  const message = String(payload.message || '').trim();
  const category = TICKET_CATEGORIES.includes(payload.category) ? payload.category : 'General';
  const priority = VALID_PRIORITIES.includes(payload.priority) ? payload.priority : 'normal';
  if (!subject || !message) return null;
  const seq = await nextSeq('ticket-company');
  const num = await nextSeq('ticket-cmp');
  const id = ticketId('company', seq);
  const now = new Date();
  const created = await Ticket.create({
    _id: id,
    ticketNo: `CMP-${num}`,
    source: 'company',
    companyId: String(companyId),
    subject,
    category,
    status: 'open',
    priority,
    unread: 0,
    lastReply: message,
    lastFrom: 'company',
    messages: [
      { from: 'company', author: companyName || 'Company', text: message, createdAt: now },
      {
        from: 'admin',
        author: SUPPORT_NAME,
        text: 'Thank you for contacting Safarny Support. We have received your ticket and will respond as soon as possible.',
        createdAt: now,
      },
    ],
  });
  return presentTicket(toDoc(created));
}

async function addReply(id, text, attachments = [], { from = 'user', author = 'You', userId } = {}) {
  const ticket = await getRawTicket(id);
  const message = String(text || '').trim();
  const files = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
  if (!ticket || (!message && !files.length)) return null;
  if (ticket.source === 'traveler' && userId && String(ticket.userId) !== String(userId)) return null;
  const reply = {
    from,
    author,
    text: message,
    attachments: files,
    createdAt: new Date(),
  };
  const $set = {
    lastReply: summarizeReply(message, files),
    lastFrom: from,
    unread: 0,
  };
  if (ticket.status === 'resolved' || ticket.status === 'closed') $set.status = 'open';
  await Ticket.updateOne({ _id: ticket.id }, { $push: { messages: reply }, $set });
  return presentMessage(reply);
}

async function addTicketReply(id, companyId, text, companyName, attachments = []) {
  const ticket = await getRawTicket(id);
  const message = String(text || '').trim();
  const files = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
  if (!ticket || ticket.source !== 'company' || String(ticket.companyId) !== String(companyId)) return null;
  if (ticket.status === 'closed' || (!message && !files.length)) return null;
  const reply = {
    from: 'company',
    author: companyName || 'Company',
    text: message,
    attachments: files,
    createdAt: new Date(),
  };
  const $set = {
    lastReply: summarizeReply(message, files),
    lastFrom: 'company',
    unread: 0,
  };
  if (ticket.status === 'resolved') $set.status = 'open';
  await Ticket.updateOne({ _id: ticket.id }, { $push: { messages: reply }, $set });
  return presentMessage(reply);
}

async function markRead(id, extra = {}) {
  const filter = { _id: parseGlobalId(id), ...extra };
  await Ticket.updateOne(filter, { $set: { unread: 0 } });
}

async function markTicketRead(id, companyId) {
  await Ticket.updateOne(
    { _id: parseGlobalId(id), companyId: String(companyId) },
    { $set: { unread: 0 } }
  );
  return getCompanyTicket(id, companyId);
}

async function normalizeForAdmin(ticket) {
  let sourceLabel = ticket.source === 'company' ? `Company #${ticket.companyId}` : 'Traveler';
  if (ticket.source === 'company' && ticket.companyId) {
    const company = toDoc(await Company.findById(String(ticket.companyId)).lean());
    if (company) sourceLabel = company.title;
  }
  return presentTicket({
    ...ticket,
    sourceLabel,
    globalId: ticket.id,
    companyId: ticket.source === 'company' ? ticket.companyId : null,
  });
}

async function getAllTickets(filters = {}) {
  const status = String(filters.status || 'all');
  const priority = String(filters.priority || 'all');
  const source = String(filters.source || 'all');
  const q = String(filters.q || '').trim().toLowerCase();
  const query = {};
  if (status !== 'all') query.status = status;
  if (priority !== 'all') query.priority = priority;
  if (source === 'company' || source === 'traveler') query.source = source;
  let items = toDocs(await Ticket.find(query).lean());
  items = await Promise.all(items.map(normalizeForAdmin));
  if (q) {
    items = items.filter((item) => {
      const haystack = `${item.ticketNo} ${item.subject} ${item.category} ${item.sourceLabel} ${item.lastReply}`.toLowerCase();
      return haystack.includes(q);
    });
  }
  const sort = String(filters.sort || 'updated');
  const rank = { urgent: 4, high: 3, normal: 2, low: 1 };
  if (sort === 'newest') items.sort((a, b) => new Date(b.createdAtRaw || 0) - new Date(a.createdAtRaw || 0));
  else if (sort === 'oldest') items.sort((a, b) => new Date(a.createdAtRaw || 0) - new Date(b.createdAtRaw || 0));
  else if (sort === 'priority') items.sort((a, b) => (rank[b.priority] || 0) - (rank[a.priority] || 0));
  else items.sort((a, b) => (b.unread - a.unread) || new Date(b.updatedAtRaw || 0) - new Date(a.updatedAtRaw || 0));
  return items;
}

async function getUnifiedTicket(globalId) {
  const ticket = await getRawTicket(globalId);
  return ticket ? normalizeForAdmin(ticket) : null;
}

async function getUnifiedThread(globalId) {
  return getTicketThread(globalId);
}

async function addAdminReply(globalId, text, adminName = 'Safarny Admin', attachments = []) {
  const ticket = await getRawTicket(globalId);
  const message = String(text || '').trim();
  const files = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
  if (!ticket || ticket.status === 'closed' || (!message && !files.length)) return null;
  const reply = {
    from: 'admin',
    author: adminName,
    text: message,
    attachments: files,
    createdAt: new Date(),
  };
  const $set = {
    lastReply: summarizeReply(message, files),
    lastFrom: 'admin',
    unread: (ticket.unread || 0) + 1,
  };
  if (ticket.status === 'resolved') $set.status = 'open';
  await Ticket.updateOne({ _id: ticket.id }, { $push: { messages: reply }, $set });
  const updated = await getUnifiedTicket(ticket.id);
  return { ticket: updated, reply: presentMessage(reply) };
}

async function setTicketStatus(globalId, status) {
  if (!VALID_STATUSES.includes(status)) return null;
  await Ticket.updateOne({ _id: parseGlobalId(globalId) }, { $set: { status } });
  return getUnifiedTicket(globalId);
}

async function setTicketPriority(globalId, priority) {
  if (!VALID_PRIORITIES.includes(priority)) return null;
  await Ticket.updateOne({ _id: parseGlobalId(globalId) }, { $set: { priority } });
  return getUnifiedTicket(globalId);
}

async function assignTicket(globalId, assignee) {
  await Ticket.updateOne({ _id: parseGlobalId(globalId) }, { $set: { assignee } });
  return getUnifiedTicket(globalId);
}

async function getSupportMeta() {
  const items = await listTickets();
  return {
    total: items.length,
    open: items.filter((item) => item.status === 'open').length,
    pending: items.filter((item) => item.status === 'pending').length,
    resolved: items.filter((item) => item.status === 'resolved').length,
    closed: items.filter((item) => item.status === 'closed').length,
    unread: items.reduce((sum, item) => sum + Number(item.unread || 0), 0),
  };
}

async function countOpenTickets() {
  return Ticket.countDocuments({ status: 'open' });
}

function paginateTickets(items, page, perPage) {
  return paginateList(items, page, perPage, { min: 10, max: 50 });
}

module.exports = {
  SUPPORT_AVATAR,
  SUPPORT_NAME,
  TICKET_CATEGORIES,
  VALID_STATUSES,
  VALID_PRIORITIES,
  getTicket,
  getTicketsByUser,
  getTicketsByCompany,
  getCompanyTicket,
  getReplies,
  getTicketThread,
  getThreadItems: getThreadItemsFor,
  countByStatusFactory,
  filterTicketsByCompany,
  paginateList,
  paginateTickets,
  getTicketListMeta,
  createTicket,
  createCompanyTicket,
  addReply,
  addTicketReply,
  markRead,
  markTicketRead,
  getAllTickets,
  getUnifiedTicket,
  getUnifiedThread,
  addAdminReply,
  setTicketStatus,
  setTicketPriority,
  assignTicket,
  getSupportMeta,
  countOpenTickets,
};
