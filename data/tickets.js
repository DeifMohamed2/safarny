const { summarizeReply } = require('../lib/ticket-attachments');

const SUPPORT_AVATAR = '/assets/logo.svg';
const SUPPORT_NAME = 'Safarny Support';

const tickets = [
  {
    id: '1',
    ticketNo: 'TKT-1042',
    userId: '21',
    subject: 'Booking modification — Sharm El Sheikh',
    category: 'Booking',
    status: 'open',
    priority: 'normal',
    createdAt: 'Aug 26, 2026',
    updatedAt: '2h ago',
    unread: 1,
    lastReply: 'We are reviewing your modification request and will update you shortly.',
    lastFrom: 'admin',
  },
  {
    id: '2',
    ticketNo: 'TKT-1038',
    userId: '22',
    subject: 'Payment confirmation for Luxor tour',
    category: 'Payment',
    status: 'pending',
    priority: 'high',
    createdAt: 'Aug 24, 2026',
    updatedAt: '1d ago',
    unread: 0,
    lastReply: 'Your payment receipt has been received. Awaiting bank verification.',
    lastFrom: 'admin',
  },
  {
    id: '3',
    ticketNo: 'TKT-1025',
    userId: '24',
    subject: 'Refund request — cancelled Aswan trip',
    category: 'Refund',
    status: 'resolved',
    priority: 'normal',
    createdAt: 'Aug 18, 2026',
    updatedAt: '5d ago',
    unread: 0,
    lastReply: 'Refund processed. Allow 3–5 business days for the amount to appear.',
    lastFrom: 'admin',
  },
];

const repliesByTicket = {
  1: [
    { from: 'user', author: 'You', text: 'Hi, I need to change my travel date for the Sharm El Sheikh booking from Sep 10 to Sep 15.', time: '10:22 AM', date: 'Aug 26, 2026' },
    { from: 'admin', author: SUPPORT_NAME, text: 'Thank you for reaching out. I have located your booking #BK-8821. Could you confirm the number of travelers remains the same?', time: '11:05 AM', date: 'Aug 26, 2026' },
    { from: 'user', author: 'You', text: 'Yes, still 2 adults. Same room preference if possible.', time: '11:18 AM', date: 'Aug 26, 2026' },
    { from: 'admin', author: SUPPORT_NAME, text: 'We are reviewing your modification request and will update you shortly.', time: '2:30 PM', date: 'Today' },
  ],
  2: [
    { from: 'user', author: 'You', text: 'I made a bank transfer yesterday for the Luxor tour. Can you confirm receipt?', time: '3:40 PM', date: 'Aug 24, 2026' },
    { from: 'admin', author: SUPPORT_NAME, text: 'Your payment receipt has been received. Awaiting bank verification.', time: '9:15 AM', date: 'Aug 25, 2026' },
  ],
  3: [
    { from: 'user', author: 'You', text: 'I had to cancel my Aswan trip due to a family emergency. Please initiate a refund.', time: '4:00 PM', date: 'Aug 18, 2026' },
    { from: 'admin', author: SUPPORT_NAME, text: 'We are sorry to hear that. Your cancellation has been approved per our policy.', time: '10:30 AM', date: 'Aug 19, 2026' },
    { from: 'admin', author: SUPPORT_NAME, text: 'Refund processed. Allow 3–5 business days for the amount to appear.', time: '2:00 PM', date: 'Aug 22, 2026' },
  ],
};

let nextTicketNum = 1043;

function getTicket(id) {
  return tickets.find((item) => item.id === String(id));
}

function getReplies(id) {
  return repliesByTicket[String(id)] || [];
}

function getThreadItems(id) {
  const replies = getReplies(id);
  const items = [];
  let currentDate = null;
  replies.forEach((reply) => {
    const date = reply.date || 'Today';
    if (date !== currentDate) {
      items.push({ type: 'date', label: date });
      currentDate = date;
    }
    items.push({ type: 'reply', ...reply });
  });
  return items;
}

function countByStatus(status) {
  if (!status || status === 'all') return tickets.length;
  return tickets.filter((t) => t.status === status).length;
}

function addReply(id, text, attachments = []) {
  const message = String(text || '').trim();
  const files = Array.isArray(attachments) ? attachments.filter(Boolean) : [];
  if (!message && !files.length) return null;
  const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const list = repliesByTicket[String(id)] || [];
  const reply = {
    from: 'user',
    author: 'You',
    text: message,
    time,
    date: 'Today',
    ...(files.length ? { attachments: files } : {}),
  };
  list.push(reply);
  repliesByTicket[String(id)] = list;
  const ticket = getTicket(id);
  if (ticket) {
    ticket.lastReply = summarizeReply(message, files);
    ticket.updatedAt = 'now';
    ticket.unread = 0;
    ticket.lastFrom = 'user';
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      ticket.status = 'open';
    }
  }
  return reply;
}

function createTicket({ subject, category, message }) {
  const id = String(tickets.length + 1);
  const ticketNo = `TKT-${nextTicketNum++}`;
  const now = new Date();
  const createdAt = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const ticket = {
    id,
    ticketNo,
    subject,
    category: category || 'General',
    status: 'open',
    priority: 'normal',
    createdAt,
    updatedAt: 'now',
    unread: 0,
    lastReply: message,
    lastFrom: 'user',
  };
  tickets.unshift(ticket);
  repliesByTicket[id] = [
    { from: 'user', author: 'You', text: message, time, date: 'Today' },
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

function markRead(id) {
  const ticket = getTicket(id);
  if (ticket) ticket.unread = 0;
}

module.exports = {
  tickets,
  repliesByTicket,
  SUPPORT_AVATAR,
  SUPPORT_NAME,
  getTicket,
  getReplies,
  getThreadItems,
  countByStatus,
  addReply,
  createTicket,
  markRead,
};
