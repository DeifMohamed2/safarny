const fs = require('fs');
const path = require('path');
const multer = require('multer');

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const DOC_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/zip',
  'application/x-zip-compressed',
]);
const ALLOWED_TYPES = new Set([...IMAGE_TYPES, ...DOC_TYPES]);
const MAX_FILES = 5;
const MAX_BYTES = 10 * 1024 * 1024;

const uploadsRoot = path.join(__dirname, '..', 'public', 'uploads', 'support-tickets');

function attachmentScope(req) {
  const user = req.session?.user;
  if (!user) return 'guest';
  if (user.role === 'admin') return 'admin';
  if (user.role === 'company') return `company-${user.companyId}`;
  return `traveler-${user.id}`;
}

function ensureUploadDir(scope) {
  const dir = path.join(uploadsRoot, String(scope));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function attachmentKind(mimetype) {
  if (IMAGE_TYPES.has(mimetype)) return 'image';
  if (DOC_TYPES.has(mimetype) || ALLOWED_TYPES.has(mimetype)) return 'file';
  return null;
}

function summarizeReply(text, attachments = []) {
  const trimmed = String(text || '').trim();
  if (trimmed) {
    return trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed;
  }
  if (!attachments?.length) return '';
  if (attachments.length === 1) {
    const att = attachments[0];
    if (att.type === 'image') return 'Photo';
    return att.name || 'Attachment';
  }
  return `${attachments.length} attachments`;
}

function mapUploadedAttachments(req) {
  const scope = attachmentScope(req);
  return (req.files || []).map((file) => {
    const kind = attachmentKind(file.mimetype) || 'file';
    const filename = path.basename(file.filename || file.path || '');
    return {
      url: `/uploads/support-tickets/${scope}/${filename}`,
      name: file.originalname || filename,
      type: kind,
      mime: file.mimetype,
      size: file.size,
    };
  });
}

function uploadErrorResponse(error, res) {
  if (error.message === 'UNSUPPORTED_TYPE') {
    return res.status(400).json({ ok: false, message: 'Unsupported file type.' });
  }
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ ok: false, message: 'Each file must be 10 MB or less.' });
  }
  if (error.code === 'LIMIT_FILE_COUNT' || error.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ ok: false, message: `You can attach up to ${MAX_FILES} files.` });
  }
  return res.status(400).json({ ok: false, message: error.message || 'Upload failed.' });
}

const ticketAttachmentUpload = multer({
  storage: multer.diskStorage({
    destination(req, _file, cb) {
      try {
        const dir = ensureUploadDir(attachmentScope(req));
        cb(null, dir);
      } catch (err) {
        cb(err);
      }
    },
    filename(_req, file, cb) {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const safeExt = ext && ext.length <= 8 ? ext : '';
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${safeExt}`);
    },
  }),
  limits: {
    fileSize: MAX_BYTES,
    files: MAX_FILES,
  },
  fileFilter(_req, file, cb) {
    if (!attachmentKind(file.mimetype)) {
      return cb(new Error('UNSUPPORTED_TYPE'));
    }
    cb(null, true);
  },
});

module.exports = {
  MAX_FILES,
  MAX_BYTES,
  ticketAttachmentUpload,
  mapUploadedAttachments,
  summarizeReply,
  uploadErrorResponse,
};
