const companyChats = [
  {
    id: '1',
    companyId: '1',
    customerName: 'Ahmed Hassan',
    customerEmail: 'ahmed.hassan@email.com',
    subject: 'Pyramids trip — extra night',
    updatedAt: '2h ago',
    unread: 1,
    lastReply: 'We can add one extra night in Cairo. Shall I send an updated quote?',
    lastFrom: 'company',
  },
  {
    id: '2',
    companyId: '1',
    customerName: 'Sara Mohamed',
    customerEmail: 'sara.mohamed@email.com',
    subject: 'Pickup time for Giza tour',
    updatedAt: '1d ago',
    unread: 0,
    lastReply: 'Pickup is at 7:30 AM from your hotel lobby.',
    lastFrom: 'company',
  },
  {
    id: '3',
    companyId: '1',
    customerName: 'Layla Ibrahim',
    customerEmail: 'layla.ibrahim@email.com',
    subject: 'Desert safari packing list',
    updatedAt: '3d ago',
    unread: 0,
    lastReply: 'Please bring a light jacket and closed shoes for the camp.',
    lastFrom: 'company',
  },
];

const repliesByChat = {
  1: [
    { from: 'customer', author: 'Ahmed Hassan', text: 'Hi, can we stay one extra night after the pyramids tour?', time: '10:12 AM', date: 'Aug 26, 2026' },
    { from: 'company', author: 'Red Sea Adventures', text: 'We can add one extra night in Cairo. Shall I send an updated quote?', time: '11:40 AM', date: 'Today' },
  ],
  2: [
    { from: 'customer', author: 'Sara Mohamed', text: 'What time is hotel pickup for the Giza trip?', time: '4:20 PM', date: 'Aug 25, 2026' },
    { from: 'company', author: 'Red Sea Adventures', text: 'Pickup is at 7:30 AM from your hotel lobby.', time: '9:05 AM', date: 'Aug 26, 2026' },
  ],
  3: [
    { from: 'customer', author: 'Layla Ibrahim', text: 'What should we pack for the desert safari?', time: '1:00 PM', date: 'Aug 23, 2026' },
    { from: 'company', author: 'Red Sea Adventures', text: 'Please bring a light jacket and closed shoes for the camp.', time: '3:15 PM', date: 'Aug 23, 2026' },
  ],
};

function getChatsByCompany(companyId) {
  return companyChats.filter((chat) => String(chat.companyId) === String(companyId));
}

function getCompanyChat(id, companyId) {
  return companyChats.find((chat) => chat.id === String(id) && String(chat.companyId) === String(companyId));
}

function getChatReplies(id) {
  return repliesByChat[String(id)] || [];
}

function getChatThread(id) {
  const replies = getChatReplies(id);
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

function addChatReply(id, companyId, text, companyName) {
  const chat = getCompanyChat(id, companyId);
  if (!chat || !text) return null;
  const replies = repliesByChat[String(id)] || (repliesByChat[String(id)] = []);
  replies.push({
    from: 'company',
    author: companyName || 'Company',
    text,
    time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
    date: 'Today',
  });
  chat.lastReply = text;
  chat.lastFrom = 'company';
  chat.updatedAt = 'Just now';
  chat.unread = 0;
  return chat;
}

function markChatRead(id, companyId) {
  const chat = getCompanyChat(id, companyId);
  if (chat) chat.unread = 0;
  return chat;
}

module.exports = {
  companyChats,
  repliesByChat,
  getChatsByCompany,
  getCompanyChat,
  getChatReplies,
  getChatThread,
  addChatReply,
  markChatRead,
};
