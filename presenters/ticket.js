const { relativeTime, formatDisplayDate, formatTime } = require('../lib/helpers');

function presentMessage(message, locale = 'en') {
  const createdAt = message.createdAt ? new Date(message.createdAt) : new Date();
  return {
    ...message,
    time: message.time || formatTime(createdAt, locale),
    date: message.date || formatDisplayDate(createdAt, locale),
  };
}

function getThread(messages = [], locale = 'en') {
  const items = [];
  let currentDate = null;
  messages.forEach((raw) => {
    const message = presentMessage(raw, locale);
    const date = message.date || 'Today';
    if (date !== currentDate) {
      items.push({ type: 'date', date, label: date });
      currentDate = date;
    }
    items.push({ type: 'message', ...message });
  });
  return items;
}

function getThreadItems(messages = [], locale = 'en') {
  return getThread(messages, locale).map((item) => {
    if (item.type === 'date') return { type: 'date', label: item.date, date: item.date };
    return { type: 'reply', ...item };
  });
}

function presentTicket(ticket, extras = {}, locale = 'en') {
  if (!ticket) return null;
  const id = ticket.id || ticket._id;
  return {
    ...ticket,
    id,
    globalId: ticket.globalId || id,
    createdAt: typeof ticket.createdAt === 'string' ? ticket.createdAt : formatDisplayDate(ticket.createdAt, locale),
    updatedAt: typeof ticket.updatedAt === 'string' && !ticket.updatedAt.includes('T')
      ? ticket.updatedAt
      : relativeTime(ticket.updatedAt, locale),
    createdAtRaw: ticket.createdAt,
    updatedAtRaw: ticket.updatedAt,
    ...extras,
  };
}

module.exports = {
  presentMessage,
  getThread,
  getThreadItems,
  presentTicket,
};
