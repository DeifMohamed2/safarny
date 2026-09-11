const { summarizeReply } = require('../lib/ticket-attachments');

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

let nextTicketNum = 1048;

const companyTickets = [
  {
    id: '1',
    companyId: '1',
    ticketNo: 'CMP-1042',
    subject: 'Monthly payout not received',
    category: 'Payments & Payouts',
    status: 'open',
    priority: 'high',
    createdAt: 'Aug 26, 2026',
    updatedAt: '2h ago',
    unread: 1,
    lastReply: 'We are checking with our finance team and will update you within 24 hours.',
    lastFrom: 'admin',
  },
  {
    id: '2',
    companyId: '1',
    ticketNo: 'CMP-1038',
    subject: 'Trip listing pending approval for 5 days',
    category: 'Trip Listings',
    status: 'pending',
    priority: 'normal',
    createdAt: 'Aug 24, 2026',
    updatedAt: '1d ago',
    unread: 0,
    lastReply: 'Our team is reviewing your Luxor package submission.',
    lastFrom: 'admin',
  },
  {
    id: '3',
    companyId: '1',
    ticketNo: 'CMP-1031',
    subject: 'Settlement timing for confirmed bookings',
    category: 'Account & Verification',
    status: 'resolved',
    priority: 'normal',
    createdAt: 'Aug 20, 2026',
    updatedAt: '4d ago',
    unread: 0,
    lastReply: 'Confirmed bookings stay in Awaiting settlement until finance marks them paid out.',
    lastFrom: 'admin',
  },
  {
    id: '4',
    companyId: '1',
    ticketNo: 'CMP-1025',
    subject: 'Cannot upload trip gallery images',
    category: 'Technical',
    status: 'open',
    priority: 'urgent',
    createdAt: 'Aug 18, 2026',
    updatedAt: '6h ago',
    unread: 2,
    lastReply: 'Could you share the file size and format you are trying to upload?',
    lastFrom: 'admin',
  },
  {
    id: '5',
    companyId: '1',
    ticketNo: 'CMP-1019',
    subject: 'Company verification documents submitted',
    category: 'Account & Verification',
    status: 'closed',
    priority: 'normal',
    createdAt: 'Aug 12, 2026',
    updatedAt: '1w ago',
    unread: 0,
    lastReply: 'Your company profile has been verified. You can now publish trips.',
    lastFrom: 'admin',
  },
];

const repliesByTicket = {
  1: [
    { from: 'company', author: 'Red Sea Adventures', text: 'Hello, we have not received our August payout for confirmed bookings. Can you check the status?', time: '9:10 AM', date: 'Aug 26, 2026' },
    { from: 'admin', author: SUPPORT_NAME, text: 'Thank you for reaching out. I have located your company account. Could you confirm the payout method on file?', time: '10:30 AM', date: 'Aug 26, 2026' },
    { from: 'company', author: 'Red Sea Adventures', text: 'Yes, bank transfer to National Bank of Egypt ending 4521.', time: '11:05 AM', date: 'Aug 26, 2026' },
    { from: 'admin', author: SUPPORT_NAME, text: 'We are checking with our finance team and will update you within 24 hours.', time: '2:30 PM', date: 'Today' },
  ],
  2: [
    { from: 'company', author: 'Red Sea Adventures', text: 'Our new Luxor & Aswan package has been in pending status for 5 days. Please advise.', time: '3:00 PM', date: 'Aug 24, 2026' },
    { from: 'admin', author: SUPPORT_NAME, text: 'Our team is reviewing your Luxor package submission.', time: '9:15 AM', date: 'Aug 25, 2026' },
  ],
  3: [
    { from: 'company', author: 'Red Sea Adventures', text: 'When do confirmed bookings move from awaiting settlement to settled?', time: '11:00 AM', date: 'Aug 20, 2026' },
    { from: 'admin', author: SUPPORT_NAME, text: 'Confirmed bookings stay in Awaiting settlement until finance marks them paid out.', time: '4:45 PM', date: 'Aug 21, 2026' },
  ],
  4: [
    { from: 'company', author: 'Red Sea Adventures', text: 'Image uploads fail with a generic error when adding more than 3 photos to a trip.', time: '2:20 PM', date: 'Aug 18, 2026' },
    { from: 'admin', author: SUPPORT_NAME, text: 'Thank you for reporting this. We are investigating the upload issue.', time: '4:00 PM', date: 'Aug 18, 2026' },
    { from: 'admin', author: SUPPORT_NAME, text: 'Could you share the file size and format you are trying to upload?', time: '8:30 AM', date: 'Today' },
  ],
  5: [
    { from: 'company', author: 'Red Sea Adventures', text: 'We submitted our trade license and tax documents for verification.', time: '10:00 AM', date: 'Aug 12, 2026' },
    { from: 'admin', author: SUPPORT_NAME, text: 'Documents received. Our verification team will review within 2 business days.', time: '11:30 AM', date: 'Aug 12, 2026' },
    { from: 'admin', author: SUPPORT_NAME, text: 'Your company profile has been verified. You can now publish trips.', time: '3:00 PM', date: 'Aug 15, 2026' },
  ],
};

function getTicketsByCompany(companyId) {
  return companyTickets.filter((ticket) => String(ticket.companyId) === String(companyId));
}

function getCompanyTicket(id, companyId) {
  return companyTickets.find((ticket) => ticket.id === String(id) && String(ticket.companyId) === String(companyId));
}

function getTicketReplies(id) {
  return repliesByTicket[String(id)] || [];
}

function getTicketThread(id) {
  const replies = getTicketReplies(id);
  const items = [];
  let currentDate = null;
  replies.forEach((reply) => {
    const date = reply.date || 'Today';
    if (date !== currentDate) {
      items.push({ type: 'date', date });
      currentDate = date;
    }
    items.push({ type: 'message', ...reply });
  });
  return items;
}

function filterTicketsByCompany(companyId, filters = {}) {
  const q = String(filters.q || '').trim().toLowerCase();
  const status = String(filters.status || 'all');
  const category = String(filters.category || 'all');
  const priority = String(filters.priority || 'all');
  const sort = String(filters.sort || 'newest');

  let items = getTicketsByCompany(companyId).filter((ticket) => {
    if (status !== 'all' && ticket.status !== status) return false;
    if (category !== 'all' && ticket.category !== category) return false;
    if (priority !== 'all' && ticket.priority !== priority) return false;
    if (!q) return true;
    const haystack = [ticket.ticketNo, ticket.subject, ticket.category, ticket.lastReply].join(' ').toLowerCase();
    return haystack.includes(q);
  });

  const sorters = {
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    updated: (a, b) => (b.unread - a.unread) || String(b.updatedAt).localeCompare(String(a.updatedAt)),
    priority: (a, b) => {
      const rank = { urgent: 4, high: 3, normal: 2, low: 1 };
      return (rank[b.priority] || 0) - (rank[a.priority] || 0);
    },
  };
  items.sort(sorters[sort] || sorters.newest);
  return items;
}

function paginateList(items, page = 1, perPage = 10) {
  const safePerPage = Math.min(30, Math.max(5, Number(perPage) || 10));
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

function getTicketListMeta(companyId) {
  const items = getTicketsByCompany(companyId);
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

function createCompanyTicket(companyId, companyName, payload = {}) {
  const subject = String(payload.subject || '').trim();
  const message = String(payload.message || '').trim();
  const category = TICKET_CATEGORIES.includes(payload.category) ? payload.category : 'General';
  const priority = VALID_PRIORITIES.includes(payload.priority) ? payload.priority : 'normal';
  if (!subject || !message) return null;

  const id = String(companyTickets.length + 1);
  const ticketNo = `CMP-${nextTicketNum++}`;
  const now = new Date();
  const createdAt = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const ticket = {
    id,
    companyId: String(companyId),
    ticketNo,
    subject,
    category,
    status: 'open',
    priority,
    createdAt,
    updatedAt: 'Just now',
    unread: 0,
    lastReply: message,
    lastFrom: 'company',
  };

  companyTickets.unshift(ticket);
  repliesByTicket[id] = [
    { from: 'company', author: companyName || 'Company', text: message, time, date: 'Today' },
    {
      from: 'admin',
      author: SUPPORT_NAME,
      text: 'Thank you for contacting Safarny Support. We have received your ticket and will respond as soon as possible.',
      time,
      date: 'Today',
    },
  ];

  return ticket;
}

function addTicketReply(id, companyId, text, companyName, attachments = []) {
  const ticket = getCompanyTicket(id, companyId);
  const message = String(text || '').trim();
  const files = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
  if (!ticket || ticket.status === 'closed' || (!message && !files.length)) return null;
  const replies = repliesByTicket[String(id)] || (repliesByTicket[String(id)] = []);
  const reply = {
    from: 'company',
    author: companyName || 'Company',
    text: message,
    time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    date: 'Today',
    ...(files.length ? { attachments: files } : {}),
  };
  replies.push(reply);
  ticket.lastReply = summarizeReply(message, files);
  ticket.lastFrom = 'company';
  ticket.updatedAt = 'Just now';
  ticket.unread = 0;
  if (ticket.status === 'resolved') ticket.status = 'open';
  return reply;
}

function markTicketRead(id, companyId) {
  const ticket = getCompanyTicket(id, companyId);
  if (ticket) ticket.unread = 0;
  return ticket;
}

module.exports = {
  companyTickets,
  repliesByTicket,
  SUPPORT_AVATAR,
  SUPPORT_NAME,
  TICKET_CATEGORIES,
  VALID_STATUSES,
  VALID_PRIORITIES,
  getTicketsByCompany,
  getCompanyTicket,
  getTicketReplies,
  getTicketThread,
  filterTicketsByCompany,
  paginateList,
  getTicketListMeta,
  createCompanyTicket,
  addTicketReply,
  markTicketRead,
};
