const { User, nextSeq } = require('../models');
const { toDoc, toDocs } = require('../lib/document');
const { hashPassword, comparePassword } = require('../lib/password');
const { paginateList } = require('../lib/paginate');

function publicUser(user) {
  if (!user) return null;
  const doc = user.id ? user : toDoc(user);
  return {
    id: doc.id,
    avatar: doc.avatar,
    userName: doc.userName,
    email: doc.email,
    phone: doc.phone,
    role: doc.role || 'traveler',
    companyId: doc.companyId || null,
    status: doc.status || 'active',
  };
}

function postLoginPath(user, redirect) {
  if (!user) return '/';
  if (user.role === 'admin') {
    const dest = String(redirect || '');
    return dest.startsWith('/admin') ? dest : '/admin/dashboard';
  }
  if (user.role === 'company') {
    const dest = String(redirect || '');
    return dest.startsWith('/company') ? dest : '/company/dashboard';
  }
  return redirect || '/';
}

function emptyTraveler() {
  return {
    favoriteTripIds: [],
    preferredDestinations: [],
    language: 'en',
    notifications: { email: true, sms: false, push: false },
    notes: '',
    activity: [],
  };
}

async function findByEmail(email, { withPassword = false } = {}) {
  if (!email) return null;
  const query = User.findOne({ email: String(email).trim().toLowerCase() });
  if (withPassword) query.select('+passwordHash');
  return toDoc(await query.lean());
}

async function findById(id, { withPassword = false } = {}) {
  if (!id) return null;
  const query = User.findById(String(id));
  if (withPassword) query.select('+passwordHash');
  return toDoc(await query.lean());
}

async function createUser({ userName, email, phone, password, role = 'traveler', companyId = null, status = 'active' }) {
  const id = String(Date.now());
  const safeRole = ['company', 'admin'].includes(role) ? role : 'traveler';
  const doc = await User.create({
    _id: id,
    avatar: '/user.png',
    userName,
    email: String(email || '').trim().toLowerCase(),
    phone: phone || '',
    passwordHash: await hashPassword(password),
    role: safeRole,
    companyId: safeRole === 'company' ? String(companyId) : null,
    status: status === 'suspended' ? 'suspended' : 'active',
    traveler: emptyTraveler(),
  });
  return toDoc(doc);
}

async function createAdminUser(payload) {
  return createUser({ ...payload, role: 'admin' });
}

async function updateUser(id, patch = {}) {
  const $set = { ...patch };
  delete $set.password;
  delete $set.passwordHash;
  if (patch.password) $set.passwordHash = await hashPassword(patch.password);
  const user = await User.findByIdAndUpdate(String(id), { $set }, { new: true }).lean();
  return toDoc(user);
}

async function updateTraveler(id, payload = {}) {
  const user = await findById(id);
  if (!user || user.role !== 'traveler') return { error: 'not_found' };

  const email = String(payload.email || user.email).trim().toLowerCase();
  if (!email) return { error: 'invalid_email' };
  const existing = await findByEmail(email);
  if (existing && existing.id !== user.id) return { error: 'email_taken' };

  const userName = String(payload.userName || user.userName).trim();
  if (!userName) return { error: 'invalid_name' };

  const $set = {
    userName,
    email,
    phone: String(payload.phone || '').trim(),
    city: String(payload.city || '').trim(),
    country: String(payload.country || 'Egypt').trim(),
    avatar: String(payload.avatar || user.avatar).trim() || '/user.png',
    status: payload.status === 'suspended' ? 'suspended' : 'active',
  };
  const password = String(payload.password || '').trim();
  if (password && password.length >= 6) $set.passwordHash = await hashPassword(password);

  const updated = await User.findByIdAndUpdate(String(id), { $set }, { new: true }).lean();
  return { user: toDoc(updated) };
}

async function updateAdmin(id, payload = {}) {
  const user = await findById(id);
  if (!user || user.role !== 'admin') return { error: 'not_found' };

  const email = String(payload.email || user.email).trim().toLowerCase();
  if (!email) return { error: 'invalid_email' };
  const existing = await findByEmail(email);
  if (existing && existing.id !== user.id) return { error: 'email_taken' };

  const userName = String(payload.userName || user.userName).trim();
  if (!userName) return { error: 'invalid_name' };

  const $set = {
    userName,
    email,
    phone: String(payload.phone || '').trim(),
    avatar: String(payload.avatar || user.avatar).trim() || '/user.png',
    status: payload.status === 'suspended' ? 'suspended' : 'active',
  };
  const password = String(payload.password || '').trim();
  if (password && password.length >= 6) $set.passwordHash = await hashPassword(password);

  const updated = await User.findByIdAndUpdate(String(id), { $set }, { new: true }).lean();
  return { user: toDoc(updated) };
}

function applyUserFilters(items, filters = {}) {
  const q = String(filters.q || '').trim().toLowerCase();
  const role = String(filters.role || 'all');
  const status = String(filters.status || 'all');
  const excludeRole = String(filters.excludeRole || '');
  let next = [...items];
  if (excludeRole) next = next.filter((user) => user.role !== excludeRole);
  if (role !== 'all') next = next.filter((user) => user.role === role);
  if (status !== 'all') next = next.filter((user) => (user.status || 'active') === status);
  if (q) {
    next = next.filter((user) => {
      const haystack = `${user.userName} ${user.email} ${user.phone} ${user.id} ${user.city || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }
  const sort = String(filters.sort || 'newest');
  if (sort === 'name') next.sort((a, b) => a.userName.localeCompare(b.userName));
  else if (sort === 'active') {
    next.sort((a, b) => String(b.lastActiveAt || b.createdAt).localeCompare(String(a.lastActiveAt || a.createdAt)));
  } else next.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return next;
}

async function filterUsers(filters = {}) {
  const items = toDocs(await User.find().lean());
  return applyUserFilters(items, filters);
}

async function filterTravelers(filters = {}) {
  return filterUsers({ ...filters, role: 'traveler' });
}

async function filterAdmins(filters = {}) {
  return filterUsers({ ...filters, role: 'admin' });
}

async function setUserStatus(id, status) {
  return updateUser(id, { status: status === 'suspended' ? 'suspended' : 'active' });
}

async function setUserRole(id, role) {
  if (!['traveler', 'company', 'admin'].includes(role)) return null;
  const $set = { role, companyId: role === 'company' ? undefined : null };
  const user = await User.findByIdAndUpdate(String(id), { $set }, { new: true }).lean();
  return toDoc(user);
}

async function getUserStats() {
  const items = toDocs(await User.find().lean());
  return {
    total: items.length,
    travelers: items.filter((u) => u.role === 'traveler').length,
    companies: items.filter((u) => u.role === 'company').length,
    admins: items.filter((u) => u.role === 'admin').length,
    suspended: items.filter((u) => u.status === 'suspended').length,
    active: items.filter((u) => (u.status || 'active') === 'active').length,
  };
}

async function getTravelerProfile(userId) {
  const user = await findById(userId);
  return { ...emptyTraveler(), ...(user?.traveler || {}), lastActiveAt: user?.lastActiveAt || null };
}

async function updateTravelerProfile(userId, payload = {}) {
  const preferredDestinations = String(payload.preferredDestinations || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const favoriteTripIds = String(payload.favoriteTripIds || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  const $set = {
    'traveler.language': payload.language === 'ar' ? 'ar' : 'en',
    'traveler.preferredDestinations': preferredDestinations,
    'traveler.favoriteTripIds': favoriteTripIds,
    'traveler.notifications.email': payload.notifyEmail === 'on' || payload.notifyEmail === true,
    'traveler.notifications.sms': payload.notifySms === 'on' || payload.notifySms === true,
    'traveler.notifications.push': payload.notifyPush === 'on' || payload.notifyPush === true,
    'traveler.notes': String(payload.notes || ''),
  };
  const user = await User.findByIdAndUpdate(String(userId), { $set }, { new: true }).lean();
  return toDoc(user)?.traveler || emptyTraveler();
}

async function setTravelerNotes(userId, notes) {
  const user = await User.findByIdAndUpdate(
    String(userId),
    { $set: { 'traveler.notes': String(notes || '') } },
    { new: true }
  ).lean();
  return toDoc(user)?.traveler || emptyTraveler();
}

async function toggleFavorite(userId, tripId) {
  const user = await findById(userId);
  if (!user) return [];
  const id = String(tripId);
  const current = [...(user.traveler?.favoriteTripIds || [])];
  const index = current.indexOf(id);
  if (index >= 0) current.splice(index, 1);
  else current.push(id);
  await User.findByIdAndUpdate(String(userId), { $set: { 'traveler.favoriteTripIds': current } });
  return current;
}

async function setLanguage(userId, lang) {
  await User.findByIdAndUpdate(String(userId), { $set: { 'traveler.language': lang === 'ar' ? 'ar' : 'en' } });
}

async function appendActivity(userId, entry) {
  await User.findByIdAndUpdate(String(userId), {
    $push: {
      'traveler.activity': {
        $each: [{ ...entry, at: entry.at || new Date() }],
        $position: 0,
        $slice: 50,
      },
    },
    $set: { lastActiveAt: new Date() },
  });
}

async function verifyCredentials(email, password) {
  const user = await findByEmail(email, { withPassword: true });
  if (!user) return null;
  const ok = await comparePassword(password, user.passwordHash);
  if (!ok) return null;
  delete user.passwordHash;
  return user;
}

module.exports = {
  publicUser,
  postLoginPath,
  findByEmail,
  findById,
  createUser,
  createAdminUser,
  updateUser,
  updateTraveler,
  updateAdmin,
  filterUsers,
  filterTravelers,
  filterAdmins,
  setUserStatus,
  setUserRole,
  getUserStats,
  getTravelerProfile,
  updateTravelerProfile,
  setTravelerNotes,
  toggleFavorite,
  setLanguage,
  appendActivity,
  verifyCredentials,
  paginateList,
  emptyTraveler,
  nextSeq,
};
