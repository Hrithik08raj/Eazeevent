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

if (!sessionStorage.getItem('eazeevent_logged_in_vendor')) {
    alert('🔒 Access Denied!\n\nPlease log in as a vendor first to view your dashboard.');
    window.location.href = 'index.html';
}

// ===================== DATA =====================
let blockedDates = [];

const inquiries = [
    { id: 1, initials: 'AK', name: 'Aditi & Karan', pkg: '2 Days Wedding Package', date: 'Nov 14, 2026', location: 'Mumbai', status: 'New Request', statusColor: 'yellow', budget: '₹2,50,000' },
    { id: 2, initials: 'RS', name: 'Rohan Singh', pkg: 'Pre-wedding Shoot', date: 'Dec 02, 2026', location: 'Goa', status: 'In Discussion', statusColor: 'blue', budget: '₹75,000' },
    { id: 3, initials: 'NM', name: 'Neha & Mayank', pkg: 'Cinematic Video', date: 'Jan 15, 2027', location: 'Udaipur', status: 'Booked', statusColor: 'green', budget: '₹1,80,000' },
    { id: 4, initials: 'PG', name: 'Priya & Gaurav', pkg: 'Full Wedding Package', date: 'Feb 08, 2027', location: 'Delhi', status: 'New Request', statusColor: 'yellow', budget: '₹3,50,000' },
    { id: 5, initials: 'SK', name: 'Sanya Kapoor', pkg: 'Birthday Shoot', date: 'Mar 20, 2027', location: 'Mumbai', status: 'Declined', statusColor: 'red', budget: '₹30,000' },
];

const bookings = [
    { id: 1, initials: 'NM', name: 'Neha & Mayank', pkg: 'Cinematic Video', date: 'Jan 15, 2027', location: 'Udaipur Palace, Rajasthan', amount: '₹1,80,000', status: 'Confirmed', paid: '₹90,000', due: '₹90,000' },
    { id: 2, initials: 'VS', name: 'Vikram & Simran', pkg: '3-Day Wedding', date: 'Feb 12, 2027', location: 'Lonavala Resort, Maharashtra', amount: '₹3,20,000', status: 'Confirmed', paid: '₹1,00,000', due: '₹2,20,000' },
    { id: 3, initials: 'AJ', name: 'Anjali & Jayesh', pkg: 'Engagement Shoot', date: 'Mar 04, 2027', location: 'Mumbai', amount: '₹60,000', status: 'Confirmed', paid: '₹60,000', due: '₹0' },
    { id: 4, initials: 'KR', name: 'Kavya & Rishi', pkg: 'Pre-wedding Film', date: 'Mar 28, 2027', location: 'Goa Beachside', amount: '₹95,000', status: 'Confirmed', paid: '₹30,000', due: '₹65,000' },
    { id: 5, initials: 'DS', name: 'Divya & Saurav', pkg: 'Full Wedding', date: 'Apr 18, 2027', location: 'Jaipur Fort, Rajasthan', amount: '₹2,80,000', status: 'Confirmed', paid: '₹1,40,000', due: '₹1,40,000' },
];

const notifications = [
    { title: 'New Lead: Aditi & Karan', body: 'Requested a quote for Nov 14, 2026.', time: '10 mins ago', read: false },
    { title: 'New Lead: Priya & Gaurav', body: 'Interested in a full wedding package.', time: '1 hour ago', read: false },
    { title: 'Review Received', body: 'Rohan Singh left you a 5-star review.', time: '3 hours ago', read: false },
    { title: 'Booking Confirmed', body: 'Neha & Mayank confirmed their booking.', time: 'Yesterday', read: true },
];

const reviews = [
    { name: 'Aditi & Karan', stars: 5, date: 'Nov 2026', text: 'Absolutely magical! Lumiere Films captured our wedding perfectly. Every moment felt cinematic and emotional. Highly recommend!', replied: false },
    { name: 'Rohan Singh', stars: 5, date: 'Sep 2026', text: 'The pre-wedding shoot was beyond our expectations. Great team, great locations, great output. 10/10!', replied: true, reply: 'Thank you so much, Rohan! It was a pleasure working with you.' },
    { name: 'Simran & Vikram', stars: 4, date: 'Aug 2026', text: 'Very professional and creative team. Delivered on time and was very accommodating with our requests.', replied: false },
];

let transactions = [];

const earningsData = [
    { month: 'Jan', value: 850000 },
    { month: 'Feb', value: 620000 },
    { month: 'Mar', value: 980000 },
    { month: 'Apr', value: 540000 },
    { month: 'May', value: 710000 },
    { month: 'Jun', value: 850000 },
];

const aiTips = [
    '🎯 Your profile gets 3x more leads when you respond within 1 hour. Your average is 4.2 hours.',
    '📸 Vendors with 15+ portfolio items get 56% more clicks. You have 8 — add 7 more!',
    '⭐ Clients who see your reviews are 2x more likely to inquire. Encourage past clients to review.',
    '🗺️ 68% of your inquiries come from destination weddings. Highlight your travel portfolio!',
    '💬 Adding a WhatsApp link to your profile increases conversions by 28%.',
    '🎬 Drone coverage showcase can increase destination wedding bookings by 34%.',
    '📅 Update your availability calendar monthly to get 40% more bookings.',
];

const captions = {
    'Romantic & Elegant': [
        "In the golden light of {location}, two souls became one. Every glance, every smile — forever immortalised. ✨ #WeddingPhotography #LumiereFilms #EternalMoments",
        "Where love blooms and promises are made to last forever. A story told not in words, but in light. 🌹 #CinematicWedding #LumiereFilms",
    ],
    'Fun & Playful': [
        "When your couple is THIS cute, the camera practically shoots itself! 😍📷 Tag your partner if you'd want this! #WeddingGoals #LumiereFilms",
        "Plot twist: The best part of our job is watching love happen in real time! 🎉💕 #WeddingPhotographer #HappyCouple",
    ],
    'Professional & Formal': [
        "Lumiere Films proudly presents our latest work — a stunning wedding celebration captured with precision and artistry. Contact us to book your date. #LumiereFilms #WeddingPhotography",
        "Excellence in every frame. Lumiere Films delivers cinematic wedding stories that stand the test of time. Inquire today. #ProfessionalPhotography",
    ],
    'Emotional & Heartfelt': [
        "Tears, laughter, joy — and in between it all, a love so pure it fills every frame. This is why we do what we do. 💛 #WeddingStory #LumiereFilms",
        "Some moments don't need words. They just need to be felt. We are honoured to preserve yours forever. 🤍 #LumiereFilms",
    ],
};

const statusColors = {
    'New Request': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    'In Discussion': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    'Booked': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    'Declined': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    'Confirmed': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
};
const statusDots = {
    'New Request': 'bg-yellow-500', 'In Discussion': 'bg-blue-500',
    'Booked': 'bg-green-500', 'Declined': 'bg-red-500', 'Confirmed': 'bg-green-500',
};

// ===================== STATE =====================
let currentPage = 'dashboard';
let isAccepting = true;
let chatContext = null;
let chatHistory = {};
let calDate = new Date(2027, 0, 1);
let selectedBoostPlan = 1;
let tipIdx = 0;
let toastTimer;
let earningsChartInstance = null; // Stored chart instance

// ===================== NAVIGATION =====================
function navigateTo(page) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + page).classList.add('active');

    document.querySelectorAll('.nav-link').forEach(l => {
        l.className = 'nav-link flex items-center gap-3 px-4 py-3 text-[#5e8d8d] hover:bg-gray-50 dark:hover:bg-white/5 hover:text-primary dark:hover:text-white rounded-xl font-semibold transition-colors';
        const badge = l.querySelector('.bg-red-500');
        if (badge) l.appendChild(badge);
    });
    const activeLink = document.querySelector(`[data-page="${page}"]`);
    if (activeLink) {
        activeLink.className = 'nav-link active-nav flex items-center gap-3 px-4 py-3 bg-primary/10 dark:bg-accent-gold/10 text-primary dark:text-accent-gold rounded-xl font-bold transition-colors';
        const badge = activeLink.querySelector('.bg-red-500');
        if (badge) activeLink.appendChild(badge);
    }

    const titles = { dashboard: 'Overview', inquiries: 'Inquiries', bookings: 'Bookings', profile: 'My Profile', earnings: 'Earnings', 'ai-marketing': 'AI Marketing' };
    document.getElementById('pageTitle').textContent = titles[page] || '';

    currentPage = page;

    // Re-render chart explicitly if navigating to earnings page
    if (page === 'earnings') {
        setTimeout(() => renderEarningsChart(), 10);
    }

    // close sidebar on mobile
    if (window.innerWidth < 768) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar.classList.add('-translate-x-full');
        overlay.classList.add('opacity-0');
        setTimeout(() => overlay.classList.add('hidden'), 300);
    }
    // Close menus
    document.getElementById('profileMenu').classList.add('hidden');
    document.getElementById('notifMenu').classList.add('hidden');
}

// ===================== RENDER FUNCTIONS =====================
function renderDashboardInquiries() {
    const el = document.getElementById('dashboardInquiries');
    el.innerHTML = inquiries.slice(0, 3).map(inq => `
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border-b last:border-0 border-[#e0e8e8] dark:border-[#2a4a4a] items-center hover:bg-gray-50 dark:hover:bg-[#2a4a4a]/30 transition-colors">
        <div class="col-span-4 flex items-center gap-3">
            <div class="size-10 rounded-full avatar-placeholder flex items-center justify-center text-sm">${inq.initials}</div>
            <div><p class="font-bold text-sm">${inq.name}</p><p class="text-xs text-[#5e8d8d]">${inq.pkg}</p></div>
        </div>
        <div class="col-span-3"><p class="text-sm font-medium">${inq.date}</p><p class="text-xs text-[#5e8d8d]">${inq.location}</p></div>
        <div class="col-span-3"><span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md ${statusColors[inq.status]} text-xs font-bold shadow-sm"><span class="size-1.5 rounded-full ${statusDots[inq.status]}"></span>${inq.status}</span></div>
        <div class="col-span-2 md:text-right mt-2 md:mt-0">
            ${inq.status === 'New Request' ? `<div class="flex gap-2 justify-end"><button class="flex-1 md:flex-none px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition ripple" onclick="openChat(${inq.id})">Respond</button><button class="flex-1 md:flex-none px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20 text-xs font-bold rounded-lg transition ripple" onclick="openRemoveModal(${inq.id})">Remove</button></div>` :
            inq.status === 'In Discussion' ? `<div class="flex gap-2 justify-end"><button class="p-2 text-[#5e8d8d] hover:text-primary bg-gray-100 dark:bg-[#102a2a] rounded-lg transition" onclick="openChat(${inq.id})"><span class="material-symbols-outlined text-sm">chat</span></button><button class="p-2 text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 transition" onclick="confirmBooking(${inq.id})"><span class="material-symbols-outlined text-sm">check</span></button></div>` :
                `<button class="w-full md:w-auto px-4 py-2 border border-[#e0e8e8] dark:border-[#2a4a4a] text-sm font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-[#102a2a] transition" onclick="openBookingDetail(${inq.id})">Details</button>`}
        </div>
    </div>`).join('');
}

function renderInquiries() {
    const filter = document.getElementById('inquiryFilter').value;
    const filtered = filter === 'all' ? inquiries : inquiries.filter(i => i.status === filter);
    const el = document.getElementById('inquiriesList');
    el.innerHTML = filtered.map(inq => `
    <div class="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 border-b last:border-0 border-[#e0e8e8] dark:border-[#2a4a4a] items-center hover:bg-gray-50 dark:hover:bg-[#2a4a4a]/30 transition-colors">
        <div class="col-span-4 flex items-center gap-3">
            <div class="size-10 rounded-full avatar-placeholder flex items-center justify-center text-sm">${inq.initials}</div>
            <div><p class="font-bold text-sm">${inq.name}</p><p class="text-xs text-[#5e8d8d]">${inq.pkg}</p><p class="text-xs font-bold text-primary dark:text-accent-gold mt-0.5">${inq.budget}</p></div>
        </div>
        <div class="col-span-2"><p class="text-sm font-medium">${inq.date}</p></div>
        <div class="col-span-2"><p class="text-sm text-[#5e8d8d] font-semibold">${inq.location}</p></div>
        <div class="col-span-2"><span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md ${statusColors[inq.status]} text-xs font-bold"><span class="size-1.5 rounded-full ${statusDots[inq.status]}"></span>${inq.status}</span></div>
        <div class="col-span-2 flex gap-2 justify-end flex-wrap">
            ${inq.status === 'New Request' ? `
                <button class="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition ripple" onclick="openChat(${inq.id})">Respond</button>
                <button class="px-3 py-1.5 border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-900/30 dark:hover:bg-red-900/20 text-xs font-bold rounded-lg transition ripple" onclick="openRemoveModal(${inq.id})">Remove</button>` :
            inq.status === 'In Discussion' ? `
                <button class="p-1.5 text-[#5e8d8d] hover:text-primary bg-gray-100 dark:bg-[#102a2a] rounded-lg transition" onclick="openChat(${inq.id})"><span class="material-symbols-outlined text-sm">chat</span></button>
                <button class="p-1.5 text-green-600 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 transition" onclick="confirmBooking(${inq.id})"><span class="material-symbols-outlined text-sm">check</span></button>` :
                inq.status === 'Declined' ? `<span class="text-xs text-[#5e8d8d] italic">No action needed</span>` :
                    `<button class="px-3 py-1.5 border border-[#e0e8e8] dark:border-[#2a4a4a] text-xs font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-[#102a2a] transition" onclick="openBookingDetail(${inq.id})">Details</button>`}
        </div>
    </div>`).join('') || '<div class="p-8 text-center text-[#5e8d8d] font-semibold">No inquiries found for this filter.</div>';
}

function renderBookings() {
    const el = document.getElementById('bookingsList');
    el.innerHTML = bookings.map(b => `
    <div class="bg-white dark:bg-[#1d3a3a] rounded-2xl border border-[#e0e8e8] dark:border-[#2a4a4a] shadow-sm p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-primary/30 dark:hover:border-accent-gold/30 hover:shadow-md transition-all">
        <div class="size-12 rounded-xl avatar-placeholder shrink-0 flex items-center justify-center">${b.initials}</div>
        <div class="flex-1 min-w-0">
            <p class="font-bold">${b.name}</p>
            <p class="text-sm text-[#5e8d8d]">${b.pkg} · ${b.location}</p>
            <div class="flex flex-wrap gap-3 mt-2">
                <span class="text-xs font-bold text-[#5e8d8d] flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">calendar_month</span>${b.date}</span>
                <span class="text-xs font-bold text-green-600">Paid: ${b.paid}</span>
                ${b.due !== '₹0' ? `<span class="text-xs font-bold text-red-500">Due: ${b.due}</span>` : `<span class="text-xs font-bold text-green-500">Fully Paid ✓</span>`}
            </div>
        </div>
        <div class="flex flex-col items-end gap-2">
            <span class="text-lg font-black">${b.amount}</span>
            <div class="flex gap-2">
                <button class="px-3 py-1.5 border border-[#e0e8e8] dark:border-[#2a4a4a] text-xs font-bold rounded-lg hover:bg-gray-50 dark:hover:bg-[#102a2a] transition" onclick="viewBookingDetail(${b.id})">Details</button>
                <button class="p-1.5 text-[#5e8d8d] bg-gray-100 dark:bg-[#102a2a] rounded-lg hover:text-primary transition" onclick="openChatForBooking(${b.id})"><span class="material-symbols-outlined text-sm">chat</span></button>
            </div>
        </div>
    </div>`).join('');
}

function renderCalendar() {
    const el = document.getElementById('calGrid');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    document.getElementById('calMonthYear').textContent = `${monthNames[calDate.getMonth()]} ${calDate.getFullYear()}`;

    const firstDay = new Date(calDate.getFullYear(), calDate.getMonth(), 1).getDay();
    const daysInMonth = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0).getDate();

    const bookedDates = bookings.map(b => {
        const parts = b.date.split(' ');
        const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
        return { day: parseInt(parts[1].replace(',', '')), month: months[parts[0]], year: parseInt(parts[2]) };
    });

    let html = '';
    for (let i = 0; i < firstDay; i++) html += '<div></div>';
    for (let d = 1; d <= daysInMonth; d++) {
        const isBooked = bookedDates.some(b => b.day === d && b.month === calDate.getMonth() && b.year === calDate.getFullYear());
        
        // Format YYYY-MM-DD
        const yyyy = calDate.getFullYear();
        const mm = String(calDate.getMonth() + 1).padStart(2, '0');
        const dd = String(d).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const isBlocked = blockedDates.includes(dateStr);
        
        const today = new Date();
        const isToday = d === today.getDate() && calDate.getMonth() === today.getMonth() && calDate.getFullYear() === today.getFullYear();
        
        let dayClass = 'hover:bg-gray-100 dark:hover:bg-[#102a2a]';
        let clickAttr = `onclick="promptToggleBlock('${dateStr}')"`;
        
        if (isBooked) {
            dayClass = 'bg-primary text-white hover:bg-primary/90';
            clickAttr = `onclick="showToast('Confirmed booking on this date! 🗓️')"`;
        } else if (isBlocked) {
            dayClass = 'bg-red-500 text-white hover:bg-red-600';
        } else if (isToday) {
            dayClass = 'border-2 border-primary text-primary dark:text-accent-gold font-black';
        }
        
        html += `<div class="aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-semibold cursor-pointer transition-all ${dayClass}" ${clickAttr}>
        ${d}
        ${isBooked ? `<span class="w-1.5 h-1.5 rounded-full bg-accent-gold mt-0.5"></span>` : ''}
        ${isBlocked ? `<span class="text-[8px] uppercase font-bold mt-0.5 text-white tracking-wider">Blocked</span>` : ''}
    </div>`;
    }
    el.innerHTML = html;
}

function renderNotifications() {
    const el = document.getElementById('notifList');
    el.innerHTML = notifications.slice(0, 3).map(n => `
    <div class="p-4 hover:bg-gray-50 dark:hover:bg-[#2a4a4a]/50 cursor-pointer transition-colors border-b border-[#e0e8e8] dark:border-[#2a4a4a] ${n.read ? 'opacity-60' : ''}" onclick="navigateTo('inquiries')">
        ${!n.read ? '<div class="flex items-start gap-3"><div class="size-2 rounded-full bg-primary dark:bg-accent-gold mt-1.5 shrink-0"></div><div>' : '<div class="pl-5">'}
        <p class="text-sm font-bold text-primary dark:text-accent-gold">${n.title}</p>
        <p class="text-xs text-[#5e8d8d] mt-0.5">${n.body}</p>
        <p class="text-[10px] text-gray-400 mt-1">${n.time}</p>
        ${!n.read ? '</div></div>' : '</div>'}
    </div>`).join('');

    const unread = notifications.filter(n => !n.read).length;
    document.getElementById('notifDot').style.display = unread > 0 ? 'block' : 'none';
}

function renderReviews() {
    const el = document.getElementById('reviewsList');
    el.innerHTML = reviews.map((r, i) => `
    <div class="border border-[#e0e8e8] dark:border-[#2a4a4a] rounded-xl p-4">
        <div class="flex items-start justify-between gap-2">
            <div>
                <p class="font-bold text-sm">${r.name}</p>
                <div class="flex gap-0.5 mt-1">${Array(r.stars).fill('<span class="material-symbols-outlined text-accent-gold text-[14px]" style="font-variation-settings:\'FILL\' 1">star</span>').join('')}</div>
            </div>
            <span class="text-xs text-[#5e8d8d]">${r.date}</span>
        </div>
        <p class="text-sm text-[#5e8d8d] mt-2 leading-relaxed">${r.text}</p>
        ${r.replied ? `<div class="mt-3 pl-3 border-l-2 border-primary/30 dark:border-accent-gold/30"><p class="text-xs text-[#5e8d8d] font-semibold italic">"${r.reply}"</p></div>` :
            `<button class="mt-2 text-xs font-bold text-primary dark:text-accent-gold flex items-center gap-1 hover:underline" onclick="openReviewModal(${i})"><span class="material-symbols-outlined text-[14px]">reply</span>Reply</button>`}
    </div>`).join('');
}

function renderEarningsChart() {
    const canvasElement = document.getElementById('earningsChartCanvas');
    if (!canvasElement) return; // Wait until page is active

    const ctx = canvasElement.getContext('2d');

    if (earningsChartInstance) {
        earningsChartInstance.destroy();
    }

    Chart.defaults.color = '#888';
    Chart.defaults.font.family = '"Plus Jakarta Sans", sans-serif';

    earningsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: earningsData.map(e => e.month),
            datasets: [{
                label: 'Revenue',
                data: earningsData.map(e => e.value),
                borderColor: '#004c4c',
                backgroundColor: 'rgba(0, 76, 76, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#D4AF37',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    padding: 12,
                    callbacks: {
                        label: function (context) {
                            return '₹ ' + context.parsed.y.toLocaleString('en-IN');
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(128, 128, 128, 0.2)', borderDash: [5, 5] },
                    ticks: {
                        callback: function (value) {
                            return '₹' + (value / 100000) + 'L';
                        }
                    }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

function renderTransactions() {
    const el = document.getElementById('transactionsList');
    el.innerHTML = transactions.map(t => `
    <div class="flex items-center gap-4 p-4 border-b last:border-0 border-[#e0e8e8] dark:border-[#2a4a4a] hover:bg-gray-50 dark:hover:bg-[#2a4a4a]/30 transition-colors">
        <div class="size-10 rounded-xl ${t.type === 'credit' ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-red-50 dark:bg-red-900/20 text-red-500'} flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[18px]">${t.type === 'credit' ? 'south_west' : 'north_east'}</span>
        </div>
        <div class="flex-1 min-w-0">
            <p class="font-bold text-sm">${t.name}</p>
            <p class="text-xs text-[#5e8d8d]">${t.pkg} · ${t.date}</p>
        </div>
        <span class="font-black text-sm ${t.type === 'credit' ? 'text-green-600' : 'text-red-500'}">${t.amount}</span>
    </div>`).join('');
}

function renderAITips() {
    const el = document.getElementById('aiTipsList');
    const shuffled = [...aiTips].sort(() => 0.5 - Math.random()).slice(0, 3);
    el.innerHTML = shuffled.map(tip => `
    <div class="bg-gray-50 dark:bg-[#102a2a] rounded-xl p-3 text-sm font-semibold text-[#5e8d8d] leading-relaxed">${tip}</div>`).join('');
}

function renderBoostPlans() {
    const plans = [
        { weeks: 1, price: 999, label: '1 Week' },
        { weeks: 2, price: 1799, label: '2 Weeks', popular: true },
        { weeks: 4, price: 2999, label: '1 Month' },
    ];
    document.getElementById('boostPlans').innerHTML = plans.map((p, i) => `
    <div class="boost-plan relative border-2 rounded-xl p-3 text-center cursor-pointer transition-all ${selectedBoostPlan === i ? 'border-primary dark:border-accent-gold bg-primary/5 dark:bg-accent-gold/5' : 'border-[#e0e8e8] dark:border-[#2a4a4a] hover:border-primary/40'}" onclick="selectBoostPlan(${i})">
        ${p.popular ? '<div class="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent-gold text-primary text-[9px] font-black px-2 py-0.5 rounded-full">POPULAR</div>' : ''}
        <p class="text-[10px] font-bold text-[#5e8d8d] mt-1">${p.label}</p>
        <p class="text-lg font-black mt-1">₹${p.price.toLocaleString()}</p>
    </div>`).join('');
}

function selectBoostPlan(i) {
    selectedBoostPlan = i;
    renderBoostPlans();
}

// ===================== MODALS & ACTIONS =====================
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

async function openChat(inquiryId) {
    const inq = inquiries.find(i => i.id === inquiryId);
    if (!inq) return;
    chatContext = inq;
    document.getElementById('chatAvatar').textContent = inq.initials;
    document.getElementById('chatName').textContent = inq.name;
    document.getElementById('chatPkg').textContent = inq.pkg;

    try {
        const msgs = await apiFetch(`/api/chat/${inquiryId}`);
        chatHistory[inquiryId] = msgs.map(m => ({
            role: m.sender_role,
            text: m.text,
            time: m.time
        }));
    } catch (err) {
        console.error("Failed to load chat history:", err);
        chatHistory[inquiryId] = [
            { role: 'client', text: `Hi! I'm interested in your ${inq.pkg} for ${inq.date} in ${inq.location}. Could you share your package details?`, time: '10:30 AM' }
        ];
    }
    renderChatMessages(inquiryId);
    openModal('chatModal');
}

function renderChatMessages(id) {
    const el = document.getElementById('chatMessages');
    el.innerHTML = (chatHistory[id] || []).map(m => `
    <div class="flex ${m.role === 'vendor' ? 'justify-end' : 'justify-start'}">
        <div class="max-w-[80%] ${m.role === 'vendor' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-[#102a2a] text-[#101818] dark:text-white'} rounded-2xl ${m.role === 'vendor' ? 'rounded-tr-sm' : 'rounded-tl-sm'} px-4 py-2.5">
            <p class="text-sm font-semibold">${m.text}</p>
            <p class="text-[10px] opacity-60 mt-1 text-right">${m.time}</p>
        </div>
    </div>`).join('');
    el.scrollTop = el.scrollHeight;
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text || !chatContext) return;
    const id = chatContext.id;
    
    try {
        const newMsg = await apiFetch(`/api/chat/${id}`, {
            method: 'POST',
            body: JSON.stringify({ text })
        });
        
        if (!chatHistory[id]) chatHistory[id] = [];
        chatHistory[id].push({
            role: 'vendor',
            text: newMsg.text,
            time: newMsg.time
        });
        
        input.value = '';
        renderChatMessages(id);
    } catch (err) {
        showToast('Failed to send message: ' + err.message);
    }

    // Update status if New Request
    const inq = inquiries.find(i => i.id === id);
    if (inq && inq.status === 'New Request') {
        try {
            await apiFetch(`/api/vendors/portal/inquiries/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'In Discussion' })
            });
            inq.status = 'In Discussion';
            renderDashboardInquiries();
            renderInquiries();
        } catch (err) {
            console.error('Failed to update inquiry status:', err);
        }
    }
}

// Changed openQuote to openRemoveModal
function openRemoveModal(inquiryId) {
    chatContext = inquiries.find(i => i.id === inquiryId);
    document.getElementById('removeApologyMsg').value = '';
    openModal('removeModal');
}

// New function to process the removal of an inquiry
async function confirmRemoveInquiry() {
    const msg = document.getElementById('removeApologyMsg').value.trim();
    if (!msg) {
        showToast('Please write a short apology note first.');
        return;
    }
    if (chatContext) {
        try {
            await apiFetch(`/api/vendors/portal/inquiries/${chatContext.id}`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'Declined' })
            });
            
            const index = inquiries.findIndex(i => i.id === chatContext.id);
            if (index !== -1) {
                inquiries[index].status = 'Declined';
            }
            
            renderDashboardInquiries();
            renderInquiries();
            showToast('Inquiry removed & apology sent! ✉️');
        } catch (err) {
            showToast('Failed to decline inquiry: ' + err.message);
        }
    }
    closeModal('removeModal');
}

async function confirmBooking(inquiryId) {
    try {
        const inq = await apiFetch(`/api/vendors/portal/inquiries/${inquiryId}`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'Booked' })
        });
        
        const index = inquiries.findIndex(i => i.id === inquiryId);
        if (index !== -1) {
            inquiries[index].status = 'Booked';
        }
        
        // Refresh bookings list
        const bookingsData = await apiFetch('/api/vendors/portal/bookings');
        bookings.length = 0;
        bookings.push(...bookingsData.map(b => ({
            id: b.id,
            initials: b.customer_name ? b.customer_name.split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'C',
            name: b.customer_name || 'Customer',
            pkg: b.package_name,
            date: b.date,
            location: b.location || 'Mumbai',
            amount: `₹${b.amount.toLocaleString('en-IN')}`,
            paid: `₹${b.paid_amount.toLocaleString('en-IN')}`,
            due: `₹${(b.amount - b.paid_amount).toLocaleString('en-IN')}`,
            status: b.status
        })));
        
        renderDashboardInquiries();
        renderInquiries();
        renderBookings();
        showToast(`Marked as Booked! 🎉`);
    } catch (err) {
        showToast('Failed to confirm booking: ' + err.message);
    }
}

function openBookingDetail(inquiryId) {
    const inq = inquiries.find(i => i.id === inquiryId);
    if (!inq) return;
    chatContext = inq;
    document.getElementById('bookingModalContent').innerHTML = `
    <div class="flex items-center gap-3 mb-4">
        <div class="size-14 rounded-xl avatar-placeholder text-lg flex items-center justify-center">${inq.initials}</div>
        <div><p class="font-bold text-xl">${inq.name}</p><p class="text-[#5e8d8d] text-sm">${inq.pkg}</p></div>
    </div>
    ${[['Date', inq.date], ['Location', inq.location], ['Budget', inq.budget], ['Status', inq.status]].map(([k, v]) => `
    <div class="flex items-center justify-between py-2 border-b border-[#e0e8e8] dark:border-[#2a4a4a]">
        <span class="text-sm text-[#5e8d8d] font-semibold">${k}</span>
        <span class="font-bold text-sm">${v}</span>
    </div>`).join('')}`;
    openModal('bookingModal');
}

function viewBookingDetail(bookingId) {
    const b = bookings.find(bk => bk.id === bookingId);
    if (!b) return;
    chatContext = { id: bookingId, initials: b.initials, name: b.name, pkg: b.pkg };
    document.getElementById('bookingModalContent').innerHTML = `
    <div class="flex items-center gap-3 mb-4">
        <div class="size-14 rounded-xl avatar-placeholder text-lg flex items-center justify-center">${b.initials}</div>
        <div><p class="font-bold text-xl">${b.name}</p><p class="text-[#5e8d8d] text-sm">${b.pkg}</p></div>
    </div>
    ${[['Date', b.date], ['Location', b.location], ['Total Amount', b.amount], ['Amount Paid', b.paid], ['Balance Due', b.due], ['Status', b.status]].map(([k, v]) => `
    <div class="flex items-center justify-between py-2 border-b border-[#e0e8e8] dark:border-[#2a4a4a]">
        <span class="text-sm text-[#5e8d8d] font-semibold">${k}</span>
        <span class="font-bold text-sm">${v}</span>
    </div>`).join('')}`;
    openModal('bookingModal');
}

function openChatFromBooking() {
    closeModal('bookingModal');
    if (chatContext) openChat(chatContext.id);
}
function openChatForBooking(id) {
    const b = bookings.find(bk => bk.id === id);
    if (b) {
        chatContext = { id: id + 100, initials: b.initials, name: b.name, pkg: b.pkg };
        document.getElementById('chatAvatar').textContent = b.initials;
        document.getElementById('chatName').textContent = b.name;
        document.getElementById('chatPkg').textContent = b.pkg;
        chatHistory[chatContext.id] = [
            { role: 'client', text: `Hi, looking forward to the event on ${b.date}!`, time: '9:00 AM' }
        ];
        renderChatMessages(chatContext.id);
        openModal('chatModal');
    }
}

function openSettingsModal() {
    document.getElementById('profileMenu').classList.add('hidden');
    openModal('settingsModal');
}
function openBoostModal() { renderBoostPlans(); openModal('boostModal'); }

async function activateBoost() {
    try {
        await apiFetch('/api/vendors/portal/boost', {
            method: 'POST',
            body: JSON.stringify({ plan_index: selectedBoostPlan })
        });
        
        closeModal('boostModal');
        showToast('Boost activated! Your listing is now featured 🚀');
        
        await loadTransactionsAndEarnings();
    } catch (err) {
        showToast('Boost failed: ' + err.message);
    }
}

function openReviewModal(idx) { openModal('reviewModal'); }

// ===================== CAPTION GENERATOR =====================
document.addEventListener('click', async function (e) {
    if (e.target.id === 'genCaptionBtn' || e.target.closest('#genCaptionBtn')) {
        const tone = document.getElementById('captionTone').value;
        const promptText = document.getElementById('captionInput').value.trim();
        const result = document.getElementById('captionResult');
        const captionTextEl = document.getElementById('captionText');
        const genBtn = document.getElementById('genCaptionBtn');
        
        if (!promptText) {
            showToast('Please enter a brief image/video description!');
            return;
        }
        
        const originalHtml = genBtn.innerHTML;
        genBtn.disabled = true;
        genBtn.innerHTML = '<span class="animate-spin text-sm">&#9203;</span> Generating...';
        
        try {
            const res = await apiFetch('/api/ai/generate-caption', {
                method: 'POST',
                body: JSON.stringify({ prompt: promptText, tone: tone })
            });
            
            captionTextEl.textContent = res.caption;
            result.classList.remove('hidden');
            showToast('Caption generated! ✨');
        } catch (err) {
            showToast('Error: ' + err.message);
        } finally {
            genBtn.disabled = false;
            genBtn.innerHTML = originalHtml;
        }
    }
    if (e.target.id === 'refreshTipsBtn' || e.target.closest('#refreshTipsBtn')) {
        renderAITips();
        showToast('Tips refreshed!');
    }
});

function copyCaptionText() {
    const text = document.getElementById('captionText').textContent;
    navigator.clipboard.writeText(text).then(() => showToast('Caption copied!')).catch(() => showToast('Caption copied!'));
}

// ===================== TOAST =====================
function showToast(msg) {
    clearTimeout(toastTimer);
    const toast = document.getElementById('toast');
    document.getElementById('toastMsg').textContent = msg;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===================== THEME =====================
const themeToggleBtn = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
themeToggleBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    document.documentElement.classList.toggle('light');
    themeIcon.textContent = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode';
});

// ===================== SIDEBAR =====================
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const closeSidebarBtn = document.getElementById('closeSidebarBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function toggleSidebar() {
    const isClosed = sidebar.classList.contains('-translate-x-full');
    if (isClosed) {
        sidebar.classList.remove('-translate-x-full');
        sidebarOverlay.classList.remove('hidden');
        setTimeout(() => sidebarOverlay.classList.remove('opacity-0'), 10);
    } else {
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('opacity-0');
        setTimeout(() => sidebarOverlay.classList.add('hidden'), 300);
    }
}
mobileMenuBtn.addEventListener('click', toggleSidebar);
closeSidebarBtn.addEventListener('click', toggleSidebar);
sidebarOverlay.addEventListener('click', toggleSidebar);

// ===================== DROPDOWNS =====================
const profileBtn = document.getElementById('profileBtn');
const profileMenu = document.getElementById('profileMenu');
const notifBtn = document.getElementById('notifBtn');
const notifMenu = document.getElementById('notifMenu');

profileBtn.addEventListener('click', e => { e.stopPropagation(); profileMenu.classList.toggle('hidden'); notifMenu.classList.add('hidden'); });
notifBtn.addEventListener('click', e => { e.stopPropagation(); notifMenu.classList.toggle('hidden'); profileMenu.classList.add('hidden'); });
document.addEventListener('click', () => { profileMenu.classList.add('hidden'); notifMenu.classList.add('hidden'); });
profileMenu.addEventListener('click', e => e.stopPropagation());
notifMenu.addEventListener('click', e => e.stopPropagation());

document.getElementById('markAllRead').addEventListener('click', () => {
    notifications.forEach(n => n.read = true);
    renderNotifications();
    showToast('All notifications marked as read');
});

// ===================== STATUS TOGGLE =====================
document.getElementById('statusToggle').addEventListener('click', () => {
    isAccepting = !isAccepting;
    const toggle = document.getElementById('statusToggle');
    const dot = document.getElementById('statusDot');
    const text = document.getElementById('statusText');
    if (isAccepting) {
        toggle.className = 'hidden sm:flex items-center gap-2 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800 cursor-pointer select-none transition-all hover:opacity-80 shadow-sm';
        dot.className = 'size-2 rounded-full bg-green-500 animate-pulse';
        text.textContent = 'Accepting Leads';
        text.className = 'text-[10px] font-bold text-green-700 dark:text-green-400 uppercase tracking-widest';
    } else {
        toggle.className = 'hidden sm:flex items-center gap-2 bg-gray-100 dark:bg-[#2a4a4a] px-3 py-1.5 rounded-full border border-gray-300 dark:border-gray-600 cursor-pointer select-none transition-all hover:opacity-80 shadow-sm';
        dot.className = 'size-2 rounded-full bg-gray-500';
        text.textContent = 'Paused';
        text.className = 'text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest';
    }
    showToast(isAccepting ? 'Now accepting leads!' : 'Lead intake paused');
});

// ===================== NAV LINKS =====================
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const page = this.dataset.page;
        if (page) navigateTo(page);
    });
});

// ===================== LOGOUT =====================
document.getElementById('logoutBtn').addEventListener('click', e => { e.preventDefault(); openModal('logoutModal'); });
document.getElementById('signOutBtn').addEventListener('click', e => { e.preventDefault(); document.getElementById('profileMenu').classList.add('hidden'); openModal('logoutModal'); });

// ===================== CALENDAR =====================
document.getElementById('prevMonth').addEventListener('click', () => { calDate.setMonth(calDate.getMonth() - 1); renderCalendar(); });
document.getElementById('nextMonth').addEventListener('click', () => { calDate.setMonth(calDate.getMonth() + 1); renderCalendar(); });

// ===================== INQUIRY FILTER =====================
document.getElementById('inquiryFilter').addEventListener('change', renderInquiries);

// ===================== PROFILE SAVE =====================
async function syncVendorData() {
    const newName = document.getElementById('profileBusinessName').value;
    const newCategory = document.getElementById('profileCategory').value;
    const newCity = document.getElementById('profileCity').value;
    const newServices = document.getElementById('profileDescription').value;

    try {
        const profile = await apiFetch('/api/vendors/portal/profile', {
            method: 'PUT',
            body: JSON.stringify({
                name: newName,
                business_name: newName,
                category: newCategory,
                city: newCity,
                services_offered: newServices
            })
        });
        
        const loggedInVendorStr = sessionStorage.getItem('eazeevent_logged_in_vendor');
        if (loggedInVendorStr) {
            const vendor = JSON.parse(loggedInVendorStr);
            vendor.name = profile.business_name;
            vendor.category = profile.category;
            vendor.city = profile.city;
            sessionStorage.setItem('eazeevent_logged_in_vendor', JSON.stringify(vendor));
        }
        
        showToast('Profile saved successfully! ✅');
    } catch (err) {
        showToast('Failed to save profile: ' + err.message);
    }
}

document.getElementById('saveProfileBtn').addEventListener('click', () => {
    const newName = document.getElementById('profileBusinessName').value;
    const newCategory = document.getElementById('profileCategory').value;
    const newCity = document.getElementById('profileCity').value.split(',')[0];
    const newInitials = newName.trim().split(/\s+/).map(word => word[0]).join('').substring(0, 2).toUpperCase();

    document.getElementById('headerProfileName').textContent = newName;
    document.getElementById('headerProfileCategory').textContent = newCategory;
    document.getElementById('headerAvatar').textContent = newInitials;

    const firstName = newName.split(' ')[0];
    document.getElementById('dashWelcomeText').textContent = `Welcome back, ${firstName}! 👋`;

    document.getElementById('summaryProfileName').textContent = newName;
    document.getElementById('summaryProfileDetails').textContent = `${newCategory} · ${newCity}`;
    document.getElementById('summaryAvatar').textContent = newInitials;

    syncVendorData();
});

// ===================== INIT =====================
document.addEventListener('DOMContentLoaded', async () => {
    const token = sessionStorage.getItem('eazeevent_token');
    if (!token) {
        window.location.href = "index.html";
        return;
    }
    
    try {
        // Fetch Portal Profile
        const profile = await apiFetch('/api/vendors/portal/profile');
        
        document.getElementById('profileBusinessName').value = profile.business_name;
        document.getElementById('profileCategory').value = profile.category;
        document.getElementById('profilePrice').value = profile.bookings_count;
        document.getElementById('profileCity').value = profile.city;
        document.getElementById('profileEmail').value = profile.email;
        document.getElementById('profileDescription').value = profile.services_offered || '';
        if (profile.phone) document.getElementById('profilePhone').value = profile.phone;

        const newInitials = profile.business_name.trim().split(/\s+/).map(word => word[0]).join('').substring(0, 2).toUpperCase();
        document.getElementById('headerProfileName').textContent = profile.business_name;
        document.getElementById('headerProfileCategory').textContent = profile.category;
        document.getElementById('headerAvatar').textContent = newInitials;

        const firstName = profile.business_name.split(' ')[0];
        document.getElementById('dashWelcomeText').textContent = `Welcome back, ${firstName}! 👋`;

        document.getElementById('summaryProfileName').textContent = profile.business_name;
        document.getElementById('summaryProfileDetails').textContent = `${profile.category} · ${profile.city.split(',')[0]}`;
        document.getElementById('summaryAvatar').textContent = newInitials;
        
        // Fetch Bookings
        const bookingsData = await apiFetch('/api/vendors/portal/bookings');
        bookings.length = 0;
        bookings.push(...bookingsData.map(b => ({
            id: b.id,
            initials: b.customer_name ? b.customer_name.split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'C',
            name: b.customer_name || 'Customer',
            pkg: b.package_name,
            date: b.date,
            location: b.location || 'Mumbai',
            amount: `₹${b.amount.toLocaleString('en-IN')}`,
            paid: `₹${b.paid_amount.toLocaleString('en-IN')}`,
            due: `₹${(b.amount - b.paid_amount).toLocaleString('en-IN')}`,
            status: b.status
        })));
        
        // Fetch Inquiries
        const inquiriesData = await apiFetch('/api/vendors/portal/inquiries');
        inquiries.length = 0;
        inquiries.push(...inquiriesData.map(i => ({
            id: i.id,
            initials: i.customer_name ? i.customer_name.split(/\s+/).map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'C',
            name: i.customer_name || 'Customer',
            pkg: i.pkg,
            date: i.date,
            location: i.location,
            status: i.status,
            budget: `₹${i.budget.toLocaleString('en-IN')}`
        })));
        
        // Fetch Reviews
        const reviewsData = await apiFetch(`/api/vendors/${profile.id}/reviews`);
        reviews.length = 0;
        reviews.push(...reviewsData.map(r => ({
            id: r.id,
            name: r.reviewer_name,
            stars: r.rating,
            date: r.date,
            text: r.text,
            replied: r.replied,
            reply: r.reply_text
        })));
        
        // Fetch Earnings & Transactions
        await loadTransactionsAndEarnings();
        
        // Fetch Blocked Dates
        await loadBlockedDates();
        
    } catch(e) {
        console.error('Error loading vendor profile:', e);
    }
    
    renderDashboardInquiries();
    renderInquiries();
    renderBookings();
    renderCalendar();
    renderNotifications();
    renderReviews();
    setTimeout(renderEarningsChart, 50);
    renderAITips();
    renderBoostPlans();
});

async function loadTransactionsAndEarnings() {
    try {
        const earnings = await apiFetch('/api/vendors/portal/earnings');
        const currency = earnings.currency_symbol || "₹";
        
        const earnText = document.getElementById('dashEarningsText');
        if (earnText) earnText.textContent = `${currency}${earnings.total_earnings.toLocaleString('en-IN')}`;
        
        const mText = document.getElementById('earnMonthText');
        if (mText) mText.textContent = `${currency}${earnings.total_earnings.toLocaleString('en-IN')}`;
        
        const pText = document.getElementById('earnPendingText');
        if (pText) pText.textContent = `${currency}${earnings.escrow_balance.toLocaleString('en-IN')}`;
        
        // Fetch Transactions list
        const list = await apiFetch('/api/vendors/portal/transactions');
        transactions = list.map(t => ({
            name: t.client_name,
            pkg: t.type === 'deposit' ? 'Escrow Deposit Received' : 'Funds Payout',
            date: t.date,
            amount: `${t.type === 'deposit' ? '+' : '-'}${currency}${t.amount.toLocaleString('en-IN')}`,
            type: t.type === 'deposit' ? 'credit' : 'debit'
        }));
        renderTransactions();
    } catch (err) {
        console.error("Failed to load transactions/earnings:", err);
    }
}

async function uploadPortfolioMedia(input) {
    if (!input.files.length) return;
    
    try {
        const fd = new FormData();
        fd.append('file', input.files[0]);
        
        const upRes = await fetch(`${API_BASE_URL}/api/vendors/upload`, {
            method: 'POST',
            body: fd
        });
        
        if (!upRes.ok) throw new Error("Upload failed.");
        const upData = await upRes.json();
        
        showToast('Portfolio media uploaded successfully! 📸');
        
        const grid = input.parentNode.parentNode;
        const newMediaDiv = document.createElement('div');
        newMediaDiv.className = "aspect-square rounded-xl flex items-center justify-center relative group overflow-hidden bg-cover bg-center";
        newMediaDiv.style.backgroundImage = `url('${upData.file_url}')`;
        newMediaDiv.innerHTML = `
            <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button class="p-1.5 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition" onclick="this.parentNode.parentNode.remove(); showToast('Photo removed')">
                    <span class="material-symbols-outlined text-white text-sm">delete</span>
                </button>
            </div>
        `;
        grid.insertBefore(newMediaDiv, input.parentNode);
        
    } catch (err) {
        showToast("Upload failed: " + err.message);
    }
}

async function loadBlockedDates() {
    try {
        const list = await apiFetch('/api/vendors/portal/calendar/blocked');
        blockedDates = list.map(b => b.date);
    } catch(err) {
        console.error("Failed to load blocked dates:", err);
    }
}

async function promptToggleBlock(dateStr) {
    const isBlocked = blockedDates.includes(dateStr);
    const action = isBlocked ? "unblock" : "block";
    const confirmToggle = confirm(`Do you want to ${action} date ${dateStr} for new leads?`);
    if (!confirmToggle) return;
    
    try {
        const res = await apiFetch('/api/vendors/portal/calendar/toggle-block', {
            method: 'POST',
            body: JSON.stringify({ date: dateStr })
        });
        
        showToast(res.message);
        
        if (res.status === 'blocked') {
            blockedDates.push(dateStr);
        } else {
            blockedDates = blockedDates.filter(d => d !== dateStr);
        }
        renderCalendar();
    } catch (err) {
        showToast("Error updating calendar: " + err.message);
    }
}