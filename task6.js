document.addEventListener("DOMContentLoaded", () => {
    // Initial Data
    let tasks = [
        { id: 1, title: "Update Sprint 1", date: "2026-04-03", done: false },
        { id: 2, title: "Check Sprint 2", date: "2026-04-06", done: false }
    ];

    // DOM Elements
    const tasksContainer = document.getElementById("tasks-container");
    const calendarContainer = document.getElementById("calendar-container");
    const addTaskForm = document.getElementById("add-task-form");
    
    // Custom Timepicker Elements
    const colHour = document.getElementById("col-hour");
    const colMinute = document.getElementById("col-minute");
    const inputTime = document.getElementById("meeting-time");
    
    // Modal Elements
    const meetingModal = new bootstrap.Modal(document.getElementById("meetingModal"));
    const meetingForm = document.getElementById("meeting-form");
    const mTaskId = document.getElementById("meeting-task-id");
    const mTitle = document.getElementById("meeting-title");
    const mDate = document.getElementById("meeting-date");
    
    let selectedHour = "09";
    let selectedMinute = "05";
    let selectedPeriod = "PM";

    // 1. Render Tasks
    function renderTasks() {
        tasksContainer.innerHTML = "";
        
        if (tasks.length === 0) {
            tasksContainer.innerHTML = `<div class="text-muted text-center py-3">No tasks pending.</div>`;
            return;
        }

        tasks.forEach(task => {
            const taskDiv = document.createElement("div");
            taskDiv.className = "task-item";
            
            const titleClass = task.done ? "task-title done" : "task-title";
            
            let buttonsHtml = "";
            if (!task.done) {
                buttonsHtml += `<button class="btn btn-done btn-sm me-2" onclick="window.markTaskDone(${task.id})">Done</button>`;
            }
            buttonsHtml += `<button class="btn btn-outline-meeting btn-sm" onclick="window.openMeetingModal(${task.id})">Create Meeting</button>`;

            taskDiv.innerHTML = `
                <div class="${titleClass}">
                    ${task.title} — ${task.date}
                </div>
                <div>
                    ${buttonsHtml}
                </div>
            `;
            tasksContainer.appendChild(taskDiv);
        });
    }

    // 2. Render Calendar (Completed Tasks)
    function renderCalendar() {
        calendarContainer.innerHTML = "";
        const completedTasks = tasks.filter(t => t.done);
        
        if (completedTasks.length === 0) {
            calendarContainer.innerHTML = `<div class="text-muted">No completed tasks yet.</div>`;
            return;
        }

        completedTasks.forEach(task => {
            const el = document.createElement("div");
            el.className = "calendar-item";
            el.innerHTML = `<i class="bi bi-check-square-fill"></i> Completed Task: ${task.title} (Due: ${task.date})`;
            calendarContainer.appendChild(el);
        });
    }

    // 3. Add Task Let
    addTaskForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const titleInput = document.getElementById("task-title");
        const dateInput = document.getElementById("task-date");
        
        if (!titleInput.value.trim() || !dateInput.value) return;

        const newTask = {
            id: Date.now(),
            title: titleInput.value.trim(),
            date: dateInput.value,
            done: false
        };

        tasks.push(newTask);
        renderTasks();
        
        titleInput.value = "";
        dateInput.value = "";
    });

    // 4. Global Actions
    window.markTaskDone = function(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.done = true;
            renderTasks();
            renderCalendar();
        }
    };

    window.openMeetingModal = function(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            mTaskId.value = task.id;
            // Map title exactly like the screenshot
            const meetingTitle = task.title.replace("Check ", "").replace("Update ", ""); 
            mTitle.value = meetingTitle;
            
            // Assume format exists
            mDate.value = task.date; 

            meetingModal.show();
        }
    };

    meetingForm.addEventListener("submit", (e) => {
        e.preventDefault();
        // UI simulation of save
        meetingModal.hide();
        setTimeout(() => alert("Meeting Saved Successfully!"), 300);
    });

    // 5. Build Custom Timepicker
    function populateTimepicker() {
        // Hours 01 to 12
        for (let i = 1; i <= 12; i++) {
            let hr = i < 10 ? "0" + i : i.toString();
            let div = document.createElement("div");
            div.className = `timepicker-item ${hr === selectedHour ? 'active' : ''}`;
            div.setAttribute("data-type", "hour");
            div.setAttribute("data-val", hr);
            div.innerText = hr;
            colHour.appendChild(div);
        }

        // Minutes 00 to 59
        for (let i = 0; i <= 59; i++) {
            let mn = i < 10 ? "0" + i : i.toString();
            let div = document.createElement("div");
            div.className = `timepicker-item ${mn === selectedMinute ? 'active' : ''}`;
            div.setAttribute("data-type", "minute");
            div.setAttribute("data-val", mn);
            div.innerText = mn;
            colMinute.appendChild(div);
        }

        updateTimeInput();
    }

    function updateTimeInput() {
        inputTime.value = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
    }

    // Handle Timepicker clicks
    document.getElementById("timepicker-scroll-container").addEventListener("click", (e) => {
        if (e.target.classList.contains("timepicker-item")) {
            const type = e.target.getAttribute("data-type");
            const val = e.target.getAttribute("data-val");

            // Update state
            if (type === "hour") selectedHour = val;
            else if (type === "minute") selectedMinute = val;
            else if (type === "period") selectedPeriod = val;

            // Update UI class
            const siblings = e.target.parentElement.querySelectorAll('.timepicker-item');
            siblings.forEach(node => node.classList.remove('active'));
            e.target.classList.add('active');

            updateTimeInput();
        }
    });

    // Initialize
    populateTimepicker();
    renderTasks();
    renderCalendar();
});
