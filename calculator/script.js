/**
 * OmniCalc Precision Mathematics Engine
 * Vanilla ES6+ Calculation Core with Scientific Mode & Tape History
 */

(function () {
  'use strict';

  const HISTORY_STORAGE_KEY = 'ankit_omnicalc_history_v1';
  const THEME_KEY = 'ap_portfolio_theme';

  // Calculator State
  let currentInput = '0';
  let previousExpression = '';
  let pendingOperator = null;
  let firstOperand = null;
  let shouldResetInput = false;
  let memoryValue = 0;
  let angleMode = 'DEG'; // 'DEG' or 'RAD'
  let isScientific = false;
  let history = [];

  // DOM Cache
  const DOM = {
    html: document.documentElement,
    themeToggle: document.getElementById('theme-toggle'),
    toggleHistoryBtn: document.getElementById('toggle-history-btn'),
    historySidebar: document.getElementById('history-sidebar'),

    // Mode Buttons
    btnModeStd: document.getElementById('btn-mode-std'),
    btnModeSci: document.getElementById('btn-mode-sci'),
    angleToggles: document.getElementById('angle-toggles'),
    btnAngleDeg: document.getElementById('btn-angle-deg'),
    btnAngleRad: document.getElementById('btn-angle-rad'),
    memIndicator: document.getElementById('mem-indicator'),

    // Displays
    expressionTape: document.getElementById('expression-tape'),
    mainDisplay: document.getElementById('main-display'),
    copyResultBtn: document.getElementById('copy-result-btn'),

    // Scientific Pad
    scientificPad: document.getElementById('scientific-pad'),

    // Keypads
    primaryKeypad: document.querySelector('.primary-keypad'),
    memoryActionsRow: document.querySelector('.memory-actions-row'),

    // History
    historyList: document.getElementById('history-list'),
    emptyHistory: document.getElementById('empty-history'),
    clearHistoryBtn: document.getElementById('clear-history-btn'),

    // Toast
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toast-message')
  };

  /* ==========================================================================
     01. THEME & INITIALIZATION
     ========================================================================== */
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const active = saved || (prefersDark ? 'dark' : 'light');
    DOM.html.setAttribute('data-theme', active);

    DOM.themeToggle.addEventListener('click', () => {
      const current = DOM.html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      DOM.html.setAttribute('data-theme', next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  function loadHistory() {
    try {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (raw) history = JSON.parse(raw);
    } catch (e) {
      history = [];
    }
  }

  function saveHistory() {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {}
  }

  /* ==========================================================================
     02. DISPLAY UPDATES
     ========================================================================== */
  function updateDisplay() {
    DOM.mainDisplay.textContent = currentInput;
    DOM.expressionTape.textContent = previousExpression;

    // Adjust font size dynamically if input is very long
    if (currentInput.length > 12) {
      DOM.mainDisplay.style.fontSize = '1.75rem';
    } else if (currentInput.length > 8) {
      DOM.mainDisplay.style.fontSize = '2.25rem';
    } else {
      DOM.mainDisplay.style.fontSize = '';
    }
  }

  function showToast(message) {
    DOM.toastMsg.textContent = message;
    DOM.toast.classList.add('show');
    setTimeout(() => {
      DOM.toast.classList.remove('show');
    }, 2000);
  }

  /* ==========================================================================
     03. CORE ARITHMETIC & PRECISION CORRECTION
     ========================================================================== */
  // Precision corrector to fix 0.1 + 0.2 = 0.30000000000000004
  function normalizeFloat(num) {
    if (!isFinite(num)) return num;
    const precision = 12;
    return parseFloat(Number(num).toPrecision(precision));
  }

  function appendDigit(digit) {
    if (shouldResetInput) {
      currentInput = digit === '.' ? '0.' : digit;
      shouldResetInput = false;
    } else {
      if (digit === '.') {
        if (currentInput.includes('.')) return;
        currentInput += '.';
      } else {
        currentInput = currentInput === '0' ? digit : currentInput + digit;
      }
    }
    updateDisplay();
  }

  function handleOperator(op) {
    const inputValue = parseFloat(currentInput);

    if (firstOperand === null) {
      firstOperand = inputValue;
    } else if (pendingOperator) {
      const result = executeOperation(firstOperand, inputValue, pendingOperator);
      if (result === 'Error') {
        resetAll('Error');
        return;
      }
      firstOperand = result;
      currentInput = String(result);
    }

    pendingOperator = op;
    previousExpression = `${firstOperand} ${op}`;
    shouldResetInput = true;
    updateDisplay();
  }

  function executeOperation(a, b, op) {
    let result = 0;
    switch (op) {
      case '+':
        result = a + b;
        break;
      case '-':
        result = a - b;
        break;
      case '×':
      case '*':
        result = a * b;
        break;
      case '÷':
      case '/':
        if (b === 0) return 'Error';
        result = a / b;
        break;
      default:
        return b;
    }
    return normalizeFloat(result);
  }

  function evaluate() {
    if (pendingOperator === null || firstOperand === null) return;

    const secondOperand = parseFloat(currentInput);
    const expressionString = `${firstOperand} ${pendingOperator} ${secondOperand}`;
    const result = executeOperation(firstOperand, secondOperand, pendingOperator);

    if (result === 'Error') {
      resetAll('Error: Div by 0');
      return;
    }

    // Add to history
    addHistoryRecord(expressionString, result);

    previousExpression = `${expressionString} =`;
    currentInput = String(result);
    firstOperand = null;
    pendingOperator = null;
    shouldResetInput = true;
    updateDisplay();
  }

  function resetAll(customDisplay = '0') {
    currentInput = customDisplay;
    previousExpression = '';
    pendingOperator = null;
    firstOperand = null;
    shouldResetInput = false;
    updateDisplay();
  }

  function backspace() {
    if (shouldResetInput || currentInput === 'Error') {
      currentInput = '0';
      shouldResetInput = false;
    } else {
      currentInput = currentInput.length > 1 ? currentInput.slice(0, -1) : '0';
    }
    updateDisplay();
  }

  function negate() {
    if (currentInput === '0' || currentInput === 'Error') return;
    currentInput = currentInput.startsWith('-') ? currentInput.slice(1) : '-' + currentInput;
    updateDisplay();
  }

  function percent() {
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;
    currentInput = String(normalizeFloat(val / 100));
    updateDisplay();
  }

  /* ==========================================================================
     04. SCIENTIFIC FUNCTIONS
     ========================================================================== */
  function executeScientific(action) {
    const val = parseFloat(currentInput);
    if (isNaN(val)) return;

    let res = 0;
    let expr = '';

    const toRad = (angle) => (angleMode === 'DEG' ? (angle * Math.PI) / 180 : angle);

    switch (action) {
      case 'sin':
        res = normalizeFloat(Math.sin(toRad(val)));
        expr = `sin(${val})`;
        break;
      case 'cos':
        res = normalizeFloat(Math.cos(toRad(val)));
        expr = `cos(${val})`;
        break;
      case 'tan':
        if (angleMode === 'DEG' && val % 180 === 90) {
          resetAll('Error: Undefined');
          return;
        }
        res = normalizeFloat(Math.tan(toRad(val)));
        expr = `tan(${val})`;
        break;
      case 'ln':
        if (val <= 0) { resetAll('Error'); return; }
        res = normalizeFloat(Math.log(val));
        expr = `ln(${val})`;
        break;
      case 'log':
        if (val <= 0) { resetAll('Error'); return; }
        res = normalizeFloat(Math.log10(val));
        expr = `log(${val})`;
        break;
      case 'sqrt':
        if (val < 0) { resetAll('Error'); return; }
        res = normalizeFloat(Math.sqrt(val));
        expr = `√(${val})`;
        break;
      case 'sqr':
        res = normalizeFloat(val * val);
        expr = `sqr(${val})`;
        break;
      case 'inv':
        if (val === 0) { resetAll('Error'); return; }
        res = normalizeFloat(1 / val);
        expr = `1/(${val})`;
        break;
      case 'fact':
        if (val < 0 || !Number.isInteger(val) || val > 170) {
          resetAll('Error');
          return;
        }
        res = factorial(val);
        expr = `fact(${val})`;
        break;
      case 'pi':
        res = normalizeFloat(Math.PI);
        expr = 'π';
        break;
      case 'e':
        res = normalizeFloat(Math.E);
        expr = 'e';
        break;
      case 'abs':
        res = Math.abs(val);
        expr = `|${val}|`;
        break;
      default:
        return;
    }

    addHistoryRecord(expr, res);
    previousExpression = `${expr} =`;
    currentInput = String(res);
    shouldResetInput = true;
    updateDisplay();
  }

  function factorial(n) {
    if (n === 0 || n === 1) return 1;
    let total = 1;
    for (let i = 2; i <= n; i++) total *= i;
    return total;
  }

  /* ==========================================================================
     05. MEMORY REGISTERS
     ========================================================================== */
  function handleMemory(action) {
    const val = parseFloat(currentInput) || 0;
    switch (action) {
      case 'mc':
        memoryValue = 0;
        DOM.memIndicator.style.display = 'none';
        showToast('Memory Cleared (MC)');
        break;
      case 'mr':
        currentInput = String(memoryValue);
        shouldResetInput = true;
        updateDisplay();
        showToast('Memory Recalled (MR)');
        break;
      case 'm-plus':
        memoryValue = normalizeFloat(memoryValue + val);
        DOM.memIndicator.style.display = 'inline-block';
        shouldResetInput = true;
        showToast(`M+ (${memoryValue})`);
        break;
      case 'm-minus':
        memoryValue = normalizeFloat(memoryValue - val);
        DOM.memIndicator.style.display = 'inline-block';
        shouldResetInput = true;
        showToast(`M- (${memoryValue})`);
        break;
      case 'ms':
        memoryValue = val;
        DOM.memIndicator.style.display = 'inline-block';
        shouldResetInput = true;
        showToast(`Memory Stored (${memoryValue})`);
        break;
    }
  }

  /* ==========================================================================
     06. HISTORY TAPE ENGINE
     ========================================================================== */
  function addHistoryRecord(expression, result) {
    const item = {
      id: 'hist-' + Date.now(),
      expression,
      result,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    };
    history.unshift(item);
    if (history.length > 50) history.pop();
    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    DOM.historyList.innerHTML = '';
    if (history.length === 0) {
      DOM.emptyHistory.style.display = 'flex';
      return;
    }
    DOM.emptyHistory.style.display = 'none';

    history.forEach(item => {
      const el = document.createElement('div');
      el.className = 'history-item';
      el.innerHTML = `
        <div class="hist-expr">${item.expression} =</div>
        <div class="hist-res">${item.result}</div>
      `;
      el.addEventListener('click', () => {
        currentInput = String(item.result);
        shouldResetInput = true;
        updateDisplay();
        showToast('Recalled result from history');
      });
      DOM.historyList.appendChild(el);
    });
  }

  /* ==========================================================================
     07. EVENT MAPPINGS (CLICK & PHYSICAL KEYBOARD)
     ========================================================================== */
  function setupEvents() {
    // Mode toggles
    DOM.btnModeStd.addEventListener('click', () => {
      isScientific = false;
      DOM.btnModeStd.classList.add('active');
      DOM.btnModeSci.classList.remove('active');
      DOM.scientificPad.style.display = 'none';
      DOM.angleToggles.style.display = 'none';
    });

    DOM.btnModeSci.addEventListener('click', () => {
      isScientific = true;
      DOM.btnModeSci.classList.add('active');
      DOM.btnModeStd.classList.remove('active');
      DOM.scientificPad.style.display = 'grid';
      DOM.angleToggles.style.display = 'flex';
    });

    // Angle toggles
    DOM.btnAngleDeg.addEventListener('click', () => {
      angleMode = 'DEG';
      DOM.btnAngleDeg.classList.add('active');
      DOM.btnAngleRad.classList.remove('active');
    });

    DOM.btnAngleRad.addEventListener('click', () => {
      angleMode = 'RAD';
      DOM.btnAngleRad.classList.add('active');
      DOM.btnAngleDeg.classList.remove('active');
    });

    // Copy Result
    DOM.copyResultBtn.addEventListener('click', () => {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(currentInput).then(() => {
          showToast('Copied value to clipboard');
        });
      }
    });

    // Toggle History Sidebar on mobile / drawer
    DOM.toggleHistoryBtn.addEventListener('click', () => {
      DOM.historySidebar.scrollIntoView({ behavior: 'smooth' });
    });

    // Clear History
    DOM.clearHistoryBtn.addEventListener('click', () => {
      history = [];
      saveHistory();
      renderHistory();
      showToast('Calculation history cleared');
    });

    // Keypad Click Delegation
    DOM.primaryKeypad.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const num = btn.getAttribute('data-num');
      if (num !== null) {
        appendDigit(num);
        return;
      }

      const action = btn.getAttribute('data-action');
      if (action === 'operator') {
        const op = btn.getAttribute('data-op');
        handleOperator(op);
      } else if (action === 'evaluate') {
        evaluate();
      } else if (action === 'clear') {
        resetAll();
      } else if (action === 'backspace') {
        backspace();
      } else if (action === 'negate') {
        negate();
      } else if (action === 'percent') {
        percent();
      }
    });

    // Scientific Keypad Delegation
    DOM.scientificPad.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      if (action) executeScientific(action);
    });

    // Memory Keys Delegation
    DOM.memoryActionsRow.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      if (action) handleMemory(action);
    });

    // Physical Keyboard Support
    window.addEventListener('keydown', (e) => {
      // Numbers 0-9
      if (e.key >= '0' && e.key <= '9') {
        appendDigit(e.key);
      } else if (e.key === '.') {
        appendDigit('.');
      } else if (e.key === '+' || e.key === '-') {
        handleOperator(e.key);
      } else if (e.key === '*') {
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        evaluate();
      } else if (e.key === 'Backspace') {
        backspace();
      } else if (e.key === 'Escape') {
        resetAll();
      } else if (e.key === '%') {
        percent();
      }
    });
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadHistory();
    renderHistory();
    setupEvents();
    updateDisplay();
  });
})();
