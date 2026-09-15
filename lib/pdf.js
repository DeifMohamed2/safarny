const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { formatMoney } = require('./money');

const FONTS_DIR = path.join(__dirname, '..', 'assets', 'fonts');
const STORAGE_ROOT = path.join(__dirname, '..', 'storage', 'finance-docs');

const FONT_FILES = {
  regular: path.join(FONTS_DIR, 'NotoSans-Regular.ttf'),
  bold: path.join(FONTS_DIR, 'NotoSans-Bold.ttf'),
  arabic: path.join(FONTS_DIR, 'NotoNaskhArabic-Regular.ttf'),
};

function fontAvailable(kind) {
  try {
    return fs.existsSync(FONT_FILES[kind]);
  } catch {
    return false;
  }
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function cachePath(kind, number) {
  const folder = kind === 'invoice' ? 'invoices' : kind === 'statement' ? 'statements' : 'credit-notes';
  return path.join(STORAGE_ROOT, folder, `${number}.pdf`);
}

function applyFonts(doc) {
  if (fontAvailable('regular')) doc.registerFont('Body', FONT_FILES.regular);
  if (fontAvailable('bold')) doc.registerFont('Heading', FONT_FILES.bold);
  if (fontAvailable('arabic')) doc.registerFont('Arabic', FONT_FILES.arabic);
  // Arabic names render with Noto Naskh; full RTL shaping would need arabic-reshaper + bidi-js.
  doc.font(fontAvailable('regular') ? 'Body' : 'Helvetica');
}

function headingFont(doc) {
  return fontAvailable('bold') ? 'Heading' : 'Helvetica-Bold';
}

function bodyFont(doc) {
  return fontAvailable('regular') ? 'Body' : 'Helvetica';
}

function drawHeader(doc, { title, number, date }) {
  doc.font(headingFont(doc)).fontSize(18).fillColor('#122445').text('Safarny', 50, 42);
  doc.font(bodyFont(doc)).fontSize(9).fillColor('#64748b').text('Travel platform · Egypt', 50, 64);
  doc.font(headingFont(doc)).fontSize(16).fillColor('#122445').text(title, 320, 42, { width: 225, align: 'right' });
  doc.font(bodyFont(doc)).fontSize(10).fillColor('#334155');
  doc.text(number, 320, 64, { width: 225, align: 'right' });
  if (date) doc.text(date, 320, 78, { width: 225, align: 'right' });
  doc.moveTo(50, 100).lineTo(545, 100).strokeColor('#e2e8f0').lineWidth(1).stroke();
  doc.y = 118;
}

function drawFooter(doc) {
  const page = doc.page;
  doc.font(bodyFont(doc)).fontSize(8).fillColor('#94a3b8');
  doc.text('Safarny · Manual transfer records. This document is not a bank receipt.', 50, page.height - 50, {
    width: page.width - 100,
    align: 'center',
  });
}

function hasArabic(value) {
  return /[\u0600-\u06FF]/.test(String(value || ''));
}

function fontFor(doc, value, heading) {
  if (hasArabic(value) && fontAvailable('arabic')) return 'Arabic';
  return heading ? headingFont(doc) : bodyFont(doc);
}

function kv(doc, label, value) {
  const y = doc.y;
  doc.font(bodyFont(doc)).fontSize(9).fillColor('#64748b').text(label, 50, y, { width: 140 });
  doc.font(fontFor(doc, value, true)).fontSize(10).fillColor('#0f172a').text(String(value || '—'), 190, y, { width: 355 });
  doc.moveDown(0.4);
}

function drawTable(doc, columns, rows) {
  const startX = 50;
  const widths = columns.map((col) => col.width);
  const tableWidth = widths.reduce((sum, w) => sum + w, 0);
  let x = startX;
  const headerY = doc.y;
  doc.rect(startX, headerY, tableWidth, 22).fill('#122445');
  columns.forEach((col, index) => {
    doc.font(headingFont(doc)).fontSize(8).fillColor('#ffffff')
      .text(col.label, x + 6, headerY + 6, { width: widths[index] - 12, align: col.align || 'left' });
    x += widths[index];
  });
  let y = headerY + 22;
  rows.forEach((row, rowIndex) => {
    const height = 22;
    if (y + height > doc.page.height - 70) {
      doc.addPage();
      y = 50;
    }
    if (rowIndex % 2 === 0) doc.rect(startX, y, tableWidth, height).fill('#f8fafc');
    x = startX;
    columns.forEach((col, index) => {
      doc.font(fontFor(doc, row[col.key], false)).fontSize(8).fillColor('#0f172a')
        .text(String(row[col.key] ?? ''), x + 6, y + 6, { width: widths[index] - 12, align: col.align || 'left' });
      x += widths[index];
    });
    y += height;
  });
  doc.y = y + 12;
}

function money(value, currency = 'EGP') {
  return `${formatMoney(value)} ${currency}`;
}

function createDocument() {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    bufferPages: true,
    info: { Author: 'Safarny', Creator: 'Safarny Finance' },
  });
  applyFonts(doc);
  return doc;
}

function stampFooters(doc) {
  const range = doc.bufferedPageRange();
  for (let i = 0; i < range.count; i += 1) {
    doc.switchToPage(range.start + i);
    doc.font(bodyFont(doc)).fontSize(8).fillColor('#94a3b8');
    doc.text('Safarny · Manual transfer records. This document is not a bank receipt.', 50, doc.page.height - 40, {
      width: doc.page.width - 100,
      align: 'center',
      lineBreak: false,
    });
  }
}

function renderToFile(doc, destPath) {
  ensureDir(path.dirname(destPath));
  stampFooters(doc);
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(destPath);
    doc.pipe(stream);
    stream.on('finish', () => resolve(destPath));
    stream.on('error', reject);
    doc.end();
  });
}

async function sendPdf(res, filePath, downloadName) {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${downloadName}"`);
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('end', resolve);
    stream.pipe(res);
  });
}

module.exports = {
  STORAGE_ROOT,
  cachePath,
  createDocument,
  drawHeader,
  drawFooter,
  stampFooters,
  kv,
  drawTable,
  money,
  renderToFile,
  sendPdf,
  headingFont,
  bodyFont,
};
