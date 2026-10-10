/**
 * Taskflow - Advanced Task & Productivity Management Engine
 * Vanilla ES6+ Implementation with LocalStorage Persistence
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'ankit_taskflow_data_v1';
  const THEME_KEY = 'ap_portfolio_theme';

  // Sample seed tasks for demonstration
  const SEED_TASKS = [
    {
      id: 'task-seed-1',
      title: 'Practice Binary Search & Sliding Window algorithms in C++',
      category: 'Study',
      priority: 'High',
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      desc: 'Complete 3 medium problems on LeetCode focusing on two-pointer patterns.',
      completed: true,
      createdAt: Date.now() - 86400000 * 7
    },
    {
      id: 'task-seed-2',
      title: 'Complete responsive CSS Grid layout for Weather Dashboard',
      category: 'Project',
      priority: 'High',
      dueDate: new Date(Date.now() + 86400000 * 1).toISOString().split('T')[0],
      desc: 'Verify clamp() fluid scaling and test on mobile screen widths.',
      completed: true,
      createdAt: Date.now() - 86400000 * 6
    },
    {
      id: 'task-seed-3',
      title: 'Review Discrete Mathematics graph theory lecture notes',
      category: 'Study',
      priority: 'Medium',
      dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
      desc: 'Prepare for midterm test on Euler paths and Hamiltonian cycles.',
      completed: false,
      createdAt: Date.now() - 86400000 * 5
    },
    {
      id: 'task-seed-4',
      title: 'Build interactive CSS Conic-Gradient charts for SpendWise Expense Tracker',
      category: 'Project',
      priority: 'High',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      desc: 'Implement dynamic SVG and CSS conic gradient rendering without external libraries.',
      completed: false,
      createdAt: Date.now() - 86400000 * 4
    },
    {
      id: 'task-seed-5',
      title: 'Implement IEEE 754 precision correction for OmniCalc Calculator',
      category: 'Coding',
      priority: 'Medium',
      dueDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
      desc: 'Guard against floating point representation artifacts (0.1 + 0.2 = 0.3).',
      completed: false,
      createdAt: Date.now() - 86400000 * 3
    },
    {
      id: 'task-seed-6',
      title: 'Review Operating Systems process scheduling & semaphore locks',
      category: 'Study',
      priority: 'High',
      dueDate: new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0],
      desc: 'Study Round-Robin, Priority Preemptive, and deadlock avoidance bankers algorithm.',
      completed: false,
      createdAt: Date.now() - 86400000 * 2
    },
    {
      id: 'task-seed-7',
      title: 'Refactor mobile viewport breakpoints & smooth touch scrollbars',
      category: 'Project',
      priority: 'Low',
      dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      desc: 'Ensure no horizontal clipping occurs on screens between 320px and 768px.',
      completed: false,
      createdAt: Date.now() - 86400000 * 1
    },
    {
      id: 'task-seed-8',
      title: 'Push Git commits and document local offline deployment architecture',
      category: 'Coding',
      priority: 'Low',
      dueDate: new Date(Date.now() + 86400000 * 8).toISOString().split('T')[0],
      desc: 'Commit clean updates, verify local static web server, and review portfolio links.',
      completed: false,
      createdAt: Date.now()
    }
  ];

  // Application State
  let tasks = [];
  let currentFilter = 'all'; // 'all', 'pending', 'completed'
  let currentCategory = 'all';
  let searchQuery = '';
  let currentSort = 'newest';

  // DOM Elements Cache
  const DOM = {
    html: document.documentElement,
    themeToggle: document.getElementById('theme-toggle'),
    taskForm: document.getElementById('task-form'),
    titleInput: document.getElementById('task-title-input'),
    categorySelect: document.getElementById('task-category-select'),
    prioritySelect: document.getElementById('task-priority-select'),
    dueDateInput: document.getElementById('task-due-date'),
    descInput: document.getElementById('task-desc-input'),
    taskList: document.getElementById('task-list'),
    emptyState: document.getElementById('empty-state'),
    emptyResetBtn: document.getElementById('empty-reset-btn'),

    // Metrics
    metricTotal: document.getElementById('metric-total'),
    metricPending: document.getElementById('metric-pending'),
    metricCompleted: document.getElementById('metric-completed'),
    metricRate: document.getElementById('metric-rate'),
    progressFill: document.getElementById('progress-fill'),

    // Toolbar
    searchInput: document.getElementById('search-input'),
    clearSearchBtn: document.getElementById('clear-search-btn'),
    filterTabs: document.querySelectorAll('.tab-btn'),
    categoryFilter: document.getElementById('filter-category'),
    sortSelect: document.getElementById('sort-select'),
    optionsBtn: document.getElementById('options-btn'),
    optionsMenu: document.getElementById('options-menu'),
    btnExport: document.getElementById('btn-export-tasks'),
    btnImport: document.getElementById('import-file-input'),
    btnClearCompleted: document.getElementById('btn-clear-completed'),
    btnResetDemo: document.getElementById('btn-reset-demo'),

    // Edit Dialog
    editDialog: document.getElementById('edit-task-dialog'),
    editForm: document.getElementById('edit-task-form'),
    editId: document.getElementById('edit-task-id'),
    editTitle: document.getElementById('edit-task-title'),
    editCategory: document.getElementById('edit-task-category'),
    editPriority: document.getElementById('edit-task-priority'),
    editDue: document.getElementById('edit-task-due'),
    editDesc: document.getElementById('edit-task-desc'),
    closeDialogBtn: document.getElementById('close-dialog-btn'),
    cancelEditBtn: document.getElementById('cancel-edit-btn'),

    // Toast
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toast-message')
  };

  /* ==========================================================================
     01. THEME ENGINE
     ========================================================================== */
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const activeTheme = saved ? saved : (prefersDark ? 'dark' : 'light');
    DOM.html.setAttribute('data-theme', activeTheme);

    DOM.themeToggle.addEventListener('click', () => {
      const current = DOM.html.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      DOM.html.setAttribute('data-theme', next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  /* ==========================================================================
     02. LOCAL STORAGE HANDLING
     ========================================================================== */
  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        tasks = JSON.parse(raw);
      } else {
        tasks = [...SEED_TASKS];
        saveTasks();
      }
    } catch (e) {
      console.error('Failed to parse tasks from localStorage', e);
      tasks = [...SEED_TASKS];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }

  /* ==========================================================================
     03. METRICS UPDATE
     ========================================================================== */
  function updateMetrics() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    DOM.metricTotal.textContent = total;
    DOM.metricPending.textContent = pending;
    DOM.metricCompleted.textContent = completed;
    DOM.metricRate.textContent = `${percentage}%`;
    DOM.progressFill.style.width = `${percentage}%`;
  }

  /* ==========================================================================
     04. TASK FILTERING & SORTING
     ========================================================================== */
  function getFilteredAndSortedTasks() {
    let result = [...tasks];

    // Status Filter (tab)
    if (currentFilter === 'pending') {
      result = result.filter(t => !t.completed);
    } else if (currentFilter === 'completed') {
      result = result.filter(t => t.completed);
    }

    // Category Filter
    if (currentCategory !== 'all') {
      result = result.filter(t => t.category === currentCategory);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.desc && t.desc.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (currentSort === 'newest') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      } else if (currentSort === 'oldest') {
        return (a.createdAt || 0) - (b.createdAt || 0);
      } else if (currentSort === 'priority') {
        const order = { High: 3, Medium: 2, Low: 1 };
        return (order[b.priority] || 0) - (order[a.priority] || 0);
      } else if (currentSort === 'due') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return 0;
    });

    return result;
  }

  /* ==========================================================================
     05. RENDERING PIPELINE
     ========================================================================== */
  function render() {
    updateMetrics();

    const filtered = getFilteredAndSortedTasks();
    DOM.taskList.innerHTML = '';

    if (filtered.length === 0) {
      DOM.emptyState.style.display = 'flex';
      return;
    }

    DOM.emptyState.style.display = 'none';

    filtered.forEach(task => {
      const item = document.createElement('div');
      item.className = `task-item ${task.completed ? 'completed' : ''}`;
      item.id = `task-${task.id}`;

      // Due date formatting
      let dueHtml = '';
      if (task.dueDate) {
        const dueObj = new Date(task.dueDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isOverdue = !task.completed && dueObj < today;
        dueHtml = `
          <div class="task-due-badge ${isOverdue ? 'overdue' : ''}">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="10" y1="10" y2="10"/></svg>
            <span>${task.dueDate}</span>
          </div>
        `;
      }

      const categoryClass = `badge-${task.category.toLowerCase()}`;
      const priorityClass = `priority-${task.priority.toLowerCase()}`;

      item.innerHTML = `
        <div class="task-checkbox-wrap">
          <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''} aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}">
        </div>
        <div class="task-content">
          <div class="task-header-row">
            <span class="task-title">${escapeHtml(task.title)}</span>
            <div class="task-actions">
              <button type="button" class="action-btn-sm edit-btn" data-id="${task.id}" title="Edit task" aria-label="Edit task">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
              <button type="button" class="action-btn-sm delete-btn" data-id="${task.id}" title="Delete task" aria-label="Delete task">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
              </button>
            </div>
          </div>
          ${task.desc ? `<p class="task-desc">${escapeHtml(task.desc)}</p>` : ''}
          <div class="task-meta-row">
            <span class="badge ${categoryClass}">${task.category}</span>
            <span class="badge ${priorityClass}">${task.priority}</span>
            ${dueHtml}
          </div>
        </div>
      `;

      DOM.taskList.appendChild(item);
    });
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /* ==========================================================================
     06. EVENT DELEGATION & CRUD ACTIONS
     ========================================================================== */
  function setupEvents() {
    // Add Task Submit
    DOM.taskForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = DOM.titleInput.value.trim();
      if (!title) return;

      const newTask = {
        id: 'task-' + Date.now(),
        title: title,
        category: DOM.categorySelect.value,
        priority: DOM.prioritySelect.value,
        dueDate: DOM.dueDateInput.value || '',
        desc: DOM.descInput.value.trim() || '',
        completed: false,
        createdAt: Date.now()
      };

      tasks.unshift(newTask);
      saveTasks();
      render();

      DOM.taskForm.reset();
      showToast('Task added successfully');

      // Smoothly scroll to the newly created task item and add focus pulse
      const firstTask = DOM.taskList.firstElementChild;
      if (firstTask) {
        firstTask.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        firstTask.classList.add('task-highlight');
        setTimeout(() => firstTask.classList.remove('task-highlight'), 1800);
      }
      DOM.titleInput.focus();
    });

    // Checkbox & Action Button Delegation
    DOM.taskList.addEventListener('click', (e) => {
      const checkbox = e.target.closest('.task-checkbox');
      if (checkbox) {
        const id = checkbox.getAttribute('data-id');
        toggleTaskCompletion(id);
        return;
      }

      const editBtn = e.target.closest('.edit-btn');
      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        openEditDialog(id);
        return;
      }

      const deleteBtn = e.target.closest('.delete-btn');
      if (deleteBtn) {
        const id = deleteBtn.getAttribute('data-id');
        deleteTask(id);
        return;
      }
    });

    // Search Input
    DOM.searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      DOM.clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
      render();
    });

    DOM.clearSearchBtn.addEventListener('click', () => {
      DOM.searchInput.value = '';
      searchQuery = '';
      DOM.clearSearchBtn.style.display = 'none';
      render();
    });

    // Filter Tabs
    DOM.filterTabs.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.filterTabs.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter');
        render();
      });
    });

    // Category Filter Dropdown
    DOM.categoryFilter.addEventListener('change', (e) => {
      currentCategory = e.target.value;
      render();
    });

    // Sort Dropdown
    DOM.sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      render();
    });

    // Options Menu Toggle
    DOM.optionsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      DOM.optionsMenu.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      DOM.optionsMenu.classList.remove('show');
    });

    // Clear Completed
    DOM.btnClearCompleted.addEventListener('click', () => {
      const initialCount = tasks.length;
      tasks = tasks.filter(t => !t.completed);
      const cleared = initialCount - tasks.length;
      saveTasks();
      render();
      showToast(cleared > 0 ? `Cleared ${cleared} completed task${cleared > 1 ? 's' : ''}` : 'No completed tasks to clear');
    });

    // Reset Demo Tasks
    DOM.btnResetDemo.addEventListener('click', () => {
      tasks = [...SEED_TASKS];
      saveTasks();
      render();
      showToast('Sample tasks reloaded');
    });

    if (DOM.emptyResetBtn) {
      DOM.emptyResetBtn.addEventListener('click', () => {
        tasks = [...SEED_TASKS];
        saveTasks();
        render();
        showToast('Sample tasks reloaded');
      });
    }

    // Export JSON
    DOM.btnExport.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `taskflow_backup_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Tasks exported to JSON');
    });

    // Import JSON
    DOM.btnImport.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          if (Array.isArray(imported)) {
            tasks = imported;
            saveTasks();
            render();
            showToast(`Imported ${tasks.length} tasks successfully`);
          } else {
            showToast('Invalid JSON file format');
          }
        } catch (err) {
          showToast('Failed to parse JSON file');
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    });

    // Edit Dialog Handling
    DOM.closeDialogBtn.addEventListener('click', () => DOM.editDialog.close());
    DOM.cancelEditBtn.addEventListener('click', () => DOM.editDialog.close());

    DOM.editForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = DOM.editId.value;
      const target = tasks.find(t => t.id === id);
      if (target) {
        target.title = DOM.editTitle.value.trim();
        target.category = DOM.editCategory.value;
        target.priority = DOM.editPriority.value;
        target.dueDate = DOM.editDue.value || '';
        target.desc = DOM.editDesc.value.trim() || '';

        saveTasks();
        render();
        DOM.editDialog.close();
        showToast('Task updated successfully');
      }
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl + N or Alt + N to focus task input
      if ((e.ctrlKey || e.metaKey || e.altKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        DOM.titleInput.focus();
      }
      // Esc to clear search if active
      if (e.key === 'Escape' && document.activeElement === DOM.searchInput) {
        DOM.searchInput.value = '';
        searchQuery = '';
        DOM.clearSearchBtn.style.display = 'none';
        DOM.searchInput.blur();
        render();
      }
    });

    // Scroll handling: Floating Back-to-Top, Sticky Header elevation & Scroll Progress bar
    const backToTopBtn = document.getElementById('back-to-top-btn');
    const appHeader = document.querySelector('.app-header');
    const scrollProgressBar = document.getElementById('scroll-progress-bar');

    function handleScroll() {
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;

      // Scroll Progress Indicator
      if (scrollProgressBar && scrollHeight > 0) {
        const progress = Math.min(100, Math.max(0, (scrollY / scrollHeight) * 100));
        scrollProgressBar.style.width = `${progress}%`;
      }

      // Back-to-Top Floating Button
      if (backToTopBtn) {
        if (scrollY > 180) {
          backToTopBtn.classList.add('visible');
        } else {
          backToTopBtn.classList.remove('visible');
        }
      }

      // Sticky Header Shadow & Blur Elevation
      if (appHeader) {
        if (scrollY > 10) {
          appHeader.classList.add('scrolled');
        } else {
          appHeader.classList.remove('scrolled');
        }
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  }

  function toggleTaskCompletion(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    saveTasks();
    render();
    showToast(task.completed ? 'Task completed! 🎉' : 'Task marked as pending');
  }

  function deleteTask(id) {
    const taskIndex = tasks.findIndex(t => t.id === id);
    if (taskIndex === -1) return;

    const [deletedTask] = tasks.splice(taskIndex, 1);
    saveTasks();
    render();
    showToast('Task deleted');
  }

  function openEditDialog(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    DOM.editId.value = task.id;
    DOM.editTitle.value = task.title;
    DOM.editCategory.value = task.category;
    DOM.editPriority.value = task.priority;
    DOM.editDue.value = task.dueDate || '';
    DOM.editDesc.value = task.desc || '';

    if (typeof DOM.editDialog.showModal === 'function') {
      DOM.editDialog.showModal();
    } else {
      DOM.editDialog.setAttribute('open', '');
    }
  }

  let toastTimeout;
  function showToast(message) {
    if (!DOM.toast) return;
    DOM.toastMsg.textContent = message;
    DOM.toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      DOM.toast.classList.remove('show');
    }, 2500);
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadTasks();
    setupEvents();
    render();
  });
})();
