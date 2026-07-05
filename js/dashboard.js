// ============ ROLE-BASED ACCESS CONTROL & API CLIENT ============
const API_BASE_URL = "http://127.0.0.1:8000";

function getAuthHeader() {
    const token = sessionStorage.getItem('eazeevent_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function apiFetch(endpoint, options = {}) {
    const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
        ...(options.headers || {})
    };
    
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });
    
    if (res.status === 401 || res.status === 403) {
        alert("🔒 Session expired. Please log in again.");
        window.location.href = "index.html";
        return;
    }
    
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "API Request failed.");
    }
    
    if (res.status === 204) return null;
    return await res.json();
}

if (!sessionStorage.getItem('eazeevent_logged_in_customer') && !sessionStorage.getItem('eazeevent_impersonating_user')) {
    alert('🔒 Access Denied!\n\nPlease log in as a customer first to view your dashboard.');
    window.location.href = 'index.html';
}

// ============ STATE ============
let weddingDate = new Date('2026-11-14'); // Configurable Wedding Date
let globalCurrency = '₹'; // Default currency

// START FRESH: Empty initial data
let db_totalBudget = 0; 
let db_expenses = []; 

// Colors for the new Budget Donut Chart slices
const expenseColors = ['#004c4c', '#D4AF37', '#e67e22', '#e74c3c', '#9b59b6', '#2980b9', '#1abc9c', '#34495e'];

let tl_events = {};

// START FRESH: Empty guest data
let guestData = [];

let openActionMenuIndex = null;
let tempProfileImage = null;

function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

// Helper to format large currency numbers beautifully
function formatCurrency(num) {
    if (num >= 100000) return globalCurrency + ' ' + (num / 100000).toFixed(1) + 'L';
    return globalCurrency + ' ' + num.toLocaleString('en-IN');
}

// Update currency across the app based on settings
function updateGlobalCurrency() {
    globalCurrency = document.getElementById('settingCurrency').value;
    
    // Update static currency symbols in the DOM
    document.querySelectorAll('.currency-symbol').forEach(el => {
        el.textContent = globalCurrency;
    });
    
    // Re-render UI elements that rely on the formatCurrency function
    dbUpdateUI();
    
    showToast('Currency updated to ' + globalCurrency);
}

// Theme Toggle Function
function toggleAppTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    const toggleSwitch = document.getElementById('settingThemeToggle');
    if (toggleSwitch) {
        toggleSwitch.checked = isDark;
    }
}

// ============ NAVIGATION ============
function showPage(page) {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    const pageEl = document.getElementById('page-' + page);
    if (pageEl) pageEl.classList.add('active');
    document.querySelectorAll('.nav-link').forEach(l => {
        if (l.dataset.page === page) {
            l.classList.add('bg-white/10', 'text-white');
            l.classList.remove('text-white/80', 'hover:bg-white/5');
        } else {
            l.classList.remove('bg-white/10', 'text-white');
            l.classList.add('text-white/80', 'hover:bg-white/5');
        }
    });
    if (page === 'marketplace') { window.location.href = 'vendors.html'; return; }
    if (page === 'checklist') { fetchChecklist(); }
    if (page === 'timeline') { loadTimeline(); }
    if (page === 'bookings') { loadBookings(); }
}

document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        showPage(link.dataset.page);
    });
});

// ============ PROFILE EDIT ============
function previewProfileImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            tempProfileImage = e.target.result;
            document.getElementById('editProfileImagePreview').src = tempProfileImage;
        };
        reader.readAsDataURL(file);
    }
}

function openEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    modal.classList.remove('hidden');
    // Small delay to allow CSS transition
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('editProfileModalContent').classList.remove('scale-95');
    }, 10);
}

function closeEditProfileModal() {
    const modal = document.getElementById('editProfileModal');
    modal.classList.add('opacity-0');
    document.getElementById('editProfileModalContent').classList.add('scale-95');
    // Wait for transition before hiding
    setTimeout(() => {
        modal.classList.add('hidden');
        
        // Reset image preview if canceled
        if (tempProfileImage && document.getElementById('sidebarAvatar').src !== tempProfileImage) {
            document.getElementById('editProfileImagePreview').src = document.getElementById('sidebarAvatar').src;
            tempProfileImage = null;
        }
    }, 300);
}

async function saveProfileData() {
    const name = document.getElementById('editProfileName').value.trim();
    const phone = document.getElementById('editProfilePhone').value.trim();

    if (!name) {
        showToast('Name cannot be empty!');
        return;
    }

    try {
        const profile = await apiFetch('/api/customer/profile', {
            method: 'PUT',
            body: JSON.stringify({ name, phone })
        });

        // Update UI Elements
        document.getElementById('btnProfileName').textContent = profile.name;
        document.getElementById('menuProfileName').textContent = profile.name;
        
        const loggedInUserStr = sessionStorage.getItem('eazeevent_logged_in_customer');
        if (loggedInUserStr) {
            const user = JSON.parse(loggedInUserStr);
            user.name = profile.name;
            sessionStorage.setItem('eazeevent_logged_in_customer', JSON.stringify(user));
        }

        showToast('Profile updated successfully!');
        closeEditProfileModal();
    } catch (err) {
        showToast('Failed to update profile: ' + err.message);
    }
}

// ============ PROFILE MENU TOGGLE ============
function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    if (menu.classList.contains('opacity-0')) {
        menu.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
        menu.classList.add('opacity-100', 'scale-100', 'pointer-events-auto');
    } else {
        closeProfileMenu();
    }
}

function closeProfileMenu() {
    const menu = document.getElementById('profileMenu');
    menu.classList.add('opacity-0', 'scale-95', 'pointer-events-none');
    menu.classList.remove('opacity-100', 'scale-100', 'pointer-events-auto');
}

// ============ COUNTDOWN (Top Widget) ============
function updateCountdown() {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight
    
    const targetDate = new Date(weddingDate);
    targetDate.setHours(0, 0, 0, 0); // Normalize to midnight
    
    const diffTime = targetDate - today;
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Display positive days left, or 0 if date has passed
    document.getElementById('daysToGo').textContent = days >= 0 ? days : 0;
    
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const prefix = days >= 0 ? 'Wedding: ' : 'Married on: ';
    document.getElementById('weddingDateDisplay').textContent = prefix + targetDate.toLocaleDateString('en-US', options);
}

async function updateWeddingDate(input) {
    if (input.value) {
        try {
            const profile = await apiFetch('/api/customer/profile', {
                method: 'PUT',
                body: JSON.stringify({ name: document.getElementById('btnProfileName').textContent, wedding_date: input.value })
            });
            weddingDate = new Date(profile.wedding_date);
            updateCountdown();
            showToast('Wedding date updated successfully!');
        } catch (err) {
            showToast('Failed to update wedding date: ' + err.message);
        }
    }
}

// ============ BUDGET (Top Widget & Tracker Tab) ============
async function dbSetBudget() {
    const val = parseFloat(document.getElementById('db-budgetInput').value) || 0;
    if (val <= 0) { showToast('Enter a valid budget amount'); return; }
    
    try {
        const profile = await apiFetch('/api/customer/profile', {
            method: 'PUT',
            body: JSON.stringify({ name: document.getElementById('btnProfileName').textContent, estimated_budget: val })
        });
        db_totalBudget = profile.estimated_budget;
        document.getElementById('db-budgetInput').value = '';
        dbUpdateUI();
        showToast('Budget set to ' + globalCurrency + val.toLocaleString('en-IN'));
    } catch (err) {
        showToast('Failed to set budget: ' + err.message);
    }
}

async function dbAddExpense() {
    const name = document.getElementById('db-expName').value.trim();
    const amount = parseFloat(document.getElementById('db-expAmount').value) || 0;
    if (!name || amount <= 0) { showToast('Enter valid name and amount'); return; }
    
    try {
        const newExpense = await apiFetch('/api/customer/expenses', {
            method: 'POST',
            body: JSON.stringify({
                name,
                category: "General",
                cost: amount,
                paid_amount: 0.0,
                status: "Unpaid"
            })
        });
        db_expenses.push({ id: newExpense.id, name: newExpense.name, amount: newExpense.cost });
        document.getElementById('db-expName').value = '';
        document.getElementById('db-expAmount').value = '';
        
        // Refresh profile status/actual total
        const profile = await apiFetch('/api/customer/profile');
        db_totalBudget = profile.estimated_budget;
        
        dbUpdateUI();
        showToast('Expense added!');
    } catch (err) {
        showToast('Failed to add expense: ' + err.message);
    }
}

async function dbRemoveExpense(i) {
    const exp = db_expenses[i];
    if (!exp) return;
    
    try {
        await apiFetch(`/api/customer/expenses/${exp.id}`, { method: 'DELETE' });
        db_expenses.splice(i, 1);
        dbUpdateUI();
        showToast('Expense removed');
    } catch (err) {
        showToast('Failed to remove expense: ' + err.message);
    }
}

function dbUpdateUI() {
    const spent = db_expenses.reduce((s, e) => s + e.amount, 0);
    
    // Update Budget Tracker Tab Stats
    document.getElementById('db-totalBudget').textContent = db_totalBudget.toLocaleString('en-IN');
    document.getElementById('db-totalSpent').textContent = spent.toLocaleString('en-IN');
    document.getElementById('db-remaining').textContent = (db_totalBudget - spent).toLocaleString('en-IN');
    
    // Update Placeholder text for inputs
    document.getElementById('db-budgetInput').placeholder = `Set Total Budget (${globalCurrency})`;
    document.getElementById('db-expAmount').placeholder = `Amount (${globalCurrency})`;
    
    // Update Dashboard Summary Stats
    document.getElementById('dash-budget-tax').textContent = formatCurrency(spent * 0.18); // Simulated 18% tax view
    
    // --- NEW: Donut Chart Logic for Budget Tracker Page ---
    const donut = document.getElementById('budgetDonut');
    const legend = document.getElementById('budgetLegend');
    const donutSpent = document.getElementById('donutTotalSpent');
    
    donutSpent.textContent = formatCurrency(spent);
    
    if (db_totalBudget <= 0 && spent <= 0) {
        donut.style.background = 'conic-gradient(rgba(150, 160, 160, 0.2) 0% 100%)';
        legend.innerHTML = '<p class="text-[#5e8d8d] text-sm">Set a budget and add expenses to generate your financial graph.</p>';
        document.getElementById('dash-budget-preview').innerHTML = '<p class="text-[#5e8d8d] text-sm py-4 text-center">No expenses tracked yet.</p>';
    } else {
        let visualTotal = Math.max(db_totalBudget, spent);
        let visualStops = [];
        let visPct = 0;
        let legendHTML = '<div class="space-y-3 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">';
        let dashHTML = '';
        
        db_expenses.forEach((exp, i) => {
            const color = expenseColors[i % expenseColors.length];
            const actualPct = db_totalBudget > 0 ? (exp.amount / db_totalBudget) * 100 : 0;
            const slicePct = (exp.amount / visualTotal) * 100;
            
            if(slicePct > 0) {
                visualStops.push(`${color} ${visPct}% ${visPct + slicePct}%`);
                visPct += slicePct;
                
                // Legend for Tracker Page
                legendHTML += `
                    <div class="flex items-center justify-between text-sm">
                        <div class="flex items-center gap-2">
                            <span class="w-3 h-3 rounded-full flex-shrink-0" style="background-color: ${color}"></span>
                            <span class="font-medium text-[#101818] dark:text-white truncate max-w-[120px]">${exp.name}</span>
                        </div>
                        <div class="flex items-center gap-3 text-right">
                            <span class="font-bold">${formatCurrency(exp.amount)}</span>
                            <span class="text-[#5e8d8d] font-bold w-10 text-[10px] bg-[#f0f5f5] dark:bg-white/5 px-1 py-0.5 rounded text-center">${actualPct.toFixed(1)}%</span>
                        </div>
                    </div>
                `;
                
                // Dashboard Mini Summary View
                if(i < 3) { // Show only top 3 on dashboard
                    dashHTML += `
                    <div>
                        <div class="flex justify-between items-end mb-2">
                            <div><h4 class="text-sm font-semibold">${exp.name}</h4></div>
                            <div class="text-right"><p class="text-sm font-bold" style="color: ${color}">${formatCurrency(exp.amount)}</p></div>
                        </div>
                        <div class="w-full bg-[#f0f5f5] dark:bg-white/10 h-2 rounded-full overflow-hidden">
                            <div class="h-full" style="width:${actualPct}%; background-color: ${color}"></div>
                        </div>
                    </div>`;
                }
            }
        });
        
        if (visPct < 100) {
            visualStops.push(`rgba(150, 160, 160, 0.2) ${visPct}% 100%`);
            const remPct = ((db_totalBudget - spent) / db_totalBudget) * 100;
            
            legendHTML += `
                <div class="flex items-center justify-between text-sm mt-2 pt-3 border-t border-[#dae7e7] dark:border-white/10">
                    <div class="flex items-center gap-2">
                        <span class="w-3 h-3 rounded-full flex-shrink-0 bg-gray-200 dark:bg-white/20"></span>
                        <span class="font-medium text-[#5e8d8d]">Remaining</span>
                    </div>
                    <div class="flex items-center gap-3 text-right">
                        <span class="font-bold text-green-600">${formatCurrency(db_totalBudget - spent)}</span>
                        <span class="text-green-600 font-bold w-10 text-[10px] bg-green-50 dark:bg-green-900/20 px-1 py-0.5 rounded text-center">${remPct.toFixed(1)}%</span>
                    </div>
                </div>
            `;
        }
        
        legendHTML += '</div>';
        donut.style.background = `conic-gradient(${visualStops.join(', ')})`;
        legend.innerHTML = legendHTML;
        document.getElementById('dash-budget-preview').innerHTML = dashHTML;
    }

    // Update the lower expense table
    const tbody = document.getElementById('db-expList');
    tbody.innerHTML = db_expenses.length === 0
        ? '<tr><td colspan="3" class="px-4 py-8 text-center text-[#5e8d8d]">No expenses added yet</td></tr>'
        : db_expenses.map((e, i) => {
            const color = expenseColors[i % expenseColors.length];
            return `<tr class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <td class="px-4 py-3 font-medium flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full flex-shrink-0" style="background-color: ${color}"></span>
                    ${e.name}
                </td>
                <td class="px-4 py-3 text-right font-bold">${globalCurrency}${e.amount.toLocaleString('en-IN')}</td>
                <td class="px-4 py-3 text-right">
                    <button onclick="dbRemoveExpense(${i})" class="text-red-400 hover:text-red-600 transition-colors"><span class="material-symbols-outlined text-sm">delete</span></button>
                </td>
            </tr>`;
        }).join('');

    // --- Top Dashboard Widget (Budget Health) Update Logic ---
    document.getElementById('topBudgetSpent').textContent = formatCurrency(spent);
    document.getElementById('topBudgetTotal').textContent = `of ${formatCurrency(db_totalBudget)}`;
    
    const bStatus = document.getElementById('topBudgetStatus');
    const bIcon = document.getElementById('topBudgetIcon');
    const bRing = document.getElementById('topBudgetRing');
    const bPct = document.getElementById('topBudgetPct');
    
    if (db_totalBudget === 0) {
        bStatus.innerHTML = '<span class="material-symbols-outlined text-[12px]">info</span> Setup needed';
        bStatus.className = 'text-[10px] font-bold mt-2 flex items-center gap-1 text-[#5e8d8d]';
        bIcon.className = 'material-symbols-outlined text-[#5e8d8d]';
        bRing.style.strokeDashoffset = '100';
        bPct.textContent = '0%';
        bPct.className = 'text-xs font-black text-[#5e8d8d]';
        bRing.className = 'stroke-[#5e8d8d] transition-all duration-1000';
    } else {
        const spentPct = Math.min((spent / db_totalBudget) * 100, 100);
        bRing.style.strokeDashoffset = 100 - spentPct;
        bPct.textContent = Math.round((spent / db_totalBudget) * 100) + '%';

        if (spent > db_totalBudget) {
            const overPct = Math.round(((spent - db_totalBudget) / db_totalBudget) * 100);
            bStatus.innerHTML = `<span class="material-symbols-outlined text-[12px]">warning</span> ${overPct}% over budget`;
            bStatus.className = 'text-[10px] font-bold mt-2 flex items-center gap-1 text-red-500';
            bIcon.className = 'material-symbols-outlined text-red-500';
            bRing.className = 'stroke-red-500 transition-all duration-1000';
            bPct.className = 'text-xs font-black text-red-500';
        } else if (spentPct > 85) {
            bStatus.innerHTML = `<span class="material-symbols-outlined text-[12px]">trending_up</span> Almost at limit`;
            bStatus.className = 'text-[10px] font-bold mt-2 flex items-center gap-1 text-orange-400';
            bIcon.className = 'material-symbols-outlined text-orange-400';
            bRing.className = 'stroke-orange-400 transition-all duration-1000';
            bPct.className = 'text-xs font-black text-orange-400';
        } else {
            const safePct = Math.round(((db_totalBudget - spent) / db_totalBudget) * 100);
            bStatus.innerHTML = `<span class="material-symbols-outlined text-[12px]">trending_down</span> ${safePct}% under budget`;
            bStatus.className = 'text-[10px] font-bold mt-2 flex items-center gap-1 text-green-500';
            bIcon.className = 'material-symbols-outlined text-green-500';
            bRing.className = 'stroke-green-500 transition-all duration-1000';
            bPct.className = 'text-xs font-black text-green-500';
        }
    }
    syncUserData();
}

// ============ TIMELINE ============
// ============ TIMELINE & DB PERSISTENCE ============
async function loadTimeline() {
    try {
        const data = await apiFetch('/api/customer/timeline');
        tl_events = {};
        data.forEach(item => {
            if (!tl_events[item.date_or_day]) tl_events[item.date_or_day] = [];
            tl_events[item.date_or_day].push({ id: item.id, time: item.time, desc: item.description });
        });
        for (let day in tl_events) {
            tl_events[day].sort((a, b) => a.time.localeCompare(b.time));
        }
        tlRender();
    } catch (err) {
        console.error("Failed to load timeline:", err);
    }
}

async function tlAddEvent() {
    const day = document.getElementById('tl-day').value.trim();
    const time = document.getElementById('tl-time').value;
    const desc = document.getElementById('tl-desc').value.trim();
    
    if (!day || !time || !desc) { 
        showToast('Please fill in Date/Day, Time, and Event Name'); 
        return; 
    }
    
    try {
        await apiFetch('/api/customer/timeline', {
            method: 'POST',
            body: JSON.stringify({
                date_or_day: day,
                time,
                description: desc
            })
        });
        document.getElementById('tl-desc').value = '';
        await loadTimeline();
        showToast('Event added to timeline!');
    } catch (err) {
        showToast('Failed to add timeline event: ' + err.message);
    }
}

async function tlRemove(day, i) {
    const ev = tl_events[day][i];
    if (!ev || !ev.id) return;
    
    try {
        await apiFetch(`/api/customer/timeline/${ev.id}`, { method: 'DELETE' });
        await loadTimeline();
        showToast('Event removed');
    } catch (err) {
        showToast('Failed to remove timeline event: ' + err.message);
    }
}

function tlRender() {
    const container = document.getElementById('tl-container');
    if (!container) return;
    const days = Object.keys(tl_events).filter(d => tl_events[d].length > 0);
    
    if (days.length === 0) {
        container.innerHTML = '<p class="text-[#5e8d8d] text-center py-12">No events added yet. Add your first event above!</p>';
        return;
    }
    
    container.innerHTML = days.map(day => `
        <div class="bg-white dark:bg-white/5 border border-[#dae7e7] dark:border-white/10 rounded-2xl p-6">
            <h4 class="font-bold text-accent-gold mb-4 flex items-center gap-2"><span class="material-symbols-outlined text-sm">event</span>${day}</h4>
            <div class="border-l-2 border-primary/20 ml-2 space-y-4">
                ${tl_events[day].map((ev, i) => `
                    <div class="relative pl-6 flex items-start justify-between group">
                        <div>
                            <div class="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1"></div>
                            <span class="text-xs font-bold text-primary dark:text-accent-gold">${ev.time}</span>
                            <p class="text-sm mt-0.5">${ev.desc}</p>
                        </div>
                        <button onclick="tlRemove('${day}', ${i})" class="text-red-400 hover:text-red-600 ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"><span class="material-symbols-outlined text-sm">delete</span></button>
                    </div>`).join('')}
            </div>
        </div>`).join('');
}

// ============ CHECKLIST & DB PERSISTENCE ============
let checklistItems = [];

async function fetchChecklist() {
    try {
        const checklistData = await apiFetch('/api/customer/checklist');
        checklistItems = checklistData;
        renderChecklist();
    } catch (err) {
        console.error("Failed to fetch checklist:", err);
    }
}

function renderChecklist() {
    const container = document.getElementById('checklist-container');
    if (!container) return;
    
    if (checklistItems.length === 0) {
        container.innerHTML = '<p class="text-[#5e8d8d] text-center py-12">No checklist items yet. Add one above!</p>';
        return;
    }
    
    container.innerHTML = checklistItems.map(item => `
        <div class="flex items-center justify-between bg-white dark:bg-white/5 border border-[#dae7e7] dark:border-white/10 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center gap-3">
                <input type="checkbox" ${item.status === 'Completed' ? 'checked' : ''} onchange="chkToggleStatus(${item.id}, this.checked)" class="rounded text-primary focus:ring-primary border-[#e0e8e8] dark:border-white/10 dark:bg-white/5 h-5 w-5">
                <div>
                    <p class="font-bold text-sm ${item.status === 'Completed' ? 'line-through text-[#5e8d8d]' : ''}">${item.title}</p>
                    <div class="flex gap-2 items-center mt-1">
                        <span class="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary dark:bg-accent-gold/10 dark:text-accent-gold uppercase font-bold">${item.category}</span>
                        ${item.due_date ? `<span class="text-[10px] text-[#5e8d8d] flex items-center gap-1 font-medium"><span class="material-symbols-outlined text-[12px]">calendar_month</span> Due: ${item.due_date}</span>` : ''}
                    </div>
                </div>
            </div>
            <button onclick="chkDeleteItem(${item.id})" class="text-red-400 hover:text-red-600 transition-colors p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10">
                <span class="material-symbols-outlined text-sm">delete</span>
            </button>
        </div>
    `).join('');
}

async function chkAddItem() {
    const title = document.getElementById('chk-title').value.trim();
    const category = document.getElementById('chk-category').value;
    const due_date = document.getElementById('chk-duedate').value;
    
    if (!title) {
        showToast('Please enter a task title');
        return;
    }
    
    try {
        const newItem = await apiFetch('/api/customer/checklist', {
            method: 'POST',
            body: JSON.stringify({
                title,
                category,
                status: "Pending",
                due_date: due_date || null
            })
        });
        checklistItems.push(newItem);
        document.getElementById('chk-title').value = '';
        document.getElementById('chk-duedate').value = '';
        renderChecklist();
        showToast('Task added!');
        syncUserData();
    } catch (err) {
        showToast('Failed to add task: ' + err.message);
    }
}

async function chkToggleStatus(id, isChecked) {
    const item = checklistItems.find(x => x.id === id);
    if (!item) return;
    const originalStatus = item.status;
    const newStatus = isChecked ? 'Completed' : 'Pending';
    item.status = newStatus;
    
    try {
        await apiFetch(`/api/customer/checklist/${id}`, {
            method: 'PUT',
            body: JSON.stringify({
                title: item.title,
                category: item.category,
                status: newStatus,
                due_date: item.due_date
            })
        });
        renderChecklist();
        showToast(newStatus === 'Completed' ? 'Task completed!' : 'Task marked pending');
        syncUserData();
    } catch (err) {
        item.status = originalStatus;
        renderChecklist();
        showToast('Failed to update status: ' + err.message);
    }
}

async function chkDeleteItem(id) {
    try {
        await apiFetch(`/api/customer/checklist/${id}`, { method: 'DELETE' });
        checklistItems = checklistItems.filter(x => x.id !== id);
        renderChecklist();
        showToast('Task deleted');
        syncUserData();
    } catch (err) {
        showToast('Failed to delete task: ' + err.message);
    }
}

// ============ BOOKINGS MANAGEMENT ============
async function loadBookings() {
    const container = document.querySelector('#page-bookings .grid');
    if (!container) return;
    
    try {
        const bookings = await apiFetch('/api/customer/bookings');
        
        if (!bookings || bookings.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <p class="text-[#5e8d8d] dark:text-[#a3c2c2] text-sm">You don't have any bookings yet.</p>
                    <button onclick="showPage('marketplace')" class="mt-4 bg-primary text-white px-6 py-2 rounded-xl font-bold hover:bg-primary/90 transition-colors">Book a Vendor</button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = bookings.map(b => `
        <div class="bg-white dark:bg-white/5 border border-[#dae7e7] dark:border-white/10 rounded-2xl p-6 shadow-sm flex flex-col">
            <div class="flex justify-between items-start mb-4 border-b border-[#dae7e7] dark:border-white/10 pb-4">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                        <span class="material-symbols-outlined">receipt_long</span>
                    </div>
                    <div>
                        <h3 class="font-bold text-base leading-tight">${b.vendor_name}</h3>
                        <p class="text-[10px] font-bold text-accent-gold uppercase tracking-wider mt-0.5">${b.package_name}</p>
                    </div>
                </div>
                <span class="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-bold flex-shrink-0">${b.status}</span>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-4 text-sm flex-1">
                <div>
                    <p class="text-[#5e8d8d] text-[10px] uppercase font-bold tracking-wider mb-0.5">Booking ID</p>
                    <p class="font-medium text-xs">#BKG-${b.id}</p>
                </div>
                <div>
                    <p class="text-[#5e8d8d] text-[10px] uppercase font-bold tracking-wider mb-0.5">Event Date</p>
                    <p class="font-medium text-xs">${b.date}</p>
                </div>
                <div>
                    <p class="text-[#5e8d8d] text-[10px] uppercase font-bold tracking-wider mb-0.5">Total Amount</p>
                    <p class="font-bold text-xs">${globalCurrency} ${b.amount.toLocaleString('en-IN')}</p>
                </div>
                <div>
                    <p class="text-[#5e8d8d] text-[10px] uppercase font-bold tracking-wider mb-0.5">Paid Amount</p>
                    <p class="font-bold text-xs text-green-600">${globalCurrency} ${b.paid_amount.toLocaleString('en-IN')}</p>
                </div>
            </div>
            <div class="bg-[#f0f5f5] dark:bg-white/5 p-3 rounded-lg mb-5 border border-[#dae7e7] dark:border-white/5">
                <p class="text-[10px] font-bold mb-1 flex items-center gap-1 text-[#101818] dark:text-white uppercase"><span class="material-symbols-outlined text-[14px] text-primary">info</span> Location</p>
                <p class="text-xs text-[#5e8d8d] leading-relaxed">${b.location || 'Not specified'}</p>
            </div>
            <div class="flex gap-2 mt-auto">
                <button onclick="showToast('Downloading Invoice...')" class="flex-1 bg-white dark:bg-white/5 border border-[#dae7e7] dark:border-white/10 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-white/10 transition-colors flex items-center justify-center gap-1">
                    <span class="material-symbols-outlined text-[16px]">download</span> Invoice
                </button>
                <button onclick="showToast('Contacting Vendor...')" class="flex-1 bg-primary text-white py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-1">
                    <span class="material-symbols-outlined text-[16px]">call</span> Contact
                </button>
            </div>
        </div>
        `).join('');
    } catch (err) {
        console.error("Failed to load bookings:", err);
        container.innerHTML = `
            <div class="col-span-full text-center py-12 text-red-500">
                ⚠️ Failed to load bookings from database.
            </div>
        `;
    }
}

// ============ HELP & SUPPORT TICKETS ============
async function submitSupportTicket() {
    const subject = document.getElementById('ticketSubject').value.trim();
    const category = document.getElementById('ticketCategory').value;
    const description = document.getElementById('ticketDescription').value.trim();
    
    if (!subject || !description) {
        alert("Please fill in both the Subject and Description fields.");
        return;
    }
    
    try {
        await apiFetch('/api/customer/tickets', {
            method: 'POST',
            body: JSON.stringify({
                subject,
                category,
                message: description,
                priority: "Normal Priority"
            })
        });
        
        // Reset fields
        document.getElementById('ticketSubject').value = '';
        document.getElementById('ticketDescription').value = '';
        
        alert("Support Ticket submitted successfully!");
    } catch (err) {
        alert("Failed to submit support ticket: " + err.message);
    }
}

// ============ GUESTS (Top Widget & List) ============
function toggleActionMenu(index, event) {
    // Prevent click from propagating to the document listener
    if(event) event.stopPropagation();
    
    const allMenus = document.querySelectorAll('.action-menu');
    allMenus.forEach((menu, i) => {
        if (i === index) {
            menu.classList.toggle('hidden');
            if(!menu.classList.contains('hidden')) {
                openActionMenuIndex = index;
            } else {
                openActionMenuIndex = null;
            }
        } else {
            menu.classList.add('hidden');
        }
    });
}

function renderGuests(data) {
    const tbody = document.getElementById('guestTableBody');
    const dashPreview = document.getElementById('dash-guest-preview');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-[#5e8d8d]">No guests added yet.</td></tr>';
        if (dashPreview) dashPreview.innerHTML = '<tr><td colspan="3" class="py-4 text-center text-[#5e8d8d] text-sm">No guests added yet.</td></tr>';
        updateGuestStats();
        return;
    }

    const rows = data.map((g, i) => `
        <tr class="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
            <td class="px-4 py-3 font-medium">${g.name}</td>
            <td class="px-4 py-3 text-[#5e8d8d] text-sm">${g.contact}</td>
            <td class="px-4 py-3 text-center">
                <span class="text-[10px] px-2 py-0.5 rounded-full font-bold ${g.rsvp === 'Confirmed' ? 'bg-green-100 text-green-700' : g.rsvp === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}">${g.rsvp}</span>
            </td>
            <td class="px-4 py-3 text-center text-xs">${g.side}</td>
            <td class="px-4 py-3 text-right">
                <div class="flex justify-end gap-1 relative">
                    <button onclick="toggleActionMenu(${i}, event)" class="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center" title="Change RSVP Status">
                        <span class="material-symbols-outlined text-sm">more_vert</span>
                    </button>
                    
                    <div id="actionMenu-${i}" class="action-menu hidden absolute right-8 top-0 mt-8 w-36 bg-white dark:bg-[#1d3a3a] rounded-lg shadow-xl border border-[#dae7e7] dark:border-white/10 overflow-hidden z-10 text-left">
                        <p class="px-3 py-1.5 text-[9px] font-bold text-[#5e8d8d] uppercase border-b border-[#dae7e7] dark:border-white/10">Set Status</p>
                        <button onclick="setSpecificRSVP(${i}, 'Confirmed')" class="w-full text-left px-3 py-2 text-xs font-medium hover:bg-green-50 dark:hover:bg-green-900/20 text-green-700 dark:text-green-400 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-green-500"></span> Confirmed</button>
                        <button onclick="setSpecificRSVP(${i}, 'Pending')" class="w-full text-left px-3 py-2 text-xs font-medium hover:bg-orange-50 dark:hover:bg-orange-900/20 text-orange-600 dark:text-orange-400 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-orange-400"></span> Pending</button>
                        <button onclick="setSpecificRSVP(${i}, 'Declined')" class="w-full text-left px-3 py-2 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-red-500"></span> Declined</button>
                    </div>

                    <button onclick="removeGuest(${i})" class="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Remove Guest">
                        <span class="material-symbols-outlined text-sm">delete</span>
                    </button>
                </div>
            </td>
        </tr>`).join('');
        
    tbody.innerHTML = rows;
    
    // Update Dashboard Summary List (First 3 items only)
    if(dashPreview) {
        dashPreview.innerHTML = data.slice(0, 3).map(g => `
        <tr>
            <td class="py-3 font-medium">${g.name}</td>
            <td class="py-3 text-center"><span class="bg-${g.rsvp === 'Confirmed' ? 'green' : g.rsvp === 'Pending' ? 'orange' : 'red'}-100 text-${g.rsvp === 'Confirmed' ? 'green' : g.rsvp === 'Pending' ? 'orange' : 'red'}-700 text-[10px] px-2 py-0.5 rounded-full font-bold">${g.rsvp}</span></td>
            <td class="py-3 text-right text-xs">${g.side}</td>
        </tr>`).join('');
    }
    
    updateGuestStats();
}

function setSpecificRSVP(i, status) {
    // Find the actual index in the main array if we are filtering
    const displayedGuestName = document.querySelectorAll('#guestTableBody tr')[i].children[0].textContent;
    const actualIndex = guestData.findIndex(g => g.name === displayedGuestName);
    
    if (actualIndex !== -1) {
        guestData[actualIndex].rsvp = status;
        filterGuests();
        showToast(`Status set to ${status}`);
    }
    
    // Hide the menu
    const menu = document.getElementById(`actionMenu-${i}`);
    if(menu) menu.classList.add('hidden');
    openActionMenuIndex = null;
}

function updateGuestStats() {
    // Compute Percentages & Totals
    const confirmed = guestData.filter(g => g.rsvp === 'Confirmed').length;
    const pending = guestData.filter(g => g.rsvp === 'Pending').length;
    const declined = guestData.filter(g => g.rsvp === 'Declined').length;
    const total = guestData.length;
    
    const pctConf = total > 0 ? (confirmed / total) * 100 : 0;
    const pctPend = total > 0 ? (pending / total) * 100 : 0;
    const pctDecl = total > 0 ? (declined / total) * 100 : 0;
    
    // Update Guest Manager view numbers
    document.getElementById('guestTotal').textContent = total;
    document.getElementById('guestConfirmed').textContent = confirmed;
    document.getElementById('guestPending').textContent = pending;
    document.getElementById('guestDeclined').textContent = declined;
    
    // Update Top Widget (RSVP Conversion) Multi-Bar Segment
    document.getElementById('rsvpCount').textContent = `${confirmed} / ${total}`;
    document.getElementById('rsvpBarConfirmed').style.width = pctConf + '%';
    document.getElementById('rsvpBarPending').style.width = pctPend + '%';
    document.getElementById('rsvpBarDeclined').style.width = pctDecl + '%';
    document.getElementById('rsvpPct').textContent = Math.round(pctConf) + '%';

    // Update Guest Manager Page Graph
    document.getElementById('gmBarConfirmed').style.width = pctConf + '%';
    document.getElementById('gmBarPending').style.width = pctPend + '%';
    document.getElementById('gmBarDeclined').style.width = pctDecl + '%';
    
    // Update Dashboard Summary text
    const dashPendingText = document.getElementById('dash-guest-pending-text');
    if(dashPendingText) {
        dashPendingText.textContent = `${pending} pending guests notified`;
    }
}

// Modal Add Guest Functions
function openAddGuestModal() {
    const modal = document.getElementById('addGuestModal');
    modal.classList.remove('hidden');
    // Small delay to allow CSS transition
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        document.getElementById('addGuestModalContent').classList.remove('scale-95');
    }, 10);
}

function closeAddGuestModal() {
    const modal = document.getElementById('addGuestModal');
    modal.classList.add('opacity-0');
    document.getElementById('addGuestModalContent').classList.add('scale-95');
    // Wait for transition before hiding
    setTimeout(() => {
        modal.classList.add('hidden');
        document.getElementById('newGuestName').value = '';
        document.getElementById('newGuestContact').value = '';
    }, 300);
}

async function addGuest() {
    const name = document.getElementById('newGuestName').value.trim();
    const contact = document.getElementById('newGuestContact').value.trim() || 'N/A';
    const side = document.getElementById('newGuestSide').value;
    if (!name) {
        showToast('Please enter a guest name');
        return;
    }
    
    try {
        const newGuest = await apiFetch('/api/customer/guests', {
            method: 'POST',
            body: JSON.stringify({
                name,
                phone: contact,
                email: "",
                rsvp_status: "Pending",
                invitation_sent: false
            })
        });
        
        guestData.push({ id: newGuest.id, name: newGuest.name, contact: newGuest.phone || 'N/A', rsvp: newGuest.rsvp_status, side: side });
        filterGuests();
        showToast('Guest added successfully!');
        closeAddGuestModal();
    } catch (err) {
        showToast('Failed to add guest: ' + err.message);
    }
}

async function removeGuest(i) {
    const displayedGuestName = document.querySelectorAll('#guestTableBody tr')[i].children[0].textContent;
    const actualGuest = guestData.find(g => g.name === displayedGuestName);
    
    if (actualGuest) {
        try {
            await apiFetch(`/api/customer/guests/${actualGuest.id}`, { method: 'DELETE' });
            guestData = guestData.filter(g => g.id !== actualGuest.id);
            filterGuests();
            showToast('Guest removed');
        } catch (err) {
            showToast('Failed to remove guest: ' + err.message);
        }
    }
}

function filterGuests() {
    const search = document.getElementById('guestSearch').value.toLowerCase();
    const side = document.getElementById('guestSideFilter').value;
    const filtered = guestData.filter(g => {
        return (!search || g.name.toLowerCase().includes(search)) && (!side || g.side === side);
    });
    renderGuests(filtered);
}

// ============ INIT ============
let isInitializing = true;

async function loadAIMatchmaker() {
    const grid = document.getElementById('ai-matchmaker-grid');
    if (!grid) return;
    
    try {
        const matches = await apiFetch('/api/ai/match-vendors');
        
        if (!matches || matches.length === 0) {
            grid.innerHTML = `
                <div class="col-span-1 md:col-span-3 text-center py-6 flex flex-col items-center justify-center">
                    <p class="text-white/60 text-xs mb-3">No matching vendors found within your remaining budget range.</p>
                    <button onclick="window.location.href='vendors.html'" class="bg-accent-gold text-primary font-bold px-4 py-2 rounded-lg text-xs hover:opacity-90 transition-opacity">Browse All Vendors</button>
                </div>
            `;
            return;
        }
        
        let html = matches.map(m => `
            <div class="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 hover:border-accent-gold transition-colors cursor-pointer group" onclick="window.location.href='vendors.html?category=${encodeURIComponent(m.category)}'">
                <img src="${m.profile_image}" class="h-12 w-12 rounded-lg object-cover mb-3" onerror="this.src='https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=100'">
                <p class="font-bold text-sm text-white">${m.business_name}</p>
                <p class="text-[10px] text-accent-gold font-bold">${m.match_percentage}% Match • ${m.category} in ${m.city}</p>
                <p class="text-[10px] text-white/70 mt-1 truncate">Starts at ${formatCurrency(m.starting_price)}</p>
            </div>
        `).join('');
        
        if (matches.length < 3) {
            html += `
                <div class="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 hover:border-accent-gold transition-colors cursor-pointer flex flex-col items-center justify-center text-center" onclick="window.location.href='vendors.html'">
                    <span class="material-symbols-outlined text-accent-gold mb-1 text-2xl">search</span>
                    <p class="font-bold text-sm text-white">Browse All</p>
                    <p class="text-[10px] text-white/60">Find more vendors</p>
                </div>
            `;
        }
        grid.innerHTML = html;
        
    } catch (err) {
        console.error("Failed to load AI Matchmaker recommendations:", err);
        grid.innerHTML = `
            <div class="col-span-1 md:col-span-3 text-center py-6 text-white/50 text-xs">
                ⚠️ Failed to load AI recommendations. Make sure the API server is online.
            </div>
        `;
    }
}

function syncUserData() {
    loadAIMatchmaker();
}

document.addEventListener('DOMContentLoaded', async () => {
    const token = sessionStorage.getItem('eazeevent_token');
    if (!token) {
        window.location.href = "index.html";
        return;
    }
    
    try {
        // Load Client Profile
        const profile = await apiFetch('/api/customer/profile');
        weddingDate = new Date(profile.wedding_date || Date.now());
        db_totalBudget = profile.estimated_budget;
        
        // Update profile names in headers
        const nameEl1 = document.getElementById('btnProfileName');
        const nameEl2 = document.getElementById('menuProfileName');
        const emailEl = document.getElementById('menuProfileEmail');
        if (nameEl1) nameEl1.textContent = profile.name;
        if (nameEl2) nameEl2.textContent = profile.name;
        if (emailEl) emailEl.textContent = profile.email;
        
        const editName = document.getElementById('editProfileName');
        const editEmail = document.getElementById('editProfileEmail');
        const editPhone = document.getElementById('editProfilePhone');
        if (editName) editName.value = profile.name;
        if (editEmail) editEmail.value = profile.email;
        if (editPhone && profile.phone) editPhone.value = profile.phone;
        
        // Fetch Expenses
        const expensesData = await apiFetch('/api/customer/expenses');
        db_expenses = expensesData.map(e => ({ id: e.id, name: e.name, amount: e.cost }));
        
        // Fetch Guests
        const guestsData = await apiFetch('/api/customer/guests');
        guestData = guestsData.map(g => ({ id: g.id, name: g.name, contact: g.phone || 'N/A', rsvp: g.rsvp_status, side: 'Bride' }));
        
        // Check if impersonating from Admin
        if (sessionStorage.getItem('eazeevent_impersonating_user')) {
            const banner = document.createElement('div');
            banner.id = 'impersonationBanner';
            banner.className = 'bg-accent-gold text-primary font-bold text-xs py-2 px-6 flex justify-between items-center z-[99] sticky top-0 w-full shadow-md';
            banner.innerHTML = `
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-sm">visibility</span>
                    <span>Impersonating Client: <span class="underline font-extrabold">${profile.name}</span> (View Only Mode)</span>
                </div>
                <button class="bg-primary text-white px-3 py-1 rounded hover:opacity-90 transition-opacity flex items-center gap-1 text-[11px]" onclick="exitImpersonation()">
                    <span class="material-symbols-outlined text-[14px]">logout</span>
                    Return to Admin
                </button>
            `;
            document.body.insertBefore(banner, document.body.firstChild);
            
            window.exitImpersonation = function() {
                sessionStorage.removeItem('eazeevent_impersonating_user');
                sessionStorage.removeItem('eazeevent_token'); // Clear impersonation token
                window.location.href = 'admin_customers.html';
            };
        }
    } catch (err) {
        console.error('Error fetching dashboard details:', err);
    }
    
    // Initialize Top Widgets & Components
    updateCountdown();
    renderGuests(guestData);
    dbUpdateUI();
    loadTimeline();
    fetchChecklist();
    
    // Listeners
    document.getElementById('guestSearch')?.addEventListener('input', filterGuests);
    document.getElementById('guestSideFilter')?.addEventListener('change', filterGuests);
    
    // Close menus when clicking outside
    document.addEventListener('click', (e) => {
        const menu = document.getElementById('profileMenu');
        const btn = document.getElementById('profileBtn');
        if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
            closeProfileMenu();
        }
        if (openActionMenuIndex !== null) {
            const activeMenu = document.getElementById(`actionMenu-${openActionMenuIndex}`);
            if (activeMenu && !activeMenu.contains(e.target)) {
                activeMenu.classList.add('hidden');
                openActionMenuIndex = null;
            }
        }
    });
    isInitializing = false;
});