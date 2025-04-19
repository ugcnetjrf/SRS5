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

  renderAllTasksGroupedByDate();

  showPopup("Task added successfully!");
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

// Initial Setup
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("allTasksContainer")) renderAllTasksGroupedByDate();
});
