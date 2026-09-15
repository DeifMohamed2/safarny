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

  function parseCatalog(form) {
    const node = qs('[data-destination-catalog]', form);
    if (!node) return [];
    const raw = (node.value != null ? node.value : node.textContent) || '';
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  function destHaystack(item) {
    return [item.id, item.nameEn, item.nameAr, item.regionEn, item.regionAr, item.region, ...(item.aliases || [])]
      .map((value) => String(value || '').toLowerCase())
      .join(' ');
  }

  function destMatches(item, query) {
    const needle = String(query || '').trim().toLowerCase();
    if (!needle) return true;
    return destHaystack(item).includes(needle);
  }

  function destForType(list, type) {
    const key = String(type || '').toLowerCase();
    if (key === 'umrah' || key === 'hajj') {
      return list.filter((item) => (item.group === 'sacred' || item.group === 'both') && String(item.country || '').toUpperCase() === 'SA');
    }
    return list.filter((item) => String(item.country || '').toUpperCase() === 'EG');
  }

  function destGroupKey(item) {
    if (item.country === 'EG') return `eg:${item.region || 'egypt'}`;
    return `co:${item.country || 'OTHER'}`;
  }

  function destGroupLabel(item) {
    return isRtl() ? (item.regionAr || item.nameAr || '') : (item.regionEn || item.nameEn || '');
  }

  function destLocaleName(item) {
    return destDisplayName(item);
  }

  function sortDestinations(list) {
    const locale = isRtl() ? 'ar' : 'en';
    const regionOrder = [
      'greater-cairo', 'alexandria', 'north-coast', 'matrouh', 'delta', 'canal', 'sokhna',
      'red-sea', 'south-sinai', 'north-sinai', 'fayoum', 'middle-egypt', 'upper-egypt', 'western-desert',
    ];
    const countryOrder = ['EG', 'SA', 'TR', 'AE', 'JO', 'MA', 'TN', 'OM', 'QA', 'KW', 'BH', 'LB'];
    const regionRank = (item) => {
      if ((item.country || 'EG') === 'EG') {
        const idx = regionOrder.indexOf(item.region);
        return idx === -1 ? 80 : idx;
      }
      const idx = countryOrder.indexOf(item.country);
      return 100 + (idx === -1 ? 50 : idx);
    };
    return [...list].sort((a, b) => {
      const region = regionRank(a) - regionRank(b);
      if (region) return region;
      const popular = Number(Boolean(b.popular)) - Number(Boolean(a.popular));
      if (popular) return popular;
      return String(destLocaleName(a)).localeCompare(String(destLocaleName(b)), locale, { sensitivity: 'base' });
    });
  }

  function pickerOptionHtml(item, selected, attr) {
    const active = selected === item.nameEn || selected === item.id ? ' is-active' : '';
    return `
      <button type="button" class="dest-picker-option${active}" ${attr} data-id="${escapeHtml(item.id)}" data-name="${escapeHtml(item.nameEn)}">
        <span>${escapeHtml(destDisplayName(item))}</span>
        <small>${escapeHtml(isRtl() ? item.nameEn : item.nameAr)}</small>
      </button>`;
  }

  function groupedPickerHtml(items, selected, attr, query, copy) {
    const sorted = sortDestinations(items);
    const needle = String(query || '').trim();
    let html = '';
    if (!needle) {
      const popularOrder = [
        'hurghada', 'el-gouna', 'sharm-el-sheikh', 'dahab', 'north-coast', 'ras-el-hekma',
        'marina', 'hacienda', 'ain-sokhna', 'luxor', 'aswan', 'cairo', 'alexandria', 'siwa', 'fayoum',
      ];
      const popular = sorted.filter((item) => item.popular).sort((a, b) => {
        const ai = popularOrder.indexOf(a.id);
        const bi = popularOrder.indexOf(b.id);
        return (ai === -1 ? 80 : ai) - (bi === -1 ? 80 : bi);
      }).slice(0, 16);
      if (popular.length) {
        html += `<p class="dest-picker-group">${escapeHtml(copy.popular)}</p>`;
        html += popular.map((item) => pickerOptionHtml(item, selected, attr)).join('');
      }
    }
    let lastGroup = null;
    const limit = needle ? 48 : sorted.length;
    sorted.slice(0, limit).forEach((item) => {
      const group = destGroupLabel(item);
      const key = destGroupKey(item) + group;
      if (key !== lastGroup) {
        lastGroup = key;
        html += `<p class="dest-picker-group">${escapeHtml(group)}</p>`;
      }
      html += pickerOptionHtml(item, selected, attr);
    });
    return html;
  }

  function findCatalogItem(list, value) {
    const needle = String(value || '').trim().toLowerCase();
    if (!needle) return null;
    const exact = list.find((item) => [item.id, item.nameEn, item.nameAr, ...(item.aliases || [])]
      .some((part) => String(part || '').trim().toLowerCase() === needle));
    if (exact) return exact;
    return list.find((item) => destHaystack(item).includes(needle)) || null;
  }

  function destDisplayName(item) {
    if (!item) return '';
    return isRtl() ? (item.nameAr || item.nameEn) : (item.nameEn || item.nameAr);
  }

  function currentTripType(form) {
    return qs('[data-trip-type]', form)?.value || 'leisure';
  }

  function isRtl() {
    return document.documentElement.lang === 'ar';
  }

  function labels() {
    const ar = isRtl();
    return {
      startDate: ar ? 'تاريخ البداية' : 'Start date',
      endDate: ar ? 'تاريخ النهاية' : 'End date',
      price: ar ? 'سعر الغرفة' : 'Room price',
      rooms: ar ? 'الغرف' : 'Rooms',
      roomsPerDate: ar ? 'عدد الغرف المتاحة' : 'How many rooms',
      roomsPlaceholder: ar ? 'مثال: 8' : 'e.g. 8',
      remaining: ar ? 'المتبقية' : 'Still available',
      sleeps: ar ? 'تسع {n} ضيوف' : 'sleeps {n}',
      noDates: ar ? 'أضف أول موعد مغادرة ليتمكن المسافرون من الحجز.' : 'Add a departure so travelers can book this trip.',
      noStays: ar ? 'أضف إقامة في المدينة التي ينام فيها الضيوف.' : 'Add a stay in the city where guests sleep.',
      noActivities: ar ? 'أضف نشاطاً داخل أيام الإقامة.' : 'Add an activity on a day inside a stay.',
      stay: ar ? 'إقامة' : 'Stay',
      activity: ar ? 'نشاط' : 'Activity',
      fromDay: ar ? 'من يوم' : 'From day',
      toDay: ar ? 'إلى يوم' : 'To day',
      day: ar ? 'اليوم' : 'Day',
      city: ar ? 'المدينة' : 'City',
      searchCity: ar ? 'ابحث عن مدينة' : 'Search a city',
      otherCity: ar ? 'مدينة أخرى' : 'Other city',
      other: ar ? 'أخرى' : 'Other',
      popular: ar ? 'الأكثر طلباً' : 'Popular',
      titleEn: 'Title (EN)',
      titleAr: 'Title (AR)',
      descEn: 'Description (EN)',
      descAr: 'Description (AR)',
      perDateHint: ar ? 'يُحدَّد السعر في كل موعد أدناه' : 'Set the price on each departure below',
      departure: ar ? 'مغادرة' : 'Departure',
      duration: ar ? '{days} أيام · {nights} ليالٍ' : '{days} days · {nights} nights',
      pickDates: ar ? 'اختر تاريخ البداية — تاريخ النهاية يُملأ من مدة آخر موعد.' : 'Pick a start date — the end date fills in from the last departure.',
      customizeRooms: ar ? 'تعديل الغرف لهذا الموعد' : 'Adjust rooms for this date',
      useDefaultRooms: ar ? 'استخدام الغرف المحددة أعلاه' : 'Use the rooms set above',
      duplicate: ar ? 'تكرار' : 'Duplicate',
      removeDate: ar ? 'حذف الموعد' : 'Remove date',
      noRoomsYet: ar ? 'فعّل نوع غرفة واحداً على الأقل أعلاه أولاً.' : 'Turn on at least one room type above first.',
      inventoryTitle: ar ? 'الغرف والسعر لهذا الموعد' : 'Rooms and price for this date',
      priceOnDate: ar ? 'السعر في هذا الموعد' : 'Price on this date',
      egp: ar ? 'ج.م' : 'EGP',
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
                <span>${copy.price} (${copy.egp})</span>
                <input type="number" min="0" class="${inputCls}" data-room-price value="${price}" ${on ? '' : 'disabled'} />
              </label>
              <p class="trip-form-field-hint" data-per-date-hint ${priceMode === 'per-date' ? '' : 'hidden'}>${copy.perDateHint}</p>
              <label class="trip-form-field">
                <span>${copy.roomsPerDate}</span>
                <input type="number" min="1" class="${inputCls}" data-room-count value="${rooms}" placeholder="${copy.roomsPlaceholder}" ${on ? '' : 'disabled'} />
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

  function formatMoney(value, copy) {
    const amount = Number(value) || 0;
    return `${amount.toLocaleString()} ${copy.egp}`;
  }

  function addDaysIso(iso, days) {
    if (!iso) return '';
    const date = new Date(`${iso}T00:00:00`);
    if (Number.isNaN(date.getTime())) return '';
    date.setDate(date.getDate() + Number(days || 0));
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  function nightsBetween(start, end) {
    if (!start || !end) return 0;
    const from = new Date(`${start}T00:00:00`);
    const to = new Date(`${end}T00:00:00`);
    if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
    return Math.max(0, Math.round((to - from) / 86400000));
  }

  function typicalNights(form) {
    const dates = readJsonField(form, '[data-travel-dates-input]');
    for (let i = dates.length - 1; i >= 0; i -= 1) {
      const nights = nightsBetween(dates[i].startDate, dates[i].endDate);
      if (nights > 0) return nights;
    }
    return 3;
  }

  function defaultEndFromStart(form, start) {
    return addDaysIso(start, typicalNights(form));
  }

  function durationLabel(start, end, copy) {
    if (!start || !end) return copy.pickDates;
    const nights = nightsBetween(start, end);
    const days = nights + 1;
    return copy.duration.replace('{days}', String(days)).replace('{nights}', String(nights));
  }

  function dateSummary(item, enabled, priceMode, copy, showPrice = true) {
    if (!enabled.length) {
      return `<p class="trip-form-empty">${copy.noRoomsYet}</p>`;
    }
    return `
      <ul class="trip-date-summary">
        ${enabled
          .map((type) => {
            const row = (item.rooms || []).find((entry) => entry.type === type.type) || type;
            const price = priceMode === 'per-date' ? (row.price ?? type.price) : type.price;
            return `<li class="trip-date-chip">
              <strong>${escapeHtml(roomName(ROOM_DEFS.find((d) => d.id === type.type)))}</strong>
              <span>${Number(row.totalRooms) || 0} ${copy.rooms}</span>
              ${showPrice ? `<span>${formatMoney(price, copy)}</span>` : ''}
            </li>`;
          })
          .join('')}
      </ul>`;
  }

  function roomsEditor(item, enabled, priceMode, inputCls, copy, editing) {
    if (!enabled.length) return '';
    return `
      <div class="trip-date-rooms">
        ${enabled
          .map((type) => {
            const row = (item.rooms || []).find((entry) => entry.type === type.type) || type;
            return `
              <div class="trip-date-room-row ${editing ? 'is-editing' : ''}" data-room-row="${type.type}">
                <span class="trip-date-room-name">${escapeHtml(roomName(ROOM_DEFS.find((d) => d.id === type.type)))}</span>
                <label class="trip-form-field">
                  <span>${copy.rooms}</span>
                  <input type="number" min="0" class="${inputCls}" data-date-room-field="totalRooms" value="${row.totalRooms ?? ''}" />
                </label>
                ${
                  editing
                    ? `<label class="trip-form-field">
                        <span>${copy.remaining}</span>
                        <input type="number" min="0" class="${inputCls}" data-date-room-field="availableRooms" value="${row.availableRooms ?? row.totalRooms ?? ''}" />
                      </label>`
                    : ''
                }
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

  function perDatePrices(item, enabled, inputCls, copy) {
    if (!enabled.length) return '';
    return `
      <div class="trip-date-prices">
        <p class="trip-date-prices-label">${copy.priceOnDate}</p>
        <div class="trip-date-price-grid">
          ${enabled
            .map((type) => {
              const row = (item.rooms || []).find((entry) => entry.type === type.type) || type;
              return `
                <label class="trip-form-field" data-room-row="${type.type}">
                  <span>${escapeHtml(roomName(ROOM_DEFS.find((d) => d.id === type.type)))} (${copy.egp})</span>
                  <input type="number" min="0" class="${inputCls}" data-date-room-field="price" value="${row.price ?? type.price ?? ''}" />
                </label>`;
            })
            .join('')}
        </div>
      </div>`;
  }

  function initTravelDatesEditor(form, getRoomState) {
    const list = qs('[data-travel-dates-list]', form);
    const field = '[data-travel-dates-input]';
    if (!list || !qs(field, form)) return null;

    const inputCls = form.dataset.formTheme === 'admin' ? 'admin-input' : 'company-input';
    const editing = form.dataset.tripEditing === 'true';
    let dates = readJsonField(form, field);

    function blankDate() {
      const { roomTypes, priceMode } = getRoomState();
      return {
        id: `td-${Date.now()}`,
        startDate: '',
        endDate: '',
        roomsCustomized: false,
        rooms: roomTypes.map((type) => ({
          type: type.type,
          occupancy: type.occupancy,
          totalRooms: Number(type.totalRooms) || 0,
          availableRooms: Number(type.totalRooms) || 0,
          price: Number(type.price) || 0,
          priceMode,
        })),
      };
    }

    function inferCustomized(item, roomTypes) {
      if (item.roomsCustomized) return true;
      if (!Array.isArray(item.rooms) || !item.rooms.length) return false;
      return roomTypes.some((type) => {
        const prev = item.rooms.find((row) => row.type === type.type);
        if (!prev) return false;
        return Number(prev.totalRooms || 0) !== Number(type.totalRooms || 0);
      });
    }

    function applyRoomState(nextDates = dates) {
      const { roomTypes, priceMode } = getRoomState();
      return nextDates.map((item) => {
        const custom = Boolean(item.roomsCustomized);
        const rooms = roomTypes.map((type) => {
          const prev = (item.rooms || []).find((row) => row.type === type.type) || {};
          const totalRooms = custom
            ? (Number(prev.totalRooms ?? type.totalRooms) || 0)
            : (Number(type.totalRooms) || 0);
          const availableRooms = editing
            ? Math.max(0, Number(prev.availableRooms ?? totalRooms) || 0)
            : totalRooms;
          return {
            type: type.type,
            occupancy: type.occupancy,
            totalRooms,
            availableRooms,
            price: priceMode === 'per-date'
              ? (Number(prev.price) || Number(type.price) || 0)
              : (Number(type.price) || 0),
          };
        });
        return { ...item, rooms, roomsCustomized: custom };
      });
    }

    const render = () => {
      const copy = labels();
      const { roomTypes, priceMode } = getRoomState();
      if (!dates.length) {
        list.innerHTML = `
          <div class="trip-date-empty">
            <p class="trip-date-empty-title">${copy.noDates}</p>
            <p class="trip-form-empty">${copy.pickDates}</p>
          </div>`;
        return;
      }

      list.innerHTML = dates
        .map((item, index) => {
          const custom = Boolean(item.roomsCustomized);
          return `
        <article class="trip-date-editor-card" data-index="${index}">
          <div class="trip-date-editor-head">
            <span class="trip-date-editor-badge">${copy.departure} ${index + 1}</span>
            <div class="trip-date-editor-head-actions">
              <button type="button" class="trip-date-editor-link" data-duplicate-date="${index}">${copy.duplicate}</button>
              <button type="button" class="trip-date-editor-remove" data-remove-date="${index}" aria-label="${copy.removeDate}">×</button>
            </div>
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
          <p class="trip-date-duration" data-date-duration>${durationLabel(item.startDate, item.endDate, copy)}</p>
          ${priceMode === 'per-date' && !custom ? perDatePrices(item, roomTypes, inputCls, copy) : ''}
          ${custom ? roomsEditor(item, roomTypes, priceMode, inputCls, copy, editing) : dateSummary(item, roomTypes, priceMode, copy, priceMode === 'shared')}
          ${roomTypes.length ? `<button type="button" class="trip-date-editor-link trip-date-customize" data-toggle-rooms-custom="${index}">
            ${custom ? copy.useDefaultRooms : copy.customizeRooms}
          </button>` : ''}
        </article>`;
        })
        .join('');
    };

    const persist = () => writeJsonField(form, field, dates);

    const sync = () => {
      dates = applyRoomState(dates);
      persist();
      render();
    };

    if (!dates.length && !editing) dates.push(blankDate());
    const initialTypes = getRoomState().roomTypes;
    dates = dates.map((item) => ({ ...item, roomsCustomized: inferCustomized(item, initialTypes) }));
    dates = applyRoomState(dates);
    persist();
    render();

    return {
      add(source) {
        if (source) {
          dates.push({
            ...JSON.parse(JSON.stringify(source)),
            id: `td-${Date.now()}`,
          });
        } else {
          dates.push(blankDate());
        }
        persist();
        render();
      },
      duplicate(index) {
        if (!dates[index]) return;
        this.add(dates[index]);
      },
      remove(index) {
        dates.splice(index, 1);
        persist();
        render();
      },
      toggleCustom(index) {
        if (!dates[index]) return;
        dates[index].roomsCustomized = !dates[index].roomsCustomized;
        sync();
      },
      update(index, fieldName, value) {
        if (!dates[index]) return;
        dates[index][fieldName] = value;
        if (fieldName === 'startDate' && value) {
          const currentEnd = dates[index].endDate;
          if (!currentEnd || currentEnd < value) {
            dates[index].endDate = defaultEndFromStart(form, value);
            const endInput = qs(`[data-index="${index}"] [data-date-field="endDate"]`, form);
            if (endInput) endInput.value = dates[index].endDate;
          }
        }
        const duration = qs(`[data-index="${index}"] [data-date-duration]`, form);
        if (duration) duration.textContent = durationLabel(dates[index].startDate, dates[index].endDate, labels());
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
        if (fieldName === 'totalRooms') {
          if (!editing || row.availableRooms == null || row.availableRooms > value) {
            row.availableRooms = value;
            const remainingInput = qs(`[data-index="${index}"] [data-room-row="${typeId}"] [data-date-room-field="availableRooms"]`, form);
            if (remainingInput) remainingInput.value = value;
          }
        }
        persist();
      },
      refreshFromRooms() {
        sync();
      },
    };
  }

  function cityPickerHtml(selected, copy, form, inputCls, allowEmpty) {
    const catalog = destForType(parseCatalog(form), currentTripType(form));
    const found = findCatalogItem(catalog, selected) || findCatalogItem(parseCatalog(form), selected);
    const isOther = Boolean(selected) && !found;
    const display = found ? destDisplayName(found) : (isOther ? selected : '');
    return `
      <div class="dest-picker dest-picker--compact" data-city-picker>
        <input type="hidden" data-itinerary-field="location" value="${escapeHtml(selected || '')}" />
        <input type="search" class="${inputCls}" data-city-search value="${escapeHtml(display)}" placeholder="${escapeHtml(copy.searchCity)}" autocomplete="off" spellcheck="false" />
        ${allowEmpty ? `<input type="hidden" data-city-allow-empty="1" />` : ''}
        <div class="dest-picker-menu" data-city-menu hidden role="listbox"></div>
      </div>`;
  }

  function renderCityMenu(picker, form, query) {
    const menu = qs('[data-city-menu]', picker);
    const hidden = qs('[data-itinerary-field="location"]', picker);
    if (!menu) return;
    const copy = labels();
    const catalog = destForType(parseCatalog(form), currentTripType(form));
    const matches = catalog.filter((item) => destMatches(item, query));
    const selected = hidden?.value || '';
    let html = groupedPickerHtml(matches, selected, 'data-city-option', query, copy);
    html += `<button type="button" class="dest-picker-option dest-picker-option--other" data-city-option="other">${escapeHtml(copy.otherCity)}</button>`;
    menu.innerHTML = html;
    menu.hidden = false;
  }

  function bindCityPickers(form) {
    qsa('[data-city-picker]', form).forEach((picker) => {
      if (picker.dataset.ready === 'true') return;
      picker.dataset.ready = 'true';
      const search = qs('[data-city-search]', picker);
      const hidden = qs('[data-itinerary-field="location"]', picker);
      const menu = qs('[data-city-menu]', picker);
      if (!search || !hidden) return;
      search.addEventListener('focus', () => renderCityMenu(picker, form, search.value));
      search.addEventListener('input', () => renderCityMenu(picker, form, search.value));
      search.addEventListener('blur', () => {
        window.setTimeout(() => {
          if (menu) menu.hidden = true;
        }, 150);
        const typed = search.value.trim();
        if (!typed) {
          if (qs('[data-city-allow-empty]', picker)) hidden.value = '';
          hidden.dispatchEvent(new Event('change', { bubbles: true }));
          return;
        }
        const found = findCatalogItem(parseCatalog(form), typed);
        if (found) {
          hidden.value = found.id;
          search.value = destDisplayName(found);
        } else {
          hidden.value = typed;
        }
        hidden.dispatchEvent(new Event('change', { bubbles: true }));
      });
      menu?.addEventListener('mousedown', (event) => {
        const option = event.target.closest('[data-city-option]');
        if (!option) return;
        event.preventDefault();
        if (option.dataset.cityOption === 'other') {
          hidden.value = search.value.trim();
        } else {
          hidden.value = option.dataset.id;
          search.value = destDisplayName(findCatalogItem(parseCatalog(form), option.dataset.id));
        }
        menu.hidden = true;
        hidden.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
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
        location: String(item.location || '').trim(),
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

  function stayEditorCard(item, index, inputCls, textareaCls, copy, form) {
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
            ${cityPickerHtml(item.location, copy, form, inputCls, false)}
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

  function activityEditorCard(item, index, inputCls, textareaCls, copy, form) {
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
            ${cityPickerHtml(item.location, copy, form, inputCls, true)}
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
          ? stays.map((row) => stayEditorCard(row.item, row.index, inputCls, textareaCls, copy, form)).join('')
          : `<p class="trip-form-empty">${copy.noStays}</p>`;
      }
      if (activitiesList) {
        activitiesList.innerHTML = activities.length
          ? activities.map((row) => activityEditorCard(row.item, row.index, inputCls, textareaCls, copy, form)).join('')
          : `<p class="trip-form-empty">${copy.noActivities}</p>`;
      }
      bindCityPickers(form);
    };

    const nextStayRange = () => {
      const stays = items.filter((item) => item.kind === 'stay');
      const lastTo = stays.reduce((max, item) => Math.max(max, Number(item.dayTo) || 0), 0);
      const from = lastTo + 1;
      return { from, to: from + 4 };
    };

    const defaultStayCity = () => {
      const type = currentTripType(form);
      const destValue = qs('[data-trip-destination]', form)?.value || '';
      const catalog = parseCatalog(form);
      const selected = findCatalogItem(catalog, destValue);
      if (type === 'umrah' || type === 'hajj') {
        const stays = items.filter((item) => item.kind === 'stay');
        if (!stays.length) return 'makkah';
        const last = stays[stays.length - 1];
        if (String(last.location || '').toLowerCase() === 'makkah') return 'madinah';
        return selected?.id || 'makkah';
      }
      return selected?.id || destValue || '';
    };

    persist();
    render();

    return {
      addStay() {
        const { from, to } = nextStayRange();
        const location = defaultStayCity();
        const city = findCatalogItem(parseCatalog(form), location);
        items.push({
          kind: 'stay',
          day: from,
          dayFrom: from,
          dayTo: to,
          location,
          title: city ? `Stay in ${city.nameEn}` : '',
          titleAr: city ? `الإقامة في ${city.nameAr}` : '',
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
          location: defaultStayCity(),
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
      refresh() {
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

  function isSacredType(value) {
    return value === 'umrah' || value === 'hajj';
  }

  function initDestinationPicker(form) {
    const root = qs('[data-dest-picker]', form);
    if (!root) return { refresh() {} };
    const hidden = qs('[data-trip-destination]', root);
    const search = qs('[data-dest-search]', root);
    const menu = qs('[data-dest-menu]', root);
    const otherWrap = qs('[data-dest-other]', root);
    const otherInput = qs('[data-dest-other-input]', root);
    if (!hidden || !search || !menu) return { refresh() {} };
    const copy = () => labels();

    const close = () => {
      menu.hidden = true;
    };

    const renderMenu = (query) => {
      const catalog = destForType(parseCatalog(form), currentTripType(form));
      const matches = catalog.filter((item) => destMatches(item, query));
      const selected = hidden.value;
      let html = groupedPickerHtml(matches, selected, 'data-dest-option', query, copy());
      html += `<button type="button" class="dest-picker-option dest-picker-option--other" data-dest-option="other">${escapeHtml(copy().other)}</button>`;
      if (!matches.length) html = `<p class="dest-picker-empty">${escapeHtml(copy().otherCity)}</p>` + html;
      menu.innerHTML = html;
      menu.hidden = false;
    };

    const selectItem = (item) => {
      hidden.value = item.nameEn;
      search.value = destDisplayName(item);
      if (otherWrap) otherWrap.hidden = true;
      hidden.dispatchEvent(new Event('change', { bubbles: true }));
      close();
    };

    const selectOther = () => {
      if (otherWrap) otherWrap.hidden = false;
      if (otherInput) {
        otherInput.value = hidden.value && !findCatalogItem(parseCatalog(form), hidden.value) ? hidden.value : '';
        otherInput.focus();
      }
      search.value = copy().other;
      close();
    };

    search.addEventListener('focus', () => renderMenu(search.value));
    search.addEventListener('input', () => {
      if (otherWrap) otherWrap.hidden = true;
      renderMenu(search.value);
    });
    menu.addEventListener('mousedown', (event) => {
      const option = event.target.closest('[data-dest-option]');
      if (!option) return;
      event.preventDefault();
      if (option.dataset.destOption === 'other') {
        selectOther();
        return;
      }
      const item = findCatalogItem(parseCatalog(form), option.dataset.id);
      if (item) selectItem(item);
    });
    otherInput?.addEventListener('input', () => {
      hidden.value = otherInput.value.trim();
    });
    form.addEventListener('submit', () => {
      if (hidden.value.trim()) return;
      const typed = (otherInput && !otherWrap?.hidden ? otherInput.value : search.value).trim();
      if (!typed || typed === copy().other) return;
      const found = findCatalogItem(destForType(parseCatalog(form), currentTripType(form)), typed)
        || findCatalogItem(parseCatalog(form), typed);
      hidden.value = found ? found.nameEn : typed;
    });
    document.addEventListener('click', (event) => {
      if (!root.contains(event.target)) close();
    });

    return {
      refresh(fromUser) {
        const catalog = destForType(parseCatalog(form), currentTripType(form));
        const current = findCatalogItem(parseCatalog(form), hidden.value);
        const allowed = current && catalog.some((item) => item.id === current.id);
        search.placeholder = isSacredType(currentTripType(form))
          ? (isRtl() ? 'مكة أو المدينة' : 'Makkah or Madinah')
          : (isRtl() ? 'ابحث عن وجهة سياحية' : 'Search a destination');
        if (fromUser && current && !allowed) {
          if (isSacredType(currentTripType(form))) {
            const makkah = findCatalogItem(catalog, 'makkah');
            if (makkah) selectItem(makkah);
            else {
              hidden.value = '';
              search.value = '';
            }
          } else {
            hidden.value = '';
            search.value = '';
            if (otherWrap) otherWrap.hidden = true;
          }
        } else if (current) {
          search.value = destDisplayName(current);
        }
      },
    };
  }

  function initTripTypeUi(form, destPicker, itineraryApi) {
    const typeSelect = qs('[data-trip-type]', form);
    const preset = qs('[data-umrah-only]', form);
    const pills = qs('[data-trip-type-pills]', form);
    if (!typeSelect) return;

    const setType = (value, fromUser) => {
      typeSelect.value = value;
      if (pills) {
        qsa('[data-pill-value]', pills).forEach((btn) => {
          const on = btn.dataset.pillValue === value;
          btn.classList.toggle('is-active', on);
          btn.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
      }
      sync(fromUser);
    };

    const sync = (fromUser) => {
      const sacred = isSacredType(typeSelect.value);
      if (preset) preset.hidden = !sacred;
      destPicker?.refresh(fromUser);
      itineraryApi?.refresh();
    };

    if (pills) {
      pills.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-pill-value]');
        if (!btn || !pills.contains(btn)) return;
        setType(btn.dataset.pillValue, true);
      });
    }

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
    const destPicker = initDestinationPicker(form);
    initTripTypeUi(form, destPicker, itineraryApi);

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
      const duplicateBtn = event.target.closest('[data-duplicate-date]');
      if (duplicateBtn) {
        event.preventDefault();
        travelApi?.duplicate(Number(duplicateBtn.dataset.duplicateDate));
        return;
      }
      const customBtn = event.target.closest('[data-toggle-rooms-custom]');
      if (customBtn) {
        event.preventDefault();
        travelApi?.toggleCustom(Number(customBtn.dataset.toggleRoomsCustom));
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
