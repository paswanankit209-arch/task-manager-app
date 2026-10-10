/**
 * SpendWise Financial Engine
 * Client-Side Personal Finance Ledger & Category Analytics
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'ankit_spendwise_data_v1';
  const CURRENCY_KEY = 'ankit_spendwise_currency';
  const THEME_KEY = 'ap_portfolio_theme';

  const CATEGORY_COLORS = {
    Food: '#f59e0b',
    Education: '#3b82f6',
    Housing: '#8b5cf6',
    Tech: '#06b6d4',
    Transport: '#ec4899',
    Entertainment: '#f43f5e',
    Health: '#10b981',
    Salary: '#22c55e',
    Other: '#64748b'
  };

  const CATEGORY_EMOJIS = {
    Food: '🍔',
    Education: '📚',
    Housing: '🏠',
    Tech: '💻',
    Transport: '🚗',
    Entertainment: '🎬',
    Health: '💊',
    Salary: '💰',
    Other: '📦'
  };

  // Sample student financial ledger for immediate demonstration
  const SEED_TRANSACTIONS = [
    {
      id: 'tx-1',
      title: 'Academic Research Fellowship Stipend',
      type: 'income',
      amount: 15000,
      category: 'Salary',
      date: new Date(Date.now() - 86400000 * 8).toISOString().split('T')[0]
    },
    {
      id: 'tx-2',
      title: 'Algorithms & Discrete Math Textbooks',
      type: 'expense',
      amount: 1850,
      category: 'Education',
      date: new Date(Date.now() - 86400000 * 6).toISOString().split('T')[0]
    },
    {
      id: 'tx-3',
      title: 'Hostel Accommodation / Campus Utility',
      type: 'expense',
      amount: 4500,
      category: 'Housing',
      date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0]
    },
    {
      id: 'tx-4',
      title: 'GitHub Copilot & Cloud Sandbox Renewal',
      type: 'expense',
      amount: 999,
      category: 'Tech',
      date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0]
    },
    {
      id: 'tx-5',
      title: 'Campus Cafeteria & Weekly Meal Card',
      type: 'expense',
      amount: 1450,
      category: 'Food',
      date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0]
    },
    {
      id: 'tx-6',
      title: 'Weekend Metro & Local Commute Pass',
      type: 'expense',
      amount: 420,
      category: 'Transport',
      date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0]
    }
  ];

  // Application State
  let transactions = [];
  let currentCurrency = localStorage.getItem(CURRENCY_KEY) || '₹';
  let currentTxType = 'expense';
  let filterType = 'all'; // 'all', 'expense', 'income'
  let filterCategory = 'all';
  let searchQuery = '';

  // DOM Elements
  const DOM = {
    html: document.documentElement,
    themeToggle: document.getElementById('theme-toggle'),
    currencySelect: document.getElementById('currency-select'),

    // Symbols
    symBalance: document.getElementById('sym-balance'),
    symIncome: document.getElementById('sym-income'),
    symExpense: document.getElementById('sym-expense'),
    inputCurrencyLabel: document.getElementById('input-currency-label'),

    // Metric Values
    metricBalance: document.getElementById('metric-balance'),
    metricIncome: document.getElementById('metric-income'),
    metricExpenses: document.getElementById('metric-expenses'),
    metricSavings: document.getElementById('metric-savings'),

    // Form
    txForm: document.getElementById('transaction-form'),
    typeExpense: document.getElementById('type-expense'),
    typeIncome: document.getElementById('type-income'),
    txTitle: document.getElementById('tx-title'),
    txAmount: document.getElementById('tx-amount'),
    txCategory: document.getElementById('tx-category'),
    txDate: document.getElementById('tx-date'),

    // Ledger
    ledgerCount: document.getElementById('ledger-count'),
    btnExportCsv: document.getElementById('btn-export-csv'),
    btnResetDemo: document.getElementById('btn-reset-demo'),
    ledgerSearch: document.getElementById('ledger-search'),
    filterChips: document.querySelectorAll('.filter-chip'),
    filterCategorySelect: document.getElementById('filter-category'),
    transactionsList: document.getElementById('transactions-list'),
    emptyLedger: document.getElementById('empty-ledger'),

    // Analytics
    donutChart: document.getElementById('donut-chart'),
    donutTotal: document.getElementById('donut-total'),
    categoryBarsList: document.getElementById('category-bars-list'),
    financialAdviceText: document.getElementById('financial-advice-text'),

    // Toast
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toast-message')
  };

  /* ==========================================================================
     01. THEME & CURRENCY INITIALIZATION
     ========================================================================== */
  function initThemeAndCurrency() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const activeTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    DOM.html.setAttribute('data-theme', activeTheme);

    DOM.themeToggle.addEventListener('click', () => {
      const current = DOM.html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      DOM.html.setAttribute('data-theme', next);
      localStorage.setItem(THEME_KEY, next);
    });

    // Set currency selector value
    DOM.currencySelect.value = currentCurrency;
    updateCurrencySymbols();

    DOM.currencySelect.addEventListener('change', (e) => {
      currentCurrency = e.target.value;
      localStorage.setItem(CURRENCY_KEY, currentCurrency);
      updateCurrencySymbols();
      render();
    });

    // Set default transaction date to today
    DOM.txDate.value = new Date().toISOString().split('T')[0];
  }

  function updateCurrencySymbols() {
    DOM.symBalance.textContent = currentCurrency;
    DOM.symIncome.textContent = currentCurrency;
    DOM.symExpense.textContent = currentCurrency;
    DOM.inputCurrencyLabel.textContent = currentCurrency;
  }

  /* ==========================================================================
     02. LOCAL STORAGE HANDLING
     ========================================================================== */
  function loadTransactions() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        transactions = JSON.parse(raw);
      } else {
        transactions = [...SEED_TRANSACTIONS];
        saveTransactions();
      }
    } catch (e) {
      transactions = [...SEED_TRANSACTIONS];
    }
  }

  function saveTransactions() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {}
  }

  /* ==========================================================================
     03. CALCULATIONS & RENDERING
     ========================================================================== */
  function render() {
    // 1. Calculate totals
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach(t => {
      if (t.type === 'income') totalIncome += Number(t.amount);
      else totalExpenses += Number(t.amount);
    });

    const netBalance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0
      ? Math.max(0, Math.round(((totalIncome - totalExpenses) / totalIncome) * 100))
      : 0;

    DOM.metricBalance.textContent = formatNumber(netBalance);
    DOM.metricIncome.textContent = formatNumber(totalIncome);
    DOM.metricExpenses.textContent = formatNumber(totalExpenses);
    DOM.metricSavings.textContent = `${savingsRate}%`;

    // 2. Render Donut Chart & Category Breakdown
    renderAnalytics(totalExpenses);

    // 3. Render Filtered Transactions Ledger
    renderLedger();
  }

  function formatNumber(num) {
    return Number(num).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function renderAnalytics(totalExpenses) {
    DOM.donutTotal.textContent = `${currentCurrency}${formatNumber(totalExpenses)}`;

    // Group expenses by category
    const categoryTotals = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount);
      });

    const sortedCategories = Object.keys(categoryTotals).sort(
      (a, b) => categoryTotals[b] - categoryTotals[a]
    );

    // Build Conic Gradient for Donut Chart
    if (totalExpenses > 0 && sortedCategories.length > 0) {
      let gradientSegments = [];
      let currentPercentage = 0;

      sortedCategories.forEach(cat => {
        const amount = categoryTotals[cat];
        const percent = (amount / totalExpenses) * 100;
        const color = CATEGORY_COLORS[cat] || '#64748b';
        const start = currentPercentage;
        const end = currentPercentage + percent;
        gradientSegments.push(`${color} ${start.toFixed(1)}% ${end.toFixed(1)}%`);
        currentPercentage = end;
      });

      DOM.donutChart.style.background = `conic-gradient(${gradientSegments.join(', ')})`;
    } else {
      DOM.donutChart.style.background = 'conic-gradient(#64748b 0% 100%)';
    }

    // Category progress bars
    DOM.categoryBarsList.innerHTML = '';
    if (sortedCategories.length === 0) {
      DOM.categoryBarsList.innerHTML = `<div style="font-size: 0.82rem; color: var(--text-muted); text-align: center; padding: 1rem;">No expense categories recorded yet.</div>`;
      return;
    }

    sortedCategories.forEach(cat => {
      const amount = categoryTotals[cat];
      const percent = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
      const color = CATEGORY_COLORS[cat] || '#64748b';
      const emoji = CATEGORY_EMOJIS[cat] || '📦';

      const barItem = document.createElement('div');
      barItem.className = 'cat-bar-item';
      barItem.innerHTML = `
        <div class="cat-bar-header">
          <div class="cat-name-row">
            <span class="cat-dot" style="background-color: ${color};"></span>
            <span>${emoji} ${cat}</span>
          </div>
          <div class="cat-amount-row">
            <span>${currentCurrency}${formatNumber(amount)}</span>
            <span style="color: var(--text-muted); font-size: 0.75rem;">(${percent}%)</span>
          </div>
        </div>
        <div class="cat-track">
          <div class="cat-fill" style="width: ${percent}%; background-color: ${color};"></div>
        </div>
      `;
      DOM.categoryBarsList.appendChild(barItem);
    });

    // Update Advice
    if (totalExpenses === 0) {
      DOM.financialAdviceText.textContent = 'No expenses recorded yet. Maintain accurate logs to generate insights.';
    } else {
      const topCat = sortedCategories[0];
      DOM.financialAdviceText.textContent = `Your primary outflow domain is ${topCat} (${Math.round((categoryTotals[topCat] / totalExpenses) * 100)}% of expenses). Track planned allocations to preserve a steady savings buffer.`;
    }
  }

  function renderLedger() {
    let filtered = [...transactions];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(t => t.category === filterCategory);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    DOM.ledgerCount.textContent = `${filtered.length} item${filtered.length === 1 ? '' : 's'}`;
    DOM.transactionsList.innerHTML = '';

    if (filtered.length === 0) {
      DOM.emptyLedger.style.display = 'flex';
      return;
    }

    DOM.emptyLedger.style.display = 'none';

    filtered.forEach(tx => {
      const isIncome = tx.type === 'income';
      const emoji = CATEGORY_EMOJIS[tx.category] || '📦';
      const sign = isIncome ? '+' : '-';

      const row = document.createElement('div');
      row.className = 'tx-row';
      row.innerHTML = `
        <div class="tx-left">
          <div class="tx-category-icon">${emoji}</div>
          <div class="tx-meta">
            <span class="tx-title">${escapeHtml(tx.title)}</span>
            <span class="tx-subtext">${tx.date} · ${tx.category}</span>
          </div>
        </div>
        <div class="tx-right">
          <span class="tx-amount ${isIncome ? 'income' : 'expense'}">
            ${sign}${currentCurrency}${formatNumber(tx.amount)}
          </span>
          <button type="button" class="tx-delete-btn" data-id="${tx.id}" title="Delete transaction" aria-label="Delete transaction">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
          </button>
        </div>
      `;
      DOM.transactionsList.appendChild(row);
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /* ==========================================================================
     04. EVENT HANDLERS
     ========================================================================== */
  function setupEvents() {
    // Transaction type switcher
    DOM.typeExpense.addEventListener('click', () => {
      currentTxType = 'expense';
      DOM.typeExpense.classList.add('active');
      DOM.typeIncome.classList.remove('active');
    });

    DOM.typeIncome.addEventListener('click', () => {
      currentTxType = 'income';
      DOM.typeIncome.classList.add('active');
      DOM.typeExpense.classList.remove('active');
    });

    // Form submit
    DOM.txForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = DOM.txTitle.value.trim();
      const amount = parseFloat(DOM.txAmount.value);
      const category = DOM.txCategory.value;
      const date = DOM.txDate.value;

      if (!title || isNaN(amount) || amount <= 0 || !date) {
        alert('Please fill out all fields with valid values.');
        return;
      }

      const newTx = {
        id: 'tx-' + Date.now(),
        title,
        type: currentTxType,
        amount,
        category,
        date
      };

      transactions.unshift(newTx);
      saveTransactions();
      render();

      DOM.txTitle.value = '';
      DOM.txAmount.value = '';
      showToast(`${currentTxType === 'income' ? 'Income' : 'Expense'} recorded!`);
    });

    // Delete delegation
    DOM.transactionsList.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.tx-delete-btn');
      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        render();
        showToast('Transaction removed');
      }
    });

    // Filter Chips
    DOM.filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        filterType = chip.getAttribute('data-filter');
        render();
      });
    });

    // Category Filter
    DOM.filterCategorySelect.addEventListener('change', (e) => {
      filterCategory = e.target.value;
      render();
    });

    // Search Filter
    DOM.ledgerSearch.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      render();
    });

    // Reset Demo Data
    DOM.btnResetDemo.addEventListener('click', () => {
      transactions = [...SEED_TRANSACTIONS];
      saveTransactions();
      render();
      showToast('Sample financial data reloaded');
    });

    // CSV Export
    DOM.btnExportCsv.addEventListener('click', () => {
      if (transactions.length === 0) {
        alert('No transactions to export.');
        return;
      }

      let csv = 'ID,Date,Type,Category,Description,Amount,Currency\n';
      transactions.forEach(t => {
        const cleanTitle = `"${t.title.replace(/"/g, '""')}"`;
        csv += `${t.id},${t.date},${t.type},${t.category},${cleanTitle},${t.amount},${currentCurrency}\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `spendwise_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Exported CSV spreadsheet');
    });
  }

  let toastTimer;
  function showToast(msg) {
    DOM.toastMsg.textContent = msg;
    DOM.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      DOM.toast.classList.remove('show');
    }, 2500);
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    initThemeAndCurrency();
    loadTransactions();
    setupEvents();
    render();
  });
})();
