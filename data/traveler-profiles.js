const travelerProfiles = {
  '21': {
    favoriteTripIds: ['1', '3', '5', '7'],
    preferredDestinations: ['Sharm El Sheikh', 'Dahab', 'Marsa Alam'],
    language: 'en',
    notifications: { email: true, sms: true, push: false },
    lastActiveAt: '2026-08-28',
    notes: 'Frequent Red Sea traveler. Prefers double rooms and morning departures.',
    activity: [
      { type: 'booking', label: 'Booked Sharm El Sheikh Getaway', at: '2026-08-01', meta: 'T001' },
      { type: 'favorite', label: 'Saved Dahab Blue Hole Week to favorites', at: '2026-08-04' },
      { type: 'review', label: 'Left a 5-star review for Sharm El Sheikh Getaway', at: '2026-07-01' },
      { type: 'booking', label: 'Booked Hurghada House Reef Week', at: '2026-08-05', meta: 'B001' },
      { type: 'booking', label: 'Booked Marsa Alam Reef Escape', at: '2026-08-10', meta: 'B012' },
      { type: 'ticket', label: 'Opened support ticket TKT-1042', at: '2026-08-26' },
    ],
  },
  '22': {
    favoriteTripIds: ['2', '4'],
    preferredDestinations: ['Luxor', 'Aswan'],
    language: 'ar',
    notifications: { email: true, sms: false, push: true },
    lastActiveAt: '2026-08-20',
    notes: '',
    activity: [
      { type: 'booking', label: 'Booked Sharm El Sheikh Getaway', at: '2026-08-12', meta: 'B002' },
      { type: 'favorite', label: 'Saved Siwa Oasis Escape', at: '2026-08-01' },
      { type: 'booking', label: 'Booked Alexandria Corniche Weekend', at: '2026-07-30', meta: 'B007' },
    ],
  },
  '23': {
    favoriteTripIds: ['6', '9'],
    preferredDestinations: ['Alexandria', 'Cairo'],
    language: 'en',
    notifications: { email: true, sms: true, push: true },
    lastActiveAt: '2026-08-15',
    notes: 'Weekend traveler from Cairo.',
    activity: [
      { type: 'booking', label: 'Booked Luxor Ancient Tour', at: '2026-07-22', meta: 'B004' },
      { type: 'review', label: 'Left a 4-star review for Alexandria Corniche Weekend', at: '2026-07-20' },
    ],
  },
  '24': {
    favoriteTripIds: ['1', '8'],
    preferredDestinations: ['Hurghada', 'El Gouna'],
    language: 'ar',
    notifications: { email: false, sms: true, push: false },
    lastActiveAt: '2026-08-05',
    notes: '',
    activity: [
      { type: 'booking', label: 'Booked El Gouna Beach Break', at: '2026-07-12', meta: 'B011' },
      { type: 'ticket', label: 'Opened refund request TKT-1025', at: '2026-08-18' },
    ],
  },
};

function getTravelerProfile(userId) {
  return travelerProfiles[String(userId)] || {
    favoriteTripIds: [],
    preferredDestinations: [],
    language: 'en',
    notifications: { email: true, sms: false, push: false },
    lastActiveAt: null,
    notes: '',
    activity: [],
  };
}

function updateTravelerProfile(userId, payload = {}) {
  const profile = getTravelerProfile(userId);
  const preferredDestinations = String(payload.preferredDestinations || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const favoriteTripIds = String(payload.favoriteTripIds || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  travelerProfiles[String(userId)] = {
    ...profile,
    language: payload.language === 'ar' ? 'ar' : 'en',
    preferredDestinations,
    favoriteTripIds,
    notifications: {
      email: payload.notifyEmail === 'on' || payload.notifyEmail === true,
      sms: payload.notifySms === 'on' || payload.notifySms === true,
      push: payload.notifyPush === 'on' || payload.notifyPush === true,
    },
    notes: String(payload.notes || ''),
    lastActiveAt: profile.lastActiveAt || new Date().toISOString().slice(0, 10),
  };

  return travelerProfiles[String(userId)];
}

function setTravelerNotes(userId, notes) {
  const profile = getTravelerProfile(userId);
  travelerProfiles[String(userId)] = { ...profile, notes: String(notes || '') };
  return travelerProfiles[String(userId)];
}

module.exports = {
  travelerProfiles,
  getTravelerProfile,
  updateTravelerProfile,
  setTravelerNotes,
};
