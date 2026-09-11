const companyTicketsModule = require('./company-tickets');
const travelerTicketsModule = require('./tickets');
const { getCompanyById } = require('./companies');
const { summarizeReply } = require('../lib/ticket-attachments');

function normalizeCompanyTicket(ticket) {
  const company = getCompanyById(ticket.companyId);
  return {
    ...ticket,
    source: 'company',
    sourceLabel: company?.title || `Company #${ticket.companyId}`,
    globalId: `company:${ticket.id}`,
  };
}

function normalizeTravelerTicket(ticket) {
  return {
    ...ticket,
    source: 'traveler',
    sourceLabel: 'Traveler',
    globalId: `traveler:${ticket.id}`,
    companyId: null,
  };
}

function getAllTickets(filters = {}) {
  const status = String(filters.status || 'all');
  const priority = String(filters.priority || 'all');
  const source = String(filters.source || 'all');
  const q = String(filters.q || '').trim().toLowerCase();

  let items = [
    ...companyTicketsModule.companyTickets.map(normalizeCompanyTicket),
    ...travelerTicketsModule.tickets.map(normalizeTravelerTicket),
  ];

  if (status !== 'all') items = items.filter((item) => item.status === status);
  if (priority !== 'all') items = items.filter((item) => item.priority === priority);
  if (source === 'company') items = items.filter((item) => item.source === 'company');
  if (source === 'traveler') items = items.filter((item) => item.source === 'traveler');
  if (q) {
    items = items.filter((item) => {
      const haystack = `${item.ticketNo} ${item.subject} ${item.category} ${item.sourceLabel} ${item.lastReply}`.toLowerCase();
      return haystack.includes(q);
    });
  }

  const sort = String(filters.sort || 'updated');
  const sorters = {
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    updated: (a, b) => (b.unread - a.unread) || String(b.updatedAt).localeCompare(String(a.updatedAt)),
    priority: (a, b) => {
      const rank = { urgent: 4, high: 3, normal: 2, low: 1 };
      return (rank[b.priority] || 0) - (rank[a.priority] || 0);
    },
  };
  items.sort(sorters[sort] || sorters.updated);
  return items;
}

function getUnifiedTicket(globalId) {
  const [source, id] = String(globalId).split(':');
  if (source === 'company') {
    const ticket = companyTicketsModule.companyTickets.find((item) => item.id === String(id));
    return ticket ? normalizeCompanyTicket(ticket) : null;
  }
  const ticket = travelerTicketsModule.getTicket(id);
  return ticket ? normalizeTravelerTicket(ticket) : null;
}

function getUnifiedThread(globalId) {
  const [source, id] = String(globalId).split(':');
  if (source === 'company') return companyTicketsModule.getTicketThread(id);
  return travelerTicketsModule.getThreadItems(id).map((item) => {
    if (item.type === 'date') return { type: 'date', date: item.label };
    return { type: 'message', ...item };
  });
}

function addAdminReply(globalId, text, adminName = 'Safarny Admin', attachments = []) {
  const [source, id] = String(globalId).split(':');
  const message = String(text || '').trim();
  const files = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
  if (!message && !files.length) return null;

  const time = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const reply = {
    from: 'admin',
    author: adminName,
    text: message,
    time,
    date: 'Today',
    ...(files.length ? { attachments: files } : {}),
  };
  const preview = summarizeReply(message, files);

  if (source === 'company') {
    const ticket = companyTicketsModule.companyTickets.find((item) => item.id === String(id));
    if (!ticket || ticket.status === 'closed') return null;
    const replies = companyTicketsModule.getTicketReplies(id);
    replies.push(reply);
    ticket.lastReply = preview;
    ticket.lastFrom = 'admin';
    ticket.updatedAt = 'Just now';
    ticket.unread = (ticket.unread || 0) + 1;
    if (ticket.status === 'resolved') ticket.status = 'open';
    return { ticket: normalizeCompanyTicket(ticket), reply };
  }

  const ticket = travelerTicketsModule.getTicket(id);
  if (!ticket || ticket.status === 'closed') return null;
  const replies = travelerTicketsModule.getReplies(id);
  replies.push(reply);
  ticket.lastReply = preview;
  ticket.lastFrom = 'admin';
  ticket.updatedAt = 'Just now';
  ticket.unread = (ticket.unread || 0) + 1;
  if (ticket.status === 'resolved') ticket.status = 'open';
  return { ticket: normalizeTravelerTicket(ticket), reply };
}

function setTicketStatus(globalId, status) {
  const ticket = getUnifiedTicket(globalId);
  if (!ticket || !companyTicketsModule.VALID_STATUSES.includes(status)) return null;
  const [source, id] = String(globalId).split(':');
  if (source === 'company') {
    const raw = companyTicketsModule.companyTickets.find((item) => item.id === String(id));
    if (raw) raw.status = status;
    return raw ? normalizeCompanyTicket(raw) : null;
  }
  const raw = travelerTicketsModule.getTicket(id);
  if (raw) raw.status = status;
  return raw ? normalizeTravelerTicket(raw) : null;
}

function setTicketPriority(globalId, priority) {
  const ticket = getUnifiedTicket(globalId);
  if (!ticket || !companyTicketsModule.VALID_PRIORITIES.includes(priority)) return null;
  const [source, id] = String(globalId).split(':');
  if (source === 'company') {
    const raw = companyTicketsModule.companyTickets.find((item) => item.id === String(id));
    if (raw) raw.priority = priority;
    return raw ? normalizeCompanyTicket(raw) : null;
  }
  const raw = travelerTicketsModule.getTicket(id);
  if (raw) raw.priority = priority;
  return raw ? normalizeTravelerTicket(raw) : null;
}

function assignTicket(globalId, assignee) {
  const ticket = getUnifiedTicket(globalId);
  if (!ticket) return null;
  const [source, id] = String(globalId).split(':');
  if (source === 'company') {
    const raw = companyTicketsModule.companyTickets.find((item) => item.id === String(id));
    if (raw) raw.assignee = assignee;
    return raw ? normalizeCompanyTicket(raw) : null;
  }
  const raw = travelerTicketsModule.getTicket(id);
  if (raw) raw.assignee = assignee;
  return raw ? normalizeTravelerTicket(raw) : null;
}

function paginateTickets(items, page = 1, perPage = 15) {
  const safePerPage = Math.min(50, Math.max(10, Number(perPage) || 15));
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

function getSupportMeta() {
  const items = getAllTickets();
  return {
    total: items.length,
    open: items.filter((item) => item.status === 'open').length,
    pending: items.filter((item) => item.status === 'pending').length,
    resolved: items.filter((item) => item.status === 'resolved').length,
    closed: items.filter((item) => item.status === 'closed').length,
    unread: items.reduce((sum, item) => sum + Number(item.unread || 0), 0),
  };
}

module.exports = {
  getAllTickets,
  getUnifiedTicket,
  getUnifiedThread,
  addAdminReply,
  setTicketStatus,
  setTicketPriority,
  assignTicket,
  paginateTickets,
  getSupportMeta,
};
