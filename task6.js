document.addEventListener("DOMContentLoaded", () => {
    const TASKS_KEY = "task6_tasks";
    const MEETINGS_KEY = "task6_meetings";

    const defaultTasks = [
        { id: 1, title: "Update Sprint 1", date: "2026-04-03", priority: "high", done: true, completedAt: "2026-04-03T09:00:00" },
        { id: 2, title: "Check Sprint 2", date: "2026-04-06", priority: "medium", done: false, completedAt: null }
    ];

    const defaultMeetings = [
        {
            id: 101,
            taskId: 2,
            taskTitle: "Check Sprint 2",
            title: "Sprint 2",
            date: "2026-04-06",
            time: "09:05 AM",
            attendees: "hiep20004@gmail.com",
            location: "Google Meet"
        }
    ];

    let tasks = loadData(TASKS_KEY, defaultTasks);
    let meetings = loadData(MEETINGS_KEY, defaultMeetings);
    let activeFilter = "all";
    let editingTaskId = null;
    let selectedHour = "09";
    let selectedMinute = "05";
    let selectedPeriod = "AM";

    const todayIso = new Date().toISOString().split("T")[0];

    const statsGrid = document.getElementById("stats-grid");
    const taskForm = document.getElementById("task-form");
    const taskFormTitle = document.getElementById("task-form-title");
    const taskIdInput = document.getElementById("task-id");
    const taskTitleInput = document.getElementById("task-title");
    const taskDateInput = document.getElementById("task-date");
    const taskPriorityInput = document.getElementById("task-priority");
    const taskSubmitBtn = document.getElementById("task-submit-btn");
    const taskCancelWrap = document.getElementById("task-cancel-wrap");
    const cancelEditBtn = document.getElementById("cancel-edit-btn");
    const searchInput = document.getElementById("search-input");
    const tasksContainer = document.getElementById("tasks-container");
    const meetingsContainer = document.getElementById("meetings-container");
    const timelineContainer = document.getElementById("timeline-container");
    const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));

    const meetingModalElement = document.getElementById("meetingModal");
    const meetingModal = new bootstrap.Modal(meetingModalElement);
    const meetingForm = document.getElementById("meeting-form");
    const meetingTaskIdInput = document.getElementById("meeting-task-id");
    const meetingTitleInput = document.getElementById("meeting-title");
    const meetingDateInput = document.getElementById("meeting-date");
    const meetingTimeInput = document.getElementById("meeting-time");
    const meetingAttendeesInput = document.getElementById("meeting-attendees");
    const meetingLocationInput = document.getElementById("meeting-location");
    const colHour = document.getElementById("col-hour");
    const colMinute = document.getElementById("col-minute");
    const colPeriod = document.getElementById("col-period");
    const timepickerScrollContainer = document.getElementById("timepicker-scroll-container");

    const toastElement = document.getElementById("planner-toast");
    const toastBody = document.getElementById("planner-toast-body");
    const plannerToast = new bootstrap.Toast(toastElement, { delay: 2200 });

    function loadData(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (error) {
            return fallback;
        }
    }

    function saveState() {
        localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
        localStorage.setItem(MEETINGS_KEY, JSON.stringify(meetings));
    }

    function showToast(message) {
        toastBody.textContent = message;
        plannerToast.show();
    }

    function escapeHtml(value) {
        return value
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function formatDateDisplay(value) {
        return new Intl.DateTimeFormat("en-CA", {
            year: "numeric",
            month: "short",
            day: "2-digit"
        }).format(new Date(`${value}T00:00:00`));
    }

    function isOverdue(task) {
        return !task.done && task.date < todayIso;
    }

    function getPriorityLabel(priority) {
        if (priority === "high") return "High Priority";
        if (priority === "low") return "Low Priority";
        return "Medium Priority";
    }

    function renderStats() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.done).length;
        const pendingTasks = totalTasks - completedTasks;
        const overdueTasks = tasks.filter(isOverdue).length;

        statsGrid.innerHTML = `
            <div class="stat-card">
                <div class="stat-label">Total Tasks</div>
                <div class="stat-value">${totalTasks}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Pending</div>
                <div class="stat-value">${pendingTasks}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Completed</div>
                <div class="stat-value">${completedTasks}</div>
            </div>
            <div class="stat-card">
                <div class="stat-label">Meetings</div>
                <div class="stat-value">${meetings.length}</div>
            </div>
        `;
    }

    function getFilteredTasks() {
        const query = searchInput.value.trim().toLowerCase();

        return tasks
            .filter(task => {
                if (activeFilter === "pending") return !task.done;
                if (activeFilter === "completed") return task.done;
                if (activeFilter === "overdue") return isOverdue(task);
                return true;
            })
            .filter(task => task.title.toLowerCase().includes(query))
            .sort((a, b) => {
                if (a.done !== b.done) return Number(a.done) - Number(b.done);
                return a.date.localeCompare(b.date);
            });
    }

    function renderTasks() {
        const filteredTasks = getFilteredTasks();

        if (filteredTasks.length === 0) {
            tasksContainer.innerHTML = `
                <div class="empty-state">
                    <div class="fw-bold mb-2">No matching tasks</div>
                    <div>Try changing the filter, editing your search, or adding a new task.</div>
                </div>
            `;
            return;
        }

        tasksContainer.innerHTML = filteredTasks.map(task => {
            const relatedMeetings = meetings.filter(meeting => meeting.taskId === task.id).length;
            const nameClass = task.done ? "task-name done" : "task-name";
            const cardClass = task.done ? "task-card done" : "task-card";
            const overduePill = isOverdue(task)
                ? `<span class="meta-pill status-overdue"><i class="bi bi-exclamation-circle"></i>Overdue</span>`
                : "";
            const doneButton = task.done
                ? ""
                : `<button type="button" class="action-btn success" data-action="done" data-id="${task.id}"><i class="bi bi-check2-circle me-1"></i>Done</button>`;

            return `
                <article class="${cardClass}">
                    <div class="task-top">
                        <div class="task-main">
                            <input class="task-check" type="checkbox" ${task.done ? "checked" : ""} data-action="toggle" data-id="${task.id}">
                            <div>
                                <h3 class="${nameClass}">${escapeHtml(task.title)}</h3>
                                <div class="task-meta">
                                    <span class="meta-pill meta-date"><i class="bi bi-calendar-event"></i>${formatDateDisplay(task.date)}</span>
                                    <span class="meta-pill priority-${task.priority}"><i class="bi bi-flag-fill"></i>${getPriorityLabel(task.priority)}</span>
                                    ${overduePill}
                                    ${relatedMeetings > 0 ? `<span class="meta-pill meta-date"><i class="bi bi-people"></i>${relatedMeetings} meeting${relatedMeetings > 1 ? "s" : ""}</span>` : ""}
                                </div>
                            </div>
                        </div>
                        <div class="task-actions">
                            ${doneButton}
                            <button type="button" class="action-btn" data-action="meeting" data-id="${task.id}"><i class="bi bi-camera-video me-1"></i>Meeting</button>
                            <button type="button" class="action-btn" data-action="edit" data-id="${task.id}"><i class="bi bi-pencil-square me-1"></i>Edit</button>
                            <button type="button" class="action-btn danger" data-action="delete" data-id="${task.id}"><i class="bi bi-trash3 me-1"></i>Delete</button>
                        </div>
                    </div>
                </article>
            `;
        }).join("");
    }

    function renderMeetings() {
        const sortedMeetings = [...meetings].sort((a, b) => {
            const first = `${a.date} ${convertTo24Hour(a.time)}`;
            const second = `${b.date} ${convertTo24Hour(b.time)}`;
            return first.localeCompare(second);
        });

        if (sortedMeetings.length === 0) {
            meetingsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="fw-bold mb-2">No meetings scheduled</div>
                    <div>Create a meeting from any task to see it here.</div>
                </div>
            `;
            return;
        }

        meetingsContainer.innerHTML = sortedMeetings.map(meeting => `
            <div class="meeting-item">
                <div class="meeting-tag"><i class="bi bi-camera-video-fill"></i>Meeting Planner</div>
                <div class="meeting-title">${escapeHtml(meeting.title)}</div>
                <div class="meeting-meta mb-2">${formatDateDisplay(meeting.date)} at ${meeting.time}</div>
                <div class="meeting-meta mb-1"><strong>Task:</strong> ${escapeHtml(meeting.taskTitle)}</div>
                <div class="meeting-meta mb-1"><strong>Attendees:</strong> ${escapeHtml(meeting.attendees || "Not specified")}</div>
                <div class="meeting-meta"><strong>Location:</strong> ${escapeHtml(meeting.location || "Not specified")}</div>
            </div>
        `).join("");
    }

    function renderTimeline() {
        const activity = [];

        tasks
            .filter(task => task.done)
            .forEach(task => {
                activity.push({
                    type: "completed",
                    sortKey: task.completedAt || `${task.date}T23:59:00`,
                    title: `Completed task: ${task.title}`,
                    meta: `Due ${formatDateDisplay(task.date)}`
                });
            });

        meetings.forEach(meeting => {
            activity.push({
                type: "meeting",
                sortKey: `${meeting.date}T${convertTo24Hour(meeting.time)}:00`,
                title: `Meeting: ${meeting.title}`,
                meta: `${formatDateDisplay(meeting.date)} at ${meeting.time}${meeting.attendees ? ` with ${meeting.attendees}` : ""}`
            });
        });

        activity.sort((a, b) => b.sortKey.localeCompare(a.sortKey));

        if (activity.length === 0) {
            timelineContainer.innerHTML = `
                <div class="empty-state">
                    <div class="fw-bold mb-2">No activity yet</div>
                    <div>Your completed work and meetings will appear here.</div>
                </div>
            `;
            return;
        }

        timelineContainer.innerHTML = activity.map(item => `
            <div class="timeline-item ${item.type}">
                <div class="timeline-title">${item.type === "completed" ? "Completed Work" : "Meeting Scheduled"}</div>
                <div class="mb-1">${escapeHtml(item.title)}</div>
                <div class="timeline-meta">${escapeHtml(item.meta)}</div>
            </div>
        `).join("");
    }

    function renderAll() {
        renderStats();
        renderTasks();
        renderMeetings();
        renderTimeline();
    }

    function resetTaskForm() {
        editingTaskId = null;
        taskIdInput.value = "";
        taskTitleInput.value = "";
        taskDateInput.value = "";
        taskPriorityInput.value = "medium";
        taskFormTitle.textContent = "Add Task";
        taskSubmitBtn.textContent = "Add Task";
        taskCancelWrap.classList.add("d-none");
    }

    function startEditTask(id) {
        const task = tasks.find(item => item.id === id);
        if (!task) return;

        editingTaskId = id;
        taskIdInput.value = task.id;
        taskTitleInput.value = task.title;
        taskDateInput.value = task.date;
        taskPriorityInput.value = task.priority;
        taskFormTitle.textContent = "Edit Task";
        taskSubmitBtn.textContent = "Update Task";
        taskCancelWrap.classList.remove("d-none");
        taskTitleInput.focus();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function createTask(payload) {
        tasks.unshift({
            id: Date.now(),
            title: payload.title,
            date: payload.date,
            priority: payload.priority,
            done: false,
            completedAt: null
        });
        saveState();
        renderAll();
        showToast("Task added to your planner.");
    }

    function updateTask(payload) {
        tasks = tasks.map(task => task.id === editingTaskId
            ? { ...task, title: payload.title, date: payload.date, priority: payload.priority }
            : task);
        saveState();
        renderAll();
        showToast("Task updated successfully.");
    }

    function markTaskDone(id, doneState = true) {
        tasks = tasks.map(task => task.id === id
            ? { ...task, done: doneState, completedAt: doneState ? new Date().toISOString() : null }
            : task);
        saveState();
        renderAll();
        showToast(doneState ? "Task marked as completed." : "Task moved back to pending.");
    }

    function deleteTask(id) {
        const task = tasks.find(item => item.id === id);
        if (!task) return;

        tasks = tasks.filter(item => item.id !== id);
        meetings = meetings.filter(meeting => meeting.taskId !== id);

        if (editingTaskId === id) {
            resetTaskForm();
        }

        saveState();
        renderAll();
        showToast(`Removed "${task.title}".`);
    }

    function openMeetingModal(id) {
        const task = tasks.find(item => item.id === id);
        if (!task) return;

        meetingTaskIdInput.value = task.id;
        meetingTitleInput.value = task.title.replace("Update ", "").replace("Check ", "");
        meetingDateInput.value = task.date;
        meetingAttendeesInput.value = "";
        meetingLocationInput.value = "";
        selectedHour = "09";
        selectedMinute = "05";
        selectedPeriod = "AM";
        populateTimepicker();
        updateMeetingTimeInput();
        meetingModal.show();
    }

    function saveMeeting() {
        const taskId = Number(meetingTaskIdInput.value);
        const task = tasks.find(item => item.id === taskId);

        if (!task || !meetingDateInput.value) return;

        meetings.unshift({
            id: Date.now(),
            taskId,
            taskTitle: task.title,
            title: meetingTitleInput.value.trim() || task.title,
            date: meetingDateInput.value,
            time: meetingTimeInput.value,
            attendees: meetingAttendeesInput.value.trim(),
            location: meetingLocationInput.value.trim()
        });

        saveState();
        renderAll();
        meetingModal.hide();
        showToast("Meeting scheduled successfully.");
    }

    function convertTo24Hour(timeLabel) {
        const [time, period] = timeLabel.split(" ");
        let [hour, minute] = time.split(":").map(Number);

        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;

        return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }

    function updateMeetingTimeInput() {
        meetingTimeInput.value = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
    }

    function populateTimepicker() {
        const hours = Array.from({ length: 12 }, (_, index) => String(index + 1).padStart(2, "0"));
        const minutes = Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, "0"));
        const periods = ["AM", "PM"];

        colHour.innerHTML = hours.map(hour => `
            <div class="timepicker-item ${hour === selectedHour ? "active" : ""}" data-type="hour" data-val="${hour}">${hour}</div>
        `).join("");

        colMinute.innerHTML = minutes.map(minute => `
            <div class="timepicker-item ${minute === selectedMinute ? "active" : ""}" data-type="minute" data-val="${minute}">${minute}</div>
        `).join("");

        colPeriod.innerHTML = periods.map(period => `
            <div class="timepicker-item ${period === selectedPeriod ? "active" : ""}" data-type="period" data-val="${period}">${period}</div>
        `).join("");
    }

    taskForm.addEventListener("submit", event => {
        event.preventDefault();

        const payload = {
            title: taskTitleInput.value.trim(),
            date: taskDateInput.value,
            priority: taskPriorityInput.value
        };

        if (!payload.title || !payload.date) return;

        if (editingTaskId) {
            updateTask(payload);
        } else {
            createTask(payload);
        }

        resetTaskForm();
    });

    cancelEditBtn.addEventListener("click", resetTaskForm);

    searchInput.addEventListener("input", renderTasks);

    filterButtons.forEach(button => {
        button.addEventListener("click", () => {
            activeFilter = button.dataset.filter;
            filterButtons.forEach(item => item.classList.remove("active"));
            button.classList.add("active");
            renderTasks();
        });
    });

    tasksContainer.addEventListener("click", event => {
        const target = event.target.closest("[data-action]");
        if (!target) return;

        const action = target.dataset.action;
        const id = Number(target.dataset.id);

        if (action === "done") markTaskDone(id, true);
        if (action === "meeting") openMeetingModal(id);
        if (action === "edit") startEditTask(id);
        if (action === "delete") deleteTask(id);
    });

    tasksContainer.addEventListener("change", event => {
        const target = event.target.closest("[data-action='toggle']");
        if (!target) return;
        markTaskDone(Number(target.dataset.id), target.checked);
    });

    meetingForm.addEventListener("submit", event => {
        event.preventDefault();
        saveMeeting();
    });

    meetingModalElement.addEventListener("hidden.bs.modal", () => {
        meetingForm.reset();
        updateMeetingTimeInput();
    });

    timepickerScrollContainer.addEventListener("click", event => {
        const item = event.target.closest(".timepicker-item");
        if (!item) return;

        const type = item.dataset.type;
        const value = item.dataset.val;

        if (type === "hour") selectedHour = value;
        if (type === "minute") selectedMinute = value;
        if (type === "period") selectedPeriod = value;

        populateTimepicker();
        updateMeetingTimeInput();
    });

    populateTimepicker();
    updateMeetingTimeInput();
    renderAll();

    window.openMeetingModal = openMeetingModal;
});
