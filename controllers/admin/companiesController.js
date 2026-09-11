const companyService = require('../../services/companies');
const tripService = require('../../services/trips');
const bookingService = require('../../services/bookings');
const ticketService = require('../../services/tickets');
const { getCompanyLeaderboard, enrichCompanyForAdmin } = require('../../lib/admin-insights');
const { withLayout, audit } = require('./_helpers');

async function list(req, res) {
  const filters = {
    q: req.query.q,
    verification: req.query.verification || 'all',
    status: req.query.status || 'all',
    destination: req.query.destination || 'all',
    sort: req.query.sort || 'activity',
  };
  let items = await Promise.all((await companyService.filterCompaniesAdmin(filters)).map((c) => enrichCompanyForAdmin(c)));
  if (filters.sort === 'revenue') items.sort((a, b) => b.revenue - a.revenue);
  else if (filters.sort === 'bookings') items.sort((a, b) => b.bookingCount - a.bookingCount);
  else items.sort((a, b) => b.activityScore - a.activityScore);
  const { items: pageItems, pagination } = bookingService.paginateList(items, req.query.page, req.query.perPage || 12);
  withLayout(res, 'pages/admin/companies', {
    title: res.locals.t('admin.companies.title', 'Companies'),
    adminActive: 'companies',
    companies: pageItems,
    leaderboard: await getCompanyLeaderboard(5),
    pagination,
    filters,
    hasActiveFilters: filters.q || filters.verification !== 'all' || filters.status !== 'all' || filters.destination !== 'all',
  });
}

function createForm(req, res) {
  req.session.flash = { type: 'info', message: 'Companies now create their own accounts from the public site.' };
  res.redirect('/admin/companies');
}

async function create(req, res) {
  req.session.flash = { type: 'info', message: 'Companies now create their own accounts from the public site.' };
  res.redirect('/admin/companies');
}

async function detail(req, res) {
  const company = await companyService.getCompanyById(req.params.id);
  if (!company) return res.status(404).render('pages/not-found', { title: 'Company not found' });
  const [enriched, trips, bookings, tickets, allCompanies] = await Promise.all([
    enrichCompanyForAdmin(company),
    tripService.getTripsByCompany(company.id),
    bookingService.getBookingsByCompany(company.id),
    ticketService.getTicketsByCompany(company.id),
    companyService.listCompanies(),
  ]);
  withLayout(res, 'pages/admin/company-detail', {
    title: company.title,
    adminActive: 'companies',
    company: enriched,
    trips,
    bookings,
    tickets: tickets.slice(0, 5),
    allCompanies: allCompanies.map((c) => ({ id: c.id, title: c.title })),
  });
}

async function editForm(req, res) {
  const company = await companyService.getCompanyById(req.params.id);
  if (!company) return res.status(404).render('pages/not-found', { title: 'Company not found' });
  withLayout(res, 'pages/admin/company-form', {
    title: `Edit ${company.title}`,
    adminActive: 'companies',
    company,
    isEdit: true,
  });
}

async function edit(req, res) {
  const company = await companyService.updateCompany(req.params.id, {
    title: req.body.title,
    description: req.body.description,
    location: req.body.location,
    contactNumber: req.body.contactNumber,
    years: Number(req.body.years),
    rating: Number(req.body.rating),
    commissionRate: Number(req.body.commissionRate),
    markupType: req.body.markupType === 'fixed' ? 'fixed' : 'percent',
    markupFixed: Number(req.body.markupFixed) || 0,
    badges: String(req.body.badges || '').split(',').map((s) => s.trim()).filter(Boolean),
    image: req.body.image || undefined,
  });
  if (company) await audit(req, 'company.update', 'company', company.id, `Updated company ${company.title}`);
  req.session.flash = { type: 'success', message: 'Company updated.' };
  res.redirect(`/admin/companies/${req.params.id}`);
}

async function verify(req, res) {
  const company = await companyService.setCompanyVerification(req.params.id, 'verified');
  if (company) await audit(req, 'company.verify', 'company', company.id, `Verified company ${company.title}`);
  req.session.flash = { type: 'success', message: 'Company verified.' };
  res.redirect(`/admin/companies/${req.params.id}`);
}

async function reject(req, res) {
  const company = await companyService.setCompanyVerification(req.params.id, 'rejected');
  if (company) await audit(req, 'company.reject', 'company', company.id, `Rejected company ${company.title}`);
  req.session.flash = { type: 'success', message: 'Company verification rejected.' };
  res.redirect(`/admin/companies/${req.params.id}`);
}

async function suspend(req, res) {
  const company = await companyService.setCompanyStatus(req.params.id, 'suspended');
  if (company) await audit(req, 'company.suspend', 'company', company.id, `Suspended company ${company.title}`);
  req.session.flash = { type: 'success', message: 'Company suspended.' };
  res.redirect(`/admin/companies/${req.params.id}`);
}

async function reactivate(req, res) {
  const company = await companyService.setCompanyStatus(req.params.id, 'active');
  if (company) await audit(req, 'company.reactivate', 'company', company.id, `Reactivated company ${company.title}`);
  req.session.flash = { type: 'success', message: 'Company reactivated.' };
  res.redirect(`/admin/companies/${req.params.id}`);
}

async function commission(req, res) {
  const markupType = req.body.markupType === 'fixed' ? 'fixed' : 'percent';
  const company = await companyService.updateCompany(req.params.id, {
    markupType,
    commissionRate: Number(req.body.commissionRate) || 0,
    markupFixed: Number(req.body.markupFixed) || 0,
  });
  if (company) await audit(req, 'company.commission', 'company', company.id, `Updated markup for ${company.title}`);
  req.session.flash = { type: 'success', message: 'Platform markup updated.' };
  res.redirect(`/admin/companies/${req.params.id}`);
}

module.exports = { list, createForm, create, detail, editForm, edit, verify, reject, suspend, reactivate, commission };
