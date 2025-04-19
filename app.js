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
    div.className = "task-item task-red";
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
    div.className = "task-item task-red";
    div.textContent = task.title;

    div.addEventListener("click", () => {
      alert(task.detail);
    });

    div.addEventListener("swipeleft", () => markRevisionDone(task, div, today));
    div.addEventListener("swiperight", () =>
      undoRevisionDone(task, div, today)
    );

    container.appendChild(div);
  });
}

// Mark and Undo Revision
function markRevisionDone(task, div, date) {
  if (!task.completedRevisions.includes(date)) {
    task.completedRevisions.push(date);
    div.classList.remove("task-red");
    div.classList.add("task-green");
    saveTasks();
  }
}

function undoRevisionDone(task, div, date) {
  task.completedRevisions = task.completedRevisions.filter((d) => d !== date);
  div.classList.remove("task-green");
  div.classList.add("task-red");
  saveTasks();
}

// Render All Tasks Grouped by Date
function renderAllTasksGroupedByDate() {
  const container = document.getElementById("allTasksContainer");
  container.innerHTML = "";

  const grouped = {};
  tasks.forEach((task) => {
    if (!grouped[task.date]) grouped[task.date] = [];
    grouped[task.date].push(task);
  });

  Object.keys(grouped)
    .sort()
    .forEach((date) => {
      const section = document.createElement("div");
      section.className = "task-group";

      const header = document.createElement("h3");
      header.textContent = date;
      section.appendChild(header);

      grouped[date].forEach((task) => {
        const taskDiv = document.createElement("div");
        taskDiv.className = "task-entry";
        taskDiv.innerHTML = `
          <h4>📌 ${task.title}</h4>
          <p>📝 ${task.detail}</p>
          <div class="srt-regime">🕒 SRT Regime: ${task.srtRegime}</div>
          <button onclick="deleteTask(${task.id})" class="delete-btn">Delete</button>
        `;
        section.appendChild(taskDiv);
      });

      container.appendChild(section);
    });
}

// Delete Individual Task
function deleteTask(id) {
  if (confirm("Delete this task permanently?")) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    renderAllTasksGroupedByDate();
  }
}

// Reset All Tasks
function resetAllTasks() {
  if (confirm("Delete all tasks?")) {
    tasks = [];
    saveTasks();
    renderTodayTasks();
    renderRevisionTasks();
    renderAllTasksGroupedByDate();
  }
}

// Download Backup
function downloadTasks() {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], {
    type: "text/plain"
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "tasks_backup.txt";
  a.click();
}

// Upload Backup
function uploadTasks(event) {
  const file = event.target.files[0];
  if (!file || !file.name.endsWith(".txt")) {
    alert("Please upload a valid .txt file");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const data = JSON.parse(e.target.result);
      if (Array.isArray(data)) {
        tasks = data;
        saveTasks();
        renderTodayTasks();
        renderRevisionTasks();
        renderAllTasksGroupedByDate();
        alert("Tasks uploaded successfully!");
      } else {
        alert("Invalid file structure.");
      }
    } catch {
      alert("Failed to parse file.");
    }
  };
  reader.readAsText(file);
}

// Update SRT Intervals
function saveCustomIntervals() {
  // Get the interval values from the inputs
  customRegimes.Aggressive = [
    parseInt(document.getElementById("aggressive1").value),
    parseInt(document.getElementById("aggressive2").value),
    parseInt(document.getElementById("aggressive4").value),
    parseInt(document.getElementById("aggressive7").value),
    parseInt(document.getElementById("aggressive10").value),
  ];

  customRegimes.Relaxed = [
    parseInt(document.getElementById("relaxed2").value),
    parseInt(document.getElementById("relaxed5").value),
    parseInt(document.getElementById("relaxed10").value),
    parseInt(document.getElementById("relaxed20").value),
    parseInt(document.getElementById("relaxed30").value),
  ];

  // Store the updated values in localStorage
  localStorage.setItem("customRegimes", JSON.stringify(customRegimes));

  alert("SRT intervals have been saved!");

  // Optionally navigate back to the add-tasks page or do any additional tasks
  window.location.href = "add-tasks.html"; // Navigate back after saving
}

// Initial Setup
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("taskDate")) {
    document.getElementById("taskDate").value =
      new Date().toISOString().split("T")[0];
  }

  if (document.getElementById("todayTasks")) renderTodayTasks();
  if (document.getElementById("revisionTasks")) renderRevisionTasks();
  if (document.getElementById("allTasksContainer")) renderAllTasksGroupedByDate();

  // Add event listener for "Settings" button in add-tasks.html
  const settingsBtn = document.getElementById("settingsBtn");
  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      window.location.href = "settings.html"; // Navigate to settings page
    });
  }

  // Handle Back button on settings page
  const backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", () => {
      window.location.href = "add-tasks.html"; // Navigate back to add tasks
    });
  }
});
