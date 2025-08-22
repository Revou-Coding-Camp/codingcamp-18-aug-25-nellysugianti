console.log("Hello, World!");

document.addEventListener('DOMContentLoaded', () => {
  // Element references
  const taskForm = document.getElementById('task-form');
  const taskInput = document.getElementById('task-input');
  const dueDateInput = document.getElementById('due-date-input');
  const tasksTableBody = document.getElementById('tasks-table-body');
  const deleteAllBtn = document.getElementById('deleteAllBtn');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const dateFilter = document.getElementById('date-filter');
  const countAll = document.getElementById('countAll');
  const countInProgress = document.getElementById('countInProgress');
  const countCompleted = document.getElementById('countCompleted');

  let tasks = [];
  const STATUS = { IN_PROGRESS: 'inprogress', COMPLETED: 'completed' };
  let currentFilter = 'all';
  let currentDateFilter = 'all';

  // Load tasks from localStorage
  function loadTasks() {
    const stored = localStorage.getItem('todoTasks');
    if (stored) {
      try {
        tasks = JSON.parse(stored).map(t => ({ ...t, dueDate: new Date(t.dueDate) }));
      } catch {
        tasks = [];
      }
    }
  }

  // Save tasks to localStorage
  function saveTasks() {
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
  }

  // Format date for display
  function formatDate(date) {
    if (!(date instanceof Date)) return '';
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // Date category: overdue, today, future
  function dateCategory(date) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const check = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (check < today) return 'overdue';
    if (check.getTime() === today.getTime()) return 'today';
    return 'future';
  }

  // Status badge HTML
  function statusBadge(status) {
    if (status === STATUS.COMPLETED) {
      return `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-200 text-green-800 select-none">Completed</span>`;
    }
    return `<span class="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-amber-200 text-amber-800 select-none">In Progress</span>`;
  }

  // Update counts
  function updateCounts() {
    countAll.textContent = `(${tasks.length})`;
    countInProgress.textContent = `(${tasks.filter(t => t.status === STATUS.IN_PROGRESS).length})`;
    countCompleted.textContent = `(${tasks.filter(t => t.status === STATUS.COMPLETED).length})`;
  }

  // Update filter button states
  function updateFilterButtons(active) {
    filterBtns.forEach(btn => {
      const isActive = btn.dataset.filter === active;
      btn.classList.toggle('bg-white', isActive);
      btn.classList.toggle('text-sky-800', isActive);
      btn.classList.toggle('font-semibold', isActive);
      btn.classList.toggle('hover:bg-sky-200', !isActive);
      btn.setAttribute('aria-pressed', isActive);
    });
  }

  // Render tasks
  function renderTasks() {
    updateCounts();
    updateFilterButtons(currentFilter);

    let filtered = tasks;
    if (currentFilter === STATUS.IN_PROGRESS) filtered = tasks.filter(t => t.status === STATUS.IN_PROGRESS);
    else if (currentFilter === STATUS.COMPLETED) filtered = tasks.filter(t => t.status === STATUS.COMPLETED);

    if (currentDateFilter !== 'all') {
      filtered = filtered.filter(t => dateCategory(t.dueDate) === currentDateFilter);
    }

    tasksTableBody.innerHTML = '';
    if (filtered.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `<td colspan="5" class="text-center py-6 text-gray-500 select-none">No tasks to show.</td>`;
      tasksTableBody.appendChild(row);
      return;
    }

    filtered.forEach((task, idx) => {
      const tr = document.createElement('tr');
      tr.className = 'hover:bg-sky-50';

      const checked = task.status === STATUS.COMPLETED ? 'checked' : '';
      const checkbox = `<input type="checkbox" aria-label="Mark task as completed" ${checked} class="w-5 h-5 cursor-pointer" data-index="${idx}" />`;

      const dueDateIso = task.dueDate.toISOString().slice(0, 10);
      const todayIso = new Date().toISOString().slice(0, 10);
      const isOverdue = dueDateIso < todayIso && task.status !== STATUS.COMPLETED;
      const dueDateClass = isOverdue ? 'bg-red-200 text-red-800' : 'bg-gray-200 text-gray-800';
      const dueDateHtml = `<time datetime="${dueDateIso}" class="inline-block px-3 py-1 rounded-full text-xs font-medium ${dueDateClass} select-none">${formatDate(task.dueDate)}</time>`;

      const deleteBtn = `<button class="delete-btn text-gray-500 hover:text-red-600 transition" aria-label="Delete task" data-index="${idx}" title="Delete Task" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 inline-block" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>`;

      tr.innerHTML = `
        <td class="border-b border-gray-200 px-4 py-3 text-center">${checkbox}</td>
        <td class="border-b border-gray-200 px-4 py-3 break-words max-w-xs">${task.description}</td>
        <td class="border-b border-gray-200 px-4 py-3 text-center">${dueDateHtml}</td>
        <td class="border-b border-gray-200 px-4 py-3 text-center">${statusBadge(task.status)}</td>
        <td class="border-b border-gray-200 px-4 py-3 text-center">${deleteBtn}</td>
      `;
      tasksTableBody.appendChild(tr);
    });
  }

  // Add task
  function addTask(description, dueDate) {
    tasks.push({ description, dueDate, status: STATUS.IN_PROGRESS });
    saveTasks();
    renderTasks();
  }

  // Delete task
  function deleteTask(index) {
    if (index >= 0 && index < tasks.length) {
      tasks.splice(index, 1);
      saveTasks();
      renderTasks();
    }
  }

  // Toggle task status
  function toggleTaskStatus(index, completed) {
    if (index >= 0 && index < tasks.length) {
      tasks[index].status = completed ? STATUS.COMPLETED : STATUS.IN_PROGRESS;
      saveTasks();
      renderTasks();
    }
  }

  // Delete all tasks
  function deleteAllTasks() {
    if (tasks.length === 0) return;
    if (confirm('Are you sure you want to delete all tasks? This action cannot be undone.')) {
      tasks = [];
      saveTasks();
      renderTasks();
    }
  }

  // Validate date
  function isValidDate(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return !isNaN(d.getTime());
  }

  // Set default due date to tomorrow
  function setDefaultDueDate() {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    dueDateInput.valueAsDate = tomorrow;
    dueDateInput.min = now.toISOString().slice(0, 10);
  }

  // Event listeners
  taskForm.addEventListener('submit', e => {
    e.preventDefault();
    const description = taskInput.value.trim();
    const dueDateVal = dueDateInput.value;
    if (!description) {
      alert('Please enter a task description.');
      taskInput.focus();
      return;
    }
    if (!isValidDate(dueDateVal)) {
      alert('Please enter a valid due date.');
      dueDateInput.focus();
      return;
    }
    addTask(description, new Date(dueDateVal));
    taskInput.value = '';
    setDefaultDueDate();
    taskInput.focus();
  });

  tasksTableBody.addEventListener('click', e => {
    if (e.target.closest('.delete-btn')) {
      const index = Number(e.target.closest('.delete-btn').dataset.index);
      deleteTask(index);
    }
  });

  tasksTableBody.addEventListener('change', e => {
    if (e.target.matches('input[type="checkbox"]')) {
      const index = Number(e.target.dataset.index);
      toggleTaskStatus(index, e.target.checked);
    }
  });

  deleteAllBtn.addEventListener('click', deleteAllTasks);

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currentFilter = btn.dataset.filter;
      renderTasks();
    });
  });

  dateFilter.addEventListener('change', () => {
    currentDateFilter = dateFilter.value;
    renderTasks();
  });

  // Initialize
  setDefaultDueDate();
  loadTasks();
  renderTasks();
});