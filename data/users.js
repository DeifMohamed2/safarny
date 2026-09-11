const users = [
  {
    id: '21',
    avatar: '/user.png',
    userName: 'Ahmed Ali',
    email: 'ahmedali@email.com',
    phone: '+201227375904',
    password: '123Qwe',
    role: 'traveler',
    companyId: null,
    status: 'active',
    createdAt: '2025-06-01',
    city: 'Cairo',
    country: 'Egypt',
  },
  {
    id: '22',
    avatar: '/user.png',
    userName: 'Sara Mohamed',
    email: 'sara.mohamed@email.com',
    phone: '+201112223344',
    password: '123Qwe',
    role: 'traveler',
    companyId: null,
    status: 'active',
    createdAt: '2025-07-10',
    city: 'Alexandria',
    country: 'Egypt',
  },
  {
    id: '23',
    avatar: '/user.png',
    userName: 'Mona Samir',
    email: 'mona.samir@email.com',
    phone: '+201098765432',
    password: '123Qwe',
    role: 'traveler',
    companyId: null,
    status: 'active',
    createdAt: '2025-08-02',
    city: 'Giza',
    country: 'Egypt',
  },
  {
    id: '24',
    avatar: '/user.png',
    userName: 'Layla Ibrahim',
    email: 'layla.ibrahim@email.com',
    phone: '+201055667788',
    password: '123Qwe',
    role: 'traveler',
    companyId: null,
    status: 'suspended',
    createdAt: '2025-05-18',
    city: 'Mansoura',
    country: 'Egypt',
  },
  {
    id: '25',
    avatar: '/user.png',
    userName: 'Omar Khaled',
    email: 'omar.khaled@email.com',
    phone: '+201066778899',
    password: '123Qwe',
    role: 'traveler',
    companyId: null,
    status: 'active',
    createdAt: '2025-09-12',
    city: 'Hurghada',
    country: 'Egypt',
  },
  {
    id: '26',
    avatar: '/user.png',
    userName: 'Nour Hassan',
    email: 'nour.hassan@email.com',
    phone: '+201077889900',
    password: '123Qwe',
    role: 'traveler',
    companyId: null,
    status: 'active',
    createdAt: '2025-10-01',
    city: 'Luxor',
    country: 'Egypt',
  },
  {
    id: 'c1',
    avatar: '/assets/companies/company.png',
    userName: 'Red Sea Adventures',
    email: 'company@redsea.com',
    phone: '+201227375904',
    password: '123Qwe',
    role: 'company',
    companyId: '1',
    status: 'active',
    createdAt: '2024-01-15',
  },
  {
    id: 'c2',
    avatar: '/assets/companies/company.png',
    userName: 'Nile Heritage Tours',
    email: 'company@nileheritage.com',
    phone: '+201022334455',
    password: '123Qwe',
    role: 'company',
    companyId: '2',
    status: 'active',
    createdAt: '2024-02-10',
  },
  {
    id: 'c3',
    avatar: '/assets/companies/company.png',
    userName: 'Cairo Gate Travel',
    email: 'company@cairogate.com',
    phone: '+201033445566',
    password: '123Qwe',
    role: 'company',
    companyId: '3',
    status: 'active',
    createdAt: '2024-04-02',
  },
  {
    id: 'c5',
    avatar: '/assets/companies/company.png',
    userName: 'Haramain Umrah Co',
    email: 'company@haramain.com',
    phone: '+201055667788',
    password: '123Qwe',
    role: 'company',
    companyId: '5',
    status: 'active',
    createdAt: '2024-01-08',
  },
  {
    id: 'a1',
    avatar: '/user.png',
    userName: 'Safarny Admin',
    email: 'admin@safarny.com',
    phone: '+201000000000',
    password: '123Qwe',
    role: 'admin',
    companyId: null,
    status: 'active',
    createdAt: '2024-01-01',
    lastLoginAt: '2026-09-04',
  },
  {
    id: 'a2',
    avatar: '/user.png',
    userName: 'Operations Manager',
    email: 'ops@safarny.com',
    phone: '+201011122233',
    password: '123Qwe',
    role: 'admin',
    companyId: null,
    status: 'active',
    createdAt: '2024-06-15',
    lastLoginAt: '2026-09-02',
  },
];

function findByEmail(email) {
  return users.find((user) => user.email.toLowerCase() === String(email).toLowerCase());
}

function findById(id) {
  return users.find((user) => user.id === String(id));
}

function createUser({ userName, email, phone, password, role = 'traveler', companyId = null, status = 'active' }) {
  const user = {
    id: String(Date.now()),
    avatar: '/user.png',
    userName,
    email,
    phone: phone || '',
    password,
    role: ['company', 'admin'].includes(role) ? role : 'traveler',
    companyId: role === 'company' ? String(companyId) : null,
    status: status === 'suspended' ? 'suspended' : 'active',
    createdAt: new Date().toISOString().slice(0, 10),
  };
  users.push(user);
  return user;
}

function createAdminUser({ userName, email, phone, password }) {
  return createUser({ userName, email, phone, password, role: 'admin' });
}

function updateTraveler(id, payload = {}) {
  const user = findById(id);
  if (!user || user.role !== 'traveler') return { error: 'not_found' };

  const email = String(payload.email || user.email).trim().toLowerCase();
  if (!email) return { error: 'invalid_email' };
  const existing = findByEmail(email);
  if (existing && existing.id !== user.id) return { error: 'email_taken' };

  const userName = String(payload.userName || user.userName).trim();
  if (!userName) return { error: 'invalid_name' };

  user.userName = userName;
  user.email = email;
  user.phone = String(payload.phone || '').trim();
  user.city = String(payload.city || '').trim();
  user.country = String(payload.country || 'Egypt').trim();
  user.avatar = String(payload.avatar || user.avatar).trim() || '/user.png';
  user.status = payload.status === 'suspended' ? 'suspended' : 'active';

  const password = String(payload.password || '').trim();
  if (password && password.length >= 6) user.password = password;

  return { user };
}

function updateAdmin(id, payload = {}) {
  const user = findById(id);
  if (!user || user.role !== 'admin') return { error: 'not_found' };

  const email = String(payload.email || user.email).trim().toLowerCase();
  if (!email) return { error: 'invalid_email' };
  const existing = findByEmail(email);
  if (existing && existing.id !== user.id) return { error: 'email_taken' };

  const userName = String(payload.userName || user.userName).trim();
  if (!userName) return { error: 'invalid_name' };

  user.userName = userName;
  user.email = email;
  user.phone = String(payload.phone || '').trim();
  user.avatar = String(payload.avatar || user.avatar).trim() || '/user.png';
  user.status = payload.status === 'suspended' ? 'suspended' : 'active';

  const password = String(payload.password || '').trim();
  if (password && password.length >= 6) user.password = password;

  return { user };
}

function updateUser(id, patch) {
  const user = users.find((item) => item.id === id);
  if (!user) return null;
  Object.assign(user, patch);
  return user;
}

function filterUsers(filters = {}) {
  const q = String(filters.q || '').trim().toLowerCase();
  const role = String(filters.role || 'all');
  const status = String(filters.status || 'all');
  const excludeRole = String(filters.excludeRole || '');
  let items = [...users];
  if (excludeRole) items = items.filter((user) => user.role !== excludeRole);
  if (role !== 'all') items = items.filter((user) => user.role === role);
  if (status !== 'all') items = items.filter((user) => (user.status || 'active') === status);
  if (q) {
    items = items.filter((user) => {
      const haystack = `${user.userName} ${user.email} ${user.phone} ${user.id} ${user.city || ''}`.toLowerCase();
      return haystack.includes(q);
    });
  }
  const sort = String(filters.sort || 'newest');
  if (sort === 'name') items.sort((a, b) => a.userName.localeCompare(b.userName));
  else if (sort === 'active') items.sort((a, b) => String(b.lastActiveAt || b.createdAt).localeCompare(String(a.lastActiveAt || a.createdAt)));
  else items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return items;
}

function filterTravelers(filters = {}) {
  return filterUsers({ ...filters, role: 'traveler' });
}

function filterAdmins(filters = {}) {
  return filterUsers({ ...filters, role: 'admin' });
}

function setUserStatus(id, status) {
  const user = findById(id);
  if (!user) return null;
  user.status = status === 'suspended' ? 'suspended' : 'active';
  return user;
}

function setUserRole(id, role) {
  const user = findById(id);
  if (!user) return null;
  if (!['traveler', 'company', 'admin'].includes(role)) return null;
  user.role = role;
  if (role !== 'company') user.companyId = null;
  return user;
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    avatar: user.avatar,
    userName: user.userName,
    email: user.email,
    phone: user.phone,
    role: user.role || 'traveler',
    companyId: user.companyId || null,
    status: user.status || 'active',
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

function getUserStats() {
  return {
    total: users.length,
    travelers: users.filter((u) => u.role === 'traveler').length,
    companies: users.filter((u) => u.role === 'company').length,
    admins: users.filter((u) => u.role === 'admin').length,
    suspended: users.filter((u) => u.status === 'suspended').length,
    active: users.filter((u) => (u.status || 'active') === 'active').length,
  };
}

function paginateList(items, page = 1, perPage = 15) {
  const safePerPage = Math.min(50, Math.max(10, Number(perPage) || 15));
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

module.exports = {
  users,
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
  publicUser,
  postLoginPath,
  getUserStats,
  paginateList,
};
