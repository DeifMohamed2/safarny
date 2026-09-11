const ticketService = require('../../services/tickets');
const { wantsJson } = require('../../middleware/auth');
const {
  ticketAttachmentUpload,
  mapUploadedAttachments,
  uploadErrorResponse,
} = require('../../lib/ticket-attachments');
const { withLayout, audit } = require('./_helpers');

async function list(req, res) {
  const filters = {
    q: req.query.q,
    status: req.query.status || 'all',
    priority: req.query.priority || 'all',
    source: req.query.source || 'all',
    sort: req.query.sort || 'updated',
  };
  const items = await ticketService.getAllTickets(filters);
  const { items: pageItems, pagination } = ticketService.paginateTickets(items, req.query.page, req.query.perPage || 15);
  withLayout(res, 'pages/admin/support', {
    title: res.locals.t('admin.support.title', 'Support'),
    adminActive: 'support',
    tickets: pageItems,
    pagination,
    filters,
    meta: await ticketService.getSupportMeta(),
    hasActiveFilters: filters.q || filters.status !== 'all' || filters.priority !== 'all' || filters.source !== 'all',
  });
}

async function detail(req, res) {
  const ticket = await ticketService.getUnifiedTicket(req.params.globalId);
  if (!ticket) return res.status(404).render('pages/not-found', { title: 'Ticket not found' });
  const thread = await ticketService.getUnifiedThread(req.params.globalId);
  withLayout(res, 'pages/admin/support-detail', {
    title: ticket.ticketNo,
    adminActive: 'support',
    ticket,
    thread,
    supportName: ticketService.SUPPORT_NAME,
  });
}

function reply(req, res) {
  ticketAttachmentUpload.array('attachments')(req, res, async (uploadError) => {
    if (uploadError) {
      if (wantsJson(req)) return uploadErrorResponse(uploadError, res);
      req.session.flash = { type: 'error', message: uploadError.message || 'Upload failed.' };
      return res.redirect(`/admin/support/${req.params.globalId}`);
    }
    const message = String(req.body.message || '').trim();
    const attachments = mapUploadedAttachments(req);
    if (!message && !attachments.length) {
      if (wantsJson(req)) return res.status(400).json({ ok: false, message: 'Message or attachment is required.' });
      req.session.flash = { type: 'error', message: 'Message or attachment is required.' };
      return res.redirect(`/admin/support/${req.params.globalId}`);
    }
    const result = await ticketService.addAdminReply(req.params.globalId, message, req.session.user.userName, attachments);
    if (!result) {
      if (wantsJson(req)) return res.status(400).json({ ok: false, message: 'Could not send reply.' });
      req.session.flash = { type: 'error', message: 'Could not send reply.' };
      return res.redirect(`/admin/support/${req.params.globalId}`);
    }
    await audit(req, 'ticket.reply', 'ticket', result.ticket.ticketNo, `Replied to ticket ${result.ticket.ticketNo}`);
    if (wantsJson(req)) return res.json({ ok: true, message: 'Reply sent.', reply: result.reply });
    req.session.flash = { type: 'success', message: 'Reply sent.' };
    res.redirect(`/admin/support/${req.params.globalId}`);
  });
}

async function status(req, res) {
  await ticketService.setTicketStatus(req.params.globalId, req.body.status);
  req.session.flash = { type: 'success', message: 'Ticket status updated.' };
  res.redirect(`/admin/support/${req.params.globalId}`);
}

async function priority(req, res) {
  await ticketService.setTicketPriority(req.params.globalId, req.body.priority);
  req.session.flash = { type: 'success', message: 'Ticket priority updated.' };
  res.redirect(`/admin/support/${req.params.globalId}`);
}

async function assign(req, res) {
  await ticketService.assignTicket(req.params.globalId, req.body.assignee);
  req.session.flash = { type: 'success', message: 'Ticket assigned.' };
  res.redirect(`/admin/support/${req.params.globalId}`);
}

module.exports = { list, detail, reply, status, priority, assign };
