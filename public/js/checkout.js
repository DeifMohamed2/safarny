(function () {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => [...root.querySelectorAll(sel)];

  function formatPrice(n) {
    return Number(n || 0).toLocaleString();
  }

  function payoutForMethod(method, payouts, lang) {
    const instructions = lang === 'ar' ? payouts.instructionsAr : payouts.instructionsEn;
    const mobileWalletLines = [
      payouts.vodafoneCash && `Vodafone Cash: ${payouts.vodafoneCash}`,
      payouts.orangeCash && `Orange Cash: ${payouts.orangeCash}`,
      payouts.etisalatCash && `Etisalat Cash: ${payouts.etisalatCash}`,
    ].filter(Boolean);
    const map = {
      instapay: {
        title: 'InstaPay',
        lines: [payouts.instapayIpa && `IPA: ${payouts.instapayIpa}`, payouts.instapayMobile && `Mobile: ${payouts.instapayMobile}`].filter(Boolean),
      },
      mobile_wallet: { title: 'Mobile wallet', lines: mobileWalletLines },
      vodafone_cash: { title: 'Mobile wallet', lines: mobileWalletLines },
      orange_cash: { title: 'Mobile wallet', lines: mobileWalletLines },
      etisalat_cash: { title: 'Mobile wallet', lines: mobileWalletLines },
    };
    const info = map[method] || { title: 'Transfer', lines: [] };
    return { ...info, instructions: instructions || '' };
  }

  function initCheckout() {
    const root = qs('[data-checkout]');
    if (!root) return;
    let payouts = {};
    try {
      payouts = JSON.parse(root.dataset.payouts || '{}');
    } catch (e) {
      payouts = {};
    }

    const dateSelect = qs('#checkout-date-select');
    const dateHidden = qs('#checkout-date-id');
    const roomTypeSelect = qs('#checkout-room-type');
    const roomsInput = qs('#checkout-rooms');
    const plusBtn = qs('#checkout-rooms-plus');
    const minusBtn = qs('[data-step="-1"]', root);
    const submitBtn = qs('.checkout-submit', root);
    const hintEl = qs('#checkout-room-hint');
    const totalEl = qs('#checkout-summary-total');
    const roomsEl = qs('#checkout-summary-rooms');
    const guestsEl = qs('#checkout-summary-guests');
    const priceEl = qs('#checkout-summary-price');
    const typeEl = qs('#checkout-summary-type');
    const lang = document.documentElement.lang || 'en';
    const hintTemplate = lang === 'ar'
      ? '{room} · تسع {n} · حتى {max} غرف · {price} ج.م للغرفة'
      : '{room} · sleeps {n} · up to {max} rooms · {price} EGP per room';
    const typeNames = {
      single: lang === 'ar' ? 'فردية' : 'Single',
      double: lang === 'ar' ? 'مزدوجة' : 'Double',
      triple: lang === 'ar' ? 'ثلاثية' : 'Triple',
      quad: lang === 'ar' ? 'رباعية' : 'Quadruple',
    };

    let dates = [];
    try {
      dates = JSON.parse(root.dataset.dates || '[]');
    } catch (e) {
      dates = [];
    }

    function selectedDate() {
      return dates.find((item) => item.id === dateSelect?.value) || dates[0] || { rooms: [] };
    }

    function selectedRoom() {
      const date = selectedDate();
      const rooms = date.rooms || [];
      const typeId = roomTypeSelect?.value || root.dataset.roomType;
      return rooms.find((item) => item.type === typeId) || rooms[0] || {
        type: typeId,
        occupancy: Number(root.dataset.occupancy || 2),
        price: Number(root.dataset.roomPrice || root.dataset.perPerson || 0),
        maxRooms: Number(roomsInput?.dataset.maxRooms || 1),
      };
    }

    function selectedMaxRooms() {
      return Math.max(0, Number(selectedRoom().maxRooms || selectedRoom().availableRooms || 0));
    }

    function guestCountForRooms(rooms) {
      const room = selectedRoom();
      const occupancy = Math.max(1, Number(room.occupancy) || 1);
      return Math.max(1, Number(rooms) || 1) * occupancy;
    }

    function fillRoomTypes() {
      if (!roomTypeSelect) return;
      const date = selectedDate();
      const rooms = date.rooms || [];
      const current = roomTypeSelect.value || root.dataset.roomType;
      roomTypeSelect.innerHTML = rooms.map((item) => {
        const label = typeNames[item.type] || item.type;
        return `<option value="${item.type}">${label}</option>`;
      }).join('');
      if (rooms.some((item) => item.type === current)) roomTypeSelect.value = current;
      else if (rooms[0]) roomTypeSelect.value = rooms[0].type;
    }

    function updateRoomCap() {
      const maxRooms = selectedMaxRooms();
      const room = selectedRoom();
      if (roomsInput) {
        roomsInput.max = String(Math.max(1, maxRooms));
        roomsInput.dataset.maxRooms = String(maxRooms);
        if (maxRooms <= 0) {
          roomsInput.value = '1';
          roomsInput.disabled = true;
        } else {
          roomsInput.disabled = false;
          const current = Math.max(1, Number(roomsInput.value) || 1);
          roomsInput.value = String(Math.min(current, maxRooms));
        }
      }
      if (plusBtn) plusBtn.disabled = maxRooms <= 0 || Number(roomsInput?.value || 1) >= maxRooms;
      if (minusBtn) minusBtn.disabled = maxRooms <= 0 || Number(roomsInput?.value || 1) <= 1;
      updateSubmitState();
      if (hintEl) {
        hintEl.textContent = hintTemplate
          .replace('{room}', typeNames[room.type] || root.dataset.roomLabel || 'Room')
          .replace('{n}', String(room.occupancy || 1))
          .replace('{max}', String(maxRooms || 0))
          .replace('{price}', formatPrice(room.price || 0));
      }
    }

    function syncTotals() {
      const rooms = Math.max(1, Number(roomsInput?.value) || 1);
      const guests = guestCountForRooms(rooms);
      const room = selectedRoom();
      const roomPrice = Number(room.price) || 0;
      if (roomsEl) roomsEl.textContent = String(rooms);
      if (guestsEl) guestsEl.textContent = String(guests);
      if (priceEl) priceEl.textContent = formatPrice(roomPrice);
      if (typeEl) typeEl.textContent = typeNames[room.type] || room.type;
      if (totalEl) totalEl.textContent = formatPrice(roomPrice * rooms);
      if (plusBtn) plusBtn.disabled = rooms >= selectedMaxRooms();
      if (minusBtn) minusBtn.disabled = rooms <= 1;
    }

    dateSelect?.addEventListener('change', () => {
      if (dateHidden) dateHidden.value = dateSelect.value;
      fillRoomTypes();
      updateRoomCap();
      syncTotals();
    });

    roomTypeSelect?.addEventListener('change', () => {
      updateRoomCap();
      syncTotals();
    });

    qsa('[data-step]', root).forEach((btn) => {
      btn.addEventListener('click', () => {
        const step = Number(btn.dataset.step) || 0;
        const maxRooms = selectedMaxRooms();
        const next = Math.max(1, Math.min(maxRooms, (Number(roomsInput.value) || 1) + step));
        roomsInput.value = String(next);
        syncTotals();
      });
    });
    roomsInput?.addEventListener('input', () => {
      const maxRooms = selectedMaxRooms();
      const next = Math.max(1, Math.min(maxRooms, Number(roomsInput.value) || 1));
      roomsInput.value = String(next);
      syncTotals();
    });

    function renderPayout(method) {
      const panel = qs('#checkout-payout-panel');
      const title = qs('#checkout-payout-title');
      const lines = qs('#checkout-payout-lines');
      const note = qs('#checkout-payout-note');
      const info = payoutForMethod(method, payouts, document.documentElement.lang);
      if (title) title.textContent = info.title;
      if (lines) {
        lines.innerHTML = info.lines.map((line) => `<li>${line}</li>`).join('');
      }
      if (note) note.textContent = info.instructions;
      panel?.classList.add('is-visible');
    }

    qsa('.checkout-method input[type="radio"]', root).forEach((input) => {
      input.addEventListener('change', () => {
        qsa('.checkout-method', root).forEach((el) => el.classList.toggle('is-selected', qs('input', el)?.checked));
        if (input.checked) renderPayout(input.value);
      });
    });

    const checked = qs('.checkout-method input[type="radio"]:checked', root);
    if (checked) renderPayout(checked.value);

    const proofInput = qs('#checkout-proof');
    const proofLabel = qs('#checkout-proof-label');
    const dropzone = qs('#checkout-dropzone');
    function updateSubmitState() {
      if (!submitBtn) return;
      const hasProof = Boolean(proofInput?.files?.[0]);
      const bookable = selectedMaxRooms() > 0;
      submitBtn.disabled = !bookable || !hasProof;
    }

    const proofTitle = qs('.checkout-dropzone-title', root);

    proofInput?.addEventListener('change', () => {
      const file = proofInput.files?.[0];
      if (proofLabel) {
        proofLabel.textContent = file
          ? file.name
          : (lang === 'ar' ? 'لقطة شاشة أو PDF (بحد أقصى 10 ميجابايت)' : 'Screenshot or PDF (max 10MB)');
      }
      if (proofTitle) {
        proofTitle.textContent = file
          ? (lang === 'ar' ? 'تم رفع الإثبات' : 'Proof uploaded')
          : (lang === 'ar' ? 'رفع إثبات الدفع' : 'Upload payment proof');
      }
      dropzone?.classList.toggle('has-file', Boolean(file));
      updateSubmitState();
    });

    qsa('[data-scroll-reveal]', root).forEach((el, index) => {
      window.setTimeout(() => el.classList.add('is-revealed'), 80 + index * 60);
    });

    fillRoomTypes();
    updateRoomCap();
    syncTotals();
    updateSubmitState();
  }

  document.addEventListener('DOMContentLoaded', initCheckout);
})();
