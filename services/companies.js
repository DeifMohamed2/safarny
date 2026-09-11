const { Company, nextSeq } = require('../models');
const { toDoc, toDocs } = require('../lib/document');

function ensureCompanyDefaults(company) {
  if (!company) return null;
  return {
    verification: 'verified',
    status: 'active',
    joinedAt: '2024-01-01',
    commissionRate: 12,
    markupType: 'percent',
    markupFixed: 0,
    ...company,
    id: company.id || company._id,
  };
}

async function getCompanyById(id) {
  if (!id) return null;
  return ensureCompanyDefaults(toDoc(await Company.findById(String(id)).lean()));
}

async function listCompanies() {
  return toDocs(await Company.find().lean()).map(ensureCompanyDefaults);
}

async function updateCompany(id, patch = {}) {
  const company = await Company.findByIdAndUpdate(String(id), { $set: patch }, { new: true }).lean();
  return ensureCompanyDefaults(toDoc(company));
}

async function filterCompanies({ q, destination, tripType, rate } = {}) {
  const companies = await listCompanies();
  return companies.filter((company) => {
    if (company.verification !== 'verified') return false;
    if (company.status === 'suspended') return false;
    if (destination && company.location !== destination) return false;
    if (rate && Number(company.rating) < Number(rate)) return false;
    if (tripType) {
      const needle = String(tripType).toLowerCase();
      const haystack = `${(company.badges || []).join(' ')} ${company.description}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (q) {
      const haystack = `${company.title} ${company.description} ${company.location}`.toLowerCase();
      if (!haystack.includes(String(q).toLowerCase())) return false;
    }
    return true;
  });
}

async function filterCompaniesAdmin(filters = {}) {
  const q = String(filters.q || '').trim().toLowerCase();
  const verification = String(filters.verification || 'all');
  const status = String(filters.status || 'all');
  const destination = String(filters.destination || 'all');
  const companies = await listCompanies();
  return companies.filter((company) => {
    if (verification !== 'all' && company.verification !== verification) return false;
    if (status !== 'all' && company.status !== status) return false;
    if (destination !== 'all' && company.location !== destination) return false;
    if (q) {
      const haystack = `${company.title} ${company.description} ${company.location}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

async function setCompanyVerification(id, verification) {
  if (!['pending', 'verified', 'rejected'].includes(verification)) return null;
  return updateCompany(id, { verification });
}

async function setCompanyStatus(id, status) {
  if (!['active', 'suspended'].includes(status)) return null;
  return updateCompany(id, { status });
}

async function getCompanyStats() {
  const items = await listCompanies();
  return {
    total: items.length,
    verified: items.filter((c) => c.verification === 'verified').length,
    pending: items.filter((c) => c.verification === 'pending').length,
    suspended: items.filter((c) => c.status === 'suspended').length,
  };
}

async function createCompany(payload = {}) {
  const seq = await nextSeq('company');
  const company = ensureCompanyDefaults({
    _id: String(seq),
    id: String(seq),
    image: payload.image || '/assets/companies/company.png',
    title: String(payload.title || '').trim(),
    description: String(payload.description || '').trim(),
    location: String(payload.location || '').trim(),
    years: Number(payload.years) || 1,
    packages: 0,
    reviews: 0,
    rating: Number(payload.rating) || 4.5,
    badges: String(payload.badges || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    contactNumber: String(payload.contactNumber || '').trim(),
    verification: payload.verification === 'verified' ? 'verified' : 'pending',
    status: 'active',
    joinedAt: new Date(),
    commissionRate: Number(payload.commissionRate) || 12,
    markupType: payload.markupType === 'fixed' ? 'fixed' : 'percent',
    markupFixed: Number(payload.markupFixed) || 0,
    verificationDocs: payload.verificationDocs || {},
  });
  if (!company.title || !company.location) return null;
  const created = await Company.create({
    _id: String(seq),
    image: company.image,
    title: company.title,
    description: company.description,
    location: company.location,
    years: company.years,
    packages: company.packages,
    reviews: company.reviews,
    rating: company.rating,
    badges: company.badges,
    contactNumber: company.contactNumber,
    verification: company.verification,
    status: company.status,
    joinedAt: company.joinedAt,
    commissionRate: company.commissionRate,
    markupType: company.markupType,
    markupFixed: company.markupFixed,
    verificationDocs: company.verificationDocs,
  });
  return ensureCompanyDefaults(toDoc(created));
}

module.exports = {
  getCompanyById,
  listCompanies,
  updateCompany,
  filterCompanies,
  filterCompaniesAdmin,
  setCompanyVerification,
  setCompanyStatus,
  getCompanyStats,
  ensureCompanyDefaults,
  createCompany,
};
