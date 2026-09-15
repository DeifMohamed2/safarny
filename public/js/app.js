(function () {
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function toastDuration(el) {
    const length = String(el.textContent || '').replace(/\s+/g, ' ').trim().length;
    return Math.min(9000, Math.max(4200, length * 55));
  }

  function bindToast(el) {
    if (!el || el.dataset.toastBound === '1') return;
    el.dataset.toastBound = '1';
    let timer;
    const close = () => {
      if (el.dataset.toastClosed === '1') return;
      el.dataset.toastClosed = '1';
      window.clearTimeout(timer);
      el.classList.add('is-leaving');
      window.setTimeout(() => el.remove(), 220);
    };
    el.querySelector('[data-toast-close]')?.addEventListener('click', close);
    timer = window.setTimeout(close, toastDuration(el));
  }

  function toast(title, description) {
    const stack = qs('#toast-stack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.setAttribute('role', 'status');
    el.innerHTML = `<div class="toast-body"><p class="font-semibold text-[#122445]">${title}</p>${
      description ? `<p class="text-sm text-[#535353] mt-1">${description}</p>` : ''
    }</div><button type="button" class="toast-close" data-toast-close aria-label="Close">×</button>`;
    stack.appendChild(el);
    bindToast(el);
  }

  window.safarnyToast = toast;
  qsa('#toast-stack .toast').forEach(bindToast);

  const header = qs('[data-site-header]');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  qsa('[data-dropdown]').forEach((root) => {
    const trigger = qs('[data-dropdown-trigger]', root);
    const menu = qs('[data-dropdown-menu]', root);
    if (!trigger || !menu) return;
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      qsa('[data-dropdown-menu].is-open').forEach((openMenu) => {
        if (openMenu !== menu) openMenu.classList.remove('is-open');
      });
      menu.classList.toggle('is-open');
    });
  });

  document.addEventListener('click', () => {
    qsa('[data-dropdown-menu].is-open').forEach((menu) => menu.classList.remove('is-open'));
  });

  const sidebar = qs('#mobile-sidebar');
  qs('[data-open-sidebar]')?.addEventListener('click', () => sidebar?.classList.add('is-open'));
  qsa('[data-close-sidebar]').forEach((btn) => {
    btn.addEventListener('click', () => sidebar?.classList.remove('is-open'));
  });

  const DIALOG_ANIM_MS = 380;

  function openDialog(id) {
    const overlay = qs(id);
    if (!overlay || overlay.classList.contains('is-open')) return;
    overlay.classList.remove('is-closing');
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('dialog-open');
    const signinError = qs('#signin-error');
    if (signinError) {
      signinError.hidden = true;
      signinError.textContent = '';
    }
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => overlay.classList.add('is-visible'));
    });
    const focusTarget = overlay.querySelector('.auth-input, input:not([type="hidden"]), button:not(.auth-dialog-close)');
    window.setTimeout(() => focusTarget?.focus(), DIALOG_ANIM_MS);
  }

  function closeDialog(id) {
    const overlay = qs(id);
    if (!overlay || !overlay.classList.contains('is-open')) return;
    overlay.classList.add('is-closing');
    overlay.classList.remove('is-visible');
    overlay.setAttribute('aria-hidden', 'true');
    window.setTimeout(() => {
      overlay.classList.remove('is-open', 'is-closing');
      if (!qs('.dialog-overlay.is-open')) document.body.classList.remove('dialog-open');
    }, DIALOG_ANIM_MS);
  }

  window.openDialog = openDialog;
  window.closeDialog = closeDialog;

  qsa('[data-open-dialog]').forEach((btn) => {
    btn.addEventListener('click', () => openDialog(btn.dataset.openDialog));
  });
  qsa('[data-close-dialog]').forEach((btn) => {
    btn.addEventListener('click', () => closeDialog(btn.dataset.closeDialog));
  });
  qsa('.dialog-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) {
        const id = overlay.id ? `#${overlay.id}` : null;
        if (id) closeDialog(id);
      }
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    const openOverlay = qs('.dialog-overlay.is-open');
    if (!openOverlay?.id) return;
    closeDialog(`#${openOverlay.id}`);
  });

  function showAuthView(view) {
    const current = qs('.auth-view.is-active');
    const next = qs(`.auth-view[data-auth-view="${view}"]`);
    if (!next || current === next) return;

    if (current) {
      current.classList.add('is-leaving');
      current.classList.remove('is-active');
      window.setTimeout(() => {
        current.classList.remove('is-leaving');
        qsa('.auth-view').forEach((el) => el.classList.toggle('is-active', el === next));
        next.querySelector('.auth-input, input:not([type="hidden"])')?.focus();
      }, 220);
      return;
    }

    qsa('.auth-view').forEach((el) => el.classList.toggle('is-active', el === next));
  }

  qsa('[data-auth-view]:not(.auth-view)').forEach((btn) => {
    btn.addEventListener('click', () => showAuthView(btn.dataset.authView));
  });

  qsa('[data-password-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('.auth-input-wrap, .partner-password') || btn.parentElement;
      const input = wrap ? qs('[data-password-input]', wrap) : null;
      if (!input) return;
      const visible = input.type === 'text';
      input.type = visible ? 'password' : 'text';
      btn.classList.toggle('is-visible', !visible);
      btn.setAttribute('aria-pressed', visible ? 'false' : 'true');
    });
  });

  if (new URLSearchParams(location.search).get('signin') === '1') {
    const isAuthenticated = Boolean(qs('.site-user-btn'));
    const redirectTarget = new URLSearchParams(location.search).get('redirect') || '/';
    if (isAuthenticated) {
      location.replace(redirectTarget);
    } else {
      openDialog('#signin-dialog');
    }
  }

  qsa('[data-toggle-filters]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const panel = qs(btn.dataset.toggleFilters);
      panel?.classList.toggle('is-open');
      btn.querySelector('svg')?.classList.toggle('rotate-90');
    });
  });

  const ADVANCED_FILTER_KEYS = ['tripType', 'priceFrom', 'priceTo', 'duration'];
  const PRIMARY_FILTER_KEYS = ['q', 'destination', 'date', 'guests', 'beds'];

  function digitsOnly(value) {
    return String(value || '').replace(/[^\d]/g, '');
  }

  function syncFilterPills(form) {
    qsa('[data-filter-pills]', form).forEach((group) => {
      if (group.dataset.bedsPills !== undefined) return;
      const field = form.elements[group.dataset.filterPills];
      const value = String(field?.value || '');
      qsa('[data-pill-value]', group).forEach((btn) => {
        const active = btn.dataset.pillValue === value;
        btn.classList.toggle('is-active', active);
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    });
    syncBedsPills(form);
  }

  function syncBedsPills(form) {
    const group = qs('[data-beds-pills]', form);
    const field = form.elements.beds;
    if (!group || !field) return;
    const value = String(field.value || '');
    qsa('[data-pill-value]', group).forEach((btn) => {
      const active = btn.dataset.pillValue === value;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function syncPricePresets(form) {
    const from = digitsOnly(form.elements.priceFrom?.value);
    const to = digitsOnly(form.elements.priceTo?.value);
    qsa('[data-price-presets] [data-price-min]', form).forEach((btn) => {
      const match = digitsOnly(btn.dataset.priceMin) === from && digitsOnly(btn.dataset.priceMax) === to;
      btn.classList.toggle('is-active', match);
    });
  }

  function normalizePriceRange(form) {
    const fromField = form.elements.priceFrom;
    const toField = form.elements.priceTo;
    if (!fromField && !toField) return;
    let from = Number(digitsOnly(fromField?.value)) || 0;
    let to = Number(digitsOnly(toField?.value)) || 0;
    if (from && to && from > to) {
      const swap = from;
      from = to;
      to = swap;
    }
    if (fromField) fromField.value = from ? String(from) : '';
    if (toField) toField.value = to ? String(to) : '';
    syncPricePresets(form);
  }

  function notifyFilterChange(form) {
    updateFilterBadge(form);
    updateApplyPreview(form);
    refreshOpenExplorer(form);
  }

  function bindEasyFilters(form) {
    qsa('[data-filter-pills]', form).forEach((group) => {
      if (group.dataset.bedsPills !== undefined) {
        qsa('[data-pill-value]', group).forEach((btn) => {
          btn.addEventListener('click', () => {
            const field = form.elements.beds;
            if (!field) return;
            field.value = btn.dataset.pillValue || '';
            syncBedsPills(form);
            notifyFilterChange(form);
          });
        });
        return;
      }
      const field = form.elements[group.dataset.filterPills];
      if (!field) return;
      qsa('[data-pill-value]', group).forEach((btn) => {
        btn.addEventListener('click', () => {
          field.value = btn.dataset.pillValue || '';
          syncFilterPills(form);
          notifyFilterChange(form);
        });
      });
    });

    qsa('[data-price-presets] [data-price-min]', form).forEach((btn) => {
      btn.addEventListener('click', () => {
        if (form.elements.priceFrom) form.elements.priceFrom.value = digitsOnly(btn.dataset.priceMin);
        if (form.elements.priceTo) form.elements.priceTo.value = digitsOnly(btn.dataset.priceMax);
        syncPricePresets(form);
        notifyFilterChange(form);
      });
    });

    qsa('[data-price-input]', form).forEach((input) => {
      input.addEventListener('input', () => {
        const cleaned = digitsOnly(input.value);
        if (input.value !== cleaned) input.value = cleaned;
        syncPricePresets(form);
        notifyFilterChange(form);
      });
    });
  }

  function countActiveFilters(form) {
    let count = 0;
    if (form.dataset.lockType !== 'leisure' && String(form.elements.tripType?.value || '').trim()) count += 1;
    if (String(form.elements.priceFrom?.value || '').trim() || String(form.elements.priceTo?.value || '').trim()) {
      count += 1;
    }
    if (String(form.elements.duration?.value || '').trim()) count += 1;
    return count;
  }

  function updateFilterBadge(form) {
    const badge = qs('[data-filter-badge]', form);
    if (!badge) return;
    const count = countActiveFilters(form);
    badge.textContent = String(count);
    badge.hidden = count === 0;
  }

  function closeFilterPanel(form) {
    const panel = qs('[data-filter-panel]', form);
    const toggle = qs('[data-filter-toggle]', form);
    const widget = qs('.booking-widget', form);
    panel?.classList.remove('is-open');
    toggle?.classList.remove('is-active');
    toggle?.setAttribute('aria-expanded', 'false');
    widget?.classList.remove('is-panel-open');
    document.body.classList.remove('filter-panel-open');
  }

  function openFilterPanel(form) {
    const panel = qs('[data-filter-panel]', form);
    const toggle = qs('[data-filter-toggle]', form);
    const widget = qs('.booking-widget', form);
    qsa('[data-filter-form]').forEach((otherForm) => {
      if (otherForm !== form) closeFilterPanel(otherForm);
    });
    closeSuggest(qs('[data-suggest]', form) || form);
    closeDatePickers();
    panel?.classList.add('is-open');
    toggle?.classList.add('is-active');
    toggle?.setAttribute('aria-expanded', 'true');
    widget?.classList.add('is-panel-open');
  }

  function toggleFilterPanel(form) {
    const panel = qs('[data-filter-panel]', form);
    if (panel?.classList.contains('is-open')) closeFilterPanel(form);
    else openFilterPanel(form);
  }

  function collectFilterParams(form, { forUrl = false } = {}) {
    normalizePriceRange(form);
    const params = new URLSearchParams();
    new FormData(form).forEach((value, key) => {
      const trimmed = String(value).trim();
      if (!trimmed) return;
      if (key === 'guests' && trimmed === '1') return;
      params.set(key, trimmed);
    });
    if (form.dataset.lockType === 'leisure') {
      if (forUrl) params.delete('tripType');
      else params.set('type', 'leisure');
    } else if (form.dataset.lockType === 'umrah') {
      const selected = String(form.elements.tripType?.value || '').trim();
      const type = selected === 'hajj' || selected === 'umrah' ? selected : 'sacred';
      if (forUrl) {
        if (!selected) params.delete('tripType');
      } else {
        params.set('type', type);
        params.delete('tripType');
      }
    }
    if (form.dataset.offersOnly === '1') {
      if (!forUrl) params.set('offersOnly', '1');
    }
    return params;
  }

  function buildFilterUrl(form) {
    const params = collectFilterParams(form, { forUrl: true });
    const base = form.getAttribute('action') || location.pathname;
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }

  function navigateWithoutParam(form, key) {
    const params = collectFilterParams(form, { forUrl: true });
    params.delete(key);
    params.delete('page');
    if (key === 'priceFrom' || key === 'priceTo') {
      params.delete('priceFrom');
      params.delete('priceTo');
    }
    if (key === 'destination') {
      const query = String(form.elements.q?.value || '').trim();
      const dest = String(form.elements.destination?.value || '').trim();
      if (!query || query === dest) params.delete('q');
    }
    const base = form.getAttribute('action') || location.pathname;
    const qs = params.toString();
    location.href = qs ? `${base}?${qs}` : base;
  }

  function navigateClearAll(form) {
    const base = form.getAttribute('action') || location.pathname;
    location.href = base;
  }

  function navigateKeepPrimary(form) {
    const params = new URLSearchParams();
    PRIMARY_FILTER_KEYS.forEach((key) => {
      const value = String(form.elements[key]?.value || '').trim();
      if (!value) return;
      if (key === 'guests' && value === '1') return;
      params.set(key, value);
    });
    const base = form.getAttribute('action') || location.pathname;
    const qs = params.toString();
    location.href = qs ? `${base}?${qs}` : base;
  }

  function clearAdvancedFilters(form) {
    ADVANCED_FILTER_KEYS.forEach((key) => {
      if (form.dataset.lockType === 'leisure' && key === 'tripType') return;
      const field = form.elements[key];
      if (field) field.value = '';
    });
    qsa('[data-date-picker]', form).forEach((picker) => picker._syncDateDisplay?.());
    syncFilterPills(form);
    syncPricePresets(form);
    syncBedsPills(form);
    notifyFilterChange(form);
  }

  function clearFilterForm(form, includeSearch = false) {
    qsa('[data-filter-field]', form).forEach((field) => {
      if (!includeSearch && field.name === 'q') return;
      if (form.dataset.lockType === 'leisure' && field.name === 'tripType') return;
      if (field.name === 'guests') {
        field.value = '1';
        return;
      }
      if (field.tagName === 'SELECT') field.selectedIndex = 0;
      else field.value = '';
    });
    qsa('[data-date-picker]', form).forEach((picker) => picker._syncDateDisplay?.());
    updateFilterBadge(form);
    syncFilterPills(form);
    syncPricePresets(form);
    syncBedsPills(form);
    updateApplyPreview(form);
  }

  const datePickerLang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
  const datePickerLocale = datePickerLang === 'ar' ? 'ar-EG' : 'en-GB';
  const datePickerCopy =
    datePickerLang === 'ar'
      ? { placeholder: 'اختر التاريخ' }
      : { placeholder: 'Select date' };
  const monthFormatter = new Intl.DateTimeFormat(datePickerLocale, { month: 'long', year: 'numeric' });
  const displayFormatter = new Intl.DateTimeFormat(datePickerLocale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const weekdayFormatter = new Intl.DateTimeFormat(datePickerLocale, { weekday: 'short' });

  function toIsoDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function parseIsoDate(value) {
    if (!value) return null;
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDateDisplay(value) {
    const date = parseIsoDate(value);
    if (!date) return '';
    return displayFormatter.format(date);
  }

  function startOfDay(date) {
    const next = new Date(date);
    next.setHours(0, 0, 0, 0);
    return next;
  }

  function closeDatePicker(root) {
    if (!root) return;
    const trigger = qs('[data-date-trigger]', root);
    const panel = root._datePanel;
    root.classList.remove('is-open');
    trigger?.setAttribute('aria-expanded', 'false');
    panel?.classList.remove('is-open');
    panel?.setAttribute('aria-hidden', 'true');
    if (panel) {
      panel.classList.remove('is-drop-up');
      panel.style.top = '';
      panel.style.bottom = '';
      panel.style.left = '';
      panel.style.right = '';
      panel.style.width = '';
      panel.style.maxHeight = '';
    }
    qs('.booking-widget', root.closest('form') || document)?.classList.remove('is-date-open');
  }

  function closeDatePickers(except) {
    qsa('[data-date-picker].is-open').forEach((root) => {
      if (root !== except) closeDatePicker(root);
    });
  }

  function positionDatePanel(root, panel) {
    if (panel.parentElement !== document.body) {
      document.body.appendChild(panel);
    }

    const bar = root.closest('.booking-card') || root;
    const barRect = bar.getBoundingClientRect();
    const segRect = root.getBoundingClientRect();
    const header = qs('[data-site-header]');
    const headerBottom = header ? header.getBoundingClientRect().bottom : 0;
    const gap = 6;
    const edgePad = 8;
    const minTop = headerBottom + edgePad;
    const maxBottom = window.innerHeight - edgePad;
    const width = Math.min(280, window.innerWidth - 24);
    let left = segRect.left;
    if (document.documentElement.dir === 'rtl') {
      left = segRect.right - width;
    }
    if (left + width > window.innerWidth - edgePad) left = window.innerWidth - width - edgePad;
    if (left < edgePad) left = edgePad;

    panel.style.position = 'fixed';
    panel.style.width = `${width}px`;
    panel.style.left = `${left}px`;
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    panel.style.zIndex = '40';
    panel.style.maxHeight = '';
    panel.classList.remove('is-drop-up');

    let top = barRect.bottom + gap;
    let panelHeight = panel.offsetHeight || 280;

    if (top + panelHeight > maxBottom) {
      const aboveTop = barRect.top - panelHeight - gap;
      if (aboveTop >= minTop) {
        top = aboveTop;
        panel.classList.add('is-drop-up');
      } else {
        const maxHeight = maxBottom - minTop;
        panel.style.maxHeight = `${Math.max(160, maxHeight)}px`;
        panelHeight = panel.offsetHeight || maxHeight;
        top = Math.min(barRect.bottom + gap, maxBottom - panelHeight);
        top = Math.max(minTop, top);
      }
    }

    panel.style.top = `${top}px`;
  }

  function renderDateWeekdays(root) {
    const panel = root._datePanel || document.getElementById(root.dataset.datePanelId || '');
    const row = panel ? qs('[data-date-weekdays]', panel) : null;
    if (!row || row.childElementCount) return;
    const formatter = weekdayFormatter;
    for (let i = 0; i < 7; i += 1) {
      const date = new Date(2024, 0, 7 + i);
      const label = document.createElement('span');
      label.className = 'booking-date-weekday';
      label.textContent = formatter.format(date);
      row.appendChild(label);
    }
  }

  function initDatePickers() {
    const todayIso = toIsoDate(startOfDay(new Date()));
    const todayDate = startOfDay(new Date());

    qsa('[data-date-picker]').forEach((root) => {
      const trigger = qs('[data-date-trigger]', root);
      const widget = root.closest('.booking-widget');
      const panel =
        qs('[data-date-panel]', root) ||
        (root.dataset.datePanelId && document.getElementById(root.dataset.datePanelId)) ||
        qs('[data-date-panel]', widget || root);
      const input = qs('[data-date-input]', root);
      const display = qs('[data-date-display]', root);
      const grid = panel ? qs('[data-date-grid]', panel) : null;
      const monthLabel = panel ? qs('[data-date-month-label]', panel) : null;
      if (!trigger || !panel || !input || !display || !grid || !monthLabel) return;

      root._datePanel = panel;

      let viewDate = parseIsoDate(input.value) || new Date();
      viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);

      const syncDisplay = () => {
        if (input.value) {
          display.textContent = formatDateDisplay(input.value);
          display.classList.remove('is-placeholder');
        } else {
          display.textContent = display.dataset.placeholder || datePickerCopy.placeholder;
          display.classList.add('is-placeholder');
        }
      };

      if (!display.dataset.placeholder) {
        display.dataset.placeholder = display.textContent.trim() || datePickerCopy.placeholder;
      }
      syncDisplay();
      renderDateWeekdays(root);

      const renderMonth = (force = false) => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const monthKey = `${year}-${month}`;
        monthLabel.textContent = monthFormatter.format(viewDate);
        const selected = input.value;
        if (!force && root._renderedMonth === monthKey && grid.childElementCount) {
          qsa('[data-date]', grid).forEach((btn) => {
            btn.classList.toggle('is-selected', btn.dataset.date === selected);
          });
          return;
        }

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const prevMonthDays = new Date(year, month, 0).getDate();
        const cells = [];

        for (let i = 0; i < 42; i += 1) {
          let dayNumber;
          let cellDate;
          let isOutside = false;

          if (i < firstDay) {
            dayNumber = prevMonthDays - firstDay + i + 1;
            cellDate = new Date(year, month - 1, dayNumber);
            isOutside = true;
          } else if (i >= firstDay + daysInMonth) {
            dayNumber = i - firstDay - daysInMonth + 1;
            cellDate = new Date(year, month + 1, dayNumber);
            isOutside = true;
          } else {
            dayNumber = i - firstDay + 1;
            cellDate = new Date(year, month, dayNumber);
          }

          const iso = toIsoDate(cellDate);
          const classes = ['booking-date-day'];
          if (isOutside) classes.push('is-outside');
          if (iso === todayIso) classes.push('is-today');
          if (iso === selected) classes.push('is-selected');
          const disabled = startOfDay(cellDate) < todayDate;
          if (disabled) classes.push('is-disabled');
          cells.push(
            `<button type="button" class="${classes.join(' ')}" data-date="${iso}"${disabled ? ' disabled' : ''}>${dayNumber}</button>`
          );
        }
        grid.innerHTML = cells.join('');
        root._renderedMonth = monthKey;
      };

      if (!grid._dateBound) {
        grid._dateBound = true;
        grid.addEventListener('click', (event) => {
          const btn = event.target.closest('[data-date]');
          if (!btn || btn.disabled) return;
          const iso = btn.dataset.date;
          input.value = iso;
          syncDisplay();
          closeDatePicker(root);
          const form = root.closest('form');
          if (form) notifyFilterChange(form);
        });
      }

      const openDatePicker = () => {
        const form = root.closest('form');
        closeDatePickers(root);
        if (form) {
          closeFilterPanel(form);
          const suggestRoot = qs('[data-suggest]', form);
          if (suggestRoot && typeof closeSuggest === 'function') closeSuggest(suggestRoot);
        }
        const parsed = parseIsoDate(input.value);
        if (parsed) viewDate = new Date(parsed.getFullYear(), parsed.getMonth(), 1);
        root.classList.add('is-open');
        panel.classList.add('is-open');
        trigger.setAttribute('aria-expanded', 'true');
        panel.setAttribute('aria-hidden', 'false');
        widget?.classList.add('is-date-open');
        renderMonth();
        positionDatePanel(root, panel);
      };

      const toggleDatePicker = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (root.classList.contains('is-open')) closeDatePicker(root);
        else openDatePicker();
      };

      trigger.addEventListener('click', toggleDatePicker);
      root.addEventListener('click', (event) => {
        if (event.target.closest('[data-date-trigger], [data-date-panel]')) return;
        if (event.target.closest('button, a, input, select, textarea, label')) return;
        toggleDatePicker(event);
      });

      qs('[data-date-prev]', panel)?.addEventListener('click', (event) => {
        event.stopPropagation();
        viewDate.setMonth(viewDate.getMonth() - 1);
        renderMonth(true);
        positionDatePanel(root, panel);
      });

      qs('[data-date-next]', panel)?.addEventListener('click', (event) => {
        event.stopPropagation();
        viewDate.setMonth(viewDate.getMonth() + 1);
        renderMonth(true);
        positionDatePanel(root, panel);
      });

      qs('[data-date-clear]', panel)?.addEventListener('click', (event) => {
        event.stopPropagation();
        input.value = '';
        syncDisplay();
        closeDatePicker(root);
        const form = root.closest('form');
        if (form) notifyFilterChange(form);
      });

      qs('[data-date-today]', panel)?.addEventListener('click', (event) => {
        event.stopPropagation();
        input.value = todayIso;
        viewDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), 1);
        syncDisplay();
        renderMonth(true);
        closeDatePicker(root);
        const form = root.closest('form');
        if (form) notifyFilterChange(form);
      });

      input.addEventListener('change', syncDisplay);
      root._syncDateDisplay = syncDisplay;
      root._repositionDatePanel = () => positionDatePanel(root, panel);
      renderMonth(true);
    });
  }

  function repositionOpenDatePanels() {
    qsa('[data-date-picker].is-open').forEach((root) => {
      root._repositionDatePanel?.();
    });
  }

  window.addEventListener('resize', repositionOpenDatePanels, { passive: true });
  window.addEventListener('scroll', repositionOpenDatePanels, { passive: true, capture: true });

  initDatePickers();

  function updateApplyPreview(form) {
    const btn = qs('[data-filter-apply]', form);
    const hint = qs('[data-filter-hint]', form);
    if (!btn) return;
    const panel = qs('[data-filter-panel]', form);
    if (panel && !panel.classList.contains('is-open')) return;
    const fallback = btn.dataset.applyLabel || btn.textContent.trim();
    if (!btn.dataset.applyLabel) btn.dataset.applyLabel = fallback;
    const template = btn.dataset.showTrips || 'Show %s trips';
    const emptyLabel = btn.dataset.noTrips || 'No matching trips';
    clearTimeout(form._previewTimer);
    form._previewAbort?.abort();
    form._previewTimer = setTimeout(async () => {
      const params = collectFilterParams(form);
      const controller = new AbortController();
      form._previewAbort = controller;
      const data = await fetch(`/api/search-preview?${params.toString()}`, {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      })
        .then((response) => response.json())
        .catch((error) => (error.name === 'AbortError' ? null : { count: 0 }));
      if (!data || !btn.isConnected) return;
      const count = Number(data.count) || 0;
      btn.textContent = count === 1
        ? (btn.dataset.showTrip || 'Show 1 trip')
        : count
          ? template.replace('%s', String(count))
          : emptyLabel;
      btn.classList.toggle('is-empty', count === 0);
      if (hint) hint.hidden = true;
    }, 180);
  }

  function refreshOpenExplorer(form) {
    const root = qs('[data-suggest]', form);
    if (!root || !isSuggestOpen(root) || typeof root._runSuggest !== 'function') return;
    const query = String(qs('[data-suggest-input]', root)?.value || '').trim();
    root._runSuggest(query, true);
  }

  qsa('[data-filter-form]').forEach((form) => {
    bindEasyFilters(form);
    updateFilterBadge(form);
    syncFilterPills(form);
    syncPricePresets(form);
    syncBedsPills(form);

    form.elements.beds?.addEventListener('change', () => {
      syncBedsPills(form);
      notifyFilterChange(form);
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      location.href = buildFilterUrl(form);
    });

    qs('[data-filter-toggle]', form)?.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleFilterPanel(form);
      if (qs('[data-filter-panel]', form)?.classList.contains('is-open')) {
        updateApplyPreview(form);
      }
    });

    qs('[data-filter-clear]', form)?.addEventListener('click', () => {
      clearAdvancedFilters(form);
      const panelOpen = qs('[data-filter-panel]', form)?.classList.contains('is-open');
      const hasQuery = Boolean(location.search);
      if (form.dataset.filterVariant === 'list' && hasQuery) {
        navigateKeepPrimary(form);
        return;
      }
      if (panelOpen) closeFilterPanel(form);
    });

    qs('[data-filter-clear-chips]', form)?.addEventListener('click', () => navigateClearAll(form));

    qsa('[data-chip-remove]', form).forEach((chip) => {
      chip.addEventListener('click', () => navigateWithoutParam(form, chip.dataset.chipRemove));
    });

    qsa('[data-filter-field]', form).forEach((field) => {
      if (field.matches('[data-suggest-input], [data-price-input]')) return;
      field.addEventListener('input', () => notifyFilterChange(form));
      field.addEventListener('change', () => notifyFilterChange(form));
    });

    qsa('[data-stepper]', form).forEach((btn) => {
      btn.addEventListener('click', () => {
        const wrap = btn.closest('[data-stepper-group]');
        const input = wrap ? qs('[data-stepper-input]', wrap) : qs('[data-stepper-input]', form);
        if (!input) return;
        const min = Number(input.min) || 1;
        const max = Number(input.max) || 99;
        const current = Number(input.value) || min;
        const next = btn.dataset.stepper === 'plus' ? Math.min(max, current + 1) : Math.max(min, current - 1);
        input.value = String(next);
        notifyFilterChange(form);
      });
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (qsa('[data-suggest].is-exploring').length) return;
    if (qsa('[data-date-picker].is-open').length) {
      closeDatePickers();
      return;
    }
    qsa('[data-filter-form]').forEach((form) => closeFilterPanel(form));
  });

  document.addEventListener('click', (event) => {
    if (event.target.closest('[data-date-trigger], [data-date-picker], [data-date-panel]')) return;
    qsa('[data-date-picker].is-open').forEach((root) => {
      const panel = root._datePanel;
      if (panel?.contains(event.target)) return;
      closeDatePicker(root);
    });
    qsa('[data-filter-form]').forEach((form) => {
      const panel = qs('[data-filter-panel]', form);
      if (!panel?.classList.contains('is-open')) return;
      if (form.contains(event.target)) return;
      closeFilterPanel(form);
    });
  });

  qsa('[data-open-sheet]').forEach((btn) => {
    btn.addEventListener('click', () => qs(btn.dataset.openSheet)?.classList.add('is-open'));
  });

  const suggestCopy =
    document.documentElement.lang === 'ar'
      ? {
          destinations: 'الوجهات',
          deals: 'عروض مطابقة',
          popularDestinations: 'وجهات شائعة',
          featuredDeals: 'عروض مميزة',
          empty: 'لا توجد وجهات أو عروض مطابقة',
          trips: 'رحلات',
          trip: 'رحلة',
          offer: 'عرض',
          currency: 'ج.م',
        }
      : {
          destinations: 'Destinations',
          deals: 'Matching deals',
          popularDestinations: 'Popular destinations',
          featuredDeals: 'Featured deals',
          empty: 'No matching destinations or deals',
          trips: 'trips',
          trip: 'trip',
          offer: 'Offer',
          currency: 'EGP',
        };

  const suggestLang = document.documentElement.lang === 'ar' ? 'ar' : 'en';

  function formatSuggestPrice(value) {
    const amount = Number(value || 0).toLocaleString(suggestLang === 'ar' ? 'ar-EG' : 'en-US');
    return suggestLang === 'ar' ? `${amount} ${suggestCopy.currency}` : `${amount} ${suggestCopy.currency}`;
  }

  function destTitle(dest) {
    if (suggestLang === 'ar') return dest.nameAr || dest.label || dest.nameEn || dest.name || '';
    return dest.nameEn || dest.label || dest.name || dest.nameAr || '';
  }

  function dealTitle(deal) {
    if (suggestLang === 'ar') return deal.titleAr || deal.title || '';
    return deal.title || '';
  }

  function dealDestination(root, deal) {
    if (suggestLang === 'ar') {
      if (deal.destinationAr) return deal.destinationAr;
      const needle = String(deal.destinationEn || deal.destination || '').toLowerCase();
      const found = destIndex(root).find((item) => String(item.nameEn || item.name || '').toLowerCase() === needle);
      return found?.nameAr || found?.label || deal.destination || '';
    }
    return deal.destinationEn || deal.destination || '';
  }

  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function isExplorer(root) {
    return root.dataset.suggestMode === 'explorer';
  }

  function isSuggestOpen(root) {
    return root.classList.contains('is-exploring');
  }

  function suggestTarget(root) {
    return qs('[data-suggest-body]', root) || qs('[data-suggest-panel]', root);
  }

  function clearSuggestContent(root) {
    const panel = qs('[data-suggest-panel]', root);
    const body = qs('[data-suggest-body]', root);
    if (body) body.innerHTML = '';
    else if (panel) {
      panel.hidden = true;
      panel.innerHTML = '';
    }
  }

  function closeSuggest(root) {
    if (!root) return;
    const panel = qs('[data-suggest-panel]', root);
    if (!panel) return;
    root.classList.remove('is-exploring');
    root.dataset.activeIndex = '-1';
    panel.setAttribute('aria-hidden', 'true');
    qs('[data-suggest-input]', root)?.setAttribute('aria-expanded', 'false');
    clearTimeout(root._suggestClose);
    const finish = () => {
      if (isSuggestOpen(root)) return;
    };
    if (isExplorer(root) && !prefersReducedMotion()) {
      root._suggestClose = setTimeout(finish, 120);
    } else {
      finish();
    }
  }

  function openSuggest(root) {
    const panel = qs('[data-suggest-panel]', root);
    if (!panel) return;
    clearTimeout(root._suggestClose);
    panel.setAttribute('aria-hidden', 'false');
    qs('[data-suggest-input]', root)?.setAttribute('aria-expanded', 'true');
    if (!isExplorer(root)) {
      panel.hidden = false;
      root.classList.add('is-exploring');
      return;
    }
    if (isSuggestOpen(root)) return;
    void panel.offsetHeight;
    root.classList.add('is-exploring');
  }

  function suggestionItems(scope) {
    return qsa('[data-suggest-item]', scope);
  }

  function scrollSuggestionIntoView(item) {
    const container =
      item.closest('.suggest-col') ||
      item.closest('[data-suggest-body]') ||
      item.closest('[data-suggest-panel]');
    if (!container) return;
    const itemRect = item.getBoundingClientRect();
    const box = container.getBoundingClientRect();
    if (itemRect.top < box.top) container.scrollTop -= box.top - itemRect.top + 6;
    else if (itemRect.bottom > box.bottom) container.scrollTop += itemRect.bottom - box.bottom + 6;
  }

  function setActiveSuggestion(root, index) {
    const items = suggestionItems(suggestTarget(root) || root);
    if (!items.length) return;
    const next = (index + items.length) % items.length;
    items.forEach((item, i) => item.classList.toggle('is-active', i === next));
    scrollSuggestionIntoView(items[next]);
    root.dataset.activeIndex = String(next);
  }

  function bindSuggestionActions(root, scope) {
    qsa('[data-suggest-dest]', scope).forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.dataset.suggestDest;
        const input = qs('[data-suggest-input]', root);
        const form = root.closest('form') || root;
        if (input) {
          const label = btn.querySelector('.suggest-item-title');
          input.value = label ? label.textContent.trim() : name;
        }
        const destField = form.querySelector('[data-dest-hidden]') || form.elements?.destination;
        if (destField) destField.value = name;
        closeSuggest(root);
        if (form?.tagName === 'FORM') {
          location.href = buildFilterUrl(form);
        }
      });
    });
  }

  function containSuggestScroll(root) {
    if (root._suggestScrollBound) return;
    root._suggestScrollBound = true;
    const panel = qs('[data-suggest-panel]', root);
    if (!panel) return;

    const scrollParent = (node) =>
      node.closest('.suggest-col') ||
      qs('[data-suggest-body]', root) ||
      panel;

    panel.addEventListener(
      'wheel',
      (event) => {
        const col = scrollParent(event.target);
        if (!col) return;
        const max = col.scrollHeight - col.clientHeight;
        if (max <= 1) {
          event.preventDefault();
          return;
        }
        const atTop = col.scrollTop <= 0 && event.deltaY < 0;
        const atBottom = col.scrollTop >= max - 1 && event.deltaY > 0;
        if (atTop || atBottom) event.preventDefault();
      },
      { passive: false }
    );
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function renderSuggestions(root, data) {
    const panel = qs('[data-suggest-panel]', root);
    const target = suggestTarget(root);
    if (!panel || !target) return;
    const dests = data.destinations || [];
    const deals = data.deals || [];
    const popular = Boolean(data.popular);
    const destLabel = popular ? suggestCopy.popularDestinations : suggestCopy.destinations;
    const dealLabel = popular ? suggestCopy.featuredDeals : suggestCopy.deals;
    const explorer = isExplorer(root);

    if (!dests.length && !deals.length) {
      target.innerHTML = `<p class="suggest-empty">${escapeHtml(suggestCopy.empty)}</p>`;
      openSuggest(root);
      return;
    }

    if (explorer) {
      let destHtml = `<p class="suggest-label">${escapeHtml(destLabel)}</p>`;
      dests.forEach((dest) => {
        const title = destTitle(dest);
        destHtml += `<button type="button" class="suggest-item" data-suggest-item data-suggest-dest="${escapeHtml(dest.name)}">
          <span class="suggest-pin" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2.2" fill="currentColor"/></svg>
          </span>
          <span>
            <span class="suggest-item-title" dir="auto">${escapeHtml(title)}</span>
            ${dest.count == null ? '' : `<span class="suggest-item-meta">${Number(dest.count) || 0} ${escapeHtml(Number(dest.count) === 1 ? suggestCopy.trip : suggestCopy.trips)}</span>`}
          </span>
        </button>`;
      });
      let dealHtml = `<p class="suggest-label">${escapeHtml(dealLabel)}</p><div class="suggest-deal-grid">`;
      deals.forEach((deal) => {
        const destName = dealDestination(root, deal);
        const offerSuffix = deal.offer ? ` · ${suggestCopy.offer}` : '';
        dealHtml += `<a class="suggest-deal-card" href="/trips/${encodeURIComponent(deal.id)}" data-suggest-item>
          <img src="${escapeHtml(deal.image)}" alt="" />
          <span class="suggest-deal-body">
            <span class="suggest-item-title" dir="auto">${escapeHtml(dealTitle(deal))}</span>
            <span class="suggest-item-meta" dir="auto">${escapeHtml(destName)}${escapeHtml(offerSuffix)}</span>
            <span class="suggest-item-price">${escapeHtml(formatSuggestPrice(deal.price))}</span>
          </span>
        </a>`;
      });
      dealHtml += '</div>';
      target.innerHTML = `<div class="suggest-split">
        <div class="suggest-col suggest-col-dest">${destHtml || ''}</div>
        <div class="suggest-col suggest-col-deals">${deals.length ? dealHtml : `<p class="suggest-empty">${escapeHtml(suggestCopy.empty)}</p>`}</div>
      </div>`;
    } else {
      let html = '';
      if (dests.length) {
        html += `<p class="suggest-label">${escapeHtml(destLabel)}</p>`;
        dests.forEach((dest) => {
          const title = destTitle(dest);
          html += `<button type="button" class="suggest-item" data-suggest-item data-suggest-dest="${escapeHtml(dest.name)}">
            <span class="suggest-pin" aria-hidden="true">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="10" r="2.2" fill="currentColor"/></svg>
            </span>
            <span>
              <span class="suggest-item-title" dir="auto">${escapeHtml(title)}</span>
              ${dest.count == null ? '' : `<span class="suggest-item-meta">${Number(dest.count) || 0} ${escapeHtml(Number(dest.count) === 1 ? suggestCopy.trip : suggestCopy.trips)}</span>`}
            </span>
          </button>`;
        });
      }
      if (deals.length) {
        html += `<p class="suggest-label">${escapeHtml(dealLabel)}</p>`;
        deals.forEach((deal) => {
          html += `<a class="suggest-item" href="/trips/${encodeURIComponent(deal.id)}" data-suggest-item>
            <img src="${escapeHtml(deal.image)}" alt="" />
            <span>
              <span class="suggest-item-title" dir="auto">${escapeHtml(dealTitle(deal))}</span>
              <span class="suggest-item-meta" dir="auto">${escapeHtml(dealDestination(root, deal))}</span>
            </span>
            <span class="suggest-item-price">${escapeHtml(formatSuggestPrice(deal.price))}</span>
          </a>`;
        });
      }
      target.innerHTML = html;
    }

    openSuggest(root);
    root.dataset.activeIndex = '-1';
    bindSuggestionActions(root, target);
  }

  function destIndex(root) {
    if (root._destIndex) return root._destIndex;
    const node = (root.closest('form') || root).querySelector('[data-dest-index]');
    try {
      root._destIndex = node ? JSON.parse(node.textContent || '[]') : [];
    } catch {
      root._destIndex = [];
    }
    return root._destIndex;
  }

  function matchDestItem(item, needle) {
    if (!needle) return true;
    const hay = [item.label, item.name, item.nameEn, item.nameAr, ...(item.aliases || [])]
      .join(' ')
      .toLowerCase();
    return hay.includes(needle);
  }

  function instantSuggestData(root, q) {
    const needle = String(q || '').trim().toLowerCase();
    const dests = destIndex(root);
    const cached = root._suggestCache || { destinations: [], deals: [] };
    if (!needle) {
      const popular = dests.filter((item) => item.popular).slice(0, 8);
      return {
        popular: true,
        destinations: (cached.destinations && cached.destinations.length) ? cached.destinations : (popular.length ? popular : dests.slice(0, 8)),
        deals: cached.deals || [],
      };
    }
    const localDests = dests.filter((item) => matchDestItem(item, needle)).slice(0, 8);
    const deals = (cached.deals || []).filter((deal) => {
      const hay = `${deal.title || ''} ${deal.destination || ''}`.toLowerCase();
      return hay.includes(needle);
    });
    return { popular: false, destinations: localDests, deals };
  }

  function collectSuggestParams(form) {
    const params = new URLSearchParams();
    params.set('lang', suggestLang);
    if (!form) return params;
    if (form.dataset.lockType === 'leisure') params.set('type', 'leisure');
    else if (form.dataset.lockType === 'umrah') {
      const selected = String(form.elements.tripType?.value || '').trim();
      params.set('type', selected === 'hajj' || selected === 'umrah' ? selected : 'sacred');
    }
    if (form.dataset.offersOnly === '1') params.set('offersOnly', '1');
    return params;
  }

  function fetchSuggestions(root, q) {
    const form = root.closest('[data-filter-form]') || root.closest('form');
    const params = collectSuggestParams(form);
    params.set('q', q);
    root._suggestAbort?.abort();
    const controller = new AbortController();
    root._suggestAbort = controller;
    return fetch(`/api/suggest?${params.toString()}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then((response) => response.json().catch(() => ({ destinations: [], deals: [] })))
      .catch((error) => (error.name === 'AbortError' ? null : { destinations: [], deals: [] }));
  }

  qsa('[data-suggest]').forEach((root) => {
    const input = qs('[data-suggest-input]', root);
    const panel = qs('[data-suggest-panel]', root);
    if (!input || !panel) return;
    containSuggestScroll(root);

    const runSuggest = (q, immediate = false) => {
      clearTimeout(root._suggestTimer);
      const instant = instantSuggestData(root, q);
      if (instant.destinations.length || instant.deals.length || !q) {
        renderSuggestions(root, instant);
      } else {
        openSuggest(root);
      }
      const load = async () => {
        const data = await fetchSuggestions(root, q);
        if (!data || input.value.trim() !== q) return;
        root._suggestCache = data;
        renderSuggestions(root, data);
      };
      if (immediate) load();
      else root._suggestTimer = setTimeout(load, 40);
    };
    root._runSuggest = runSuggest;

    input.addEventListener('input', () => {
      const form = root.closest('form');
      const destField = form?.querySelector('[data-dest-hidden]');
      if (destField) destField.value = '';
      runSuggest(input.value.trim());
      if (form) updateFilterBadge(form);
    });

    input.addEventListener('focus', () => {
      const form = root.closest('form');
      if (form) {
        closeFilterPanel(form);
        closeDatePickers();
      }
      runSuggest(input.value.trim(), true);
    });

    input.addEventListener('keydown', (event) => {
      if (!isSuggestOpen(root) && panel.hidden) return;
      const items = suggestionItems(suggestTarget(root) || panel);
      const current = Number(root.dataset.activeIndex || -1);
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActiveSuggestion(root, current + 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActiveSuggestion(root, current - 1);
      } else if (event.key === 'Enter' && current >= 0 && items[current]) {
        event.preventDefault();
        items[current].click();
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeSuggest(root);
      }
    });
  });

  const scheduleIdle = window.requestIdleCallback || ((fn) => setTimeout(fn, 80));
  scheduleIdle(() => {
    qsa('[data-suggest]').forEach((root) => {
      fetchSuggestions(root, '').then((data) => {
        if (data) root._suggestCache = data;
      });
    });
  });

  document.addEventListener('click', (event) => {
    qsa('[data-suggest]').forEach((root) => {
      if (!root.contains(event.target)) closeSuggest(root);
    });
  });

  async function postForm(form) {
    const hasFiles = [...form.querySelectorAll('input[type="file"]')].some((input) => input.files?.length > 0);
    const headers = {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    };
    let body;
    if (hasFiles) {
      body = new FormData(form);
    } else {
      body = new URLSearchParams(new FormData(form));
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }
    const response = await fetch(form.action, {
      method: 'POST',
      credentials: 'same-origin',
      headers,
      body,
    });
    const data = await response.json().catch(() => ({ ok: response.ok }));
    return { ok: response.ok && data.ok !== false, data, status: response.status };
  }

  qs('#sign-in-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const signinError = qs('#signin-error');
    const showSigninError = (message) => {
      if (signinError) {
        signinError.textContent = message;
        signinError.hidden = false;
        return;
      }
      toast(message);
    };
    if (signinError) {
      signinError.hidden = true;
      signinError.textContent = '';
    }
    const { ok, data } = await postForm(event.currentTarget);
    if (!ok) {
      showSigninError(data.message || 'Unable to sign in');
      return;
    }
    toast("You're signed in successfully.", 'Welcome back to Safarny.');
    const queryRedirect = new URLSearchParams(location.search).get('redirect') || '';
    const redirectTarget = data.redirect || queryRedirect || '/';
    location.replace(redirectTarget);
  });

  qsa('#sign-in-form input').forEach((input) => {
    input.addEventListener('input', () => {
      const signinError = qs('#signin-error');
      if (signinError) {
        signinError.hidden = true;
        signinError.textContent = '';
      }
    });
  });

  qs('#sign-up-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const { ok, data } = await postForm(event.currentTarget);
    if (data.view === 'accountExists') {
      showAuthView('accountExists');
      return;
    }
    if (!ok) {
      toast(data.message || 'Unable to sign up');
      return;
    }
    toast('Your account has been created successfully.');
    location.reload();
  });

  qs('#forgot-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await postForm(event.currentTarget);
    showAuthView('verify');
  });

  qs('#verify-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const { ok, data } = await postForm(event.currentTarget);
    if (!ok) {
      toast(data.message || 'Invalid or expired reset code.');
      return;
    }
    showAuthView('reset');
  });

  qs('#reset-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await postForm(event.currentTarget);
    toast('Password reset successfully!');
    closeDialog('#signin-dialog');
  });

  qs('#sign-out-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    await postForm(event.currentTarget);
    location.href = '/';
  });

  qs('#profile-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const { ok } = await postForm(event.currentTarget);
    if (ok) {
      toast('Profile updated');
      location.reload();
    }
  });

  qs('#contact-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const { ok } = await postForm(event.currentTarget);
    if (ok) toast('Message sent', 'We will get back to you shortly.');
  });

  qs('#booking-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const { ok, data } = await postForm(event.currentTarget);
    if (data.authRequired) {
      closeDialog('#booking-dialog');
      openDialog('#signin-dialog');
      return;
    }
    if (ok) {
      toast('Booking Request Submitted!', 'Our team will contact you shortly to complete the details.');
      closeDialog('#booking-dialog');
    }
  });

  qsa('[data-favorite]').forEach((btn) => {
    btn.addEventListener('click', async (event) => {
      event.preventDefault();
      const id = btn.dataset.favorite;
      const response = await fetch(`/favorites/${id}`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      });
      const data = await response.json();
      const path = btn.querySelector('path');
      if (path) path.setAttribute('fill', data.favorite ? '#EF7722' : 'none');
    });
  });

  qsa('[data-gallery]').forEach((gallery) => {
    const main = qs('[data-gallery-main]', gallery);
    const thumbsScroller = qs('[data-gallery-thumbs]', gallery);
    const thumbsWrap = qs('[data-gallery-thumbs-wrap]', gallery);

    const scrollThumbIntoView = (thumb) => {
      if (!thumbsScroller || !thumb) return;
      const thumbTop = thumb.offsetTop;
      const thumbBottom = thumbTop + thumb.offsetHeight;
      const viewTop = thumbsScroller.scrollTop;
      const viewBottom = viewTop + thumbsScroller.clientHeight;
      if (thumbTop < viewTop + 4) {
        thumbsScroller.scrollTo({ top: Math.max(0, thumbTop - 8), behavior: 'smooth' });
      } else if (thumbBottom > viewBottom - 4) {
        thumbsScroller.scrollTo({
          top: thumbBottom - thumbsScroller.clientHeight + 8,
          behavior: 'smooth',
        });
      }
    };

    const updateThumbFades = () => {
      if (!thumbsWrap || !thumbsScroller) return;
      const { scrollTop, scrollHeight, clientHeight } = thumbsScroller;
      const canScroll = scrollHeight > clientHeight + 2;
      thumbsWrap.classList.toggle('can-scroll-up', canScroll && scrollTop > 4);
      thumbsWrap.classList.toggle('can-scroll-down', canScroll && scrollTop + clientHeight < scrollHeight - 4);
    };

    if (thumbsScroller) {
      thumbsScroller.addEventListener('scroll', updateThumbFades, { passive: true });
      window.addEventListener('resize', updateThumbFades, { passive: true });
      updateThumbFades();
    }

    qsa('[data-gallery-thumb]', gallery).forEach((thumb) => {
      thumb.addEventListener('click', () => {
        if (thumb.classList.contains('is-active')) return;
        qsa('[data-gallery-thumb]', gallery).forEach((item) => item.classList.remove('is-active'));
        thumb.classList.add('is-active');
        main.classList.add('is-changing');
        window.setTimeout(() => {
          main.style.backgroundImage = thumb.style.backgroundImage;
          main.classList.remove('is-changing');
        }, 180);
        scrollThumbIntoView(thumb);
      });
    });
  });

  qsa('[data-trip-select]').forEach((root) => {
    const toggle = qs('[data-trip-toggle]', root);
    const menu = qs('[data-trip-menu]', root);
    const card = qs('.trip-date-card', root);

    const closeMenu = () => {
      menu?.classList.remove('is-open');
      toggle?.setAttribute('aria-expanded', 'false');
      menu?.setAttribute('aria-hidden', 'true');
    };

    const openMenu = () => {
      menu?.classList.add('is-open');
      toggle?.setAttribute('aria-expanded', 'true');
      menu?.setAttribute('aria-hidden', 'false');
    };

    toggle?.addEventListener('click', (event) => {
      event.stopPropagation();
      if (menu?.classList.contains('is-open')) closeMenu();
      else openMenu();
    });

    document.addEventListener('click', (event) => {
      if (!card?.contains(event.target)) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });

    const typeNames = {
      single: document.documentElement.lang === 'ar' ? 'فردية' : 'Single',
      double: document.documentElement.lang === 'ar' ? 'مزدوجة' : 'Double',
      triple: document.documentElement.lang === 'ar' ? 'ثلاثية' : 'Triple',
      quad: document.documentElement.lang === 'ar' ? 'رباعية' : 'Quadruple',
    };
    const sleepsLabel = document.documentElement.lang === 'ar' ? 'تسع {n} ضيوف' : 'sleeps {n}';
    const roomPriceLabel = document.documentElement.lang === 'ar' ? 'للغرفة' : 'room';
    const currencyLabel = document.documentElement.lang === 'ar' ? 'ج.م' : 'EGP';

    function selectedRoomType() {
      return qs('[data-trip-room].is-selected', root)?.dataset.roomType
        || qs('[data-trip-option].is-selected', root)?.dataset.defaultRoom
        || '';
    }

    function parseRooms(option) {
      try {
        const parsed = JSON.parse(option?.dataset.rooms || '[]');
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }

    function renderRooms(option) {
      const list = qs('[data-trip-room-list]', root);
      if (!list) return;
      const rooms = parseRooms(option);
      const current = selectedRoomType() || option?.dataset.defaultRoom || rooms[0]?.type;
      list.innerHTML = rooms.map((room) => {
        const selected = room.type === current ? ' is-selected' : '';
        return `<button type="button" class="trip-room-picker-card${selected}" data-trip-room data-room-type="${room.type}" data-price="${room.price || 0}" data-max-rooms="${room.maxRooms || 0}" data-occupancy="${room.occupancy || 1}">
          <strong>${typeNames[room.type] || room.type}</strong>
          <span>${Number(room.price || 0).toLocaleString()} ${currencyLabel} / ${roomPriceLabel}</span>
          <em>${sleepsLabel.replace('{n}', String(room.occupancy || 1))}</em>
        </button>`;
      }).join('');
    }

    const syncBookingDate = (date, dateId, maxRooms, roomType) => {
      const hiddenInput = qs('#booking-travel-date');
      const bookingDateEl = qs('#booking-selected-date');
      if (hiddenInput) hiddenInput.value = date;
      if (bookingDateEl) bookingDateEl.textContent = date;
      const roomCard = qs('[data-trip-room].is-selected', root);
      const roomMax = Number(roomCard?.dataset.maxRooms ?? 0);
      const dateMax = Number(maxRooms ?? 0);
      const canBook = Math.max(0, roomMax, dateMax) > 0;
      const checkoutLink = qs('#trip-checkout-link');
      const checkoutMobile = qs('#trip-checkout-link-mobile');
      const tripId = checkoutLink?.getAttribute('href')?.match(/\/trips\/([^/]+)\//)?.[1]
        || checkoutMobile?.getAttribute('href')?.match(/\/trips\/([^/]+)\//)?.[1];
      const lang = document.documentElement.lang || 'en';
      const soldOutLabel = lang === 'ar' ? 'نفدت الأماكن لهذا التاريخ' : 'Sold out for this date';
      const bookLabel = lang === 'ar' ? 'احجز' : 'Book';
      const type = roomType || selectedRoomType();
      if (tripId && dateId) {
        const url = canBook
          ? `/trips/${tripId}/checkout?dateId=${encodeURIComponent(dateId)}&roomType=${encodeURIComponent(type || '')}&rooms=1`
          : '#';
        if (checkoutLink) {
          checkoutLink.href = url;
          checkoutLink.classList.toggle('is-disabled', !canBook);
          checkoutLink.setAttribute('aria-disabled', canBook ? 'false' : 'true');
          const textNode = checkoutLink.childNodes[0];
          if (textNode) textNode.textContent = canBook ? `${bookLabel} ` : soldOutLabel;
        }
        if (checkoutMobile) {
          checkoutMobile.href = url;
          checkoutMobile.classList.toggle('is-disabled', !canBook);
          checkoutMobile.setAttribute('aria-disabled', canBook ? 'false' : 'true');
          const priceLabel = checkoutMobile.dataset.priceLabel || '';
          checkoutMobile.textContent = canBook ? `${bookLabel} — ${priceLabel}` : soldOutLabel;
        }
      }
    };

    root.addEventListener('click', (event) => {
      const roomBtn = event.target.closest('[data-trip-room]');
      if (!roomBtn || !root.contains(roomBtn)) return;
      qsa('[data-trip-room]', root).forEach((item) => item.classList.toggle('is-selected', item === roomBtn));
      const selectedDate = qs('[data-trip-option].is-selected', root);
      syncBookingDate(selectedDate?.dataset.date, selectedDate?.dataset.dateId, roomBtn.dataset.maxRooms, roomBtn.dataset.roomType);
    });

    qsa('[data-trip-option]', root).forEach((option) => {
      option.addEventListener('click', () => {
        const date = option.dataset.date;
        const dateId = option.dataset.dateId;
        const spots = option.dataset.spots;
        const maxRooms = option.dataset.maxRooms;
        const duration = option.dataset.duration;
        const dateEl = qs('[data-selected-date]', root);
        const spotsEl = qs('[data-selected-spots]', root);
        const durationEl = qs('[data-selected-duration]', root);
        if (dateEl) dateEl.textContent = date;
        if (spotsEl) spotsEl.textContent = spots;
        if (durationEl) durationEl.textContent = duration;
        qsa('[data-trip-option]', root).forEach((item) => {
          item.classList.toggle('is-selected', item === option);
        });
        renderRooms(option);
        syncBookingDate(date, dateId, maxRooms);
        closeMenu();
      });
    });

    const initial = qs('[data-trip-option].is-selected', root);
    if (initial?.dataset.date) syncBookingDate(initial.dataset.date, initial.dataset.dateId, initial.dataset.maxRooms);
  });

  qsa('.trip-details-page [data-scroll-reveal]').forEach((el) => {
    const observer = new MutationObserver(() => {
      if (!el.classList.contains('is-revealed')) return;
      el.querySelectorAll('.trip-itinerary-item, .trip-details-included-item').forEach((item) => {
        item.classList.add('is-revealed');
      });
      observer.disconnect();
    });
    observer.observe(el, { attributes: true, attributeFilter: ['class'] });
  });

  qsa('[data-drag-scroll]').forEach((scroller) => {
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;
    let velocity = 0;
    let lastX = 0;
    let lastTime = 0;
    let momentumId = 0;

    const stopMomentum = () => {
      if (momentumId) cancelAnimationFrame(momentumId);
      momentumId = 0;
    };

    const runMomentum = () => {
      if (Math.abs(velocity) < 0.35) {
        stopMomentum();
        return;
      }
      scroller.scrollLeft -= velocity;
      velocity *= 0.92;
      momentumId = requestAnimationFrame(runMomentum);
    };

    scroller.addEventListener('mousedown', (event) => {
      stopMomentum();
      isDown = true;
      startX = event.pageX - scroller.offsetLeft;
      scrollLeft = scroller.scrollLeft;
      lastX = event.pageX;
      lastTime = performance.now();
      velocity = 0;
      scroller.classList.add('is-dragging');
    });

    ['mouseleave', 'mouseup'].forEach((type) => {
      scroller.addEventListener(type, () => {
        if (!isDown) return;
        isDown = false;
        scroller.classList.remove('is-dragging');
        if (Math.abs(velocity) > 0.5) runMomentum();
      });
    });

    scroller.addEventListener('mousemove', (event) => {
      if (!isDown) return;
      event.preventDefault();
      const now = performance.now();
      const deltaTime = Math.max(now - lastTime, 1);
      const x = event.pageX - scroller.offsetLeft;
      const walk = x - startX;
      scroller.scrollLeft = scrollLeft - walk * 1.15;
      velocity = ((event.pageX - lastX) / deltaTime) * 16;
      lastX = event.pageX;
      lastTime = now;
    });

    scroller.addEventListener(
      'wheel',
      (event) => {
        if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
        event.preventDefault();
        scroller.scrollLeft += event.deltaY * 0.85;
      },
      { passive: false }
    );
  });

  function initScrollReveal() {
    if (prefersReducedMotion()) {
      qsa('[data-scroll-reveal]').forEach((el) => el.classList.add('is-revealed'));
      qsa('[data-carousel]').forEach((el) => el.closest('.trips-carousel')?.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const delay = Number(el.dataset.revealDelay || 0);
          window.setTimeout(() => {
            el.classList.add('is-revealed');
            if (el.matches('[data-carousel]')) {
              el.closest('.trips-carousel')?.classList.add('is-revealed');
            }
          }, delay);
          observer.unobserve(el);
        });
      },
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' }
    );

    qsa('[data-scroll-reveal]').forEach((el, index) => {
      if (!el.dataset.revealDelay) el.dataset.revealDelay = String((index % 4) * 75);
      observer.observe(el);
    });
  }

  initScrollReveal();

  if (window.Swiper) {
    qsa('[data-carousel]').forEach((el) => {
      const isRtl = document.documentElement.dir === 'rtl';
      const root = el.closest('.trips-carousel');
      const prev = root?.querySelector('[data-carousel-prev]');
      const next = root?.querySelector('[data-carousel-next]');

      const syncNav = (swiper) => {
        if (!prev || !next) return;
        prev.disabled = swiper.isBeginning;
        next.disabled = swiper.isEnd;
        root?.classList.toggle('is-at-start', swiper.isBeginning);
        root?.classList.toggle('is-at-end', swiper.isEnd);
      };

      const swiper = new Swiper(el, {
        spaceBetween: 18,
        slidesPerView: 1.08,
        speed: 720,
        grabCursor: true,
        watchOverflow: true,
        resistanceRatio: 0.78,
        longSwipesRatio: 0.22,
        touchRatio: 1.15,
        threshold: 6,
        dir: isRtl ? 'rtl' : 'ltr',
        breakpoints: {
          640: { slidesPerView: 1.7, spaceBetween: 16 },
          768: { slidesPerView: 2.15, spaceBetween: 20 },
          1024: { slidesPerView: 3, spaceBetween: 22 },
          1280: { slidesPerView: 4, spaceBetween: 24 },
        },
        on: {
          init: (instance) => syncNav(instance),
          slideChange: (instance) => syncNav(instance),
          resize: (instance) => syncNav(instance),
        },
      });

      prev?.addEventListener('click', () => (isRtl ? swiper.slideNext() : swiper.slidePrev()));
      next?.addEventListener('click', () => (isRtl ? swiper.slidePrev() : swiper.slideNext()));
    });
  }

  qsa('[data-account-main-scroll]').forEach((panel) => {
    if (panel.classList.contains('account-main-scroll--embedded')) return;
    const updateScrollState = () => {
      const canScroll = panel.scrollHeight > panel.clientHeight + 4;
      panel.classList.toggle('is-scrollable', canScroll);
      panel.classList.toggle('is-at-top', panel.scrollTop <= 4);
      panel.classList.toggle('is-at-bottom', panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 4);
    };
    updateScrollState();
    panel.addEventListener('scroll', updateScrollState, { passive: true });
    window.addEventListener('resize', updateScrollState, { passive: true });
    if (window.ResizeObserver) {
      const ro = new ResizeObserver(updateScrollState);
      ro.observe(panel);
      Array.from(panel.children).forEach((child) => ro.observe(child));
    }
  });

  const renderSupportAttachmentsHtml = (attachments) => {
    if (!attachments?.length) return '';
    const items = attachments
      .map((att) => {
        if (att.type === 'image') {
          return `<a href="${escapeHtml(att.url)}" target="_blank" rel="noopener" class="support-attach support-attach--image"><img src="${escapeHtml(att.url)}" alt="${escapeHtml(att.name)}" loading="lazy" /></a>`;
        }
        const size = att.size ? `<span class="support-attach-size">${Math.round(att.size / 1024)} KB</span>` : '';
        return `<a href="${escapeHtml(att.url)}" target="_blank" rel="noopener" class="support-attach support-attach--file" download><span class="support-attach-icon" aria-hidden="true">📎</span><span class="support-attach-name">${escapeHtml(att.name)}</span>${size}</a>`;
      })
      .join('');
    return `<div class="support-attachments">${items}</div>`;
  };

  const initSupportAttachmentComposer = (form) => {
    const fileInput = form.querySelector('[data-support-file-input]');
    const preview = form.querySelector('[data-support-file-preview]');
    if (!fileInput || !preview) return () => {};

    const renderPreview = () => {
      preview.innerHTML = '';
      const files = [...(fileInput.files || [])];
      if (!files.length) {
        preview.hidden = true;
        return;
      }
      preview.hidden = false;
      files.forEach((file, index) => {
        const chip = document.createElement('div');
        chip.className = 'support-attach-chip';
        if (file.type.startsWith('image/')) {
          const img = document.createElement('img');
          img.src = URL.createObjectURL(file);
          img.alt = file.name;
          chip.appendChild(img);
        } else {
          chip.textContent = file.name;
        }
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'support-attach-chip-remove';
        remove.setAttribute('aria-label', 'Remove');
        remove.textContent = '×';
        remove.addEventListener('click', () => {
          const dt = new DataTransfer();
          files.forEach((item, itemIndex) => {
            if (itemIndex !== index) dt.items.add(item);
          });
          fileInput.files = dt.files;
          renderPreview();
        });
        chip.appendChild(remove);
        preview.appendChild(chip);
      });
    };

    fileInput.addEventListener('change', renderPreview);
    return () => {
      fileInput.value = '';
      preview.innerHTML = '';
      preview.hidden = true;
    };
  };

  const ticketThread = qs('#ticket-thread');
  const ticketReplyForm = qs('#ticket-reply-form');
  const ticketReplyInput = qs('#ticket-reply-input');
  const newTicketForm = qs('#new-ticket-form');
  const ticketsRoot = qs('[data-tickets-root]');

  const scrollTicketToBottom = () => {
    if (!ticketThread) return;
    ticketThread.scrollTop = ticketThread.scrollHeight;
  };

  const applyTicketFilter = () => {
    const activePill = qs('[data-ticket-filter-btn].is-active');
    const status = activePill?.dataset.ticketFilterBtn || 'all';
    const searchEl = qs('[data-ticket-search]');
    const query = (searchEl?.value || '').trim().toLowerCase();
    qsa('.account-tickets-chat, .account-tickets-item').forEach((item) => {
      const haystack = item.dataset.ticketSearch || '';
      const matchesFilter = status === 'all' || item.dataset.ticketStatus === status;
      const matchesSearch = !query || haystack.includes(query);
      item.style.display = matchesFilter && matchesSearch ? '' : 'none';
    });
  };

  qsa('[data-ticket-filter-btn]').forEach((btn) => {
    btn.addEventListener('click', () => {
      qsa('[data-ticket-filter-btn]').forEach((pill) => {
        pill.classList.remove('is-active');
        pill.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      applyTicketFilter();
    });
  });

  if (ticketThread) scrollTicketToBottom();

  const clearTicketAttachments = ticketReplyForm ? initSupportAttachmentComposer(ticketReplyForm) : () => {};

  ticketReplyInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      ticketReplyForm?.requestSubmit();
    }
  });

  ticketReplyForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = qs('textarea[name="text"]', ticketReplyForm);
    const fileInput = qs('[data-support-file-input]', ticketReplyForm);
    const text = input?.value.trim() || '';
    const hasFiles = fileInput?.files?.length > 0;
    if (!text && !hasFiles) return;
    const sendBtn = qs('.account-tickets-send', ticketReplyForm);
    if (sendBtn) sendBtn.disabled = true;
    const { ok, data, status } = await postForm(ticketReplyForm);
    if (sendBtn) sendBtn.disabled = false;
    if (!ok) {
      toast(data?.message || 'Unable to send reply. Please try again.');
      return;
    }
    input.value = '';
    clearTicketAttachments();
    const last = data.reply || data.replies?.[data.replies.length - 1];
    if (ticketThread && last) {
      const reply = document.createElement('div');
      reply.className = 'account-tickets-reply is-user';
      const textHtml = last.text ? `<p>${escapeHtml(last.text)}</p>` : '';
      reply.innerHTML = `<div class="account-tickets-reply-bubble">${textHtml}${renderSupportAttachmentsHtml(last.attachments)}<time>${escapeHtml(last.time)}</time></div>`;
      ticketThread.appendChild(reply);
      scrollTicketToBottom();
    }
    const activeId = ticketsRoot?.dataset.activeTicket;
    const item = activeId ? qs(`.account-tickets-chat[data-ticket-id="${activeId}"], .account-tickets-item[data-ticket-id="${activeId}"]`) : null;
    if (item) {
      const preview = qs('.account-tickets-chat-preview', item) || qs('.account-tickets-preview', item);
      if (preview) {
        const previewText = text || (last?.attachments?.length ? `${last.attachments.length} attachment(s)` : '');
        preview.innerHTML = `<span class="account-tickets-you">${escapeHtml('You')}:</span> ${escapeHtml(previewText)}`;
      }
      const time = qs('.account-tickets-chat-time', item);
      if (time) time.textContent = 'now';
    }
    toast('Reply sent');
  });

  newTicketForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const { ok, data } = await postForm(newTicketForm);
    if (!ok) {
      toast(data.message || 'Unable to create ticket');
      return;
    }
    closeDialog('#new-ticket-dialog');
    toast('Ticket submitted', 'Our support team will respond shortly.');
    location.href = data.redirect || '/tickets';
  });

  qs('[data-ticket-search]')?.addEventListener('input', applyTicketFilter);

  const avatarInput = qs('#avatar-input');
  const avatarForm = qs('#avatar-form');
  let pendingAvatar = null;

  avatarInput?.addEventListener('change', () => {
    const file = avatarInput.files?.[0];
    const avatarError = qs('#avatar-error');
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      if (avatarError) {
        avatarError.textContent = 'Image must be 2MB or smaller.';
        avatarError.hidden = false;
      }
      return;
    }
    if (avatarError) avatarError.hidden = true;
    const reader = new FileReader();
    reader.onload = () => {
      pendingAvatar = reader.result;
      const preview = qs('#avatar-preview');
      if (preview) preview.src = pendingAvatar;
    };
    reader.readAsDataURL(file);
  });

  avatarForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const avatarError = qs('#avatar-error');
    if (!pendingAvatar) {
      if (avatarError) {
        avatarError.textContent = 'Please choose a photo first.';
        avatarError.hidden = false;
      }
      return;
    }
    const response = await fetch('/auth/avatar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify({ avatar: pendingAvatar }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      if (avatarError) {
        avatarError.textContent = data.message || 'Unable to update photo.';
        avatarError.hidden = false;
      }
      return;
    }
    qsa('#account-nav-avatar, #profile-page-avatar, #avatar-preview, .site-avatar img').forEach((img) => {
      if (img && data.user?.avatar) img.src = data.user.avatar;
    });
    toast('Profile photo updated');
    pendingAvatar = null;
  });

  qs('#password-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const passwordError = qs('#password-error');
    const passwordSuccess = qs('#password-success');
    if (passwordError) passwordError.hidden = true;
    if (passwordSuccess) passwordSuccess.hidden = true;
    const body = {
      currentPassword: form.elements.currentPassword.value,
      newPassword: form.elements.newPassword.value,
      confirmPassword: form.elements.confirmPassword.value,
    };
    const response = await fetch('/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      if (passwordError) {
        passwordError.textContent = data.message || 'Unable to update password.';
        passwordError.hidden = false;
      }
      return;
    }
    form.reset();
    if (passwordSuccess) {
      passwordSuccess.textContent = data.message || 'Password updated successfully.';
      passwordSuccess.hidden = false;
    }
    toast('Password updated');
  });

  const companyApp = document.querySelector('.company-app');
  if (companyApp) {
    const toggleSidebar = (open) => {
      companyApp.classList.toggle('is-sidebar-open', open);
      const backdrop = qs('[data-cp-close]', companyApp);
      if (backdrop) backdrop.hidden = !open;
      document.body.classList.toggle('cp-sidebar-locked', open);
    };

    qs('[data-cp-toggle]', companyApp)?.addEventListener('click', () => {
      toggleSidebar(!companyApp.classList.contains('is-sidebar-open'));
    });
    qs('[data-cp-close]', companyApp)?.addEventListener('click', () => toggleSidebar(false));

    companyApp.querySelectorAll('.cp-nav a, .cp-sidebar-foot a').forEach((link) => {
      link.addEventListener('click', () => toggleSidebar(false));
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') toggleSidebar(false);
    });

    const content = qs('[data-cp-content]', companyApp);
    if (content) {
      const syncScrollState = () => {
        const scrollable = content.scrollHeight > content.clientHeight + 2;
        content.classList.toggle('is-scrollable', scrollable);
        content.classList.toggle('is-at-top', content.scrollTop <= 2);
        content.classList.toggle(
          'is-at-bottom',
          content.scrollTop + content.clientHeight >= content.scrollHeight - 2
        );
      };
      syncScrollState();
      content.addEventListener('scroll', syncScrollState, { passive: true });
      window.addEventListener('resize', syncScrollState);
      window.setTimeout(syncScrollState, 120);
    }

    const bookingChart = qs('[data-company-booking-chart]', companyApp);
    if (bookingChart) {
      const bars = qsa('.company-mchart-bar', bookingChart);
      bars.forEach((bar) => {
        bar.addEventListener('mouseenter', () => {
          bars.forEach((item) => item.classList.remove('is-active'));
          bar.classList.add('is-active');
        });
      });
      bookingChart.addEventListener('mouseleave', () => {
        bars.forEach((item) => item.classList.remove('is-active'));
      });
    }
  }

  const tripFilters = qs('[data-company-trip-filters]');
  if (tripFilters) {
    const form = qs('[data-company-trip-form]', tripFilters);
    const advanced = qs('[data-trip-advanced]', tripFilters);
    const advancedToggle = qs('[data-trip-advanced-toggle]', tripFilters);
    const advancedLabel = qs('[data-trip-advanced-label]', tripFilters);
    const viewInput = qs('[data-trip-view-input]', tripFilters);
    const statusInput = qs('[data-trip-status-input]', tripFilters);
    const statusSelect = qs('[data-trip-status-select]', tripFilters);
    const searchInput = qs('[data-trip-search]', tripFilters);
    let searchTimer;

    const submitForm = () => form?.requestSubmit();

    advancedToggle?.addEventListener('click', () => {
      if (!advanced) return;
      const isHidden = advanced.hasAttribute('hidden');
      advanced.toggleAttribute('hidden', !isHidden);
      if (advancedLabel) {
        advancedLabel.textContent = isHidden
          ? advancedLabel.dataset.less || 'Less filters'
          : advancedLabel.dataset.more || 'More filters';
      }
    });

    qsa('[data-trip-auto-submit]', tripFilters).forEach((field) => {
      field.addEventListener('change', submitForm);
    });

    statusSelect?.addEventListener('change', () => {
      if (statusInput) statusInput.value = statusSelect.value;
      submitForm();
    });

    searchInput?.addEventListener('input', () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(submitForm, 420);
    });

    qsa('[data-trip-view]', tripFilters.closest('.cp-content') || document).forEach((button) => {
      button.addEventListener('click', () => {
        const mode = button.dataset.tripView || 'grid';
        if (viewInput) viewInput.value = mode;
        try {
          window.localStorage.setItem('companyTripsView', mode);
        } catch (error) {
          /* ignore */
        }
        submitForm();
      });
    });

    try {
      const savedView = window.localStorage.getItem('companyTripsView');
      if (
        savedView &&
        viewInput &&
        savedView !== viewInput.value &&
        !window.location.search.includes('view=')
      ) {
        viewInput.value = savedView;
        submitForm();
      }
    } catch (error) {
      /* ignore */
    }
  }

  const mediaPicker = qs('[data-trip-media-picker]');
  if (mediaPicker) {
    const imagesInput = qs('[data-trip-images-input]', mediaPicker);
    const videosInput = qs('[data-trip-videos-input]', mediaPicker);
    const fileInput = qs('[data-trip-media-input]', mediaPicker);
    const dropzone = qs('[data-trip-media-dropzone]', mediaPicker);
    const browseBtn = qs('[data-trip-media-browse]', mediaPicker);
    const imageGrid = qs('[data-trip-image-grid]', mediaPicker);
    const videoList = qs('[data-trip-video-list]', mediaPicker);
    const imageEmpty = qs('[data-trip-image-empty]', mediaPicker);
    const videoEmpty = qs('[data-trip-video-empty]', mediaPicker);
    const imageCount = qs('[data-trip-image-count]', mediaPicker);
    const videoCount = qs('[data-trip-video-count]', mediaPicker);
    const feedback = qs('[data-trip-media-feedback]', mediaPicker);
    const progress = qs('[data-trip-media-progress]', mediaPicker);
    const progressBar = qs('[data-trip-media-progress-bar]', mediaPicker);
    const form = qs('[data-trip-form]') || qs('[data-company-trip-form]');

    const maxImages = Number(mediaPicker.dataset.maxImages) || 12;
    const maxVideos = Number(mediaPicker.dataset.maxVideos) || 3;
    const maxImageSize = Number(mediaPicker.dataset.maxImageSize) || 5 * 1024 * 1024;
    const maxVideoSize = Number(mediaPicker.dataset.maxVideoSize) || 20 * 1024 * 1024;
    const uploadUrl = mediaPicker.dataset.uploadUrl || '/company/trips/media';

    const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    const videoTypes = new Set(['video/mp4', 'video/webm', 'video/quicktime']);

    let images = [];
    let videos = [];

    const parseList = (value) => {
      if (!value) return [];
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
      } catch (error) {
        return String(value)
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean);
      }
    };

    const syncInputs = () => {
      if (imagesInput) imagesInput.value = JSON.stringify(images);
      if (videosInput) videosInput.value = JSON.stringify(videos);
    };

    const formatSize = (bytes) => {
      if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const showFeedback = (message, isError = true) => {
      if (!feedback) return;
      feedback.textContent = message;
      feedback.hidden = !message;
      feedback.classList.toggle('is-error', isError);
      feedback.classList.toggle('is-success', !isError);
    };

    const setProgress = (value) => {
      if (!progress || !progressBar) return;
      if (value === null) {
        progress.hidden = true;
        progressBar.style.width = '0%';
        return;
      }
      progress.hidden = false;
      progressBar.style.width = `${Math.min(100, value)}%`;
    };

    const render = () => {
      if (imageGrid) {
        imageGrid.innerHTML = images
          .map(
            (url, index) => `
          <article class="company-media-item" data-image-index="${index}">
            <img src="${url}" alt="" />
            ${index === 0 ? '<span class="company-media-cover">Cover</span>' : ''}
            <div class="company-media-item-actions">
              ${index !== 0 ? `<button type="button" class="company-media-action" data-set-cover="${index}">Cover</button>` : ''}
              <button type="button" class="company-media-action company-media-action--danger" data-remove-image="${index}">Remove</button>
            </div>
          </article>`
          )
          .join('');
      }

      if (videoList) {
        videoList.innerHTML = videos
          .map(
            (url, index) => `
          <article class="company-media-video-item" data-video-index="${index}">
            <video src="${url}" muted playsinline preload="metadata"></video>
            <div class="company-media-video-meta">
              <strong>Video ${index + 1}</strong>
              <button type="button" class="company-media-action company-media-action--danger" data-remove-video="${index}">Remove</button>
            </div>
          </article>`
          )
          .join('');
      }

      if (imageEmpty) imageEmpty.hidden = images.length > 0;
      if (videoEmpty) videoEmpty.hidden = videos.length > 0;
      if (imageCount) imageCount.textContent = `${images.length}/${maxImages}`;
      if (videoCount) videoCount.textContent = `${videos.length}/${maxVideos}`;
      syncInputs();
    };

    const validateFile = (file) => {
      const isImage = imageTypes.has(file.type);
      const isVideo = videoTypes.has(file.type);
      if (!isImage && !isVideo) {
        return 'Unsupported file type. Use JPG, PNG, WEBP, GIF, MP4, WEBM, or MOV.';
      }
      if (isImage && file.size > maxImageSize) {
        return `"${file.name}" is too large. Photos must be 5 MB or less.`;
      }
      if (isVideo && file.size > maxVideoSize) {
        return `"${file.name}" is too large. Videos must be 20 MB or less.`;
      }
      if (isImage && images.length >= maxImages) {
        return `You can upload up to ${maxImages} photos.`;
      }
      if (isVideo && videos.length >= maxVideos) {
        return `You can upload up to ${maxVideos} videos.`;
      }
      return null;
    };

    const uploadFile = (file) =>
      new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const body = new FormData();
        body.append('file', file);
        xhr.open('POST', uploadUrl);
        xhr.upload.addEventListener('progress', (event) => {
          if (!event.lengthComputable) return;
          setProgress(Math.round((event.loaded / event.total) * 100));
        });
        xhr.addEventListener('load', () => {
          setProgress(null);
          try {
            const payload = JSON.parse(xhr.responseText || '{}');
            if (xhr.status >= 200 && xhr.status < 300 && payload.ok) {
              resolve(payload);
              return;
            }
            reject(new Error(payload.message || 'Upload failed.'));
          } catch (error) {
            reject(new Error('Upload failed.'));
          }
        });
        xhr.addEventListener('error', () => {
          setProgress(null);
          reject(new Error('Upload failed.'));
        });
        xhr.send(body);
      });

    const handleFiles = async (fileList) => {
      const files = Array.from(fileList || []);
      if (!files.length) return;

      for (const file of files) {
        const error = validateFile(file);
        if (error) {
          showFeedback(error, true);
          return;
        }
      }

      showFeedback('', false);

      for (const file of files) {
        const error = validateFile(file);
        if (error) {
          showFeedback(error, true);
          break;
        }

        try {
          const result = await uploadFile(file);
          if (result.kind === 'image') images.push(result.url);
          if (result.kind === 'video') videos.push(result.url);
          render();
          showFeedback(`Uploaded ${file.name} (${formatSize(file.size)})`, false);
        } catch (error) {
          showFeedback(error.message || 'Upload failed.', true);
          break;
        }
      }
    };

    images = parseList(imagesInput?.value);
    videos = parseList(videosInput?.value);
    render();

    browseBtn?.addEventListener('click', () => fileInput?.click());
    dropzone?.addEventListener('click', (event) => {
      if (event.target.closest('[data-trip-media-browse]')) return;
      fileInput?.click();
    });
    dropzone?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        fileInput?.click();
      }
    });
    fileInput?.addEventListener('change', () => {
      handleFiles(fileInput.files);
      fileInput.value = '';
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
      dropzone?.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.add('is-dragover');
      });
    });
    ['dragleave', 'drop'].forEach((eventName) => {
      dropzone?.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.remove('is-dragover');
        if (eventName === 'drop') handleFiles(event.dataTransfer?.files);
      });
    });

    mediaPicker.addEventListener('click', (event) => {
      const coverBtn = event.target.closest('[data-set-cover]');
      const removeImageBtn = event.target.closest('[data-remove-image]');
      const removeVideoBtn = event.target.closest('[data-remove-video]');

      if (coverBtn) {
        const index = Number(coverBtn.dataset.setCover);
        const [item] = images.splice(index, 1);
        images.unshift(item);
        render();
      }

      if (removeImageBtn) {
        images.splice(Number(removeImageBtn.dataset.removeImage), 1);
        render();
      }

      if (removeVideoBtn) {
        videos.splice(Number(removeVideoBtn.dataset.removeVideo), 1);
        render();
      }
    });

    form?.addEventListener('submit', (event) => {
      if (!images.length) {
        event.preventDefault();
        showFeedback('Add at least one photo before saving.', true);
      }
      syncInputs();
    });
  }

  const bookingFilters = qs('[data-company-booking-filters]');
  if (bookingFilters) {
    const form = qs('[data-company-booking-form]', bookingFilters);
    const searchInput = qs('[data-booking-search]', bookingFilters);
    const pageInput = qs('[data-booking-page-input]', bookingFilters);
    const dateFrom = form?.querySelector('[name="dateFrom"]');
    const dateTo = form?.querySelector('[name="dateTo"]');
    let searchTimer;

    const submitForm = () => {
      if (pageInput) pageInput.value = '1';
      form?.requestSubmit();
    };

    const formatInputDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    qsa('[data-booking-auto-submit]', bookingFilters).forEach((field) => {
      field.addEventListener('change', submitForm);
    });

    qsa('[data-booking-date]', bookingFilters).forEach((field) => {
      field.addEventListener('change', submitForm);
    });

    searchInput?.addEventListener('input', () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(submitForm, 420);
    });

    qsa('[data-preset]', bookingFilters).forEach((button) => {
      button.addEventListener('click', () => {
        const preset = button.dataset.preset;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        qsa('[data-preset]', bookingFilters).forEach((item) => item.classList.remove('is-active'));
        button.classList.add('is-active');

        if (preset === 'all') {
          if (dateFrom) dateFrom.value = '';
          if (dateTo) dateTo.value = '';
        } else if (preset === '7d') {
          const start = new Date(today);
          start.setDate(start.getDate() - 6);
          if (dateFrom) dateFrom.value = formatInputDate(start);
          if (dateTo) dateTo.value = formatInputDate(today);
        } else if (preset === '30d') {
          const start = new Date(today);
          start.setDate(start.getDate() - 29);
          if (dateFrom) dateFrom.value = formatInputDate(start);
          if (dateTo) dateTo.value = formatInputDate(today);
        } else if (preset === 'month') {
          const start = new Date(today.getFullYear(), today.getMonth(), 1);
          if (dateFrom) dateFrom.value = formatInputDate(start);
          if (dateTo) dateTo.value = formatInputDate(today);
        }

        submitForm();
      });
    });
  }

  const supportFilters = qs('[data-company-support-filters]');
  if (supportFilters) {
    const form = qs('[data-company-support-form]', supportFilters);
    const searchInput = qs('[data-support-search]', supportFilters);
    const pageInput = qs('[data-support-page-input]', supportFilters);
    let searchTimer;

    const submitForm = () => {
      if (pageInput) pageInput.value = '1';
      form?.requestSubmit();
    };

    qsa('[data-support-auto-submit]', supportFilters).forEach((field) => {
      field.addEventListener('change', submitForm);
    });

    searchInput?.addEventListener('input', () => {
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(submitForm, 420);
    });
  }

  const supportDetail = qs('[data-company-support-detail]');
  if (supportDetail) {
    const messages = qs('[data-support-messages]', supportDetail);
    if (messages) messages.scrollTop = messages.scrollHeight;

    const replyForm = qs('[data-company-support-reply]', supportDetail);
    if (replyForm) {
      const textarea = qs('textarea', replyForm);
      const sendBtn = qs('button[type="submit"]', replyForm);
      const fileInput = qs('[data-support-file-input]', replyForm);
      const clearAttachments = initSupportAttachmentComposer(replyForm);

      textarea?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          replyForm.requestSubmit();
        }
      });

      replyForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const text = textarea?.value.trim() || '';
        const hasFiles = fileInput?.files?.length > 0;
        if (!text && !hasFiles) return;
        if (sendBtn) sendBtn.disabled = true;
        const { ok, data } = await postForm(replyForm);
        if (sendBtn) sendBtn.disabled = false;
        if (!ok) {
          toast(data?.message || 'Unable to send reply. Please try again.');
          return;
        }
        const reply = data.reply;
        if (messages && reply) {
          const article = document.createElement('article');
          article.className = 'company-support-bubble is-self';
          const textHtml = reply.text ? `<p>${escapeHtml(reply.text)}</p>` : '';
          article.innerHTML = `
            <header>
              <strong>${escapeHtml(reply.author)}</strong>
              <time>${escapeHtml(reply.time)}</time>
            </header>
            ${textHtml}
            ${renderSupportAttachmentsHtml(reply.attachments)}
          `;
          messages.appendChild(article);
          messages.scrollTop = messages.scrollHeight;
        }
        textarea.value = '';
        clearAttachments();
        toast('Reply sent');
      });
    }
  }

  qsa('[data-file-field]').forEach((field) => {
    const input = qs('input[type="file"]', field);
    const nameEl = qs('[data-file-name]', field);
    if (!input || !nameEl) return;
    const placeholder = nameEl.textContent;
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      nameEl.textContent = file ? file.name : placeholder;
      field.classList.toggle('has-file', Boolean(file));
    });
  });

  const logoPicker = qs('[data-company-logo-picker]');
  if (logoPicker) {
    const fileInput = qs('[data-company-logo-file]', logoPicker);
    const dropzone = qs('[data-company-logo-dropzone]', logoPicker);
    const browseBtn = qs('[data-company-logo-browse]', logoPicker);
    const removeBtn = qs('[data-company-logo-remove]', logoPicker);
    const hiddenInput = qs('[data-company-logo-input]', logoPicker);
    const previewImg = qs('[data-company-logo-img]', logoPicker);
    const preview = qs('[data-company-logo-preview]', logoPicker);
    const fallback = qs('[data-company-logo-fallback]', logoPicker);
    const overlay = qs('[data-company-logo-overlay]', logoPicker);
    const feedback = qs('[data-company-logo-feedback]', logoPicker);

    const setFeedback = (message, isSuccess = false) => {
      if (!feedback) return;
      if (!message) {
        feedback.hidden = true;
        feedback.textContent = '';
        feedback.classList.remove('is-success');
        return;
      }
      feedback.hidden = false;
      feedback.textContent = message;
      feedback.classList.toggle('is-success', isSuccess);
    };

    const setLoading = (loading) => {
      if (overlay) overlay.hidden = !loading;
      if (browseBtn) browseBtn.disabled = loading;
      if (removeBtn) removeBtn.disabled = loading;
    };

    const setPreview = (url) => {
      const next = url || '';
      if (previewImg) {
        if (next) {
          previewImg.src = next;
          previewImg.hidden = false;
        } else {
          previewImg.removeAttribute('src');
          previewImg.hidden = true;
        }
      }
      if (fallback) fallback.hidden = Boolean(next);
      if (preview) preview.classList.toggle('is-empty', !next);
      if (hiddenInput) hiddenInput.value = next;
      if (removeBtn) removeBtn.disabled = !next;
    };

    const uploadLogo = async (file) => {
      if (!file) return;
      setFeedback('');
      setLoading(true);
      const body = new FormData();
      body.append('file', file);
      try {
        const response = await fetch('/company/settings/logo', {
          method: 'POST',
          body,
          credentials: 'same-origin',
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.message || 'Upload failed.');
        }
        setPreview(data.url);
        setFeedback('Logo uploaded. Save profile to keep other changes.', true);
      } catch (error) {
        setFeedback(error.message || 'Upload failed.');
      } finally {
        setLoading(false);
        if (fileInput) fileInput.value = '';
      }
    };

    browseBtn?.addEventListener('click', () => fileInput?.click());
    dropzone?.addEventListener('click', (event) => {
      if (event.target.closest('[data-company-logo-browse]')) return;
      fileInput?.click();
    });
    dropzone?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        fileInput?.click();
      }
    });
    fileInput?.addEventListener('change', () => {
      const [file] = fileInput.files || [];
      uploadLogo(file);
    });
    removeBtn?.addEventListener('click', () => {
      setPreview('');
      setFeedback('Logo removed. Save profile to apply.');
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
      dropzone?.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.add('is-dragover');
      });
    });
    ['dragleave', 'drop'].forEach((eventName) => {
      dropzone?.addEventListener(eventName, (event) => {
        event.preventDefault();
        dropzone.classList.remove('is-dragover');
        if (eventName === 'drop') {
          const [file] = event.dataTransfer?.files || [];
          uploadLogo(file);
        }
      });
    });
  }

  function bindMethodFields(root, selectSel) {
    const select = root.querySelector(selectSel);
    if (!select) return;
    const setGroup = (attr, show) => {
      root.querySelectorAll(`[${attr}]`).forEach((el) => {
        el.hidden = !show;
        el.querySelectorAll('input, select, textarea').forEach((input) => {
          input.disabled = !show;
        });
      });
    };
    const sync = () => {
      const method = select.value;
      setGroup('data-payout-bank', method === 'bank_transfer');
      setGroup('data-payout-wallet', Boolean(method) && method !== 'bank_transfer');
      setGroup('data-payout-instapay', method === 'instapay');
      setGroup('data-refund-bank', method === 'bank_transfer');
      setGroup('data-refund-wallet', Boolean(method) && method !== 'bank_transfer');
      setGroup('data-refund-instapay', method === 'instapay');
    };
    select.addEventListener('change', sync);
    sync();
  }
  qsa('[data-payout-details]').forEach((root) => bindMethodFields(root, '[data-payout-method]'));
  qsa('[data-refund-form]').forEach((root) => bindMethodFields(root, '[data-refund-method]'));
})();
