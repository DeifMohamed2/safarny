(function () {
  'use strict';

  if (!document.body.classList.contains('admin-app')) return;

  const chartInstances = [];
  const palette = ['#6366f1', '#22d3ee', '#22c55e', '#f59e0b', '#ef4444', '#a78bfa'];

  function isLightTheme() {
    return document.documentElement.getAttribute('data-adm-theme') === 'light';
  }

  function chartColors() {
    const light = isLightTheme();
    return {
      accent: '#6366f1',
      accent2: '#0891b2',
      muted: light ? '#64748b' : '#94a3b8',
      grid: light ? 'rgba(15, 23, 42, 0.06)' : 'rgba(148, 163, 184, 0.12)',
      text: light ? '#334155' : '#e2e8f0',
    };
  }

  function parsePayload(el) {
    try {
      return JSON.parse(el.getAttribute('data-chart-payload') || '{}');
    } catch {
      return {};
    }
  }

  function baseOptions(colors) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: colors.text, font: { family: 'Inter, Poppins, sans-serif', size: 11 } },
        },
      },
      scales: {},
    };
  }

  function buildChartConfig(canvas) {
    const type = canvas.getAttribute('data-admin-chart');
    const payload = parsePayload(canvas);
    const colors = chartColors();

    if (type === 'combo' && payload.datasets) {
      return {
        type: 'bar',
        data: {
          labels: payload.labels || [],
          datasets: [
            {
              type: 'line',
              label: payload.datasets[0]?.label || 'Revenue',
              data: payload.datasets[0]?.data || [],
              borderColor: colors.accent2,
              backgroundColor: isLightTheme() ? 'rgba(8, 145, 178, 0.08)' : 'rgba(34, 211, 238, 0.1)',
              tension: 0.35,
              yAxisID: 'y',
            },
            {
              type: 'bar',
              label: payload.datasets[1]?.label || 'Bookings',
              data: payload.datasets[1]?.data || [],
              backgroundColor: isLightTheme() ? 'rgba(99, 102, 241, 0.65)' : 'rgba(99, 102, 241, 0.7)',
              borderRadius: 6,
              yAxisID: 'y1',
            },
          ],
        },
        options: {
          ...baseOptions(colors),
          scales: {
            x: { ticks: { color: colors.muted }, grid: { color: colors.grid } },
            y: { position: 'left', ticks: { color: colors.muted }, grid: { color: colors.grid } },
            y1: { position: 'right', ticks: { color: colors.muted }, grid: { drawOnChartArea: false } },
          },
        },
      };
    }

    if (type === 'doughnut') {
      return {
        type: 'doughnut',
        data: {
          labels: payload.labels || [],
          datasets: [{ data: payload.data || [], backgroundColor: palette, borderWidth: 0 }],
        },
        options: { ...baseOptions(colors), cutout: '65%' },
      };
    }

    if (type === 'horizontalBar') {
      return {
        type: 'bar',
        data: {
          labels: payload.labels || [],
          datasets: [{
            label: payload.label || 'Revenue',
            data: payload.data || [],
            backgroundColor: isLightTheme() ? 'rgba(99, 102, 241, 0.7)' : 'rgba(99, 102, 241, 0.75)',
            borderRadius: 6,
          }],
        },
        options: {
          ...baseOptions(colors),
          indexAxis: 'y',
          scales: {
            x: { ticks: { color: colors.muted }, grid: { color: colors.grid } },
            y: { ticks: { color: colors.text }, grid: { display: false } },
          },
        },
      };
    }

    if (type === 'line') {
      return {
        type: 'line',
        data: {
          labels: payload.labels || [],
          datasets: [{
            label: payload.label || 'Value',
            data: payload.data || [],
            borderColor: colors.accent,
            backgroundColor: isLightTheme() ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.18)',
            fill: true,
            tension: 0.35,
            pointRadius: 3,
            pointBackgroundColor: colors.accent,
          }],
        },
        options: {
          ...baseOptions(colors),
          scales: {
            x: { ticks: { color: colors.muted }, grid: { display: false } },
            y: { ticks: { color: colors.muted }, grid: { color: colors.grid } },
          },
        },
      };
    }

    return {
      type: 'bar',
      data: {
        labels: payload.labels || [],
        datasets: [{
          label: payload.label || 'Count',
          data: payload.data || [],
          backgroundColor: palette,
          borderRadius: 6,
        }],
      },
      options: {
        ...baseOptions(colors),
        scales: {
          x: { ticks: { color: colors.muted }, grid: { display: false } },
          y: { ticks: { color: colors.muted }, grid: { color: colors.grid } },
        },
      },
    };
  }

  function destroyCharts() {
    while (chartInstances.length) {
      const chart = chartInstances.pop();
      chart.destroy();
    }
  }

  function initCharts() {
    if (typeof Chart === 'undefined') return;
    destroyCharts();
    document.querySelectorAll('[data-admin-chart]').forEach((canvas) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      chartInstances.push(new Chart(ctx, buildChartConfig(canvas)));
    });
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function initAdminToasts() {
    const stack = document.getElementById('adm-toast-stack');
    if (!stack) return;

    function dismissToast(toast) {
      toast.classList.remove('is-visible');
      toast.classList.add('is-leaving');
      window.setTimeout(() => toast.remove(), 260);
    }

    function showToast(message, type = 'success', duration = 4000) {
      const text = String(message || '').trim();
      if (!text) return;

      const toast = document.createElement('div');
      toast.className = `adm-toast adm-toast--${type === 'error' ? 'error' : 'success'}`;
      toast.setAttribute('role', 'status');
      toast.innerHTML = `
        <span class="adm-toast-icon" aria-hidden="true">${type === 'error' ? '!' : '✓'}</span>
        <p class="adm-toast-message">${escapeHtml(text)}</p>
        <button type="button" class="adm-toast-close" aria-label="Dismiss">×</button>
      `;

      stack.appendChild(toast);
      requestAnimationFrame(() => toast.classList.add('is-visible'));
      toast.querySelector('.adm-toast-close')?.addEventListener('click', () => dismissToast(toast));
      if (duration > 0) window.setTimeout(() => dismissToast(toast), duration);
    }

    window.admToast = showToast;
    window.safarnyToast = (title, description) => showToast(description || title, 'success');

    const payload = document.getElementById('adm-flash-payload');
    if (payload) {
      try {
        const flash = JSON.parse(payload.textContent || '{}');
        if (flash?.message) showToast(flash.message, flash.type === 'error' ? 'error' : 'success');
        payload.remove();
      } catch {
        payload.remove();
      }
    }
  }

  function renderSupportAttachmentsHtml(attachments) {
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
  }

  function initSupportAttachmentComposer(form) {
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
  }

  function initSupportChat() {
    const replyForm = document.querySelector('[data-adm-support-reply]');
    const thread = document.querySelector('[data-adm-support-thread]');
    if (!replyForm || !thread) return;

    const textarea = replyForm.querySelector('textarea');
    const sendBtn = replyForm.querySelector('button[type="submit"]');
    const fileInput = replyForm.querySelector('[data-support-file-input]');
    const clearAttachments = initSupportAttachmentComposer(replyForm);

    const scrollToBottom = () => {
      thread.scrollTop = thread.scrollHeight;
    };

    scrollToBottom();

    textarea?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        replyForm.requestSubmit();
      }
    });

    replyForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = textarea?.value.trim() || '';
      const hasFiles = fileInput?.files?.length > 0;
      if (!message && !hasFiles) return;

      if (sendBtn) sendBtn.disabled = true;
      try {
        const body = new FormData(replyForm);
        const response = await fetch(replyForm.action, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body,
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          window.admToast?.(data.message || 'Could not send reply.', 'error');
          return;
        }

        const reply = data.reply || {
          author: 'Safarny Admin',
          text: message,
          time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
        };

        const bubbleInner = `${reply.text ? escapeHtml(reply.text) : ''}${renderSupportAttachmentsHtml(reply.attachments)}`;
        const article = document.createElement('article');
        article.className = 'adm-support-msg adm-support-msg--outgoing';
        article.innerHTML = `
          <header class="adm-support-msg-head">
            <span class="adm-support-msg-author">${escapeHtml(reply.author)}</span>
            <time class="adm-support-msg-time">${escapeHtml(reply.time)}</time>
          </header>
          <div class="adm-support-msg-bubble">${bubbleInner}</div>
        `;
        thread.appendChild(article);
        textarea.value = '';
        clearAttachments();
        scrollToBottom();
        window.admToast?.('Reply sent', 'success', 2800);
      } catch {
        window.admToast?.('Something went wrong. Please try again.', 'error');
      } finally {
        if (sendBtn) sendBtn.disabled = false;
      }
    });
  }

  function initThemeToggle() {
    const toggle = document.querySelector('[data-adm-theme-toggle]');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
      const next = isLightTheme() ? 'dark' : 'light';
      document.documentElement.setAttribute('data-adm-theme', next);
      localStorage.setItem('safarny-admin-theme', next);
      initCharts();
    });
  }

  function initSidebar() {
    const sidebar = document.querySelector('[data-adm-sidebar]');
    const backdrop = document.querySelector('[data-adm-close]');
    const toggle = document.querySelector('[data-adm-toggle]');
    if (!sidebar) return;

    function open() {
      sidebar.classList.add('is-open');
      backdrop?.removeAttribute('hidden');
      document.body.classList.add('adm-sidebar-locked');
    }

    function close() {
      sidebar.classList.remove('is-open');
      backdrop?.setAttribute('hidden', '');
      document.body.classList.remove('adm-sidebar-locked');
    }

    toggle?.addEventListener('click', () => {
      if (sidebar.classList.contains('is-open')) close();
      else open();
    });
    backdrop?.addEventListener('click', close);
  }

  function initConfirmDialog() {
    const dialog = document.querySelector('#admin-confirm-dialog');
    if (!dialog) return;
    const form = dialog.querySelector('[data-confirm-form]');
    const messageEl = dialog.querySelector('[data-confirm-message]');

    document.querySelectorAll('[data-admin-confirm]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const action = btn.getAttribute('data-action');
        const message = btn.getAttribute('data-message') || 'Are you sure?';
        if (form) form.action = action;
        if (messageEl) messageEl.textContent = message;
        window.openDialog?.('#admin-confirm-dialog');
      });
    });
  }

  function initFilters() {
    document.querySelectorAll('[data-admin-filters]').forEach((form) => {
      if (form.hasAttribute('data-finance-filters')) return;
      const search = form.querySelector('input[type="search"]');
      let timer;
      search?.addEventListener('input', () => {
        clearTimeout(timer);
        timer = setTimeout(() => form.submit(), 400);
      });
      form.querySelectorAll('select').forEach((sel) => {
        sel.addEventListener('change', () => form.submit());
      });
    });
  }

  function initFinanceFilters() {
    const form = document.querySelector('[data-finance-filters]');
    if (!form) return;

    const toggle = form.querySelector('[data-finance-filter-toggle]');
    const panel = form.querySelector('[data-finance-advanced]');
    const statusInput = form.querySelector('[data-finance-status-input]');
    const methodInput = form.querySelector('[data-finance-method-input]');
    const searchInput = form.querySelector('[data-finance-search]');
    let searchTimer;

    toggle?.addEventListener('click', () => {
      const isOpen = panel?.classList.toggle('is-open');
      if (panel) panel.hidden = !isOpen;
      toggle.classList.toggle('is-active', Boolean(isOpen));
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    form.querySelectorAll('[data-finance-chip]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const field = chip.dataset.financeChip;
        const value = chip.dataset.value || 'all';
        const input = field === 'status' ? statusInput : methodInput;
        if (!input) return;
        input.value = value;
        form.querySelectorAll(`[data-finance-chip="${field}"]`).forEach((btn) => {
          btn.classList.toggle('is-active', btn === chip);
        });
        form.submit();
      });
    });

    searchInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        form.submit();
      }
    });

    searchInput?.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => form.submit(), 500);
    });
  }

  function initRangeSwitcher() {
    const select = document.querySelector('[data-adm-range]');
    const form = document.querySelector('[data-adm-range-form]');
    if (!select || !form) return;
    select.addEventListener('change', () => {
      const path = window.location.pathname;
      if (path.includes('/analytics')) {
        form.action = '/admin/analytics';
        form.submit();
      } else if (path.includes('/dashboard')) {
        form.submit();
      }
    });
  }

  function initBulkSelect() {
    const table = document.querySelector('[data-admin-bulk-table]');
    const selectAll = document.querySelector('[data-admin-select-all]');
    const bulkForm = document.querySelector('[data-admin-bulk-form]');
    if (!table || !selectAll) return;

    selectAll.addEventListener('change', () => {
      table.querySelectorAll('[data-admin-row-check]').forEach((cb) => {
        cb.checked = selectAll.checked;
      });
      syncBulkForm();
    });

    table.querySelectorAll('[data-admin-row-check]').forEach((cb) => {
      cb.addEventListener('change', syncBulkForm);
    });

    function syncBulkForm() {
      if (!bulkForm) return;
      bulkForm.querySelectorAll('input[name="ids"]').forEach((el) => el.remove());
      table.querySelectorAll('[data-admin-row-check]:checked').forEach((cb) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = 'ids';
        input.value = cb.value;
        bulkForm.appendChild(input);
      });
    }
  }

  function initPasswordForm() {
    const form = document.getElementById('password-form');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      try {
        const res = await fetch('/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(Object.fromEntries(fd)),
        });
        const data = await res.json();
        if (data.ok) window.safarnyToast?.('Success', data.message || 'Password updated');
        else window.safarnyToast?.('Error', data.message || 'Could not update password');
      } catch {
        window.safarnyToast?.('Error', 'Something went wrong');
      }
    });
  }

  function initSupportTableRows() {
    document.querySelectorAll('.admin-support-row[data-href], .adm-people-row[data-href]').forEach((row) => {
      row.addEventListener('click', (event) => {
        if (event.target.closest('a, button')) return;
        window.location.href = row.dataset.href;
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initAdminToasts();
    initThemeToggle();
    initSidebar();
    initCharts();
    initConfirmDialog();
    initFilters();
    initFinanceFilters();
    initRangeSwitcher();
    initBulkSelect();
    initPasswordForm();
    initSupportTableRows();
    initSupportChat();
    window.SafarnyTripForm?.boot();
  });
})();
