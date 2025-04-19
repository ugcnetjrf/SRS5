// Global Variables
let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let customRegimes = JSON.parse(localStorage.getItem("customRegimes")) || {
  Aggressive: [1, 2, 4, 7, 10],
  Relaxed: [2, 5, 10, 20, 30]
};

// Utility Functions
function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

function showPopup(message) {
  const popup = document.createElement("div");
  popup.textContent = message;
  popup.style.position = "fixed";
  popup.style.bottom = "20px";
  popup.style.left = "50%";
  popup.style.transform = "translateX(-50%)";
  popup.style.background = "#22F5B1";
  popup.style.color = "#000";
  popup.style.padding = "10px 20px";
  popup.style.borderRadius = "5px";
  popup.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
  popup.style.zIndex = "9999";
  document.body.appendChild(popup);
  setTimeout(() => {
    popup.remove();
  }, 2000);
}

// Add Task
function addTask() {
  const titleInput = document.getElementById("taskTitle");
  const detailInput = document.getElementById("taskDetail");
  const dateInput = document.getElementById("taskDate");
  const srtSelect = document.getElementById("srtRegime");

  const title = titleInput.value.trim();
  const detail = detailInput.value.trim();
  const date = dateInput.value;
  const srtRegime = srtSelect.value;

  if (!title || !detail || !date || !srtRegime) {
    alert("Please fill in all fields.");
    return;
  }

  const intervals =
    srtRegime === "Standard"
      ? [1, 3, 7, 14, 21]
      : customRegimes[srtRegime] || [];

  const revisionDates = intervals.map((i) => {
    const d = new Date(date);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const task = {
    id: Date.now(),
    title,
    detail,
    date,
    srtRegime,
    revisionDates,
    completedRevisions: []
  };

  tasks.push(task);
  saveTasks();

  titleInput.value = "";
  detailInput.value = "";
  dateInput.value = new Date().toISOString().split("T")[0];
  srtSelect.value = "Standard";

  renderTodayTasks();
  renderRevisionTasks();

  showPopup("Task added successfully!");
}

// Render Daily Tasks
function renderTodayTasks() {
  const today = new Date().toISOString().split("T")[0];
  const container = document.getElementById("todayTasks");
  container.innerHTML = "";

  const todayTasks = tasks.filter((t) => t.date === today);

  if (todayTasks.length === 0) {
    container.innerHTML = "<p>No tasks added today.</p>";
    return;
  }

  todayTasks.forEach((task) => {
    const div = document.createElement("div");
    div.className = "task-item";
    div.textContent = task.title;

    div.addEventListener("click", () => {
      alert(task.detail);
    });

    container.appendChild(div);
  });
}

// Render Revision Tasks Due Today
function renderRevisionTasks() {
  const today = new Date().toISOString().split("T")[0];
  const container = document.getElementById("revisionTasks");
  container.innerHTML = "";

  const dueTasks = tasks.filter(
    (task) =>
      task.revisionDates.includes(today) &&
      !task.completedRevisions.includes(today)
  );

  if (dueTasks.length === 0) {
    container.innerHTML = "<p>No revisions due today.</p>";
    return;
  }

  dueTasks.forEach((task) => {
    const div = document.createElement("div");
    div.className = "task-item";
    div.textContent = task.title;

    div.addEventListener("click", () => {
      alert(task.detail);
    });

    container.appendChild(div);
  });
}

// Render All Tasks Grouped by Date
function renderAllTasksGroupedByDate() {
  const container = document.getElementById("allTasksContainer");
  container.innerHTML = "";

  const groupedTasks = tasks.reduce((groups, task) => {
    task.revisionDates.forEach((date) => {
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(task);
    });
    return groups;
  }, {});

  for (const [date, tasks] of Object.entries(groupedTasks)) {
    const groupDiv = document.createElement("div");
    groupDiv.className = "task-group";

    const dateHeader = document.createElement("h3");
    dateHeader.textContent = `Revision Date: ${date}`;
    groupDiv.appendChild(dateHeader);

    tasks.forEach((task) => {
      const taskDiv = document.createElement("div");
      taskDiv.className = "task-item";
      taskDiv.textContent = task.title;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => deleteTask(task.id));

      taskDiv.appendChild(deleteBtn);
      groupDiv.appendChild(taskDiv);
    });

    container.appendChild(groupDiv);
  }
}

// Delete Task
function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderAllTasksGroupedByDate();
  showPopup("Task deleted.");
}

// Download Tasks as Text File
function downloadTasks() {
  const tasksText = tasks
    .map((task) => {
      return `Title: ${task.title}\nDetail: ${task.detail}\nDate: ${task.date}\nSRT Regime: ${task.srtRegime}\nRevision Dates: ${task.revisionDates.join(
        ", "
      )}\n\n`;
    })
    .join("");

  const blob = new Blob([tasksText], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "tasks.txt";
  link.click();
}

// Upload Tasks from Text File
function uploadTasks() {
  const fileInput = document.getElementById("uploadTasksBtn");
  const file = fileInput.files[0];

  if (!file) {
    showPopup("No file selected.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const content = e.target.result;
    const taskEntries = content.split("\n\n");

    taskEntries.forEach((entry) => {
      const lines = entry.split("\n");
      if (lines.length < 4) return;

      const title = lines[0].replace("Title: ", "").trim();
      const detail = lines[1].replace("Detail: ", "").trim();
      const date = lines[2].replace("Date: ", "").trim();
      const srtRegime = lines[3].replace("SRT Regime: ", "").trim();
      const revisionDates = lines[4]
        ? lines[4].replace("Revision Dates: ", "").split(", ").map((d) => d.trim())
        : [];

      const task = {
        id: Date.now(),
        title,
        detail,
        date,
        srtRegime,
        revisionDates,
        completedRevisions: []
      };

      tasks.push(task);
    });

    saveTasks();
    renderAllTasksGroupedByDate();
    showPopup("Tasks uploaded successfully!");
  };

  reader.readAsText(file);
}

// Reset All Tasks
function resetTasks() {
  if (confirm("Are you sure you want to reset all tasks?")) {
    tasks = [];
    saveTasks();
    renderAllTasksGroupedByDate();
    showPopup("All tasks have been reset.");
  }
}

// Event Listeners
document.getElementById("addTaskBtn").addEventListener("click", addTask);
document.getElementById("allTasksBtn").addEventListener("click", () => {
  window.location.href = "all-tasks.html";
});

document.getElementById("backToHomeBtn").addEventListener("click", () => {
  window.location.href = "index.html";
});

document.getElementById("downloadTasksBtn").addEventListener("click", downloadTasks);
document.getElementById("uploadTasksBtn").addEventListener("change", uploadTasks);
document.getElementById("resetTasksBtn").addEventListener("click", resetTasks);

// Initialize Views
renderTodayTasks();
renderRevisionTasks();
renderAllTasksGroupedByDate();
