const {
  publicUser,
  postLoginPath,
  findByEmail,
  findById,
  createUser,
  updateUser,
  verifyCredentials,
} = require('../services/users');
const { issueResetToken, consumeResetToken, verifyResetToken } = require('../services/password-reset');
const { wantsJson, regenerateSession } = require('../middleware/auth');
const {
  companyDocsUpload,
  DOC_FIELDS,
  fileFromField,
  finalizeUploadedDocs,
  removeUploadedFiles,
  uploadErrorMessage,
} = require('../lib/company-docs');

async function signIn(req, res) {
  const { email, password, redirect } = req.body;
  const user = await verifyCredentials(email, password);
  if (!user) {
    if (wantsJson(req)) return res.status(401).json({ ok: false, message: 'Invalid email or password' });
    req.session.flash = { type: 'error', message: 'Invalid email or password' };
    return res.redirect('/?signin=1');
  }
  if (user.status === 'suspended') {
    if (wantsJson(req)) {
      return res.status(403).json({ ok: false, message: 'Your account has been suspended.' });
    }
    req.session.flash = { type: 'error', message: 'Your account has been suspended.' };
    return res.redirect('/?signin=1');
  }
  await updateUser(user.id, { lastLoginAt: new Date(), lastActiveAt: new Date() });
  await regenerateSession(req, {
    user: publicUser(user),
    favorites: user.traveler?.favoriteTripIds || [],
    lang: user.traveler?.language || req.session.lang || 'en',
  });
  const nextPath = postLoginPath(req.session.user, redirect);
  if (wantsJson(req)) return res.json({ ok: true, user: req.session.user, redirect: nextPath });
  res.redirect(nextPath);
}

async function signUp(req, res) {
  const { fullName, email, password, phone } = req.body;
  if (await findByEmail(email)) {
    if (wantsJson(req)) {
      return res.status(409).json({ ok: false, message: 'Account already exists', view: 'accountExists' });
    }
    req.session.flash = { type: 'error', message: 'Account already exists' };
    return res.redirect('/?signin=1');
  }
  const user = await createUser({
    userName: fullName,
    email,
    phone,
    password,
  });
  await regenerateSession(req, { user: publicUser(user), favorites: [] });
  if (wantsJson(req)) return res.json({ ok: true, user: req.session.user });
  res.redirect('/');
}

function signUpCompany(req, res) {
  companyDocsUpload.fields(DOC_FIELDS)(req, res, async (uploadError) => {
    const fail = (message) => {
      removeUploadedFiles(req);
      req.session.formDraft = {
        title: String(req.body?.title || '').trim(),
        location: String(req.body?.location || '').trim(),
        description: String(req.body?.description || '').trim(),
        contactNumber: String(req.body?.contactNumber || req.body?.phone || '').trim(),
        userName: String(req.body?.userName || '').trim(),
        email: String(req.body?.email || '').trim().toLowerCase(),
      };
      req.session.flash = { type: 'error', message };
      return res.redirect('/register/company');
    };

    if (uploadError) return fail(uploadErrorMessage(uploadError));

    try {
      const companyService = require('../services/companies');
      const title = String(req.body.title || '').trim();
      const location = String(req.body.location || '').trim();
      const description = String(req.body.description || '').trim();
      const contactNumber = String(req.body.contactNumber || req.body.phone || '').trim();
      const userName = String(req.body.userName || '').trim();
      const email = String(req.body.email || '').trim().toLowerCase();
      const password = String(req.body.password || '');

      if (req.session.user) {
        return fail('Please sign out before creating a company account.');
      }
      if (!title || !location || !userName || !email || !password) {
        return fail('Please fill in company name, location, contact name, email, and password.');
      }
      if (password.length < 6) {
        return fail('Password must be at least 6 characters.');
      }
      if (!fileFromField(req, 'commercialRegister') || !fileFromField(req, 'taxCard')) {
        return fail('Please upload your commercial register and tax card.');
      }
      if (await findByEmail(email)) {
        return fail('An account with this email already exists. Please sign in.');
      }

      const company = await companyService.createCompany({
        title,
        location,
        description,
        contactNumber,
        verification: 'pending',
      });
      if (!company) {
        return fail('Could not create the company. Please try again.');
      }

      const verificationDocs = finalizeUploadedDocs(req, company.id);
      await companyService.updateCompany(company.id, { verificationDocs });

      const user = await createUser({
        userName,
        email,
        phone: contactNumber,
        password,
        role: 'company',
        companyId: company.id,
      });
      await regenerateSession(req, { user: publicUser(user), favorites: [] });
      req.session.flash = {
        type: 'success',
        message: 'Welcome to Safarny. Your documents are under review — you can set up trips while we verify your account.',
      };
      if (wantsJson(req)) return res.json({ ok: true, user: req.session.user, redirect: '/company/dashboard' });
      res.redirect('/company/dashboard');
    } catch (err) {
      console.error(err);
      return fail('Could not create the company. Please try again.');
    }
  });
}

async function signOut(req, res) {
  req.session.destroy(() => {
    if (wantsJson(req)) return res.json({ ok: true });
    res.redirect('/');
  });
}

async function forgotPassword(req, res) {
  const email = String(req.body.email || '').trim().toLowerCase();
  await issueResetToken(email);
  req.session.resetEmail = email;
  if (wantsJson(req)) return res.json({ ok: true });
  req.session.flash = { type: 'success', message: 'We sent a reset code to your email.' };
  res.redirect('/');
}

async function verifyReset(req, res) {
  const email = String(req.body.email || req.session.resetEmail || '').trim().toLowerCase();
  const otp = String(req.body.otp || '').trim();
  const verified = email && otp ? await verifyResetToken(email, otp) : null;
  if (!verified) {
    if (wantsJson(req)) return res.status(400).json({ ok: false, message: 'Invalid or expired reset code.' });
    req.session.flash = { type: 'error', message: 'Invalid or expired reset code.' };
    return res.redirect('/?signin=1');
  }
  req.session.resetEmail = email;
  req.session.resetOtp = otp;
  if (wantsJson(req)) return res.json({ ok: true });
  res.redirect('/');
}

async function resetPassword(req, res) {
  const email = String(req.body.email || req.session.resetEmail || '').trim().toLowerCase();
  const otp = String(req.body.otp || req.session.resetOtp || '').trim();
  const password = req.body.password;
  const result = await consumeResetToken(email, otp, password);
  if (!result.ok) {
    if (wantsJson(req)) return res.status(400).json({ ok: false, message: 'Invalid or expired reset code.' });
    req.session.flash = { type: 'error', message: 'Invalid or expired reset code.' };
    return res.redirect('/?signin=1');
  }
  delete req.session.resetOtp;
  delete req.session.resetEmail;
  if (wantsJson(req)) return res.json({ ok: true });
  req.session.flash = { type: 'success', message: 'Password reset successfully.' };
  res.redirect('/');
}

async function updateProfile(req, res) {
  if (!req.session.user) return res.status(401).json({ ok: false });
  const { fullName, email, phone } = req.body;
  const updated = await updateUser(req.session.user.id, {
    userName: fullName,
    email,
    phone,
  });
  req.session.user = publicUser(updated);
  if (wantsJson(req)) return res.json({ ok: true, user: req.session.user });
  res.redirect('/profile');
}

async function changePassword(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ ok: false, message: 'Please sign in to continue.' });
  }
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const user = await findById(req.session.user.id, { withPassword: true });
  const { comparePassword } = require('../lib/password');
  if (!user || !(await comparePassword(currentPassword, user.passwordHash))) {
    return res.status(400).json({ ok: false, message: 'Current password is incorrect.' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ ok: false, message: 'New password must be at least 6 characters.' });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ ok: false, message: 'Passwords do not match.' });
  }
  await updateUser(user.id, { password: newPassword });
  if (wantsJson(req)) return res.json({ ok: true, message: 'Password updated successfully.' });
  req.session.flash = { type: 'success', message: 'Password updated successfully.' };
  if (req.session.user.role === 'admin') return res.redirect('/admin/settings');
  res.redirect(req.session.user.role === 'company' ? '/company/settings' : '/settings');
}

async function updateAvatar(req, res) {
  if (!req.session.user) {
    return res.status(401).json({ ok: false, message: 'Please sign in to continue.' });
  }
  const { avatar } = req.body;
  if (!avatar || !String(avatar).startsWith('data:image/')) {
    return res.status(400).json({ ok: false, message: 'Please choose a valid image file.' });
  }
  const updated = await updateUser(req.session.user.id, { avatar: String(avatar) });
  req.session.user = publicUser(updated);
  if (wantsJson(req)) return res.json({ ok: true, user: req.session.user });
  res.redirect('/settings');
}

module.exports = {
  signIn,
  signUp,
  signUpCompany,
  signOut,
  forgotPassword,
  verifyReset,
  resetPassword,
  updateProfile,
  changePassword,
  updateAvatar,
};
