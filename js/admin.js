function escapeHtml(unsafe) {
    if (unsafe === undefined || unsafe === null) return "";
    return String(unsafe)
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

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
        alert("🔒 Admin session expired. Please log in again.");
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

if (sessionStorage.getItem('eazeevent_admin_logged_in') !== 'true') {
    alert('🔒 Unauthorized Access!\n\nPlease log in as an administrator first.');
    window.location.href = 'index.html';
}

// Global UI State mirroring DB
let db_state = { settings: {}, customers: [], vendors: [], tickets: [], transactions: [], activities: [] };

const db = {
    getSettings: () => db_state.settings || { platformName: "Eazeevent", supportEmail: "support@eazeevent.com", commissionRate: 5, currency: "₹", maintenanceMode: false },
    saveSettings: (data) => {
        db_state.settings = data;
        apiFetch('/api/admin/settings', {
            method: 'PUT',
            body: JSON.stringify({
                platform_name: data.platformName || "Eazeevent",
                support_email: data.supportEmail || "support@eazeevent.com",
                commission_rate: parseFloat(data.commissionRate) || 5.0,
                currency_symbol: data.currency || "₹",
                maintenance_mode: !!data.maintenanceMode,
                gemini_api_key: data.geminiApiKey || ""
            })
        }).catch(err => console.error("Error saving settings via API:", err));
    },

    getCustomers: () => db_state.customers || [],
    saveCustomers: (data) => { db_state.customers = data; },
    
    getVendors: () => db_state.vendors || [],
    saveVendors: (data) => { db_state.vendors = data; },
    
    getTickets: () => db_state.tickets || [],
    saveTickets: (data) => { db_state.tickets = data; },

    getTransactions: () => db_state.transactions || [],
    saveTransactions: (data) => { db_state.transactions = data; },
    
    getActivities: () => db_state.activities || [],
    saveActivities: (data) => { db_state.activities = data; },
    
    logActivity: (text, type = "general") => {
        apiFetch('/api/admin/activities', {
            method: 'POST',
            body: JSON.stringify({ text, time: "Just now", type })
        }).then(act => {
            db_state.activities.unshift(act);
            if (db_state.activities.length > 20) db_state.activities.pop();
            renderOverviewActivities();
        }).catch(err => console.error("Error logging activity to server:", err));
    }
};

// ============ UTILITIES ============

function formatMoney(amount) {
    const settings = db.getSettings();
    const symbol = settings.currency || "₹";
    
    if (amount >= 10000000) {
        return `${symbol}${(amount / 10000000).toFixed(2)}Cr`;
    } else if (amount >= 100000) {
        return `${symbol}${(amount / 100000).toFixed(1)}L`;
    }
    return `${symbol}${amount.toLocaleString('en-IN')}`;
}

function formatDate(dateStr) {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[date.getMonth()]} ${String(date.getDate()).padStart(2, '0')}, ${date.getFullYear()}`;
}

function getInitials(name) {
    return name ? name.split(' ').map(x => x[0]).join('').substring(0, 2).toUpperCase() : "CU";
}

// Get initials background color class
function getAvatarColorClass(name) {
    const colors = ["bg-tertiary-fixed text-on-tertiary-fixed", "bg-secondary-fixed text-on-secondary-fixed", "bg-primary-container text-on-primary-container", "bg-tertiary-container text-on-tertiary-container"];
    let sum = 0;
    for(let i=0; i<name.length; i++) sum += name.charCodeAt(i);
    return colors[sum % colors.length];
}

// ============ GLOBAL INITIALIZER ============

document.addEventListener('DOMContentLoaded', async () => {
    const token = sessionStorage.getItem('eazeevent_token');
    if (!token) {
        window.location.href = "index.html";
        return;
    }
    
    try {
        const settingsData = await apiFetch('/api/admin/settings');
        db_state.settings = {
            platformName: settingsData.platform_name,
            supportEmail: settingsData.support_email,
            commissionRate: settingsData.commission_rate,
            currency: settingsData.currency_symbol,
            maintenanceMode: settingsData.maintenance_mode,
            geminiApiKey: settingsData.gemini_api_key
        };
        
        const customersData = await apiFetch('/api/admin/customers');
        db_state.customers = customersData.map(c => ({
            email: c.email,
            name: c.name,
            phone: c.phone || 'N/A',
            weddingDate: c.wedding_date || 'N/A',
            estimatedBudget: c.estimated_budget,
            actualBudget: c.actual_budget,
            vendorsCount: c.actual_budget > 0 ? 3 : 0,
            totalVendors: 10,
            status: c.status,
            riskDescription: c.risk_description || '',
            lastActive: 'Just now'
        }));
        
        const vendorsData = await apiFetch('/api/admin/vendors');
        db_state.vendors = vendorsData.map(v => ({
            id: `VND-${v.id}`,
            name: v.business_name,
            email: v.email,
            category: v.category,
            city: v.city,
            bookings: v.bookings_count,
            rating: v.rating,
            status: v.status,
            description: v.services_offered
        }));
        
        const ticketsData = await apiFetch('/api/admin/tickets');
        db_state.tickets = ticketsData.map(t => {
            let parsedReplies = [];
            try { parsedReplies = JSON.parse(t.replies); } catch(e) {}
            return {
                id: `TKT-${String(t.id).padStart(4, '0')}`,
                client: t.client_name,
                clientEmail: t.client_email,
                subject: t.subject,
                message: t.message,
                category: t.category,
                priority: t.priority,
                status: t.status,
                date: t.date,
                replies: parsedReplies
            };
        });
        
        const transactionsData = await apiFetch('/api/admin/transactions');
        db_state.transactions = transactionsData.map(t => ({
            id: String(t.id),
            client: t.client_name,
            vendor: t.vendor_name,
            type: t.type === 'deposit' ? 'Deposit' : 'Payout',
            amount: t.amount,
            date: t.date,
            status: t.status
        }));
        
        const activitiesData = await apiFetch('/api/admin/activities');
        db_state.activities = activitiesData;
        
    } catch (err) {
        console.error('Error seeding admin UI state:', err);
    }

    const pathname = window.location.pathname;
    
    if (pathname.includes('admin_overview.html')) {
        initOverviewPage();
    } else if (pathname.includes('admin_customers.html')) {
        initCustomersPage();
    } else if (pathname.includes('admin_vendors.html')) {
        initVendorsPage();
    } else if (pathname.includes('admin_finance.html')) {
        initFinancePage();
    } else if (pathname.includes('admin_settings.html')) {
        initSettingsPage();
    }
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('eazeevent_admin_logged_in');
            sessionStorage.removeItem('eazeevent_impersonating_user');
            sessionStorage.removeItem('eazeevent_token');
        });
    }
});

// ============ OVERVIEW DASHBOARD LOGIC ============

function initOverviewPage() {
    updateOverviewStats();
    renderOverviewActivities();
    
    // Hook Search Input
    const searchInput = document.getElementById('globalSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim().toLowerCase();
                if (query) {
                    window.location.href = `admin_customers.html?search=${encodeURIComponent(query)}`;
                }
            }
        });
    }
}

async function updateOverviewStats() {
    try {
        const overview = await apiFetch('/api/admin/overview');
        
        // 1. Escrow Revenue
        const revFormatted = formatMoney(overview.total_revenue);
        const escrowEl = document.getElementById('escrowRevenueText');
        if (escrowEl) escrowEl.textContent = revFormatted;
        
        // 2. Active Vendors
        const activeVendors = overview.verified_vendors;
        const vendorGrowthEl = document.getElementById('vendorGrowthText');
        if (vendorGrowthEl) vendorGrowthEl.textContent = `${activeVendors} Active`;
        
        const pendingVerifications = overview.pending_approvals_count;
        const pendingVerEl = document.getElementById('pendingVerificationCount');
        if (pendingVerEl) pendingVerEl.textContent = pendingVerifications;
        
        const progressBar = document.getElementById('vendorGrowthBar');
        if (progressBar) {
            const percent = Math.min((activeVendors / 40) * 100, 100);
            progressBar.style.width = `${percent}%`;
        }
        
        // 3. Active Portfolios
        const activeClientsEl = document.getElementById('activeClientsText');
        if (activeClientsEl) activeClientsEl.textContent = overview.total_customers;
        
        const onlineEl = document.getElementById('onlineClientsCount');
        if (onlineEl) onlineEl.textContent = Math.max(1, Math.round(overview.total_customers * 0.3));
        
    } catch (err) {
        console.error("Failed to load admin overview from database:", err);
    }
    
    // 4. Open Support Tickets
    const tickets = db.getTickets();
    const openTickets = tickets.filter(t => t.status === 'New');
    const openTicketsEl = document.getElementById('openTicketsText');
    if (openTicketsEl) {
        const highPriorityCount = openTickets.filter(t => t.priority === 'High Priority').length;
        openTicketsEl.textContent = `${openTickets.length} Open (${highPriorityCount} High)`;
    }
    
    const normalTicketsEl = document.getElementById('normalTicketsCount');
    if (normalTicketsEl) {
        const normalCount = openTickets.filter(t => t.priority !== 'High Priority').length;
        normalTicketsEl.textContent = normalCount;
    }
    
    const resolvedTicketsEl = document.getElementById('resolvedTicketsCount');
    if (resolvedTicketsEl) {
        const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;
        resolvedTicketsEl.textContent = resolvedCount;
    }
}

function renderOverviewActivities() {
    const feedEl = document.getElementById('recentActivityFeed');
    if (!feedEl) return;
    
    const activities = db.getActivities();
    if (activities.length === 0) {
        feedEl.innerHTML = '<p class="text-xs text-on-surface-variant text-center py-4">No recent activities.</p>';
        return;
    }
    
    feedEl.innerHTML = activities.slice(0, 6).map(act => {
        let icon = "info";
        let bgColor = "bg-primary-container text-on-primary-container";
        
        if (act.type === "vendor") {
            icon = "storefront";
            bgColor = "bg-tertiary-fixed text-on-tertiary-fixed";
        } else if (act.type === "finance") {
            icon = "payments";
            bgColor = "bg-secondary-container text-on-secondary-container";
        } else if (act.type === "event") {
            icon = "event";
            bgColor = "bg-error-container text-error";
        } else if (act.type === "support") {
            icon = "support_agent";
            bgColor = "bg-primary-fixed text-on-primary-fixed";
        }
        
        return `
        <div class="flex gap-3 items-start relative pb-4">
            <div class="absolute left-4 top-8 bottom-0 w-px bg-surface-border"></div>
            <div class="w-8 h-8 rounded-full ${bgColor} flex items-center justify-center shrink-0 z-10">
                <span class="material-symbols-outlined text-[16px]">${icon}</span>
            </div>
            <div>
                <p class="font-body-sm text-body-sm text-on-surface">${act.text}</p>
                <span class="font-label-xs text-label-xs text-on-surface-variant">${act.time}</span>
            </div>
        </div>
        `;
    }).join('');
}


// ============ CUSTOMER MANAGEMENT LOGIC ============

let activeCustomerFilter = 'All';

function initCustomersPage() {
    renderCustomerTable();
    updateCustomerMetrics();
    populateImpersonationDropdown();
    renderSupportInquiries();
    
    // Bind search input
    const searchInput = document.getElementById('customerSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            renderCustomerTable(searchInput.value.trim());
        });
        
        // Load initial search if redirected from Overview
        const params = new URLSearchParams(window.location.search);
        const searchParam = params.get('search');
        if (searchParam) {
            searchInput.value = searchParam;
            renderCustomerTable(searchParam);
        }
    }
    
    // Bind Impersonation Button
    const impersonationBtn = document.getElementById('launchImpersonationBtn');
    if (impersonationBtn) {
        impersonationBtn.addEventListener('click', () => {
            const selectEl = document.getElementById('impersonationSelect');
            const email = selectEl.value;
            if (!email) {
                alert('Please select a client to impersonate!');
                return;
            }
            launchImpersonation(email);
        });
    }
    
    // Handle hash links for tickets
    if (window.location.hash === '#tickets') {
        const ticketsEl = document.getElementById('tickets');
        if (ticketsEl) {
            ticketsEl.scrollIntoView({ behavior: 'smooth' });
            ticketsEl.classList.add('ring-2', 'ring-accent-gold');
            setTimeout(() => ticketsEl.classList.remove('ring-2', 'ring-accent-gold'), 3000);
        }
    }
}

function updateCustomerMetrics() {
    const customers = db.getCustomers();
    
    const atRiskCount = customers.filter(c => c.status === 'AT RISK').length;
    const atRiskEl = document.getElementById('atRiskClientsCountText');
    if (atRiskEl) atRiskEl.textContent = atRiskCount;
    
    const activeEl = document.getElementById('activeClientsCountText2');
    if (activeEl) activeEl.textContent = customers.length;
}

function filterCustomerTable(filterType) {
    activeCustomerFilter = filterType;
    const searchVal = document.getElementById('customerSearchInput')?.value || '';
    renderCustomerTable(searchVal);
}

function renderCustomerTable(searchQuery = '') {
    const tableBody = document.getElementById('customerTableBody');
    if (!tableBody) return;
    
    let customers = db.getCustomers();
    
    // Apply status filter
    if (activeCustomerFilter === 'At Risk') {
        customers = customers.filter(c => c.status === 'AT RISK');
    }
    
    // Apply search filter
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        customers = customers.filter(c => 
            c.name.toLowerCase().includes(query) || 
            c.email.toLowerCase().includes(query) || 
            (c.riskDescription && c.riskDescription.toLowerCase().includes(query))
        );
    }
    
    if (customers.length === 0) {
        tableBody.innerHTML = `
        <tr>
            <td colspan="5" class="py-8 text-center text-on-surface-variant text-sm">
                No matching portfolios found.
            </td>
        </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = customers.map(c => {
        const initials = getInitials(c.name);
        const avatarBg = getAvatarColorClass(c.name);
        const budgetPercent = Math.min((c.actualBudget / c.estimatedBudget) * 100, 100);
        const overBudget = c.actualBudget > c.estimatedBudget;
        const overPct = overBudget ? Math.min(((c.actualBudget - c.estimatedBudget) / c.estimatedBudget) * 100, 100) : 0;
        
        return `
        <tr class="hover:bg-surface-container-lowest transition-colors ${c.status === 'AT RISK' ? 'bg-error-container/5 hover:bg-error-container/10' : ''}">
            <td class="py-4 px-4">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full ${avatarBg} flex items-center justify-center text-xs font-bold">${escapeHtml(initials)}</div>
                    <div>
                        <p class="font-semibold text-primary">${escapeHtml(c.name)}</p>
                        <p class="text-xs text-on-surface-variant">Last active: ${escapeHtml(c.lastActive) || 'N/A'}</p>
                    </div>
                    ${c.status === 'AT RISK' ? `<span class="ml-2 bg-error-red/10 text-error-red px-2 py-0.5 rounded text-[10px] font-bold">AT RISK</span>` : ''}
                </div>
            </td>
            <td class="py-4 px-4">
                <div class="flex items-center gap-1 text-on-surface-variant">
                    <span class="material-symbols-outlined text-[16px]">calendar_month</span>
                    ${formatDate(c.weddingDate)}
                </div>
                ${c.status === 'AT RISK' ? `<p class="text-xs text-error mt-0.5">${escapeHtml(c.riskDescription) || 'At Risk'}</p>` : ''}
            </td>
            <td class="py-4 px-4 w-48">
                <div class="flex justify-between text-xs mb-1">
                    <span class="text-on-surface-variant">${formatMoney(c.estimatedBudget)} Est.</span>
                    <span class="${overBudget ? 'text-warning-orange' : 'text-success-green'} font-semibold">${formatMoney(c.actualBudget)} Act.</span>
                </div>
                <div class="w-full bg-surface-container-highest rounded-full h-1.5 overflow-hidden flex">
                    <div class="bg-primary h-1.5 rounded-l-full" style="width: ${budgetPercent}%"></div>
                    ${overBudget ? `<div class="bg-warning-orange h-1.5 rounded-r-full" style="width: ${overPct}%"></div>` : ''}
                </div>
            </td>
            <td class="py-4 px-4 text-center">
                <span class="font-semibold text-primary">${c.vendorsCount || 0}</span><span class="text-on-surface-variant">/${c.totalVendors || 10}</span>
            </td>
            <td class="py-4 px-4 text-right">
                <button class="text-sm font-semibold text-primary hover:text-accent-gold transition-colors flex items-center justify-end gap-1 w-full" onclick="viewCustomerDetails('${escapeHtml(c.email)}')">
                    View
                    <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
            </td>
        </tr>
        `;
    }).join('');
}

function populateImpersonationDropdown() {
    const selectEl = document.getElementById('impersonationSelect');
    if (!selectEl) return;
    
    const customers = db.getCustomers();
    selectEl.innerHTML = `
        <option value="">Select client to view...</option>
        ${customers.map(c => `<option value="${escapeHtml(c.email)}">${escapeHtml(c.name)} (${getInitials(c.name)})</option>`).join('')}
    `;
}

async function launchImpersonation(email) {
    try {
        const data = await apiFetch(`/api/admin/impersonate/${email}`, { method: 'POST' });
        
        sessionStorage.setItem('eazeevent_impersonating_user', JSON.stringify({
            email: data.email,
            name: data.name,
            weddingDate: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            estimatedBudget: 5000000.0,
            actualBudget: 0.0,
            vendorsCount: 0,
            totalVendors: 10,
            status: "ON TRACK",
            phone: "+91 9876543210"
        }));
        
        sessionStorage.setItem('eazeevent_token', data.access_token);
        
        alert(`🔑 Impersonation Mode Initialized!\n\nLaunching Customer dashboard as: ${data.name}\nRedirecting to dashboard.html...`);
        window.location.href = 'dashboard.html';
    } catch (err) {
        alert('Failed to launch impersonation: ' + err.message);
    }
}

function viewCustomerDetails(email) {
    const customer = db.getCustomers().find(c => c.email === email);
    if (!customer) return;
    
    const modalBody = document.getElementById('adminModalBody');
    modalBody.innerHTML = `
        <div class="space-y-6">
            <div class="border-b pb-4">
                <h3 class="font-display-lg text-[22px] text-primary font-bold">${customer.name}</h3>
                <p class="text-sm text-on-surface-variant font-medium">${customer.email} • ${customer.phone}</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <span class="text-xs uppercase font-bold text-on-surface-variant">Wedding Date</span>
                    <p class="font-medium text-sm flex items-center gap-1 mt-1">
                        <span class="material-symbols-outlined text-sm text-primary">calendar_month</span>
                        ${formatDate(customer.weddingDate)}
                    </p>
                </div>
                <div>
                    <span class="text-xs uppercase font-bold text-on-surface-variant">Proof ID Upload</span>
                    <p class="font-medium text-sm flex items-center gap-1 mt-1 text-primary hover:underline cursor-pointer" onclick="alert('Viewing document: ${customer.proofId}')">
                        <span class="material-symbols-outlined text-sm">attachment</span>
                        ${customer.proofId || 'ID_Proof.pdf'}
                    </p>
                </div>
            </div>

            <div class="p-4 bg-surface-container-low rounded-xl border">
                <span class="text-xs uppercase font-bold text-on-surface-variant block mb-3">Escrow Budget Progress</span>
                <div class="flex justify-between items-center text-sm font-semibold mb-1">
                    <span>Estimated: ${formatMoney(customer.estimatedBudget)}</span>
                    <span class="${customer.actualBudget > customer.estimatedBudget ? 'text-error' : 'text-success-green'}">Actual: ${formatMoney(customer.actualBudget)}</span>
                </div>
                <div class="w-full bg-surface-container-highest rounded-full h-2 overflow-hidden flex">
                    <div class="bg-primary h-2" style="width: ${Math.min((customer.actualBudget/customer.estimatedBudget)*100, 100)}%"></div>
                </div>
                <div class="flex justify-between text-xs text-on-surface-variant mt-2">
                    <span>Vendors Booked: ${customer.vendorsCount}/${customer.totalVendors}</span>
                    <span>Last active: ${customer.lastActive}</span>
                </div>
            </div>

            <form id="editCustomerStatusForm" onsubmit="saveCustomerStatus(event, '${customer.email}')">
                <div class="mb-4">
                    <label class="block font-semibold mb-2 text-sm text-primary">Portfolio Status</label>
                    <select id="editCustomerStatus" class="w-full bg-surface-container-low border border-surface-border rounded-lg py-2.5 px-3 text-sm focus:ring-1 focus:ring-primary text-black" onchange="toggleRiskDescriptionInput()">
                        <option value="ON TRACK" ${customer.status === 'ON TRACK' ? 'selected' : ''}>ON TRACK</option>
                        <option value="AT RISK" ${customer.status === 'AT RISK' ? 'selected' : ''}>AT RISK</option>
                    </select>
                </div>
                <div id="riskDescContainer" class="mb-6 ${customer.status === 'AT RISK' ? '' : 'hidden'}">
                    <label class="block font-semibold mb-2 text-sm text-primary">At Risk Notice / Reason</label>
                    <input type="text" id="editCustomerRiskDesc" class="w-full bg-surface-container-low border border-surface-border rounded-lg py-2 px-3 text-sm focus:ring-1 focus:ring-primary text-black" placeholder="e.g. Venue unbooked" value="${customer.riskDescription || ''}">
                </div>
                
                <div class="flex gap-3 pt-4 border-t">
                    <button type="submit" class="bg-primary text-on-primary font-bold py-2.5 px-6 rounded-lg text-sm flex-1 hover:opacity-90 transition-opacity">Save Portfolio</button>
                    <button type="button" class="border border-error text-error hover:bg-error-container/10 font-bold py-2.5 px-4 rounded-lg text-sm transition-colors" onclick="deleteCustomerAccount('${customer.email}')">Delete Account</button>
                </div>
            </form>
        </div>
    `;
    
    openAdminModal();
}

function toggleRiskDescriptionInput() {
    const statusSelect = document.getElementById('editCustomerStatus');
    const container = document.getElementById('riskDescContainer');
    if (statusSelect && container) {
        if (statusSelect.value === 'AT RISK') {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    }
}

async function saveCustomerStatus(event, email) {
    event.preventDefault();
    const status = document.getElementById('editCustomerStatus').value;
    const riskDesc = document.getElementById('editCustomerRiskDesc').value.trim();
    
    try {
        await apiFetch(`/api/admin/customers/${email}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status, risk_description: status === 'AT RISK' ? riskDesc : '' })
        });
        
        // Refresh local customers list
        const customersData = await apiFetch('/api/admin/customers');
        db_state.customers = customersData.map(c => ({
            email: c.email,
            name: c.name,
            phone: c.phone || 'N/A',
            weddingDate: c.wedding_date || 'N/A',
            estimatedBudget: c.estimated_budget,
            actualBudget: c.actual_budget,
            vendorsCount: c.actual_budget > 0 ? 3 : 0,
            totalVendors: 10,
            status: c.status,
            riskDescription: c.risk_description || '',
            lastActive: 'Just now'
        }));
        
        db.logActivity(`Portfolio status for ${email} updated to ${status}`, "event");
        
        alert(`✅ Portfolio successfully updated!`);
        closeAdminModal();
        renderCustomerTable();
        updateCustomerMetrics();
        populateImpersonationDropdown();
    } catch (err) {
        alert('Failed to update status: ' + err.message);
    }
}

// Helper to remove customer session
async function deleteCustomerAccount(email) {
    const customer = db.getCustomers().find(c => c.email === email);
    if (!customer) return;
    
    if (confirm(`⚠️ WARNING: Are you sure you want to delete ${customer.name}'s account?\nThis action cannot be undone.`)) {
        try {
            await apiFetch(`/api/admin/customers/${email}`, { method: 'DELETE' });
            
            // Remove locally
            db_state.customers = db_state.customers.filter(c => c.email !== email);
            db.logActivity(`Customer account for ${customer.name} deleted`, "support");
            
            alert(`🗑️ Customer account deleted.`);
            closeAdminModal();
            renderCustomerTable();
            updateCustomerMetrics();
            populateImpersonationDropdown();
        } catch (err) {
            alert('Failed to delete client account: ' + err.message);
        }
    }
}

function renderSupportInquiries() {
    const inquiriesContainer = document.getElementById('inquiriesContainer');
    if (!inquiriesContainer) return;
    
    const tickets = db.getTickets();
    const openTickets = tickets.filter(t => t.status === 'New');
    
    // Update Badge
    const badge = document.getElementById('newTicketsCountBadge');
    if (badge) badge.textContent = `${openTickets.length} New`;
    
    if (tickets.length === 0) {
        inquiriesContainer.innerHTML = '<p class="text-xs text-on-surface-variant text-center py-8">No inquiries found.</p>';
        return;
    }
    
    inquiriesContainer.innerHTML = tickets.map(t => {
        const initials = getInitials(t.client);
        const avatarBg = getAvatarColorClass(t.client);
        const isResolved = t.status === 'Resolved';
        
        return `
        <div class="p-3 hover:bg-surface-container-lowest rounded-xl transition-colors cursor-pointer border border-transparent hover:border-surface-border mb-1" onclick="viewTicketDetails('${t.id}')">
            <div class="flex justify-between items-start mb-1">
                <div class="flex items-center gap-2">
                    <div class="w-6 h-6 rounded-full ${avatarBg} flex items-center justify-center text-[10px] font-bold">${escapeHtml(initials)}</div>
                    <span class="text-sm font-semibold text-primary">${escapeHtml(t.client)}</span>
                </div>
                <span class="text-[10px] text-on-surface-variant">${escapeHtml(t.date)}</span>
            </div>
            <p class="text-xs text-primary font-medium mb-1 truncate">${escapeHtml(t.subject)}</p>
            <p class="text-[11px] text-on-surface-variant line-clamp-2">${escapeHtml(t.message)}</p>
            <div class="mt-2 flex justify-between items-center">
                <div class="flex gap-2">
                    <span class="bg-surface-container-high text-on-surface-variant text-[9px] font-bold px-2 py-0.5 rounded uppercase">${escapeHtml(t.category)}</span>
                    ${t.priority === 'High Priority' ? `<span class="bg-error-red/10 text-error-red text-[9px] font-bold px-2 py-0.5 rounded uppercase">High</span>` : ''}
                </div>
                <span class="text-[10px] font-bold ${isResolved ? 'text-success-green bg-success-green/10' : 'text-warning-orange bg-warning-orange/10'} px-2 py-0.5 rounded">${escapeHtml(t.status)}</span>
            </div>
        </div>
        <hr class="border-surface-border/50 mx-3 my-1"/>
        `;
    }).join('');
}

function viewTicketDetails(id) {
    const ticket = db.getTickets().find(t => t.id === id);
    if (!ticket) return;
    
    const isResolved = ticket.status === 'Resolved';
    
    const modalBody = document.getElementById('adminModalBody');
    modalBody.innerHTML = `
        <div class="space-y-6">
            <div class="border-b pb-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-bold text-accent-gold uppercase tracking-wider">${ticket.id}</span>
                    <span class="text-xs text-on-surface-variant">${ticket.date}</span>
                </div>
                <h3 class="font-display-lg text-[20px] text-primary font-bold leading-tight">${ticket.subject}</h3>
                <p class="text-sm text-on-surface-variant mt-1">From: <span class="font-semibold text-primary">${ticket.client}</span> (${ticket.clientEmail})</p>
            </div>
            
            <div class="p-4 bg-surface-container-low rounded-xl border text-sm text-on-surface leading-relaxed">
                "${ticket.message}"
            </div>
            
            <div class="flex gap-2">
                <span class="text-xs bg-surface-container-high text-on-surface-variant font-bold px-3 py-1 rounded uppercase">${ticket.category}</span>
                <span class="text-xs ${ticket.priority === 'High Priority' ? 'bg-error-red/10 text-error-red' : 'bg-surface-container-high text-on-surface-variant'} font-bold px-3 py-1 rounded uppercase">${ticket.priority}</span>
            </div>
            
            <div class="space-y-4 pt-4 border-t">
                <h4 class="font-semibold text-sm text-primary">Replies / Conversational Logs</h4>
                <div class="space-y-2 max-h-32 overflow-y-auto pr-2" id="ticketRepliesContainer">
                    ${ticket.replies && ticket.replies.length > 0 
                        ? ticket.replies.map(r => `<div class="bg-surface border p-2 rounded text-xs text-on-surface-variant leading-normal">${r}</div>`).join('')
                        : '<p class="text-xs text-on-surface-variant italic">No replies yet.</p>'
                    }
                </div>
                
                ${!isResolved ? `
                    <div class="space-y-2 mt-4">
                        <textarea id="replyText" rows="3" class="w-full bg-surface-container-low border border-surface-border rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-primary text-black resize-none" placeholder="Type reply message to client..."></textarea>
                        <div class="flex gap-2">
                            <button class="bg-primary text-on-primary py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:opacity-90 transition-all flex-1" onclick="sendTicketReply('${ticket.id}')">Send Reply</button>
                            <button class="bg-success-green text-white py-2 px-4 rounded-lg text-xs font-bold shadow-sm hover:opacity-90 transition-all" onclick="resolveTicket('${ticket.id}')">Resolve Ticket</button>
                        </div>
                    </div>
                ` : `
                    <div class="p-3 bg-success-green/10 text-success-green text-xs font-bold rounded flex items-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">check_circle</span>
                        This support inquiry has been resolved.
                    </div>
                `}
            </div>
        </div>
    `;
    
    openAdminModal();
}

async function sendTicketReply(id) {
    const text = document.getElementById('replyText').value.trim();
    if (!text) {
        alert('Please enter a reply message!');
        return;
    }
    
    const numericId = parseInt(id.replace('TKT-', ''), 10);
    
    try {
        await apiFetch(`/api/admin/tickets/${numericId}/reply`, {
            method: 'POST',
            body: JSON.stringify({ reply_text: text })
        });
        
        // Reload all tickets
        const ticketsData = await apiFetch('/api/admin/tickets');
        db_state.tickets = ticketsData.map(t => {
            let parsedReplies = [];
            try { parsedReplies = JSON.parse(t.replies); } catch(e) {}
            return {
                id: `TKT-${String(t.id).padStart(4, '0')}`,
                client: t.client_name,
                clientEmail: t.client_email,
                subject: t.subject,
                message: t.message,
                category: t.category,
                priority: t.priority,
                status: t.status,
                date: t.date,
                replies: parsedReplies
            };
        });
        
        alert('✅ Reply sent successfully!');
        document.getElementById('replyText').value = '';
        viewTicketDetails(id); // Reload
        renderSupportInquiries();
    } catch (err) {
        alert('Failed to send reply: ' + err.message);
    }
}

async function resolveTicket(id) {
    const numericId = parseInt(id.replace('TKT-', ''), 10);
    
    try {
        await apiFetch(`/api/admin/tickets/${numericId}/resolve`, { method: 'POST' });
        
        // Reload all tickets
        const ticketsData = await apiFetch('/api/admin/tickets');
        db_state.tickets = ticketsData.map(t => {
            let parsedReplies = [];
            try { parsedReplies = JSON.parse(t.replies); } catch(e) {}
            return {
                id: `TKT-${String(t.id).padStart(4, '0')}`,
                client: t.client_name,
                clientEmail: t.client_email,
                subject: t.subject,
                message: t.message,
                category: t.category,
                priority: t.priority,
                status: t.status,
                date: t.date,
                replies: parsedReplies
            };
        });
        
        db.logActivity(`Support ticket ${id} marked as Resolved`, "support");
        
        alert('✅ Support inquiry resolved!');
        closeAdminModal();
        renderSupportInquiries();
    } catch (err) {
        alert('Failed to resolve ticket: ' + err.message);
    }
}


// ============ VENDOR ECOSYSTEM LOGIC ============

let vendorPage = 1;
const vendorsPerPage = 4;

function initVendorsPage() {
    renderVerificationQueue();
    renderVendorTable();
    setupVendorFilterHandlers();
}

function renderVerificationQueue() {
    const queueContainer = document.getElementById('verificationQueueContainer');
    if (!queueContainer) return;
    
    const vendors = db.getVendors();
    // Verification queue contains vendors that are NOT Verified and NOT Suspended (Pending, In-Review, Flagged)
    const queueVendors = vendors.filter(v => v.status !== 'Verified' && v.status !== 'Suspended');
    
    if (queueVendors.length === 0) {
        queueContainer.parentElement.style.display = 'none'; // Hide section if empty
        return;
    }
    queueContainer.parentElement.style.display = 'flex'; // Show section
    
    queueContainer.innerHTML = queueVendors.map(v => {
        let statusColor = "bg-warning-orange";
        let badgeColor = "bg-warning-orange/10 text-warning-orange";
        
        if (v.status === "Flagged") {
            statusColor = "bg-error-red";
            badgeColor = "bg-error-red/10 text-error-red";
        } else if (v.status === "In-Review") {
            statusColor = "bg-primary";
            badgeColor = "bg-primary/10 text-primary";
        }
        
        return `
        <div class="bg-surface-container-lowest border border-surface-border rounded-xl p-card-padding flex flex-col gap-4 relative overflow-hidden shadow-sm">
            <div class="absolute top-0 left-0 w-1 h-full ${statusColor}"></div>
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-body-lg text-body-lg font-bold text-on-surface">${escapeHtml(v.name)}</h3>
                    <p class="font-body-sm text-body-sm text-on-surface-variant">${escapeHtml(v.category)} • ${escapeHtml(v.city)}</p>
                </div>
                <span class="${badgeColor} font-label-bold text-label-bold px-2 py-1 rounded uppercase tracking-wider text-[10px]">${escapeHtml(v.status)}</span>
            </div>
            <div class="flex gap-2 text-on-surface-variant font-body-sm text-body-sm">
                <span class="material-symbols-outlined text-[16px]">attach_file</span>
                <span>Verification Documents Ready</span>
            </div>
            <div class="flex gap-2 mt-auto pt-2">
                <button class="bg-primary text-on-primary font-body-md text-body-md py-2 rounded-lg flex-1 shadow-sm hover:opacity-90 transition-opacity" onclick="verifyVendorDirect('${escapeHtml(v.id)}')">Verify Account</button>
                <button class="border border-surface-border text-on-surface font-body-md text-body-md py-2 px-3 rounded-lg hover:bg-surface-container-low transition-colors" onclick="reviewVendorPortfolio('${escapeHtml(v.id)}')" title="Review Profile">Review</button>
            </div>
        </div>
    }).join('');
}

async function verifyVendorDirect(id) {
    const rawId = id.replace("VND-", "");
    try {
        await apiFetch(`/api/admin/vendors/${rawId}/verify`, { method: 'POST' });
        
        // Refresh local vendors
        const vendorsData = await apiFetch('/api/admin/vendors');
        db_state.vendors = vendorsData.map(v => ({
            id: `VND-${v.id}`,
            name: v.business_name,
            email: v.email,
            category: v.category,
            city: v.city,
            bookings: v.bookings_count,
            rating: v.rating,
            status: v.status,
            description: v.services_offered
        }));
        
        db.logActivity(`Vendor account verified: ID VND-${rawId}`, "vendor");
        
        alert(`✅ Vendor successfully verified!`);
        renderVerificationQueue();
        renderVendorTable();
    } catch (err) {
        alert('Failed to verify vendor: ' + err.message);
    }
}

function renderVendorTable() {
    const tableBody = document.getElementById('vendorTableBody');
    if (!tableBody) return;
    
    let vendors = db.getVendors();
    
    // Apply Filters
    const searchVal = document.getElementById('vendorSearchInput')?.value.toLowerCase().trim() || '';
    const specialtyVal = document.getElementById('specialtyFilter')?.value || 'All';
    const cityVal = document.getElementById('cityFilter')?.value || 'All';
    const statusVal = document.getElementById('statusFilter')?.value || 'All';
    const ratingVal = document.getElementById('ratingFilter')?.value || 'All';
    
    vendors = vendors.filter(v => {
        const matchSearch = !searchVal || v.name.toLowerCase().includes(searchVal) || v.category.toLowerCase().includes(searchVal) || v.id.toLowerCase().includes(searchVal);
        const matchSpecialty = specialtyVal === 'All' || v.category.includes(specialtyVal);
        const matchCity = cityVal === 'All' || v.city === cityVal;
        const matchStatus = statusVal === 'All' || v.status === statusVal;
        const matchRating = ratingVal === 'All' || v.rating >= parseFloat(ratingVal);
        return matchSearch && matchSpecialty && matchCity && matchStatus && matchRating;
    });
    
    // Pagination Calculations
    const totalVendors = vendors.length;
    const totalPages = Math.ceil(totalVendors / vendorsPerPage);
    if (vendorPage > totalPages && totalPages > 0) vendorPage = totalPages;
    
    const startIndex = (vendorPage - 1) * vendorsPerPage;
    const paginatedVendors = vendors.slice(startIndex, startIndex + vendorsPerPage);
    
    // Update Pagination Text
    const pagTextEl = document.getElementById('vendorPaginationText');
    if (pagTextEl) {
        if (totalVendors === 0) {
            pagTextEl.textContent = 'Showing 0 vendors';
        } else {
            pagTextEl.textContent = `Showing ${startIndex + 1}-${Math.min(startIndex + vendorsPerPage, totalVendors)} of ${totalVendors} vendors`;
        }
    }
    
    // Update Table Body
    if (paginatedVendors.length === 0) {
        tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="py-8 text-center text-on-surface-variant text-sm">
                No vendors match selected filters.
            </td>
        </tr>
        `;
        renderPaginationControls(totalPages);
        return;
    }
    
    tableBody.innerHTML = paginatedVendors.map(v => {
        const initials = getInitials(v.name);
        const avatarBg = getAvatarColorClass(v.name);
        
        let statusBadge = "";
        if (v.status === 'Verified') {
            statusBadge = `
            <span class="inline-flex items-center gap-1 bg-accent-gold/10 text-tertiary-container font-label-bold text-label-bold px-2 py-1 rounded-full uppercase tracking-wider text-[10px]">
                <span class="material-symbols-outlined text-[12px] text-accent-gold icon-fill">verified</span>
                Verified
            </span>
            `;
        } else if (v.status === 'Suspended') {
            statusBadge = `
            <span class="inline-flex items-center gap-1 bg-error-container text-error font-label-bold text-label-bold px-2 py-1 rounded-full uppercase tracking-wider text-[10px]">
                <span class="material-symbols-outlined text-[12px] text-error">block</span>
                Suspended
            </span>
            `;
        } else {
            statusBadge = `
            <span class="inline-flex items-center gap-1 bg-surface-container-highest text-on-surface-variant font-label-bold text-label-bold px-2 py-1 rounded-full uppercase tracking-wider text-[10px]">
                ${escapeHtml(v.status)}
            </span>
            `;
        }
        
        return `
        <tr class="hover:bg-surface transition-colors group">
            <td class="py-4 px-6">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full ${avatarBg} flex items-center justify-center font-bold text-sm">${escapeHtml(initials)}</div>
                    <div>
                        <div class="font-body-md text-body-md font-bold text-on-surface">${escapeHtml(v.name)}</div>
                        <div class="font-body-sm text-body-sm text-on-surface-variant">ID: ${escapeHtml(v.id)}</div>
                    </div>
                </div>
            </td>
            <td class="py-4 px-6 font-body-sm text-body-sm text-on-surface">${escapeHtml(v.category)}</td>
            <td class="py-4 px-6 font-body-sm text-body-sm text-on-surface">${escapeHtml(v.city)}</td>
            <td class="py-4 px-6 font-body-sm text-body-sm text-on-surface">${v.bookings || 0}</td>
            <td class="py-4 px-6">
                <div class="flex items-center gap-1">
                    <span class="material-symbols-outlined text-accent-gold text-[16px] icon-fill">star</span>
                    <span class="font-body-sm text-body-sm text-on-surface font-bold">${v.rating > 0 ? v.rating.toFixed(1) : '--'}</span>
                </div>
            </td>
            <td class="py-4 px-6">${statusBadge}</td>
            <td class="py-4 px-6 text-right">
                <div class="flex justify-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    ${v.status !== 'Verified' && v.status !== 'Suspended' ? `
                        <button class="p-1.5 bg-primary text-on-primary hover:bg-primary-container rounded shadow-sm transition-colors" onclick="verifyVendorDirect('${escapeHtml(v.id)}')" title="Verify Account"><span class="material-symbols-outlined text-[20px]">task_alt</span></button>
                    ` : ''}
                    <button class="p-1.5 text-primary hover:bg-surface-container-high rounded border border-surface-border transition-colors" onclick="reviewVendorPortfolio('${escapeHtml(v.id)}')" title="Review Portfolio"><span class="material-symbols-outlined text-[20px]">visibility</span></button>
                    ${v.status === 'Verified' ? `
                        <button class="p-1.5 text-error-red hover:bg-error-container rounded border border-error-container transition-colors" onclick="suspendVendor('${escapeHtml(v.id)}')" title="Suspend"><span class="material-symbols-outlined text-[20px]">block</span></button>
                    ` : ''}
                </div>
            </td>
        </tr>
        `;
    }).join('');
    
    renderPaginationControls(totalPages);
}

function renderPaginationControls(totalPages) {
    const container = document.getElementById('vendorPaginationContainer');
    if (!container) return;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let buttonsHTML = `
        <button class="p-1 text-on-surface-variant hover:text-primary disabled:opacity-50" onclick="changeVendorPage(${vendorPage - 1})" ${vendorPage === 1 ? 'disabled' : ''}>
            <span class="material-symbols-outlined">chevron_left</span>
        </button>
    `;
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === vendorPage) {
            buttonsHTML += `<button class="w-8 h-8 rounded bg-primary text-on-primary font-body-sm text-body-sm flex items-center justify-center">${i}</button>`;
        } else {
            buttonsHTML += `<button class="w-8 h-8 rounded hover:bg-surface-container-high text-on-surface font-body-sm text-body-sm flex items-center justify-center transition-colors" onclick="changeVendorPage(${i})">${i}</button>`;
        }
    }
    
    buttonsHTML += `
        <button class="p-1 text-on-surface-variant hover:text-primary disabled:opacity-50" onclick="changeVendorPage(${vendorPage + 1})" ${vendorPage === totalPages ? 'disabled' : ''}>
            <span class="material-symbols-outlined">chevron_right</span>
        </button>
    `;
    
    container.innerHTML = buttonsHTML;
}

function changeVendorPage(page) {
    vendorPage = page;
    renderVendorTable();
}

function setupVendorFilterHandlers() {
    // Search input
    const searchInput = document.getElementById('vendorSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            vendorPage = 1;
            renderVendorTable();
        });
    }
    
    // Selects
    const selects = ['specialtyFilter', 'cityFilter', 'statusFilter', 'ratingFilter'];
    selects.forEach(selId => {
        const el = document.getElementById(selId);
        if (el) {
            el.addEventListener('change', () => {
                vendorPage = 1;
                renderVendorTable();
            });
        }
    });
    
    // Clear Filters
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            selects.forEach(selId => {
                const el = document.getElementById(selId);
                if (el) el.value = 'All';
            });
            vendorPage = 1;
            renderVendorTable();
        });
    }
}

function suspendVendor(id) {
    const vendor = db.getVendors().find(v => v.id === id);
    if (!vendor) return;
    
    if (confirm(`⚠️ Are you sure you want to suspend vendor "${vendor.name}"?\nSuspended vendors will not be displayed on the public marketplace listings.`)) {
        const vendors = db.getVendors();
        const vendorIndex = vendors.findIndex(v => v.id === id);
        
        if (vendorIndex !== -1) {
            vendors[vendorIndex].status = "Suspended";
            db.saveVendors(vendors);
            db.logActivity(`Vendor suspended: ${vendor.name}`, "vendor");
            
            alert(`🚫 Vendor "${vendor.name}" suspended.`);
            renderVendorTable();
            renderVerificationQueue();
        }
    }
}

function reviewVendorPortfolio(id) {
    const vendor = db.getVendors().find(v => v.id === id);
    if (!vendor) return;
    
    const isVerified = vendor.status === 'Verified';
    const isSuspended = vendor.status === 'Suspended';
    
    const modalBody = document.getElementById('adminModalBody');
    modalBody.innerHTML = `
        <div class="space-y-6">
            <div class="border-b pb-4">
                <div class="flex justify-between items-center mb-1">
                    <span class="text-xs font-bold text-accent-gold uppercase tracking-wider">${vendor.id}</span>
                    <span class="text-xs bg-surface-container-high text-on-surface-variant font-bold px-2 py-0.5 rounded uppercase">${vendor.status}</span>
                </div>
                <h3 class="font-display-lg text-[22px] text-primary font-bold">${vendor.name}</h3>
                <p class="text-sm text-on-surface-variant font-medium">${vendor.email}</p>
            </div>
            
            <div>
                <span class="text-xs uppercase font-bold text-on-surface-variant block mb-1">Business Portfolio</span>
                <p class="text-sm text-on-surface leading-relaxed italic">"${vendor.description || 'No business description provided.'}"</p>
            </div>
            
            <div class="grid grid-cols-2 gap-4 border-t pt-4 text-sm">
                <div>
                    <span class="text-xs uppercase font-bold text-on-surface-variant">Category / Specialty</span>
                    <p class="font-medium mt-0.5">${vendor.category}</p>
                </div>
                <div>
                    <span class="text-xs uppercase font-bold text-on-surface-variant">Location</span>
                    <p class="font-medium mt-0.5">${vendor.city}</p>
                </div>
                <div>
                    <span class="text-xs uppercase font-bold text-on-surface-variant">Years of Experience</span>
                    <p class="font-medium mt-0.5">${vendor.experience || '3'} Years</p>
                </div>
                <div>
                    <span class="text-xs uppercase font-bold text-on-surface-variant">Starting Price</span>
                    <p class="font-semibold text-primary mt-0.5">${formatMoney(vendor.startingPrice || 50000)}</p>
                </div>
            </div>

            <div class="p-4 bg-surface-container-low rounded-xl border space-y-3">
                <span class="text-xs uppercase font-bold text-on-surface-variant block">Verification Documents</span>
                <div class="flex items-center justify-between text-xs border-b pb-2">
                    <span class="font-semibold">Business License / Tax Reg:</span>
                    <button class="text-primary font-bold hover:underline flex items-center gap-0.5" onclick="alert('Viewing document: ${vendor.licenseDoc}')">
                        <span class="material-symbols-outlined text-[14px]">visibility</span> View File
                    </button>
                </div>
                <div class="flex items-center justify-between text-xs">
                    <span class="font-semibold">Owner Identity Proof (Aadhaar/PAN):</span>
                    <button class="text-primary font-bold hover:underline flex items-center gap-0.5" onclick="alert('Viewing document: ${vendor.ownerIdDoc}')">
                        <span class="material-symbols-outlined text-[14px]">visibility</span> View File
                    </button>
                </div>
            </div>
            
            <div class="flex gap-3 pt-4 border-t">
                ${!isVerified && !isSuspended ? `
                    <button class="bg-primary text-on-primary font-bold py-2.5 px-6 rounded-lg text-sm flex-1 hover:opacity-90 transition-opacity" onclick="verifyVendorFromReview('${vendor.id}')">Approve & Verify Account</button>
                ` : ''}
                ${isVerified ? `
                    <button class="border border-error text-error hover:bg-error-container/10 font-bold py-2.5 px-6 rounded-lg text-sm flex-1 transition-colors" onclick="suspendVendorFromReview('${vendor.id}')">Suspend Account</button>
                ` : ''}
                ${isSuspended ? `
                    <button class="bg-primary text-on-primary font-bold py-2.5 px-6 rounded-lg text-sm flex-1 hover:opacity-90 transition-opacity" onclick="verifyVendorFromReview('${vendor.id}')">Re-Activate Account</button>
                ` : ''}
                <button class="border border-surface-border text-on-surface hover:bg-surface-container-low font-bold py-2.5 px-4 rounded-lg text-sm transition-colors" onclick="closeAdminModal()">Close</button>
            </div>
        </div>
    `;
    
    openAdminModal();
}

function verifyVendorFromReview(id) {
    verifyVendorDirect(id);
    closeAdminModal();
}

function suspendVendorFromReview(id) {
    suspendVendor(id);
    closeAdminModal();
}


// ============ FINANCE MODULE LOGIC ============

function initFinancePage() {
    renderFinanceMetrics();
    renderTransactionTable();
    
    // Bind search and status selectors
    const searchInput = document.getElementById('transactionSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', renderTransactionTable);
    }
    
    const filterSelect = document.getElementById('finStatusFilter');
    if (filterSelect) {
        filterSelect.addEventListener('change', renderTransactionTable);
    }
}

function renderFinanceMetrics() {
    const customers = db.getCustomers();
    const transactions = db.getTransactions();
    const settings = db.getSettings();
    const commRate = settings.commissionRate || 5;
    
    // 1. Total Escrow Volume (Sum of budgets from customer listings)
    const escrowVolume = customers.reduce((sum, c) => sum + (c.estimatedBudget || 0), 0);
    document.getElementById('finTotalEscrow').textContent = formatMoney(escrowVolume);
    
    // 2. Released Payouts
    const releasedPayouts = transactions
        .filter(t => t.type === 'Payout' && t.status === 'Released')
        .reduce((sum, t) => sum + t.amount, 0);
    document.getElementById('finReleasedPayouts').textContent = formatMoney(releasedPayouts);
    
    // 3. Platform Fees (Commission % of Released Payouts)
    const platformFees = (commRate / 100) * releasedPayouts;
    document.getElementById('finPlatformFees').textContent = formatMoney(platformFees);
    
    // 4. Pending Vendor Payouts (Pending Deposit transactions)
    const pendingPayouts = transactions
        .filter(t => t.type === 'Deposit' && t.status === 'Pending')
        .reduce((sum, t) => sum + t.amount, 0);
    document.getElementById('finPendingPayouts').textContent = formatMoney(pendingPayouts);
}

function renderTransactionTable() {
    const tableBody = document.getElementById('transactionTableBody');
    if (!tableBody) return;
    
    const transactions = db.getTransactions();
    const searchQuery = document.getElementById('transactionSearchInput')?.value.toLowerCase().trim() || '';
    const statusFilter = document.getElementById('finStatusFilter')?.value || 'All';
    
    // Filter transactions
    const filtered = transactions.filter(t => {
        const matchSearch = !searchQuery || 
                            t.id.toLowerCase().includes(searchQuery) ||
                            t.client.toLowerCase().includes(searchQuery) ||
                            t.vendor.toLowerCase().includes(searchQuery) ||
                            t.type.toLowerCase().includes(searchQuery);
        const matchStatus = statusFilter === 'All' || t.status === statusFilter;
        return matchSearch && matchStatus;
    });
    
    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" class="py-8 text-center text-on-surface-variant text-sm">
                    No transactions match filters.
                </td>
            </tr>
        `;
        return;
    }
    
    tableBody.innerHTML = filtered.map(t => {
        let statusBadge = "";
        if (t.status === 'Released') {
            statusBadge = `<span class="bg-success-green/10 text-success-green font-bold px-2 py-0.5 rounded text-xs uppercase">Released</span>`;
        } else if (t.status === 'Pending') {
            statusBadge = `<span class="bg-warning-orange/10 text-warning-orange font-bold px-2 py-0.5 rounded text-xs uppercase">Pending</span>`;
        } else if (t.status === 'Refunded') {
            statusBadge = `<span class="bg-surface-container-highest text-on-surface-variant font-bold px-2 py-0.5 rounded text-xs uppercase">Refunded</span>`;
        }
        
        let actionButtons = "--";
        if (t.status === 'Pending') {
            actionButtons = `
                <div class="flex justify-end gap-2">
                    <button class="bg-primary text-on-primary py-1 px-3 rounded text-xs font-bold hover:opacity-90 transition-opacity" onclick="triggerReleaseModal('${t.id}')">Release</button>
                    <button class="border border-error text-error hover:bg-error-container/15 py-1 px-3 rounded text-xs font-bold transition-all" onclick="triggerRefundModal('${t.id}')">Refund</button>
                </div>
            `;
        }
        
        return `
            <tr class="hover:bg-surface-container-lowest transition-colors">
                <td class="py-4 px-6 font-semibold text-primary text-xs">${escapeHtml(t.id)}</td>
                <td class="py-4 px-6 font-medium">${escapeHtml(t.client)}</td>
                <td class="py-4 px-6 font-medium">${escapeHtml(t.vendor)}</td>
                <td class="py-4 px-6">${escapeHtml(t.type)}</td>
                <td class="py-4 px-6 font-bold text-primary">${formatMoney(t.amount)}</td>
                <td class="py-4 px-6 text-on-surface-variant text-xs">${escapeHtml(t.date)}</td>
                <td class="py-4 px-6">${statusBadge}</td>
                <td class="py-4 px-6 text-right">${actionButtons}</td>
            </tr>
        `;
    }).join('');
}

function triggerReleaseModal(id) {
    const txn = db.getTransactions().find(t => t.id === id);
    if (!txn) return;
    
    // Find active vendor options to payout to
    const vendors = db.getVendors().filter(v => v.status === 'Verified');
    
    const modalBody = document.getElementById('adminModalBody');
    modalBody.innerHTML = `
        <div class="space-y-6">
            <div class="border-b pb-4">
                <h3 class="font-display-lg text-[20px] text-primary font-bold">Release Escrow Payout</h3>
                <p class="text-xs text-on-surface-variant mt-1">Disburse locked deposit ${txn.id} for client: <span class="font-semibold">${txn.client}</span></p>
            </div>
            
            <div class="p-4 bg-surface-container-low rounded-xl border space-y-2 text-sm">
                <div class="flex justify-between">
                    <span class="text-on-surface-variant">Escrow Amount:</span>
                    <span class="font-bold">${formatMoney(txn.amount)}</span>
                </div>
                <div class="flex justify-between border-t pt-2">
                    <span class="text-on-surface-variant">Platform Fee (Simulated):</span>
                    <span class="font-semibold text-accent-gold">${formatMoney(txn.amount * (db.getSettings().commissionRate / 100))}</span>
                </div>
            </div>

            <form onsubmit="releaseEscrowPayout(event, '${txn.id}')">
                <div class="mb-6">
                    <label class="block font-semibold mb-2 text-sm text-primary">Select Vendor for Disbursement</label>
                    <select id="payoutVendorSelect" class="w-full bg-surface-container-low border border-surface-border rounded-lg py-2.5 px-3 text-sm focus:ring-1 focus:ring-primary text-black" required>
                        <option value="">-- Choose Verified Vendor --</option>
                        ${vendors.map(v => `<option value="${v.name}">${v.name} (${v.category} • ${v.city})</option>`).join('')}
                    </select>
                </div>
                
                <div class="flex gap-3 pt-4 border-t">
                    <button type="submit" class="bg-primary text-on-primary font-bold py-2.5 px-6 rounded-lg text-sm flex-1 hover:opacity-90 transition-opacity">Disburse Funds</button>
                    <button type="button" class="border border-surface-border text-on-surface hover:bg-surface-container-low font-bold py-2.5 px-4 rounded-lg text-sm transition-colors" onclick="closeAdminModal()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    openAdminModal();
}

async function releaseEscrowPayout(event, txnId) {
    event.preventDefault();
    const vendorName = document.getElementById('payoutVendorSelect').value;
    if (!vendorName) return;
    
    const numericId = parseInt(txnId, 10);
    
    try {
        await apiFetch(`/api/admin/transactions/${numericId}/release`, { method: 'POST' });
        
        // Reload transactions
        const transactionsData = await apiFetch('/api/admin/transactions');
        db_state.transactions = transactionsData.map(t => ({
            id: String(t.id),
            client: t.client_name,
            vendor: t.vendor_name,
            type: t.type === 'deposit' ? 'Deposit' : 'Payout',
            amount: t.amount,
            date: t.date,
            status: t.status
        }));
        
        db.logActivity(`Escrow payout for transaction #${txnId} released to ${vendorName}`, "finance");
        
        alert(`💸 Escrow funds successfully disbursed to ${vendorName}!`);
        closeAdminModal();
        renderFinanceMetrics();
        renderTransactionTable();
    } catch (err) {
        alert("Failed to release payout: " + err.message);
    }
}

async function triggerRefundModal(id) {
    const txn = db_state.transactions.find(t => t.id === id);
    if (!txn) return;
    
    if (confirm(`⚠️ REFUND ESCROW: Are you sure you want to refund deposit ${txn.id} back to client "${txn.client}"?\nThis funds will be released back to their account.`)) {
        const numericId = parseInt(id, 10);
        
        try {
            await apiFetch(`/api/admin/transactions/${numericId}/refund`, { method: 'POST' });
            
            // Reload transactions
            const transactionsData = await apiFetch('/api/admin/transactions');
            db_state.transactions = transactionsData.map(t => ({
                id: String(t.id),
                client: t.client_name,
                vendor: t.vendor_name,
                type: t.type === 'deposit' ? 'Deposit' : 'Payout',
                amount: t.amount,
                date: t.date,
                status: t.status
            }));
            
            db.logActivity(`Escrow deposit for transaction #${id} refunded to client ${txn.client}`, "finance");
            
            alert(`✅ Escrow deposit refunded successfully.`);
            renderFinanceMetrics();
            renderTransactionTable();
        } catch (err) {
            alert("Failed to refund escrow: " + err.message);
        }
    }
}


// ============ SYSTEM PLATFORM SETTINGS LOGIC ============

function initSettingsPage() {
    loadSettingsForm();
}

function loadSettingsForm() {
    const settings = db.getSettings();
    
    const pName = document.getElementById('settingsPlatformName');
    const pEmail = document.getElementById('settingsSupportEmail');
    const pComm = document.getElementById('settingsCommissionRate');
    const pCurr = document.getElementById('settingsCurrency');
    const pMaint = document.getElementById('settingsMaintenanceMode');
    const pGemini = document.getElementById('settingsGeminiApiKey');
    
    if (pName) pName.value = settings.platformName || "Eazeevent Luxe";
    if (pEmail) pEmail.value = settings.supportEmail || "support@eazeevent.com";
    if (pComm) pComm.value = settings.commissionRate || 5;
    if (pCurr) pCurr.value = settings.currency || "₹";
    if (pMaint) pMaint.checked = settings.maintenanceMode || false;
    if (pGemini) pGemini.value = settings.geminiApiKey || "";
}

function savePlatformSettings(event) {
    event.preventDefault();
    
    const settings = {
        platformName: document.getElementById('settingsPlatformName').value.trim(),
        supportEmail: document.getElementById('settingsSupportEmail').value.trim(),
        commissionRate: parseInt(document.getElementById('settingsCommissionRate').value),
        currency: document.getElementById('settingsCurrency').value,
        maintenanceMode: document.getElementById('settingsMaintenanceMode').checked,
        geminiApiKey: document.getElementById('settingsGeminiApiKey').value.trim()
    };
    
    db.saveSettings(settings);
    db.logActivity(`System configurations and policies updated`, "general");
    
    alert(`⚙️ Configurations saved successfully!\nCurrency set to: ${settings.currency}\nCommission set to: ${settings.commissionRate}%`);
}

function resetSettingsForm() {
    if (confirm("Reset configurations back to defaults (₹ currency, 5% fee)?")) {
        const defaults = {
            platformName: "Eazeevent Luxe",
            supportEmail: "support@eazeevent.com",
            commissionRate: 5,
            currency: "₹",
            maintenanceMode: false
        };
        db.saveSettings(defaults);
        loadSettingsForm();
    }
}


// ============ GLOBAL MODAL TOGGLE CONTROLLERS ============

function openAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeAdminModal() {
    const modal = document.getElementById('adminModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}
