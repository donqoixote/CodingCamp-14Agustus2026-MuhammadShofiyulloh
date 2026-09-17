/* ==========================================================
   Expense & Budget Visualizer
   Vanilla JS + localStorage + Chart.js (local)
   ========================================================== */

(function () {
  'use strict';

  /* ---------- Storage keys ---------- */
  const STORAGE_KEYS = {
    transactions: 'ebv_transactions',
    categories:   'ebv_categories',
    theme:        'ebv_theme',
    limit:        'ebv_monthly_limit',
  };

  const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Fun'];

  const CHART_COLORS = [
    '#37b978', '#f2994a', '#4f8ef7', '#b070e8',
    '#f2c94c', '#ea6a9a', '#5ec6c1', '#e08a3c',
  ];

  /* ---------- State ---------- */
  let transactions = loadTransactions();
  let categories   = loadCategories();
  let monthlyLimit = loadLimit();
  let chart        = null;

  /* ---------- DOM refs ---------- */
  const form             = document.getElementById('transactionForm');
  const itemNameInput    = document.getElementById('itemName');
  const amountInput      = document.getElementById('amount');
  const categorySelect   = document.getElementById('category');
  const formError        = document.getElementById('formError');
  const totalBalanceEl   = document.getElementById('totalBalance');
  const transactionListEl= document.getElementById('transactionList');
  const emptyStateEl     = document.getElementById('emptyState');
  const sortSelect       = document.getElementById('sortSelect');
  const chartCanvas      = document.getElementById('spendingChart');
  const chartEmptyState  = document.getElementById('chartEmptyState');
  const monthlySummaryEl = document.getElementById('monthlySummary');
  const themeToggle      = document.getElementById('themeToggle');
  const themeIcon        = document.getElementById('themeIcon');
  const limitWarning     = document.getElementById('limitWarning');
  const setLimitBtn      = document.getElementById('setLimitBtn');

  /* ---------- Init ---------- */
  function init() {
    applyTheme(loadTheme());
    populateCategoryOptions();
    render();

    form.addEventListener('submit', handleFormSubmit);
    categorySelect.addEventListener('change', handleCategoryChange);
    sortSelect.addEventListener('change', render);
    themeToggle.addEventListener('click', toggleTheme);
    setLimitBtn.addEventListener('click', handleSetLimit);
  }

  /* ---------- Storage helpers ---------- */
  function loadTransactions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.transactions);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveTransactions() {
    localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
  }

  function loadCategories() {
    try {
      const raw    = localStorage.getItem(STORAGE_KEYS.categories);
      const stored = raw ? JSON.parse(raw) : [];
      const merged = [...DEFAULT_CATEGORIES];
      stored.forEach(function (c) {
        if (!merged.includes(c)) merged.push(c);
      });
      return merged;
    } catch (e) {
      return [...DEFAULT_CATEGORIES];
    }
  }

  function saveCategories() {
    const custom = categories.filter(function (c) {
      return !DEFAULT_CATEGORIES.includes(c);
    });
    localStorage.setItem(STORAGE_KEYS.categories, JSON.stringify(custom));
  }

  function loadTheme() {
    return localStorage.getItem(STORAGE_KEYS.theme) || 'light';
  }

  function saveTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.theme, theme);
  }

  function loadLimit() {
    const raw   = localStorage.getItem(STORAGE_KEYS.limit);
    const value = raw ? parseFloat(raw) : null;
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function saveLimit(value) {
    if (value === null) {
      localStorage.removeItem(STORAGE_KEYS.limit);
    } else {
      localStorage.setItem(STORAGE_KEYS.limit, String(value));
    }
  }

  /* ---------- Theme ---------- */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next    = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);
    /* redraw chart so legend colour matches new theme */
    if (chart) {
      chart.destroy();
      chart = null;
    }
    renderChart();
  }

  /* ---------- Categories ---------- */
  function populateCategoryOptions() {
    const addNewOpt = categorySelect.querySelector('option[value="__add_new__"]');
    categorySelect.querySelectorAll('option:not([value="__add_new__"])').forEach(function (opt) {
      opt.remove();
    });
    categories.forEach(function (cat) {
      const option       = document.createElement('option');
      option.value       = cat;
      option.textContent = cat;
      categorySelect.insertBefore(option, addNewOpt);
    });
  }

  function handleCategoryChange() {
    if (categorySelect.value !== '__add_new__') return;

    const name    = window.prompt('Name your new category:');
    const trimmed = (name || '').trim();

    if (!trimmed) {
      categorySelect.value = categories[0];
      return;
    }
    if (!categories.includes(trimmed)) {
      categories.push(trimmed);
      saveCategories();
      populateCategoryOptions();
    }
    categorySelect.value = trimmed;
  }

  /* ---------- Spending limit ---------- */
  function handleSetLimit() {
    const current = monthlyLimit !== null ? monthlyLimit : '';
    const input   = window.prompt(
      'Set your monthly spending limit ($), or leave blank to remove it:',
      current
    );
    if (input === null) return;

    const trimmed = input.trim();
    if (trimmed === '') {
      monthlyLimit = null;
    } else {
      const parsed = parseFloat(trimmed);
      monthlyLimit = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }
    saveLimit(monthlyLimit);
    render();
  }

  /* ---------- Form handling ---------- */
  function handleFormSubmit(event) {
    event.preventDefault();

    const name     = itemNameInput.value.trim();
    const amount   = parseFloat(amountInput.value);
    const category = categorySelect.value;

    const isValid =
      name.length > 0 &&
      Number.isFinite(amount) &&
      amount > 0 &&
      category &&
      category !== '__add_new__';

    if (!isValid) {
      formError.hidden = false;
      return;
    }

    formError.hidden = true;
    transactions.push({
      id:       Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name:     name,
      amount:   amount,
      category: category,
      date:     new Date().toISOString(),
    });

    saveTransactions();
    form.reset();
    categorySelect.value = categories[0];
    render();
  }

  function handleDelete(id) {
    transactions = transactions.filter(function (t) { return t.id !== id; });
    saveTransactions();
    render();
  }

  /* ---------- Sorting ---------- */
  function getSortedTransactions() {
    const mode = sortSelect.value;
    const list = transactions.slice();

    switch (mode) {
      case 'date-asc':
        return list.sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
      case 'amount-desc':
        return list.sort(function (a, b) { return b.amount - a.amount; });
      case 'amount-asc':
        return list.sort(function (a, b) { return a.amount - b.amount; });
      case 'category':
        return list.sort(function (a, b) { return a.category.localeCompare(b.category); });
      case 'date-desc':
      default:
        return list.sort(function (a, b) { return new Date(b.date) - new Date(a.date); });
    }
  }

  /* ---------- Rendering ---------- */
  function render() {
    renderBalance();
    renderList();
    renderChart();
    renderMonthlySummary();
  }

  function formatCurrency(value) {
    return '$' + Math.abs(value).toFixed(2);
  }

  /* --- Balance --- */
  function renderBalance() {
    const total    = transactions.reduce(function (sum, t) { return sum + t.amount; }, 0);
    totalBalanceEl.textContent = '$' + total.toFixed(2);

    const overLimit = monthlyLimit !== null && total > monthlyLimit;
    totalBalanceEl.classList.toggle('negative', overLimit);
    limitWarning.hidden = !overLimit;

    setLimitBtn.textContent = monthlyLimit !== null
      ? 'Monthly limit: ' + formatCurrency(monthlyLimit) + ' (edit)'
      : 'Set monthly limit';
  }

  /* --- Transaction list --- */
  function renderList() {
    const sorted = getSortedTransactions();
    transactionListEl.innerHTML = '';

    if (sorted.length === 0) {
      transactionListEl.appendChild(emptyStateEl);
      emptyStateEl.hidden = false;
      return;
    }

    sorted.forEach(function (t) {
      const li = document.createElement('li');
      li.className = 'transaction-item';

      const info = document.createElement('div');
      info.className = 'transaction-info';

      const nameEl = document.createElement('p');
      nameEl.className   = 'transaction-name';
      nameEl.textContent = t.name;

      const amountEl = document.createElement('p');
      amountEl.className   = 'transaction-amount';
      amountEl.textContent = formatCurrency(t.amount);
      if (monthlyLimit !== null && t.amount > monthlyLimit) {
        amountEl.classList.add('over-limit');
      }

      const tag = document.createElement('span');
      tag.className   = 'transaction-tag';
      tag.textContent = t.category;

      info.appendChild(nameEl);
      info.appendChild(amountEl);
      info.appendChild(tag);

      const deleteBtn       = document.createElement('button');
      deleteBtn.className   = 'btn-delete';
      deleteBtn.type        = 'button';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', function () { handleDelete(t.id); });

      li.appendChild(info);
      li.appendChild(deleteBtn);
      transactionListEl.appendChild(li);
    });
  }

  /* --- Chart --- */
  function getCategoryTotals() {
    const totals = {};
    transactions.forEach(function (t) {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });
    return totals;
  }

  function renderChart() {
    const totals = getCategoryTotals();
    const labels = Object.keys(totals);
    const data   = Object.values(totals);

    /* No data — show placeholder, hide canvas */
    if (labels.length === 0) {
      chartCanvas.style.display      = 'none';
      chartEmptyState.style.display  = 'block';
      if (chart) {
        chart.destroy();
        chart = null;
      }
      return;
    }

    /* Has data — show canvas, hide placeholder */
    chartCanvas.style.display     = 'block';
    chartEmptyState.style.display = 'none';

    const colors    = labels.map(function (_, i) { return CHART_COLORS[i % CHART_COLORS.length]; });
    const style     = getComputedStyle(document.documentElement);
    const cardBg    = (style.getPropertyValue('--card-bg')    || '').trim() || '#ffffff';
    const textColor = (style.getPropertyValue('--text-primary') || '').trim() || '#1d2126';

    /* Update existing chart */
    if (chart) {
      chart.data.labels                          = labels;
      chart.data.datasets[0].data               = data;
      chart.data.datasets[0].backgroundColor    = colors;
      chart.data.datasets[0].borderColor        = cardBg;
      chart.options.plugins.legend.labels.color = textColor;
      chart.update();
      return;
    }

    /* Create chart for the first time */
    chart = new Chart(chartCanvas, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [{
          data:            data,
          backgroundColor: colors,
          borderColor:     cardBg,
          borderWidth:     3,
          hoverOffset:     10,
        }],
      },
      options: {
        responsive:          true,
        maintainAspectRatio: false,
        animation: {
          animateScale:  true,
          animateRotate: true,
          duration:      600,
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color:    textColor,
              boxWidth: 14,
              padding:  16,
              font: {
                family: "'Plus Jakarta Sans', sans-serif",
                size:   13,
                weight: '600',
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
                const pct   = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : '0';
                return ' ' + ctx.label + ': ' + formatCurrency(ctx.parsed) + ' (' + pct + '%)';
              },
            },
          },
        },
      },
    });
  }

  /* --- Monthly summary --- */
  function renderMonthlySummary() {
    monthlySummaryEl.innerHTML = '';

    if (transactions.length === 0) {
      const p       = document.createElement('p');
      p.className   = 'empty-state';
      p.textContent = 'No data for this month yet.';
      monthlySummaryEl.appendChild(p);
      return;
    }

    const now             = new Date();
    const currentMonthKey = now.getFullYear() + '-' + now.getMonth();

    const monthTx = transactions.filter(function (t) {
      const d = new Date(t.date);
      return d.getFullYear() + '-' + d.getMonth() === currentMonthKey;
    });

    const monthTotal = monthTx.reduce(function (sum, t) { return sum + t.amount; }, 0);
    const monthCount = monthTx.length;
    const avg        = monthCount > 0 ? monthTotal / monthCount : 0;

    const catMap = monthTx.reduce(function (acc, t) {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});
    const topCategory = Object.entries(catMap).sort(function (a, b) { return b[1] - a[1]; })[0];

    const monthName = now.toLocaleString(undefined, { month: 'long', year: 'numeric' });

    const pills = [
      { label: monthName,           value: monthCount + ' transaction' + (monthCount === 1 ? '' : 's') },
      { label: 'Spent this month',  value: formatCurrency(monthTotal) },
      { label: 'Average per item',  value: formatCurrency(avg) },
      { label: 'Top category',      value: topCategory ? topCategory[0] + ' (' + formatCurrency(topCategory[1]) + ')' : '-' },
    ];

    pills.forEach(function (p) {
      const pill      = document.createElement('div');
      pill.className  = 'summary-pill';

      const labelEl       = document.createElement('span');
      labelEl.className   = 'label';
      labelEl.textContent = p.label;

      const valueEl       = document.createElement('span');
      valueEl.className   = 'value';
      valueEl.textContent = p.value;

      pill.appendChild(labelEl);
      pill.appendChild(valueEl);
      monthlySummaryEl.appendChild(pill);
    });
  }

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', init);

})();
