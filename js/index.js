
// Seed Settings if missing
if (!localStorage.getItem('eazeevent_admin_settings')) {
    const defaultSettings = {
        platformName: "Eazeevent",
        supportEmail: "support@eazeevent.com",
        commissionRate: 5,
        currency: "₹",
        maintenanceMode: false
    };
    localStorage.setItem('eazeevent_admin_settings', JSON.stringify(defaultSettings));
}

// Seed Customers if missing
if (!localStorage.getItem('eazeevent_customers')) {
    const defaultCustomers = [
        {
            email: "rohan@gmail.com",
            password: "Eazeevent@123",
            name: "Rohan & Shruti",
            phone: "+91 9876543210",
            weddingDate: "2026-11-12",
            estimatedBudget: 8500000,
            actualBudget: 9200000,
            vendorsCount: 4,
            totalVendors: 12,
            status: "AT RISK",
            riskDescription: "Urgent: Venue unbooked",
            lastActive: "2h ago",
            proofId: "Aadhaar_RohanShruti.pdf"
        },
        {
            email: "arjun@gmail.com",
            password: "Eazeevent@123",
            name: "Arjun & Kiara",
            phone: "+91 9123456789",
            weddingDate: "2026-12-05",
            estimatedBudget: 12000000,
            actualBudget: 10000000,
            vendorsCount: 9,
            totalVendors: 15,
            status: "ON TRACK",
            riskDescription: "",
            lastActive: "1d ago",
            proofId: "Passport_ArjunKiara.pdf"
        },
        {
            email: "vikram@gmail.com",
            password: "Eazeevent@123",
            name: "Vikram & Neha",
            phone: "+91 9345678901",
            weddingDate: "2027-01-22",
            estimatedBudget: 5000000,
            actualBudget: 3500000,
            vendorsCount: 3,
            totalVendors: 10,
            status: "AT RISK",
            riskDescription: "Pending: Catering Contract",
            lastActive: "5h ago",
            proofId: "PAN_VikramNeha.jpg"
        },
        {
            email: "mayank@gmail.com",
            password: "Eazeevent@123",
            name: "Mayank & Priya",
            phone: "+91 9456789012",
            weddingDate: "2027-02-14",
            estimatedBudget: 25000000,
            actualBudget: 4000000,
            vendorsCount: 2,
            totalVendors: 20,
            status: "ON TRACK",
            riskDescription: "",
            lastActive: "Just now",
            proofId: "Aadhaar_MayankPriya.pdf"
        }
    ];
    localStorage.setItem('eazeevent_customers', JSON.stringify(defaultCustomers));
}

// Seed Vendors if missing
if (!localStorage.getItem('eazeevent_vendors')) {
    const defaultVendors = [
        {
            id: "VND-4829",
            name: "Elegance Mandap",
            email: "elegance@mandap.com",
            password: "Eazeevent@123",
            category: "Decoration",
            city: "Udaipur",
            bookings: 142,
            rating: 4.9,
            status: "Verified",
            startingPrice: 80000,
            experience: 8,
            registrationNumber: "08AAAAA1111A1Z1",
            website: "https://elegancemandaps.com",
            description: "Luxury mandap and floral set decorators specializing in royal destination weddings in Rajasthan.",
            licenseDoc: "GSTIN_Elegance.pdf",
            ownerIdDoc: "Aadhaar_Owner_Elegance.jpg"
        },
        {
            id: "VND-8831",
            name: "Symphony Musicians",
            email: "symphony@musicians.com",
            password: "Eazeevent@123",
            category: "Videography",
            city: "Mumbai",
            bookings: 89,
            rating: 4.7,
            status: "Verified",
            startingPrice: 60000,
            experience: 5,
            registrationNumber: "27BBBBB2222B2Z2",
            website: "https://symphonymusic.in",
            description: "Professional musical troupe performing classical, fusion, and popular Bollywood live music for grand receptions.",
            licenseDoc: "GSTIN_Symphony.pdf",
            ownerIdDoc: "Passport_Owner_Symphony.jpg"
        },
        {
            id: "VND-9012",
            name: "The Grand Horizon",
            email: "grand@horizon.com",
            password: "Eazeevent@123",
            category: "Venues",
            city: "Goa",
            bookings: 0,
            rating: 0.0,
            status: "Pending",
            startingPrice: 180000,
            experience: 2,
            registrationNumber: "30CCCCC3333C3Z3",
            website: "https://grandhorizonresort.com",
            description: "Stunning beachside lawn and banquet property in South Goa, perfect for luxury sunsets and intimate gatherings.",
            licenseDoc: "GSTIN_GrandHorizon.pdf",
            ownerIdDoc: "DL_Owner_GrandHorizon.jpg"
        },
        {
            id: "VND-2210",
            name: "Zest Culinary",
            email: "zest@culinary.com",
            password: "Eazeevent@123",
            category: "Catering",
            city: "Delhi",
            bookings: 310,
            rating: 4.8,
            status: "Verified",
            startingPrice: 1500,
            experience: 12,
            registrationNumber: "07DDDDD4444D4Z4",
            website: "https://zestculinary.in",
            description: "Elite gourmet catering offering authentic multi-cuisine dining options with live kitchen setups and artisanal desserts.",
            licenseDoc: "GSTIN_Zest.pdf",
            ownerIdDoc: "Aadhaar_Owner_Zest.jpg"
        },
        {
            id: "VND-1021",
            name: "Luminous Decorators",
            email: "luminous@decor.com",
            password: "Eazeevent@123",
            category: "Decoration",
            city: "Mumbai",
            bookings: 0,
            rating: 0.0,
            status: "In-Review",
            startingPrice: 75000,
            experience: 3,
            registrationNumber: "27EEEEE5555E5Z5",
            website: "https://luminousdecors.com",
            description: "Dynamic event design boutique specializing in glasshouse styling, fairy light canopies, and modern pastel themes.",
            licenseDoc: "GSTIN_Luminous.pdf",
            ownerIdDoc: "Passport_Owner_Luminous.jpg"
        },
        {
            id: "VND-5052",
            name: "Capture Studio",
            email: "capture@studio.com",
            password: "Eazeevent@123",
            category: "Photography",
            city: "Jaipur",
            bookings: 0,
            rating: 0.0,
            status: "Flagged",
            startingPrice: 95000,
            experience: 4,
            registrationNumber: "08FFFFF6666F6Z6",
            website: "https://capturestudios.com",
            description: "Destination wedding filmmakers capturing visual storytelling and high-definition aerial drone cinematography.",
            licenseDoc: "GSTIN_Capture.pdf",
            ownerIdDoc: "PAN_Owner_Capture.jpg"
        }
    ];
    localStorage.setItem('eazeevent_vendors', JSON.stringify(defaultVendors));
}

// --- Authentication State Management ---
const getUsers = (type) => JSON.parse(localStorage.getItem(`eazeevent_${type}`)) || [];
const saveUser = (type, user) => {
    const users = getUsers(type);
    users.push(user);
    localStorage.setItem(`eazeevent_${type}`, JSON.stringify(users));
};

// --- Global State ---
let totalBudget = 0;
let expenses = [];
let timelineEvents = { "Day 1": [], "Day 2": [], "Day 3": [] };

// --- Modal Controls ---
function openTool(toolName) {
    if (toolName === 'Budget Tracker') {
        document.getElementById('budgetModal')?.classList.remove('hidden');
    } else if (toolName === 'Timeline') {
        document.getElementById('timelineModal')?.classList.remove('hidden');
    }
}

function closeBudgetModal() { document.getElementById('budgetModal')?.classList.add('hidden'); }
function closeTimelineModal() { document.getElementById('timelineModal')?.classList.add('hidden'); }

// --- Legal & Info Modal Controls ---
function openBookingPolicyModal() { document.getElementById('bookingPolicyModal')?.classList.remove('hidden'); }
function closeBookingPolicyModal() { document.getElementById('bookingPolicyModal')?.classList.add('hidden'); }
function openTermsModal() { document.getElementById('termsModal')?.classList.remove('hidden'); }
function closeTermsModal() { document.getElementById('termsModal')?.classList.add('hidden'); }
function openPrivacyModal() { document.getElementById('privacyModal')?.classList.remove('hidden'); }
function closePrivacyModal() { document.getElementById('privacyModal')?.classList.add('hidden'); }
function openAboutUsModal() { document.getElementById('aboutUsModal')?.classList.remove('hidden'); }
function closeAboutUsModal() { document.getElementById('aboutUsModal')?.classList.add('hidden'); }

// --- Country Selection Logic ---
function changeCountry() {
    const select = document.getElementById('countrySelector');
    if (!select) return;
    const country = select.options[select.selectedIndex].text;
    alert(`🌍 Region updated to: ${country}\n\n(The platform will now show vendors and pricing for this region)`);
}

// --- Budget Logic ---
function setBudget() {
    totalBudget = parseFloat(document.getElementById('budgetValue')?.value) || 0;
    updateBudgetUI();
}

function addExpense() {
    const nameInput = document.getElementById('expName');
    const amountInput = document.getElementById('expAmount');
    if(!nameInput || !amountInput) return;
    
    const name = nameInput.value;
    const amount = parseFloat(amountInput.value);

    if (name && amount) {
        expenses.push({ name, amount });
        nameInput.value = '';
        amountInput.value = '';
        updateBudgetUI();
    }
}

function updateBudgetUI() {
    const spent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const tbd = document.getElementById('totalBudgetDisplay');
    const tsd = document.getElementById('totalSpentDisplay');
    const rbd = document.getElementById('remainingBudgetDisplay');
    const list = document.getElementById('expenseList');

    if(tbd) tbd.textContent = totalBudget.toLocaleString();
    if(tsd) tsd.textContent = spent.toLocaleString();
    if(rbd) rbd.textContent = (totalBudget - spent).toLocaleString();

    if(list) {
        list.innerHTML = expenses.map(exp => `
            <tr class="border-b border-gray-100 dark:border-white/5">
                <td class="py-2">${exp.name}</td>
                <td class="py-2 font-bold">₹${exp.amount.toLocaleString()}</td>
            </tr>
        `).join('');
    }
}

// --- Timeline Logic ---
function addTimelineEvent() {
    const dayInput = document.getElementById('eventDay');
    const timeInput = document.getElementById('eventTime');
    const descInput = document.getElementById('eventDesc');
    if(!dayInput || !timeInput || !descInput) return;

    const day = dayInput.value;
    const time = timeInput.value;
    const desc = descInput.value;

    if (time && desc) {
        timelineEvents[day].push({ time, desc });
        timelineEvents[day].sort((a, b) => a.time.localeCompare(b.time));
        updateTimelineUI();
    }
}

function updateTimelineUI() {
    const container = document.getElementById('timelineContainer');
    if(!container) return;
    
    container.innerHTML = Object.keys(timelineEvents).map(day => {
        if (timelineEvents[day].length === 0) return '';
        return `
            <div>
                <h4 class="font-bold text-accent-gold mb-2">${day}</h4>
                <div class="border-l-2 border-primary/20 ml-2 space-y-4">
                    ${timelineEvents[day].map(ev => `
                        <div class="relative pl-6">
                            <div class="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5"></div>
                            <span class="text-xs font-bold text-primary dark:text-white/60">${ev.time}</span>
                            <p class="text-sm">${ev.desc}</p>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// ============ MODAL MANAGEMENT ============
function openLoginModal() { document.getElementById('loginModal')?.classList.remove('hidden'); }
function closeLoginModal() { document.getElementById('loginModal')?.classList.add('hidden'); }
function openCustomerSignupModal() { document.getElementById('customerSignupModal')?.classList.remove('hidden'); }
function closeCustomerSignupModal() { document.getElementById('customerSignupModal')?.classList.add('hidden'); }
function openVendorLoginModal() { document.getElementById('vendorLoginModal')?.classList.remove('hidden'); }
function closeVendorLoginModal() { document.getElementById('vendorLoginModal')?.classList.add('hidden'); }
function openVendorSignupModal() { document.getElementById('vendorSignupModal')?.classList.remove('hidden'); }
function closeVendorSignupModal() { document.getElementById('vendorSignupModal')?.classList.add('hidden'); }

// ============ MODAL SWITCHING ============
function switchToCustomerSignup() { closeLoginModal(); openCustomerSignupModal(); }
function switchToLogin() { closeCustomerSignupModal(); openLoginModal(); }
function switchToVendorSignup() { closeVendorLoginModal(); openVendorSignupModal(); }
function switchToVendorLogin() { closeVendorSignupModal(); openVendorLoginModal(); }

// ============ FILE UPLOAD HANDLERS ============
function updateFileName(input) {
    if (input.files && input.files[0]) {
        const fileName = input.files[0].name;
        const fileSize = (input.files[0].size / 1024).toFixed(2);

        if (fileSize > 10240) {
            alert('❌ File size exceeds 10MB limit!');
            input.value = '';
            document.getElementById('fileName')?.classList.add('hidden');
            return;
        }

        const fnText = document.getElementById('fileNameText');
        if(fnText) fnText.textContent = `${fileName} (${fileSize}KB)`;
        document.getElementById('fileName')?.classList.remove('hidden');
    }
}

function updateVendorFileName(input, type) {
    if (input.files && input.files[0]) {
        const fileName = input.files[0].name;
        const fileSize = (input.files[0].size / 1024).toFixed(2);

        if (fileSize > 10240) {
            alert('❌ File size exceeds 10MB limit!');
            input.value = '';
            return;
        }

        let displayId, textId;
        if (type === 'businessDoc') {
            displayId = 'businessDocFile'; textId = 'businessDocFileText';
        } else if (type === 'identityDoc') {
            displayId = 'identityDocFile'; textId = 'identityDocFileText';
        } else if (type === 'bankDoc') {
            displayId = 'bankDocFile'; textId = 'bankDocFileText';
        }

        const t = document.getElementById(textId);
        if(t) t.textContent = `${fileName} (${fileSize}KB)`;
        document.getElementById(displayId)?.classList.remove('hidden');
    }
}

// ============ FORM HANDLERS (Auth Logic - API Server Enabled) ============
const API_BASE_URL = "http://127.0.0.1:8000";

async function handleLogin(event) {
    event.preventDefault();
    const email = document.getElementById('customerLoginEmail')?.value;
    const password = document.getElementById('customerLoginPassword')?.value;
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Invalid credentials.");
        }
        
        const data = await res.json();
        alert(`✅ Login Successful!\n\nWelcome back, ${data.name}!`);
        
        // Store JWT token
        sessionStorage.setItem('eazeevent_token', data.access_token);
        
        if (data.role === 'admin') {
            sessionStorage.setItem('eazeevent_admin_logged_in', 'true');
            closeLoginModal();
            window.location.href = 'admin_overview.html';
        } else if (data.role === 'customer') {
            sessionStorage.setItem('eazeevent_logged_in_customer', JSON.stringify({ email: data.email, name: data.name }));
            closeLoginModal();
            window.location.href = 'dashboard.html';
        } else if (data.role === 'vendor') {
            sessionStorage.setItem('eazeevent_logged_in_vendor', JSON.stringify({ email: data.email, name: data.name }));
            closeLoginModal();
            window.location.href = 'vendor_dashboard.html';
        }
    } catch (err) {
        alert(err.message);
    }
}

async function handleCustomerSignup(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value;
    const pwd = form.password.value;
    const cpwd = form.confirmpassword.value;
    const fullname = form.fullname.value;
    const phone = form.countrycode.value + " " + form.phone.value;

    if (pwd !== cpwd) { alert('❌ Passwords do not match!'); return; }
    if (!form.proofid.files.length) { alert('❌ Please upload valid proof ID!'); return; }

    try {
        // Upload identity proof first
        const fd = new FormData();
        fd.append('file', form.proofid.files[0]);
        const upRes = await fetch(`${API_BASE_URL}/api/vendors/upload`, { method: 'POST', body: fd });
        if (!upRes.ok) throw new Error("Failed to upload identity proof document.");
        const upData = await upRes.json();
        const proofUrl = upData.file_url;
        
        const res = await fetch(`${API_BASE_URL}/api/auth/register/customer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: pwd,
                name: fullname,
                phone: phone,
                wedding_date: new Date(Date.now() + 150 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                estimated_budget: 5000000.0,
                proof_file: proofUrl
            })
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Registration failed.");
        }
        
        alert(`✅ Account Created Successfully!\n\nName: ${fullname}\nEmail: ${email}\n\nYou can now log in.`);
        form.reset();
        document.getElementById('fileName')?.classList.add('hidden');
        switchToLogin();
    } catch (err) {
        alert("❌ Error: " + err.message);
    }
}

async function handleVendorLogin(event) {
    event.preventDefault();
    const email = document.getElementById('vendorLoginEmail')?.value;
    const password = document.getElementById('vendorLoginPassword')?.value;

    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Invalid business credentials.");
        }
        
        const data = await res.json();
        alert(`✅ Vendor Login Successful!\n\nWelcome, ${data.name}!`);
        
        // Store JWT token
        sessionStorage.setItem('eazeevent_token', data.access_token);
        
        if (data.role === 'admin') {
            sessionStorage.setItem('eazeevent_admin_logged_in', 'true');
            closeVendorLoginModal();
            window.location.href = 'admin_overview.html';
        } else if (data.role === 'vendor') {
            sessionStorage.setItem('eazeevent_logged_in_vendor', JSON.stringify({ email: data.email, name: data.name }));
            closeVendorLoginModal();
            window.location.href = 'vendor_dashboard.html';
        } else {
            throw new Error("Invalid role.");
        }
    } catch (err) {
        alert(err.message);
    }
}

async function handleVendorSignup(event) {
    event.preventDefault();
    const form = event.target;
    const email = form.email.value;
    const pwd = form.password.value;
    const cpwd = form.confirmpassword.value;
    const fullname = form.fullname.value;
    const businessName = form.businessname.value;
    const category = form.category.value;
    const city = form.city.value;

    if (pwd !== cpwd) { alert('❌ Passwords do not match!'); return; }
    if (!/[a-z]/.test(pwd) || !/[A-Z]/.test(pwd) || !/[0-9]/.test(pwd) || !/[@#$%^&*]/.test(pwd)) {
        alert('❌ Password must contain lowercase, uppercase, numbers, and special characters!');
        return;
    }
    if (!form.businessdoc.files.length) { alert('❌ Please upload Business Certificate!'); return; }
    if (!form.identitydoc.files.length) { alert('❌ Please upload Proof of Identity!'); return; }
    if (form.description.value.length < 50) { alert('❌ Business description must be at least 50 characters!'); return; }

    try {
        // Upload certificate file
        const fd = new FormData();
        fd.append('file', form.businessdoc.files[0]);
        const upRes = await fetch(`${API_BASE_URL}/api/vendors/upload`, { method: 'POST', body: fd });
        if (!upRes.ok) throw new Error("Failed to upload business certificate document.");
        const upData = await upRes.json();
        const proofUrl = upData.file_url;
        
        const res = await fetch(`${API_BASE_URL}/api/auth/register/vendor`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: pwd,
                name: fullname,
                business_name: businessName,
                category: category,
                city: city,
                proof_file: proofUrl
            })
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Vendor registration failed.");
        }
        
        alert(`✅ Vendor Account Created Successfully!\n\nBusiness: ${businessName}\nCategory: ${category}\n\nVerification pending. You can log in once Admin approves.`);
        form.reset();
        document.getElementById('businessDocFile')?.classList.add('hidden');
        document.getElementById('identityDocFile')?.classList.add('hidden');
        document.getElementById('bankDocFile')?.classList.add('hidden');
        switchToVendorLogin();
    } catch (err) {
        alert("❌ Error: " + err.message);
    }
}


// ============ OTHER FUNCTIONS ============
function searchVendors() {
    const category = document.getElementById('vendorCategory')?.value.trim() || document.getElementById('searchInput')?.value.trim() || '';
    const city = document.getElementById('vendorCity')?.value.trim() || document.getElementById('locationInput')?.value.trim() || '';

    if (!category && !city) {
        alert('❌ Please fill in at least one field!');
        return;
    }
    window.location.href = `vendors.html?category=${encodeURIComponent(category)}&city=${encodeURIComponent(city)}`;
}

function viewVendor(vendorName) {
    alert(`👁️ Viewing: ${vendorName}\n\n(Detailed vendor profile page coming soon!)`);
}

function viewAllVendors() {
    alert('📋 Loading vendor directory...');
}

async function subscribeNewsletter() {
    const emailInput = document.getElementById('newsletterEmail');
    const messageEl = document.getElementById('newsletterMessage');
    const email = emailInput?.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
        if(messageEl){
            messageEl.textContent = '❌ Please enter a valid email address.';
            messageEl.className = 'text-xs mt-2 text-red-500 block';
        }
        return;
    }
    if(messageEl) {
        messageEl.textContent = '✅ Thank you! Check your inbox for deals.';
        messageEl.className = 'text-xs mt-2 text-green-600 dark:text-green-400 block';
    }
    if(emailInput) emailInput.value = '';
    setTimeout(() => { messageEl?.classList.add('hidden'); }, 4000);
}

function changeLanguage() { alert('🌐 Language selection coming soon!\n\nCurrently available: English (India)'); }
function changeCurrency() { alert('💱 Currency selection coming soon!\n\nCurrently available: INR (Indian Rupee)'); }
function checkDate(day, month, year) {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    alert(`📅 Checking vendor details for: ${day} ${monthNames[month]} ${year}...\n\n(This will open a filtered list of available vendors for this date)`);
}

// ============ VENDOR SEARCH SPECIFIC ============
const ALL_VENDORS = [
    { id: 1, title: "Lumiere Wedding Films", desc: "Andheri, Mumbai • Cinematic Specialist", price: 150000, rating: 4.9, featured: 1, verified: true, badge: "Fast Response", category: "Photography", specialty: "Cinematic", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800", location: "Andheri, Mumbai" },
    { id: 2, title: "Golden Moments Studios", desc: "Colaba, Mumbai • Traditional & Portrait", price: 85000, rating: 4.7, featured: 2, verified: true, badge: "", category: "Photography", specialty: "Traditional", image: "https://images.unsplash.com/photo-1542042161784-26ab9e041e89?auto=format&fit=crop&q=80&w=800", location: "Colaba, Mumbai" },
    { id: 3, title: "Grand Celebrations Planner", desc: "Juhu, Mumbai • Wedding & Corporate Planners", price: 210000, rating: 5.0, featured: 3, verified: true, badge: "Elite Vendor", category: "Event & Wedding Planner", specialty: "Corporate", image: "https://images.unsplash.com/photo-1505369680371-4876b6b7a694?auto=format&fit=crop&q=80&w=800", location: "Juhu, Mumbai" },
    { id: 4, title: "Frame by Frame", desc: "Bandra, Mumbai • Contemporary Style", price: 60000, rating: 4.6, featured: 4, verified: false, badge: "", category: "Photography", specialty: "Traditional", image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800", location: "Bandra, Mumbai" },
    { id: 5, title: "Eternal Frames", desc: "Worli, Mumbai • Fashion & Cinematic", price: 120000, rating: 4.8, featured: 5, verified: true, badge: "", category: "Photography", specialty: "Cinematic", image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800", location: "Worli, Mumbai" },
    { id: 6, title: "Kreative Kingdom", desc: "Mulund, Mumbai • Multi-Camera Coverage", price: 45000, rating: 4.4, featured: 6, verified: false, badge: "", category: "Photography", specialty: "Drone", image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=800", location: "Mulund, Mumbai" },
    { id: 7, title: "The Royal Heritage Palace", desc: "Udaipur, Rajasthan • Heritage Venue", price: 250000, rating: 4.9, featured: 7, verified: true, badge: "Top Venue", category: "Venues", specialty: "Heritage", image: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800", location: "Udaipur, Rajasthan" },
    { id: 8, title: "Emerald Bay Resort", desc: "Goa, India • Beachfront Venue", price: 180000, rating: 4.8, featured: 8, verified: true, badge: "", category: "Venues", specialty: "Beachfront", image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800", location: "Goa" },
    { id: 9, title: "Royal Feast Caterers", desc: "Mumbai • Authentic Indian & Mughlai", price: 1500, rating: 4.7, featured: 9, verified: true, badge: "", category: "Catering", specialty: "Indian", image: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&q=80&w=800", location: "Mumbai" },
    { id: 10, title: "Global Gourmet", desc: "Delhi • Continental & Pan-Asian", price: 2200, rating: 4.9, featured: 10, verified: true, badge: "Elite", category: "Catering", specialty: "Continental", image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&q=80&w=800", location: "New Delhi" },
    { id: 11, title: "Floral Dreams Decor", desc: "Mumbai • Floral Mandaps & Arrangements", price: 80000, rating: 4.8, featured: 11, verified: true, badge: "", category: "Decoration", specialty: "Floral", image: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=800", location: "Mumbai" },
    { id: 12, title: "Sparkle Makeup Studio", desc: "Mumbai • Bridal Makeup & Hair", price: 35000, rating: 4.6, featured: 12, verified: true, badge: "", category: "Makeup", specialty: "Bridal", image: "https://images.unsplash.com/photo-1542156822-6924d1a71ace?auto=format&fit=crop&q=80&w=800", location: "Mumbai" },
    { id: 13, title: "Shree Krishna Puja Services", desc: "Varanasi • Authentic Vedic Pandits", price: 11000, rating: 4.9, featured: 13, verified: true, badge: "Highly Rated", category: "Pandit / Religious Services", specialty: "Puja/Religious", image: "https://images.unsplash.com/photo-1605389650380-0a256d67b2ff?auto=format&fit=crop&q=80&w=800", location: "Varanasi, UP" },
    { id: 14, title: "NextGen Corporate Events", desc: "Bangalore • Tech Launches & Galas", price: 500000, rating: 4.8, featured: 14, verified: true, badge: "Corporate Choice", category: "Corporate Event Services", specialty: "Corporate", image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800", location: "Bangalore" },
    { id: 15, title: "Magical Birthdays Decor", desc: "Pune • Kids & Adult Theme Parties", price: 25000, rating: 4.7, featured: 15, verified: false, badge: "", category: "Decoration", specialty: "Birthday", image: "https://images.unsplash.com/photo-1530103862676-de8892b12a15?auto=format&fit=crop&q=80&w=800", location: "Pune" }
];

let activeMinRating = 0;
let currentVisibleVendors = [...ALL_VENDORS];
let favorites = new Set();

function formatPrice(price, category) {
    if (category === "Catering") return `₹${price.toLocaleString('en-IN')} /plate`;
    return `₹${price.toLocaleString('en-IN')} /day`;
}

function renderVendors(vendors) {
    const grid = document.getElementById('vendorGrid');
    if(!grid) return; 
    
    const empty = document.getElementById('emptyState');
    const pagination = document.getElementById('paginationContainer');
    document.getElementById('resultCount').textContent = vendors.length;

    if (vendors.length === 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden'); empty.classList.add('flex');
        pagination.classList.add('hidden');
        document.getElementById('openMapBtn')?.classList.add('hidden');
        return;
    }
    empty.classList.add('hidden'); empty.classList.remove('flex');
    pagination.classList.remove('hidden');
    document.getElementById('openMapBtn')?.classList.remove('hidden');

    grid.innerHTML = vendors.map(v => `
<div class="vendor-card group bg-white dark:bg-[#1d3a3a] rounded-2xl overflow-hidden border border-[#e0e8e8] dark:border-[#2a4a4a] hover:shadow-xl hover:border-primary/20 dark:hover:border-accent-gold/30 transition-all flex flex-col cursor-pointer" onclick="openVendorModal(${v.id})">
    <div class="relative aspect-[4/3] overflow-hidden">
        <img alt="${v.title}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" src="${v.image}" onerror="this.src='https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800'"/>
        <div class="absolute top-4 left-4 flex items-center gap-2 pointer-events-none">
            ${v.verified ? `<div class="verified-badge text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-sm text-white flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">verified</span> Verified</div>` : ''}
            ${v.badge ? `<div class="bg-white/90 dark:bg-[#101818]/90 backdrop-blur px-2 py-1 rounded text-[10px] font-bold text-[#101818] dark:text-white uppercase">${v.badge}</div>` : ''}
        </div>
        <button class="fav-btn absolute top-4 right-4 size-8 bg-white/20 hover:bg-white/40 backdrop-blur rounded-full flex items-center justify-center transition-colors z-10" onclick="toggleFav(event, ${v.id})" title="Save to wishlist">
            <span class="heart-icon material-symbols-outlined text-white text-xl ${favorites.has(v.id) ? 'heart-filled' : ''}">favorite</span>
        </button>
    </div>
    <div class="p-5 flex flex-col flex-grow">
        <div class="flex items-start justify-between mb-1">
            <h3 class="vendor-title font-bold text-lg leading-tight group-hover:text-primary dark:group-hover:text-accent-gold transition-colors">${v.title}</h3>
            <div class="flex items-center gap-1 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded text-green-700 dark:text-green-400 font-bold text-xs flex-shrink-0 ml-2">
                <span>${v.rating}</span><span class="material-symbols-outlined text-[14px]" style="font-variation-settings:'FILL' 1">star</span>
            </div>
        </div>
        <p class="vendor-desc text-[#5e8d8d] text-sm mb-4">${v.desc}</p>
        <div class="flex items-center justify-between pt-4 border-t border-[#f0f5f5] dark:border-[#2a4a4a] mt-auto">
            <div>
                <p class="text-[10px] uppercase font-bold text-[#5e8d8d] tracking-wider">Starting From</p>
                <p class="text-lg font-black text-[#101818] dark:text-white">${formatPrice(v.price, v.category)}</p>
            </div>
            <button class="size-10 bg-primary/10 dark:bg-accent-gold/10 text-primary dark:text-accent-gold rounded-xl flex items-center justify-center hover:bg-primary dark:hover:bg-accent-gold hover:text-white transition-all" onclick="openVendorModal(${v.id}); event.stopPropagation();">
                <span class="material-symbols-outlined">arrow_forward</span>
            </button>
        </div>
    </div>
</div>
`).join('');
}

function toggleFav(e, id) {
    e.stopPropagation();
    if (favorites.has(id)) { favorites.delete(id); showToastMsg('Removed from wishlist'); }
    else { favorites.add(id); showToastMsg('❤️ Saved to wishlist!'); }
    renderVendors(currentVisibleVendors);
}

function openVendorModal(id) {
    const v = ALL_VENDORS.find(x => x.id === id);
    if (!v) return;
    document.getElementById('vendorModalImg').style.backgroundImage = `url('${v.image}')`;
    document.getElementById('vendorModalName').textContent = v.title;
    document.getElementById('vendorModalDesc').textContent = v.desc;
    document.getElementById('vendorModalPrice').textContent = formatPrice(v.price, v.category);
    document.getElementById('vendorModalLoc').textContent = v.location;
    document.getElementById('vendorModalRating').innerHTML = `${v.rating} <span class="material-symbols-outlined text-[14px]" style="font-variation-settings:'FILL' 1">star</span>`;
    document.getElementById('vendorModalBadge').innerHTML = v.verified ? `<span class="verified-badge text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded text-white flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">verified</span> Verified</span>` : '';
    const modal = document.getElementById('vendorModal');
    if(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
}

function closeVendorModal() {
    const modal = document.getElementById('vendorModal');
    if(modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
}

function sendInquiry() {
    closeVendorModal();
    const modal = document.getElementById('inquiryModal');
    if(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
}

function loadMore() {
    showToastMsg('Loading more vendors...');
    setTimeout(() => showToastMsg('All vendors loaded!'), 1000);
}

function applyFiltersAndSort() {
    if(!document.getElementById('vendorGrid')) return;

    const search = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    const loc = document.getElementById('locationInput')?.value.toLowerCase().trim() || '';
    const activePrices = Array.from(document.querySelectorAll('.price-checkbox:checked')).map(cb => ({ min: parseInt(cb.dataset.min), max: parseInt(cb.dataset.max) }));
    const activeSpecs = Array.from(document.querySelectorAll('.specialty-cb:checked')).map(cb => cb.dataset.spec.toLowerCase());
    const activeCatPill = document.querySelector('.category-pill.bg-primary')?.dataset.cat || '';

    const locDisplay = document.getElementById('locationInput')?.value.trim() || 'All India';
    const hl = document.getElementById('headerLocation');
    const bl = document.getElementById('breadcrumbLocation');
    const ml = document.getElementById('mapModalLocationName');
    if(hl) hl.textContent = locDisplay;
    if(bl) bl.textContent = locDisplay;
    if(ml) ml.textContent = locDisplay;

    let filtered = ALL_VENDORS.filter(v => {
        const matchSearch = !search || v.title.toLowerCase().includes(search) || v.desc.toLowerCase().includes(search) || v.category.toLowerCase().includes(search);
        const matchLoc = !loc || v.desc.toLowerCase().includes(loc) || v.location.toLowerCase().includes(loc);
        const matchPrice = activePrices.length === 0 || activePrices.some(r => v.price >= r.min && v.price <= r.max);
        const matchRating = v.rating >= activeMinRating;
        const matchSpec = activeSpecs.length === 0 || activeSpecs.some(s => v.specialty.toLowerCase().includes(s));
        const matchCat = !activeCatPill || v.category === activeCatPill;
        return matchSearch && matchLoc && matchPrice && matchRating && matchSpec && matchCat;
    });

    const sort = document.getElementById('sortSelect')?.value || 'featured';
    filtered.sort((a, b) => {
        if (sort === 'priceLow') return a.price - b.price;
        if (sort === 'priceHigh') return b.price - a.price;
        if (sort === 'rating') return b.rating - a.rating;
        return a.featured - b.featured;
    });

    currentVisibleVendors = filtered;
    renderVendors(filtered);
}

function openMap() {
    const loc = document.getElementById('locationInput')?.value.trim() || 'Mumbai';
    document.getElementById('mapIframe').src = `http://googleusercontent.com/maps.google.com/4{encodeURIComponent(loc + ' event vendors')}&t=&z=12&ie=UTF8&iwloc=&output=embed`;
    const container = document.getElementById('mapCardsContainer');
    if(container) {
        container.innerHTML = currentVisibleVendors.slice(0, 8).map(v => `
        <div class="min-w-[260px] bg-white dark:bg-[#1d3a3a] p-3 rounded-xl shadow-lg snap-center flex items-center gap-3 cursor-pointer hover:ring-2 hover:ring-primary dark:hover:ring-accent-gold transition-all" onclick="openVendorModal(${v.id})">
            <img src="${v.image}" class="w-14 h-14 rounded-lg object-cover flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=200'">
            <div class="overflow-hidden">
                <h4 class="font-bold text-sm truncate">${v.title}</h4>
                <p class="text-xs text-[#5e8d8d] truncate">${v.location}</p>
                <p class="font-bold text-sm mt-0.5">${formatPrice(v.price, v.category)}</p>
            </div>
        </div>`).join('');
    }
    const modal = document.getElementById('mapModal');
    if(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
}

function closeMap() {
    const modal = document.getElementById('mapModal');
    if(modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
    const mapIf = document.getElementById('mapIframe');
    if(mapIf) mapIf.src = '';
}

// ============ GLOBAL EVENT LISTENERS ============
document.addEventListener('DOMContentLoaded', () => {
    // Password validation listeners
    document.addEventListener('input', function (e) {
        if (e.target.name === 'password') {
            const pwd = e.target.value;
            const pLower = document.getElementById('pwd-lowercase');
            const pUpper = document.getElementById('pwd-uppercase');
            const pNum = document.getElementById('pwd-number');
            const pSpec = document.getElementById('pwd-special');

            if(pLower) {
                pLower.className = /[a-z]/.test(pwd) ? 'text-green-600 dark:text-green-400' : 'text-red-500';
                pLower.textContent = /[a-z]/.test(pwd) ? '✓ Lowercase letters (a-z)' : '✗ Lowercase letters (a-z)';
            }
            if(pUpper) {
                pUpper.className = /[A-Z]/.test(pwd) ? 'text-green-600 dark:text-green-400' : 'text-red-500';
                pUpper.textContent = /[A-Z]/.test(pwd) ? '✓ Uppercase letters (A-Z)' : '✗ Uppercase letters (A-Z)';
            }
            if(pNum) {
                pNum.className = /[0-9]/.test(pwd) ? 'text-green-600 dark:text-green-400' : 'text-red-500';
                pNum.textContent = /[0-9]/.test(pwd) ? '✓ Numbers (0-9)' : '✗ Numbers (0-9)';
            }
            if(pSpec) {
                pSpec.className = /[@#$%^&*]/.test(pwd) ? 'text-green-600 dark:text-green-400' : 'text-red-500';
                pSpec.textContent = /[@#$%^&*]/.test(pwd) ? '✓ Special character (@#$%^&*)' : '✗ Special character (@#$%^&*)';
            }
        }
    });

    // Theme Toggle Logic
    const themeToggleBtn = document.getElementById('theme-toggle') || document.getElementById('themeToggle');
    const themeIcon = document.getElementById('theme-icon') || document.getElementById('themeIcon');
    
    if (themeToggleBtn && themeIcon) {
        themeToggleBtn.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            if (document.documentElement.classList.contains('dark')) {
                document.documentElement.classList.remove('light');
                themeIcon.textContent = 'light_mode';
            } else {
                document.documentElement.classList.add('light');
                themeIcon.textContent = 'dark_mode';
            }
        });
    }

    // AI Chat Toggle & Interactive Concierge Logic
    const chatToggleBtn = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-msg-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatLoader = document.getElementById('chat-loader');
    
    if (chatToggleBtn && chatWindow) {
        chatToggleBtn.addEventListener('click', () => {
            chatWindow.classList.toggle('hidden');
            if (!chatWindow.classList.contains('hidden') && chatInput) {
                chatInput.focus();
            }
        });
    }

    async function sendConciergeMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // 1. Append user message
        const userMsgHtml = `
            <div class="flex justify-end">
                <div class="bg-primary text-white px-3 py-2 rounded-2xl rounded-tr-sm max-w-[85%] leading-relaxed font-semibold">
                    ${text}
                </div>
            </div>
        `;
        chatMessages.insertAdjacentHTML('beforeend', userMsgHtml);
        chatInput.value = '';
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // 2. Show loader
        chatLoader.classList.remove('hidden');
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // 3. Determine user context email
        let email = null;
        const loggedInUserStr = sessionStorage.getItem('eazeevent_logged_in_customer');
        if (loggedInUserStr) {
            try {
                const userObj = JSON.parse(loggedInUserStr);
                email = userObj.email;
            } catch(e) {}
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, customer_email: email })
            });

            if (!response.ok) throw new Error("Server error");
            const data = await response.json();

            // 4. Hide loader & append reply
            chatLoader.classList.add('hidden');
            const aiMsgHtml = `
                <div class="flex justify-start">
                    <div class="bg-gray-100 dark:bg-[#102a2a] text-[#101818] dark:text-white px-3 py-2 rounded-2xl rounded-tl-sm max-w-[85%] leading-relaxed">
                        ${data.reply.replace(/\n/g, '<br>')}
                    </div>
                </div>
            `;
            chatMessages.insertAdjacentHTML('beforeend', aiMsgHtml);
        } catch(err) {
            chatLoader.classList.add('hidden');
            const errorHtml = `
                <div class="flex justify-start">
                    <div class="bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 px-3 py-2 rounded-2xl rounded-tl-sm max-w-[85%] leading-relaxed font-medium">
                        ⚠️ Sorry, I'm having trouble connecting right now. Please make sure the backend is active.
                    </div>
                </div>
            `;
            chatMessages.insertAdjacentHTML('beforeend', errorHtml);
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    if (chatSendBtn && chatInput) {
        chatSendBtn.addEventListener('click', sendConciergeMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendConciergeMessage();
        });
    }

    // Live Calendar Generation (Homepage)
    const calendarGrid = document.getElementById('calendarGrid');
    if (calendarGrid) {
        let currentCalDate = new Date();
        const calPrev = document.getElementById('cal-prev');
        const calNext = document.getElementById('cal-next');
        const calMonthText = document.getElementById('currentMonthDisplay');

        function generateCalendar() {
            const year = currentCalDate.getFullYear();
            const month = currentCalDate.getMonth();
            const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
            const peakMonths = [9, 10, 11, 0, 1]; 
            const isPeak = peakMonths.includes(month);

            if(calMonthText) calMonthText.innerHTML = `${monthNames[month]} ${year} ${isPeak ? '<span class="text-sm font-normal text-accent-gold ml-2">- Peak Season</span>' : ''}`;

            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            calendarGrid.innerHTML = '';
            const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
            dayNames.forEach(day => {
                calendarGrid.innerHTML += `<div class="text-center text-xs font-bold text-gray-400 dark:text-gray-500 mb-2">${day}</div>`;
            });

            for (let i = 0; i < firstDay; i++) calendarGrid.innerHTML += `<div></div>`;

            for (let day = 1; day <= daysInMonth; day++) {
                const rand = Math.random();
                let statusClass = '';
                if (rand < 0.45) statusClass = 'bg-green-500/10 border-green-500/20 text-black dark:text-white';
                else if (rand < 0.75) statusClass = 'bg-orange-400/20 border-orange-400/40 text-black dark:text-white';
                else if (rand < 0.90) statusClass = 'bg-red-500/30 border-red-500/50 text-black dark:text-white';
                else statusClass = 'bg-red-500/80 border-red-500 text-white';

                calendarGrid.innerHTML += `
                    <div onclick="checkDate(${day}, ${month}, ${year})" class="h-10 md:h-14 rounded-lg border flex items-center justify-center text-xs font-bold cursor-pointer hover:scale-110 transition-transform ${statusClass}">
                        ${day}
                    </div>`;
            }
        }

        if (calPrev) calPrev.addEventListener('click', () => { currentCalDate.setMonth(currentCalDate.getMonth() - 1); generateCalendar(); });
        if (calNext) calNext.addEventListener('click', () => { currentCalDate.setMonth(currentCalDate.getMonth() + 1); generateCalendar(); });
        generateCalendar();
    }

    // Vendor Search & Filters Logic (Only active on pages with a searchBtn)
    if (document.getElementById('searchBtn')) {
        document.getElementById('searchBtn').addEventListener('click', applyFiltersAndSort);
        document.getElementById('searchInput')?.addEventListener('keypress', e => { if (e.key === 'Enter') applyFiltersAndSort(); });
        document.getElementById('locationInput')?.addEventListener('keypress', e => { if (e.key === 'Enter') applyFiltersAndSort(); });
        document.getElementById('sortSelect')?.addEventListener('change', applyFiltersAndSort);
        document.querySelectorAll('.price-checkbox').forEach(cb => cb.addEventListener('change', applyFiltersAndSort));
        document.querySelectorAll('.specialty-cb').forEach(cb => cb.addEventListener('change', applyFiltersAndSort));

        document.querySelectorAll('.rating-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const rating = parseFloat(btn.dataset.rating);
                if (activeMinRating === rating) {
                    activeMinRating = 0;
                    btn.classList.remove('bg-primary', 'text-white', 'border-primary');
                } else {
                    activeMinRating = rating;
                    document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('bg-primary', 'text-white', 'border-primary'));
                    btn.classList.add('bg-primary', 'text-white', 'border-primary');
                }
                applyFiltersAndSort();
            });
        });

        document.querySelectorAll('.category-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.category-pill').forEach(p => {
                    p.className = 'category-pill flex-shrink-0 px-4 py-2 rounded-full bg-white dark:bg-[#1d3a3a] border border-[#e0e8e8] dark:border-[#2a4a4a] text-sm font-bold hover:border-primary dark:hover:border-accent-gold transition-all';
                });
                pill.className = 'category-pill flex-shrink-0 px-4 py-2 rounded-full bg-primary text-white text-sm font-bold transition-all';
                applyFiltersAndSort();
            });
        });

        document.getElementById('clearFilters')?.addEventListener('click', () => {
            if(document.getElementById('searchInput')) document.getElementById('searchInput').value = '';
            if(document.getElementById('locationInput')) document.getElementById('locationInput').value = '';
            document.querySelectorAll('.price-checkbox').forEach(cb => cb.checked = false);
            document.querySelectorAll('.specialty-cb').forEach(cb => cb.checked = false);
            document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('bg-primary', 'text-white', 'border-primary'));
            if(document.getElementById('sortSelect')) document.getElementById('sortSelect').value = 'featured';
            document.querySelectorAll('.category-pill').forEach((p, i) => {
                if (i === 0) p.className = 'category-pill flex-shrink-0 px-4 py-2 rounded-full bg-primary text-white text-sm font-bold transition-all';
                else p.className = 'category-pill flex-shrink-0 px-4 py-2 rounded-full bg-white dark:bg-[#1d3a3a] border border-[#e0e8e8] dark:border-[#2a4a4a] text-sm font-bold hover:border-primary dark:hover:border-accent-gold transition-all';
            });
            activeMinRating = 0;
            applyFiltersAndSort();
        });

        document.getElementById('openMapBtn')?.addEventListener('click', openMap);
        document.getElementById('closeMapBtn')?.addEventListener('click', closeMap);
        document.getElementById('mapModal')?.addEventListener('click', e => { if (e.target === document.getElementById('mapModal')) closeMap(); });
        document.getElementById('vendorModal')?.addEventListener('click', e => { if (e.target === document.getElementById('vendorModal')) closeVendorModal(); });

        const params = new URLSearchParams(window.location.search);
        const cat = params.get('category');
        const city = params.get('city');
        if (cat) {
            const si = document.getElementById('searchInput');
            if(si) si.value = cat;
            document.querySelectorAll('.category-pill').forEach(p => {
                if (p.dataset.cat === cat) {
                    p.className = 'category-pill flex-shrink-0 px-4 py-2 rounded-full bg-primary text-white text-sm font-bold transition-all';
                } else {
                    p.className = 'category-pill flex-shrink-0 px-4 py-2 rounded-full bg-white dark:bg-[#1d3a3a] border border-[#e0e8e8] dark:border-[#2a4a4a] text-sm font-bold hover:border-primary dark:hover:border-accent-gold transition-all';
                }
            });
        }
        if (city && document.getElementById('locationInput')) {
            document.getElementById('locationInput').value = city;
        }
        applyFiltersAndSort();
    }
});

async function requestPasswordResetOTP() {
    const email = document.getElementById('forgotEmail').value.trim();
    if (!email) {
        alert("❌ Please enter your email address!");
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/password-reset/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Request failed.");
        }
        
        document.getElementById('forgotStep1').classList.add('hidden');
        document.getElementById('forgotStep2').classList.remove('hidden');
        alert("🔑 Verification code sent! Check your simulated email terminal/console.");
    } catch(err) {
        alert("❌ Error: " + err.message);
    }
}

async function confirmPasswordResetOTP() {
    const email = document.getElementById('forgotEmail').value.trim();
    const otp = document.getElementById('forgotOTP').value.trim();
    const new_password = document.getElementById('forgotNewPassword').value.trim();
    
    if (!otp || !new_password) {
        alert("❌ Please enter both the verification code and your new password!");
        return;
    }
    
    try {
        const res = await fetch(`${API_BASE_URL}/api/auth/password-reset/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, new_password })
        });
        
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.detail || "Reset failed.");
        }
        
        alert("🛡️ Password updated successfully! You can now log in with your new password.");
        closeModal('forgotPasswordModal');
        
        // Reset steps
        document.getElementById('forgotStep1').classList.remove('hidden');
        document.getElementById('forgotStep2').classList.add('hidden');
        document.getElementById('forgotEmail').value = '';
        document.getElementById('forgotOTP').value = '';
        document.getElementById('forgotNewPassword').value = '';
    } catch(err) {
        alert("❌ Error: " + err.message);
    }
}