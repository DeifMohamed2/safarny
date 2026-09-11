(function () {
  'use strict';

  const ROOM_DEFS = [
    { id: 'single', occupancy: 1, en: 'Single', ar: 'فردية' },
    { id: 'double', occupancy: 2, en: 'Double', ar: 'مزدوجة' },
    { id: 'triple', occupancy: 3, en: 'Triple', ar: 'ثلاثية' },
    { id: 'quad', occupancy: 4, en: 'Quadruple', ar: 'رباعية' },
  ];

  function qs(sel, root) {
    return (root || document).querySelector(sel);
  }

  function qsa(sel, root) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function parseJson(value, fallback) {
    if (!value) return fallback;
    const raw = String(value).trim();
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function readJsonField(form, selector) {
    const el = qs(selector, form);
    if (!el) return [];
    return parseJson(el.value || el.textContent, []);
  }

  function writeJsonField(form, selector, data) {
    const el = qs(selector, form);
    if (!el) return;
    const json = JSON.stringify(data);
    if ('value' in el) el.value = json;
    else el.textContent = json;
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;');
  }

  function isRtl() {
    return document.documentElement.lang === 'ar';
  }

  function labels() {
    const ar = isRtl();
    return {
      startDate: ar ? 'تاريخ البداية' : 'Start date',
      endDate: ar ? 'تاريخ النهاية' : 'End date',
      price: ar ? 'السعر / شخص' : 'Price / person',
      rooms: ar ? 'الغرف' : 'Rooms',
      remaining: ar ? 'المتبقية' : 'Remaining',
      sleeps: ar ? 'تسع {n}' : 'sleeps {n}',
      noDates: ar ? 'لا توجد تواريخ بعد. أضف أول موعد مغادرة.' : 'No travel dates yet. Add your first departure.',
      noStays: ar ? 'أضف إقامة مثل ١–٥ في مكة.' : 'Add a stay like 1–5 in Makkah.',
      noActivities: ar ? 'أضف نشاطاً داخل أيام الإقامة.' : 'Add an activity on a day inside a stay.',
      stay: ar ? 'إقامة' : 'Stay',
      activity: ar ? 'نشاط' : 'Activity',
      fromDay: ar ? 'من يوم' : 'From day',
      toDay: ar ? 'إلى يوم' : 'To day',
      day: ar ? 'اليوم' : 'Day',
      city: ar ? 'المدينة' : 'City',
      titleEn: 'Title (EN)',
      titleAr: 'Title (AR)',
      descEn: 'Description (EN)',
      descAr: 'Description (AR)',
      perDateHint: ar ? 'يُحدَّد السعر في كل تاريخ' : 'Set on each date',
      locations: [
        { id: 'makkah', label: ar ? 'مكة' : 'Makkah' },
        { id: 'madinah', label: ar ? 'المدينة' : 'Madinah' },
        { id: 'jeddah', label: ar ? 'جدة' : 'Jeddah' },
      ],
    };
  }

  function roomName(def) {
    return isRtl() ? def.ar : def.en;
  }

  function enabledTypes(roomTypes) {
    return ROOM_DEFS.map((def) => {
      const existing = roomTypes.find((item) => item.type === def.id);
      if (!existing) return null;
      return {
        type: def.id,
        occupancy: def.occupancy,
        price: Number(existing.price) || 0,
        totalRooms: Number(existing.totalRooms) || 0,
        availableRooms: Number(existing.availableRooms ?? existing.totalRooms) || 0,
      };
    }).filter(Boolean);
  }

  function initRoomTypesEditor(form, onChange) {
    const grid = qs('[data-room-type-grid]', form);
    const modeWrap = qs('[data-price-mode]', form);
    const modeInput = qs('[data-price-mode-input]', form);
    if (!grid) return null;

    const inputCls = form.dataset.formTheme === 'admin' ? 'admin-input' : 'company-input';
    let roomTypes = readJsonField(form, '[data-room-types-input]');
    if (!roomTypes.length) {
      roomTypes = [{ type: 'double', occupancy: 2, price: 0, totalRooms: 0, availableRooms: 0 }];
    }
    let priceMode = (modeInput?.value === 'per-date') ? 'per-date' : 'shared';

    const render = () => {
      const copy = labels();
      grid.innerHTML = ROOM_DEFS.map((def) => {
        const current = roomTypes.find((item) => item.type === def.id);
        const on = Boolean(current);
        const price = current?.price || '';
        const rooms = current?.totalRooms || '';
        return `
          <article class="trip-room-type-card ${on ? 'is-on' : ''}" data-room-type="${def.id}">
            <label class="trip-room-type-toggle">
              <input type="checkbox" data-room-enabled ${on ? 'checked' : ''} />
              <span>
                <strong>${escapeHtml(roomName(def))}</strong>
                <em>${copy.sleeps.replace('{n}', String(def.occupancy))}</em>
              </span>
            </label>
            <div class="trip-room-type-fields" ${on ? '' : 'hidden'}>
              <label class="trip-form-field" data-shared-price-field ${priceMode === 'per-date' ? 'hidden' : ''}>
                <span>${copy.price} (EGP)</span>
                <input type="number" min="0" class="${inputCls}" data-room-price value="${price}" ${on ? '' : 'disabled'} />
              </label>
              <p class="trip-form-field-hint" data-per-date-hint ${priceMode === 'per-date' ? '' : 'hidden'}>${copy.perDateHint}</p>
              <label class="trip-form-field">
                <span>${copy.rooms}</span>
                <input type="number" min="0" class="${inputCls}" data-room-count value="${rooms}" ${on ? '' : 'disabled'} />
              </label>
            </div>
          </article>`;
      }).join('');

      qsa('[data-price-mode] label', form).forEach((label) => {
        const input = qs('input', label);
        label.classList.toggle('is-on', Boolean(input?.checked));
      });
    };

    const persist = () => {
      writeJsonField(form, '[data-room-types-input]', enabledTypes(roomTypes));
      if (modeInput) modeInput.value = priceMode;
    };

    const sync = () => {
      persist();
      render();
      onChange?.({ roomTypes: enabledTypes(roomTypes), priceMode });
    };

    grid.addEventListener('change', (event) => {
      const card = event.target.closest('[data-room-type]');
      if (!card) return;
      const typeId = card.dataset.roomType;
      const def = ROOM_DEFS.find((item) => item.id === typeId);
      if (event.target.matches('[data-room-enabled]')) {
        if (event.target.checked) {
          if (!roomTypes.some((item) => item.type === typeId)) {
            roomTypes.push({
              type: typeId,
              occupancy: def.occupancy,
              price: 0,
              totalRooms: 0,
              availableRooms: 0,
            });
          }
        } else {
          roomTypes = roomTypes.filter((item) => item.type !== typeId);
        }
        sync();
      }
    });

    grid.addEventListener('input', (event) => {
      const card = event.target.closest('[data-room-type]');
      if (!card) return;
      const current = roomTypes.find((item) => item.type === card.dataset.roomType);
      if (!current) return;
      if (event.target.matches('[data-room-price]')) {
        current.price = Number(event.target.value) || 0;
      }
      if (event.target.matches('[data-room-count]')) {
        const count = Number(event.target.value) || 0;
        current.totalRooms = count;
        current.availableRooms = count;
      }
      persist();
      onChange?.({ roomTypes: enabledTypes(roomTypes), priceMode });
    });

    modeWrap?.addEventListener('change', (event) => {
      if (!event.target.matches('input[name="priceModeUi"]')) return;
      priceMode = event.target.value === 'per-date' ? 'per-date' : 'shared';
      sync();
    });

    persist();
    render();

    return {
      getState() {
        return { roomTypes: enabledTypes(roomTypes), priceMode };
      },
    };
  }

  function roomsMarkup(item, enabled, priceMode, inputCls, copy) {
    if (!enabled.length) return '';
    return `
      <div class="trip-date-rooms">
        ${enabled
          .map((type) => {
            const row = (item.rooms || []).find((entry) => entry.type === type.type) || type;
            return `
              <div class="trip-date-room-row" data-room-row="${type.type}">
                <span class="trip-date-room-name">${escapeHtml(roomName(ROOM_DEFS.find((d) => d.id === type.type)))}</span>
                <label class="trip-form-field">
                  <span>${copy.rooms}</span>
                  <input type="number" min="0" class="${inputCls}" data-date-room-field="totalRooms" value="${row.totalRooms ?? ''}" />
                </label>
                <label class="trip-form-field">
                  <span>${copy.remaining}</span>
                  <input type="number" min="0" class="${inputCls}" data-date-room-field="availableRooms" value="${row.availableRooms ?? row.totalRooms ?? ''}" />
                </label>
                ${
                  priceMode === 'per-date'
                    ? `<label class="trip-form-field">
                        <span>${copy.price}</span>
                        <input type="number" min="0" class="${inputCls}" data-date-room-field="price" value="${row.price ?? type.price ?? ''}" />
                      </label>`
                    : ''
                }
              </div>`;
          })
          .join('')}
      </div>`;
  }

  function initTravelDatesEditor(form, getRoomState) {
    const list = qs('[data-travel-dates-list]', form);
    const field = '[data-travel-dates-input]';
    if (!list || !qs(field, form)) return null;

    const inputCls = form.dataset.formTheme === 'admin' ? 'admin-input' : 'company-input';
    let dates = readJsonField(form, field);

    function applyRoomState(nextDates = dates) {
      const { roomTypes, priceMode } = getRoomState();
      return nextDates.map((item) => {
        const rooms = roomTypes.map((type) => {
          const prev = (item.rooms || []).find((row) => row.type === type.type) || {};
          return {
            type: type.type,
            occupancy: type.occupancy,
            totalRooms: Number(prev.totalRooms ?? type.totalRooms) || 0,
            availableRooms: Number(prev.availableRooms ?? prev.totalRooms ?? type.availableRooms ?? type.totalRooms) || 0,
            price: priceMode === 'per-date'
              ? (Number(prev.price) || Number(type.price) || 0)
              : (Number(type.price) || 0),
          };
        });
        return { ...item, rooms };
      });
    }

    const render = () => {
      const copy = labels();
      const { roomTypes, priceMode } = getRoomState();
      if (!dates.length) {
        list.innerHTML = `<p class="trip-form-empty">${copy.noDates}</p>`;
        return;
      }

      list.innerHTML = dates
        .map(
          (item, index) => `
        <article class="trip-date-editor-card" data-index="${index}">
          <div class="trip-date-editor-head">
            <span class="trip-date-editor-badge">#${index + 1}</span>
            <button type="button" class="trip-date-editor-remove" data-remove-date="${index}" aria-label="Remove date">×</button>
          </div>
          <div class="trip-date-editor-grid">
            <label class="trip-form-field">
              <span>${copy.startDate}</span>
              <input type="date" class="${inputCls}" data-date-field="startDate" value="${escapeHtml(item.startDate)}" />
            </label>
            <label class="trip-form-field">
              <span>${copy.endDate}</span>
              <input type="date" class="${inputCls}" data-date-field="endDate" value="${escapeHtml(item.endDate)}" />
            </label>
          </div>
          ${roomsMarkup(item, roomTypes, priceMode, inputCls, copy)}
        </article>`
        )
        .join('');
    };

    const persist = () => writeJsonField(form, field, dates);

    const sync = () => {
      dates = applyRoomState(dates);
      persist();
      render();
    };

    dates = applyRoomState(dates);
    persist();
    render();

    return {
      add() {
        const { roomTypes, priceMode } = getRoomState();
        dates.push({
          id: `td-${Date.now()}`,
          startDate: '',
          endDate: '',
          rooms: roomTypes.map((type) => ({
            type: type.type,
            occupancy: type.occupancy,
            totalRooms: Number(type.totalRooms) || 0,
            availableRooms: Number(type.availableRooms || type.totalRooms) || 0,
            price: Number(type.price) || 0,
            priceMode,
          })),
        });
        persist();
        render();
      },
      remove(index) {
        dates.splice(index, 1);
        persist();
        render();
      },
      update(index, fieldName, value) {
        if (!dates[index]) return;
        dates[index][fieldName] = value;
        persist();
      },
      updateRoom(index, typeId, fieldName, value) {
        if (!dates[index]) return;
        dates[index].rooms = dates[index].rooms || [];
        let row = dates[index].rooms.find((item) => item.type === typeId);
        if (!row) {
          const def = ROOM_DEFS.find((item) => item.id === typeId);
          row = { type: typeId, occupancy: def?.occupancy || 2, price: 0, totalRooms: 0, availableRooms: 0 };
          dates[index].rooms.push(row);
        }
        row[fieldName] = value;
        if (fieldName === 'totalRooms' && (row.availableRooms == null || row.availableRooms > value)) {
          row.availableRooms = value;
        }
        persist();
      },
      refreshFromRooms() {
        sync();
      },
    };
  }

  function locationOptions(selected, copy) {
    return copy.locations
      .map((loc) => `<option value="${loc.id}" ${selected === loc.id ? 'selected' : ''}>${escapeHtml(loc.label)}</option>`)
      .join('');
  }

  function normalizeItinerary(raw) {
    return (Array.isArray(raw) ? raw : []).map((item, index) => {
      const kind = String(item.kind || '').toLowerCase() === 'stay' ? 'stay' : 'activity';
      const dayFrom = Math.max(1, Number(item.dayFrom ?? item.day) || index + 1);
      const dayTo = Math.max(dayFrom, Number(item.dayTo ?? item.day) || dayFrom);
      return {
        kind,
        day: dayFrom,
        dayFrom,
        dayTo,
        location: String(item.location || '').trim().toLowerCase(),
        title: item.title || '',
        titleAr: item.titleAr || '',
        description: item.description || '',
        descriptionAr: item.descriptionAr || '',
      };
    });
  }

  function typicalUmrahPlan() {
    return [
      { kind: 'stay', day: 1, dayFrom: 1, dayTo: 5, location: 'makkah', title: 'Stay in Makkah', titleAr: 'الإقامة في مكة', description: 'Hotel near Al-Masjid Al-Haram for Umrah and daily prayers.', descriptionAr: 'فندق قرب المسجد الحرام للعمرة والصلوات اليومية.' },
      { kind: 'activity', day: 1, dayFrom: 1, dayTo: 1, location: 'makkah', title: 'Arrival & first Umrah', titleAr: 'الوصول والعمرة الأولى', description: 'Airport reception, hotel check-in, and performing Umrah with a guide.', descriptionAr: 'الاستقبال من المطار، دخول الفندق، وأداء العمرة مع المرشد.' },
      { kind: 'activity', day: 3, dayFrom: 3, dayTo: 3, location: 'makkah', title: 'Makkah ziyarat', titleAr: 'زيارات مكة', description: 'Visit historical sites around Makkah between prayers.', descriptionAr: 'زيارة المعالم التاريخية حول مكة بين الصلوات.' },
      { kind: 'stay', day: 6, dayFrom: 6, dayTo: 10, location: 'madinah', title: 'Stay in Madinah', titleAr: 'الإقامة في المدينة', description: 'Transfer to Madinah and stay near Al-Masjid An-Nabawi.', descriptionAr: 'الانتقال إلى المدينة والإقامة قرب المسجد النبوي.' },
      { kind: 'activity', day: 6, dayFrom: 6, dayTo: 6, location: 'madinah', title: 'Travel to Madinah', titleAr: 'الانتقال إلى المدينة', description: 'Coach transfer from Makkah to Madinah.', descriptionAr: 'انتقال بالحافلة من مكة إلى المدينة.' },
      { kind: 'activity', day: 7, dayFrom: 7, dayTo: 7, location: 'madinah', title: 'Prophet’s Mosque & Rawdah', titleAr: 'المسجد النبوي والروضة', description: 'Prayers in the Prophet’s Mosque and a Rawdah visit when available.', descriptionAr: 'الصلاة في المسجد النبوي وزيارة الروضة حسب التوفر.' },
    ];
  }

  function stayEditorCard(item, index, inputCls, textareaCls, copy) {
    return `
      <article class="trip-itinerary-editor-card is-stay" data-index="${index}">
        <div class="trip-itinerary-editor-head">
          <span class="trip-itinerary-editor-day">${copy.stay} · ${item.dayFrom || 1}–${item.dayTo || item.dayFrom || 1}</span>
          <button type="button" class="trip-date-editor-remove" data-remove-itinerary="${index}" aria-label="Remove stay">×</button>
        </div>
        <div class="trip-itinerary-editor-grid trip-itinerary-editor-grid--stay">
          <label class="trip-form-field">
            <span>${copy.fromDay}</span>
            <input type="number" min="1" class="${inputCls}" data-itinerary-field="dayFrom" value="${item.dayFrom || 1}" />
          </label>
          <label class="trip-form-field">
            <span>${copy.toDay}</span>
            <input type="number" min="1" class="${inputCls}" data-itinerary-field="dayTo" value="${item.dayTo || item.dayFrom || 1}" />
          </label>
          <label class="trip-form-field">
            <span>${copy.city}</span>
            <select class="${inputCls}" data-itinerary-field="location">${locationOptions(item.location, copy)}</select>
          </label>
          <label class="trip-form-field">
            <span>${copy.titleEn}</span>
            <input type="text" class="${inputCls}" data-itinerary-field="title" value="${escapeHtml(item.title)}" />
          </label>
          <label class="trip-form-field">
            <span>${copy.titleAr}</span>
            <input type="text" class="${inputCls}" dir="rtl" data-itinerary-field="titleAr" value="${escapeHtml(item.titleAr)}" />
          </label>
          <label class="trip-form-field trip-form-field--full">
            <span>${copy.descEn}</span>
            <textarea rows="2" class="${textareaCls}" data-itinerary-field="description">${item.description || ''}</textarea>
          </label>
          <label class="trip-form-field trip-form-field--full">
            <span>${copy.descAr}</span>
            <textarea rows="2" class="${textareaCls}" dir="rtl" data-itinerary-field="descriptionAr">${item.descriptionAr || ''}</textarea>
          </label>
        </div>
      </article>`;
  }

  function activityEditorCard(item, index, inputCls, textareaCls, copy) {
    return `
      <article class="trip-itinerary-editor-card is-activity" data-index="${index}">
        <div class="trip-itinerary-editor-head">
          <span class="trip-itinerary-editor-day">${copy.activity} · ${copy.day} ${item.dayFrom || item.day || 1}</span>
          <button type="button" class="trip-date-editor-remove" data-remove-itinerary="${index}" aria-label="Remove activity">×</button>
        </div>
        <div class="trip-itinerary-editor-grid">
          <label class="trip-form-field">
            <span>${copy.day}</span>
            <input type="number" min="1" class="${inputCls}" data-itinerary-field="dayFrom" value="${item.dayFrom || item.day || 1}" />
          </label>
          <label class="trip-form-field">
            <span>${copy.city}</span>
            <select class="${inputCls}" data-itinerary-field="location">
              <option value="">—</option>
              ${locationOptions(item.location, copy)}
            </select>
          </label>
          <label class="trip-form-field">
            <span>${copy.titleEn}</span>
            <input type="text" class="${inputCls}" data-itinerary-field="title" value="${escapeHtml(item.title)}" />
          </label>
          <label class="trip-form-field">
            <span>${copy.titleAr}</span>
            <input type="text" class="${inputCls}" dir="rtl" data-itinerary-field="titleAr" value="${escapeHtml(item.titleAr)}" />
          </label>
          <label class="trip-form-field trip-form-field--full">
            <span>${copy.descEn}</span>
            <textarea rows="2" class="${textareaCls}" data-itinerary-field="description">${item.description || ''}</textarea>
          </label>
          <label class="trip-form-field trip-form-field--full">
            <span>${copy.descAr}</span>
            <textarea rows="2" class="${textareaCls}" dir="rtl" data-itinerary-field="descriptionAr">${item.descriptionAr || ''}</textarea>
          </label>
        </div>
      </article>`;
  }

  function initItineraryEditor(form) {
    const staysList = qs('[data-itinerary-stays]', form);
    const activitiesList = qs('[data-itinerary-activities]', form);
    const field = '[data-itinerary-input]';
    if ((!staysList && !activitiesList) || !qs(field, form)) return null;

    const inputCls = form.dataset.formTheme === 'admin' ? 'admin-input' : 'company-input';
    const textareaCls = form.dataset.formTheme === 'admin' ? 'admin-textarea' : 'company-input company-textarea';
    let items = normalizeItinerary(readJsonField(form, field));

    const persist = () => writeJsonField(form, field, items);

    const render = () => {
      const copy = labels();
      const stays = items.map((item, index) => ({ item, index })).filter((row) => row.item.kind === 'stay');
      const activities = items.map((item, index) => ({ item, index })).filter((row) => row.item.kind !== 'stay');
      if (staysList) {
        staysList.innerHTML = stays.length
          ? stays.map((row) => stayEditorCard(row.item, row.index, inputCls, textareaCls, copy)).join('')
          : `<p class="trip-form-empty">${copy.noStays}</p>`;
      }
      if (activitiesList) {
        activitiesList.innerHTML = activities.length
          ? activities.map((row) => activityEditorCard(row.item, row.index, inputCls, textareaCls, copy)).join('')
          : `<p class="trip-form-empty">${copy.noActivities}</p>`;
      }
    };

    const nextStayRange = () => {
      const stays = items.filter((item) => item.kind === 'stay');
      const lastTo = stays.reduce((max, item) => Math.max(max, Number(item.dayTo) || 0), 0);
      const from = lastTo + 1;
      return { from, to: from + 4 };
    };

    persist();
    render();

    return {
      addStay() {
        const { from, to } = nextStayRange();
        items.push({
          kind: 'stay',
          day: from,
          dayFrom: from,
          dayTo: to,
          location: from <= 5 ? 'makkah' : 'madinah',
          title: '',
          titleAr: '',
          description: '',
          descriptionAr: '',
        });
        persist();
        render();
      },
      add() {
        const last = items.filter((item) => item.kind !== 'stay').at(-1);
        const day = (Number(last?.dayFrom) || 0) + 1 || 1;
        items.push({
          kind: 'activity',
          day,
          dayFrom: day,
          dayTo: day,
          location: '',
          title: '',
          titleAr: '',
          description: '',
          descriptionAr: '',
        });
        persist();
        render();
      },
      applyPreset() {
        items = typicalUmrahPlan();
        persist();
        render();
      },
      remove(index) {
        items.splice(index, 1);
        persist();
        render();
      },
      update(index, fieldName, value) {
        if (!items[index]) return;
        if (fieldName === 'dayFrom' || fieldName === 'dayTo' || fieldName === 'day') {
          const n = Math.max(1, Number(value) || 1);
          if (fieldName === 'dayTo') {
            items[index].dayTo = Math.max(items[index].dayFrom || 1, n);
          } else {
            items[index].dayFrom = n;
            items[index].day = n;
            if (items[index].kind !== 'stay') items[index].dayTo = n;
            else if ((items[index].dayTo || 0) < n) items[index].dayTo = n;
          }
        } else {
          items[index][fieldName] = value;
        }
        persist();
      },
    };
  }

  function initTripTypeUi(form) {
    const typeSelect = qs('[data-trip-type]', form);
    const destination = qs('[data-trip-destination]', form);
    const category = qs('[data-trip-category]', form);
    const preset = qs('[data-umrah-only]', form);
    if (!typeSelect) return;

    const leisurePlaceholder = isRtl() ? 'مثال: الغردقة' : 'e.g. Hurghada';
    const umrahPlaceholder = isRtl() ? 'مكة والمدينة' : 'Makkah & Madinah';

    const sync = (fromUser) => {
      const umrah = typeSelect.value === 'umrah';
      if (preset) preset.hidden = !umrah;
      if (destination) destination.placeholder = umrah ? umrahPlaceholder : leisurePlaceholder;
      if (!fromUser || !category) return;
      if (umrah && (!category.value || category.value === 'Leisure')) category.value = 'Umrah Package';
      if (!umrah && category.value === 'Umrah Package') category.value = 'Leisure';
    };

    typeSelect.addEventListener('change', () => sync(true));
    sync(false);
  }

  function initAdminCompanyUpload(form) {
    const companySelect = qs('[data-admin-company-select]', form);
    const picker = qs('[data-trip-media-picker]', form);
    if (!companySelect || !picker) return;

    const syncUploadUrl = () => {
      const id = companySelect.value;
      if (id) picker.dataset.uploadUrl = `/admin/trips/media?companyId=${encodeURIComponent(id)}`;
    };

    companySelect.addEventListener('change', syncUploadUrl);
    syncUploadUrl();
  }

  function init(form) {
    if (!form || form.dataset.tripFormReady === 'true') return;
    form.dataset.tripFormReady = 'true';

    let travelApi = null;
    const roomsApi = initRoomTypesEditor(form, () => travelApi?.refreshFromRooms());
    travelApi = initTravelDatesEditor(form, () => roomsApi?.getState() || { roomTypes: [], priceMode: 'shared' });
    const itineraryApi = initItineraryEditor(form);
    initTripTypeUi(form);

    form.addEventListener('click', (event) => {
      if (event.target.closest('[data-travel-dates-add]')) {
        event.preventDefault();
        travelApi?.add();
        return;
      }
      if (event.target.closest('[data-itinerary-add-stay]')) {
        event.preventDefault();
        itineraryApi?.addStay();
        return;
      }
      if (event.target.closest('[data-itinerary-preset]')) {
        event.preventDefault();
        itineraryApi?.applyPreset();
        return;
      }
      if (event.target.closest('[data-itinerary-add]')) {
        event.preventDefault();
        itineraryApi?.add();
        return;
      }
      const removeDateBtn = event.target.closest('[data-remove-date]');
      if (removeDateBtn) {
        event.preventDefault();
        travelApi?.remove(Number(removeDateBtn.dataset.removeDate));
        return;
      }
      const removeItineraryBtn = event.target.closest('[data-remove-itinerary]');
      if (removeItineraryBtn) {
        event.preventDefault();
        itineraryApi?.remove(Number(removeItineraryBtn.dataset.removeItinerary));
      }
    });

    form.addEventListener('input', (event) => {
      const card = event.target.closest('[data-index]');
      if (!card) return;
      const index = Number(card.dataset.index);

      if (event.target.dataset.dateField) {
        const value = event.target.type === 'number' ? Number(event.target.value) : event.target.value;
        travelApi?.update(index, event.target.dataset.dateField, value);
        return;
      }

      const roomRow = event.target.closest('[data-room-row]');
      if (roomRow && event.target.dataset.dateRoomField) {
        const value = event.target.type === 'number' ? Number(event.target.value) : event.target.value;
        travelApi?.updateRoom(index, roomRow.dataset.roomRow, event.target.dataset.dateRoomField, value);
        return;
      }

      if (event.target.dataset.itineraryField) {
        const value = event.target.type === 'number' ? Number(event.target.value) : event.target.value;
        itineraryApi?.update(index, event.target.dataset.itineraryField, value);
      }
    });

    form.addEventListener('change', (event) => {
      if (!event.target.dataset.itineraryField) return;
      const card = event.target.closest('[data-index]');
      if (!card) return;
      const value = event.target.type === 'number' ? Number(event.target.value) : event.target.value;
      itineraryApi?.update(Number(card.dataset.index), event.target.dataset.itineraryField, value);
    });

    initAdminCompanyUpload(form);
  }

  function boot() {
    qsa('[data-trip-form]').forEach(init);
  }

  window.SafarnyTripForm = { init, boot };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
