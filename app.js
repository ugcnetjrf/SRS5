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

// Add Task Functionality
function addTask() {
  const titleInput = document.getElementById("taskTitle");
  const detailInput = document.getElementById("taskDetail");
  const dateInput = document.getElementById("taskDate");
  const srtSelect = document.getElementById("taskRegime");

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

// Render Today's Tasks
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

// Render Revision Tasks
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

    container.appendChild(div);
  });
}

// Download All Tasks Functionality (as .txt)
function downloadAllTasks() {
  let tasksText = tasks.map(
    (task) =>
      `Title: ${task.title}\nDetail: ${task.detail}\nDate: ${task.date}\nRegime: ${task.srtRegime}\nRevision Dates: ${task.revisionDates.join(
        ", "
      )}\n\n`
  ).join("");

  const blob = new Blob([tasksText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "tasks.txt";
  link.click();
  URL.revokeObjectURL(url);
}

// Upload Tasks Functionality (from .txt)
function uploadTasks(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const fileContent = reader.result;
      const taskArray = fileContent
        .split("\n\n")
        .map((taskText) => {
          const taskDetails = taskText.split("\n");
          const title = taskDetails[0].replace("Title: ", "");
          const detail = taskDetails[1].replace("Detail: ", "");
          const date = taskDetails[2].replace("Date: ", "");
          const regime = taskDetails[3].replace("Regime: ", "");
          const revisionDates = taskDetails
            .slice(4)
            .join("\n")
            .replace("Revision Dates: ", "")
            .split(", ");

          return {
            id: Date.now(),
            title,
            detail,
            date,
            srtRegime: regime,
            revisionDates,
            completedRevisions: []
          };
        });

      tasks = taskArray;
      saveTasks();
      renderTodayTasks();
      renderRevisionTasks();
      showPopup("Tasks uploaded successfully!");
    } catch (error) {
      showPopup("Error reading file.");
    }
  };
  reader.readAsText(file);
}

// Reset All Tasks Functionality
function resetAllTasks() {
  if (confirm("Are you sure you want to reset all tasks? This action is irreversible.")) {
    tasks = [];
    saveTasks();
    renderTodayTasks();
    renderRevisionTasks();
    showPopup("All tasks have been reset.");
  }
}

// Initial Setup
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("taskDate")) {
    document.getElementById("taskDate").value =
      new Date().toISOString().split("T")[0];
  }

  // Render Today's Tasks and Revision Tasks on page load
  if (document.getElementById("todayTasks")) renderTodayTasks();
  if (document.getElementById("revisionTasks")) renderRevisionTasks();

  // Add Task Button Event
  const addTaskButton = document.getElementById("addTaskButton");
  addTaskButton.addEventListener("click", addTask);

  // Download Tasks Button Event
  const downloadTasksButton = document.getElementById("downloadTasksButton");
  downloadTasksButton.addEventListener("click", downloadAllTasks);

  // Upload Tasks Button Event
  const uploadTasksButton = document.getElementById("uploadTasksButton");
  uploadTasksButton.addEventListener("change", uploadTasks);

  // Reset All Tasks Button Event
  const resetAllButton = document.getElementById("resetAllButton");
  resetAllButton.addEventListener("click", resetAllTasks);
});
