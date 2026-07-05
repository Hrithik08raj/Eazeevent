// ============ VENDOR DATA ============
const API_BASE_URL = "http://127.0.0.1:8000";

let ALL_VENDORS = [];
let activeVendorId = null;

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

let activeMinRating = 0;
let currentVisibleVendors = [...ALL_VENDORS];
let favorites = new Set();
let activeSubCategory = ""; // Track active sub-category

const venueSubCategories = [
    "Banquet Halls",
    "Hotels",
    "Marriage Gardens",
    "Kalyana Mandaps",
    "Wedding Lawns",
    "Farm Houses",
    "Wedding Resorts"
];

function showToastMsg(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
}

function formatPrice(price, category) {
    if (category === "Catering") return `₹${price.toLocaleString('en-IN')} /plate`;
    return `₹${price.toLocaleString('en-IN')} /day`;
}

function renderSubCategories() {
    const container = document.getElementById('subCategoryContainer');
    container.innerHTML = venueSubCategories.map(sub => `
        <button class="sub-category-pill flex-shrink-0 px-4 py-1.5 rounded-full ${activeSubCategory === sub ? 'bg-accent-gold text-white border-accent-gold' : 'bg-white dark:bg-[#1d3a3a] text-[#5e8d8d] border-[#e0e8e8] dark:border-[#2a4a4a]'} border text-xs font-bold hover:bg-accent-gold hover:text-white hover:border-accent-gold transition-all" data-subcat="${sub}">
            ${sub}
        </button>
    `).join('');

    // Attach event listeners to new sub-category buttons
    document.querySelectorAll('.sub-category-pill').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const sub = e.target.dataset.subcat;
            if (activeSubCategory === sub) {
                activeSubCategory = ""; // toggle off if already clicked
            } else {
                activeSubCategory = sub;
            }
            renderSubCategories(); // Re-render to update active styling
            applyFiltersAndSort();
        });
    });
}

function renderVendors(vendors) {
    const grid = document.getElementById('vendorGrid');
    const empty = document.getElementById('emptyState');
    const pagination = document.getElementById('paginationContainer');
    document.getElementById('resultCount').textContent = vendors.length;

    if (vendors.length === 0) {
        grid.innerHTML = '';
        empty.classList.remove('hidden'); empty.classList.add('flex');
        pagination.classList.add('hidden');
        document.getElementById('openMapBtn').classList.add('hidden');
        return;
    }
    empty.classList.add('hidden'); empty.classList.remove('flex');
    pagination.classList.remove('hidden');
    document.getElementById('openMapBtn').classList.remove('hidden');

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

async function openVendorModal(id) {
    activeVendorId = id;
    const v = ALL_VENDORS.find(x => x.id === id);
    if (!v) return;
    document.getElementById('vendorModalImg').style.backgroundImage = `url('${v.image}')`;
    document.getElementById('vendorModalName').textContent = v.title;
    document.getElementById('vendorModalDesc').textContent = v.desc;
    document.getElementById('vendorModalPrice').textContent = formatPrice(v.price, v.category);
    document.getElementById('vendorModalLoc').textContent = v.location;
    document.getElementById('vendorModalRating').innerHTML = `${v.rating} <span class="material-symbols-outlined text-[14px]" style="font-variation-settings:'FILL' 1">star</span>`;
    document.getElementById('vendorModalBadge').innerHTML = v.verified ? `<span class="verified-badge text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded text-white flex items-center gap-1"><span class="material-symbols-outlined text-[12px]">verified</span> Verified</span>` : '';
    
    // Populate packages
    const pkgsContainer = document.getElementById('vendorModalPackages');
    if (pkgsContainer) {
        if (v.packages) {
            try {
                const pkgsList = typeof v.packages === 'string' ? JSON.parse(v.packages) : v.packages;
                pkgsContainer.innerHTML = pkgsList.map(p => `
                    <div class="flex justify-between items-center bg-gray-50 dark:bg-[#102a2a] p-3 rounded-lg border border-transparent hover:border-accent-gold/20 transition-all">
                        <span class="font-bold text-primary dark:text-[#bfc8c8]">${p.name}</span>
                        <span class="font-black text-accent-gold">${formatPrice(p.price, v.category)}</span>
                    </div>
                `).join('');
            } catch (err) {
                console.error("Failed to parse packages:", err);
                pkgsContainer.innerHTML = `<p class="text-xs text-[#5e8d8d]">Custom pricing package: starts at ${formatPrice(v.price, v.category)}</p>`;
            }
        } else {
            pkgsContainer.innerHTML = `<div class="bg-gray-50 dark:bg-[#102a2a] p-3 rounded-lg"><span class="font-bold">Standard Services Package: </span><span class="font-black text-accent-gold">${formatPrice(v.price, v.category)}</span></div>`;
        }
    }

    // Fetch and populate reviews
    const reviewsContainer = document.getElementById('vendorModalReviews');
    if (reviewsContainer) {
        reviewsContainer.innerHTML = `<p class="text-xs text-[#5e8d8d] animate-pulse">Loading reviews...</p>`;
        try {
            const reviews = await apiFetch(`/api/vendors/${v.id}/reviews`);
            if (!reviews || reviews.length === 0) {
                reviewsContainer.innerHTML = `<p class="text-xs text-[#5e8d8d] italic py-2">No reviews left for this vendor yet.</p>`;
            } else {
                reviewsContainer.innerHTML = reviews.map(r => `
                    <div class="bg-gray-50 dark:bg-[#102a2a] p-3 rounded-lg space-y-1">
                        <div class="flex justify-between items-center font-bold">
                            <span class="text-primary dark:text-white">${r.reviewer_name}</span>
                            <span class="flex items-center text-accent-gold gap-0.5">${r.rating} <span class="material-symbols-outlined text-[12px]" style="font-variation-settings:'FILL' 1">star</span></span>
                        </div>
                        <p class="text-on-surface-variant italic">"${r.text}"</p>
                        ${r.replied && r.reply_text ? `
                            <div class="ml-4 mt-2 border-l-2 border-primary/20 pl-3 py-1 bg-primary/5 dark:bg-white/5 rounded text-[11px]">
                                <span class="font-bold text-primary dark:text-accent-gold block mb-0.5">Vendor reply:</span>
                                <p class="text-on-surface-variant italic">"${r.reply_text}"</p>
                            </div>
                        ` : ''}
                    </div>
                `).join('');
            }
        } catch (err) {
            console.error("Failed to fetch reviews:", err);
            reviewsContainer.innerHTML = `<p class="text-xs text-red-500">Failed to load reviews from database.</p>`;
        }
    }

    const modal = document.getElementById('vendorModal');
    modal.classList.remove('hidden'); modal.classList.add('flex');
}

function closeVendorModal() {
    const modal = document.getElementById('vendorModal');
    modal.classList.add('hidden'); modal.classList.remove('flex');
}

async function sendInquiry() {
    const token = sessionStorage.getItem('eazeevent_token');
    const customer = sessionStorage.getItem('eazeevent_logged_in_customer');
    if (!token || !customer) {
        alert("🔒 Please log in as a customer first to submit inquiries!");
        window.location.href = "index.html";
        return;
    }
    
    if (!activeVendorId) return;
    const v = ALL_VENDORS.find(x => x.id === activeVendorId);
    if (!v) return;
    
    try {
        await apiFetch('/api/customer/inquiries', {
            method: 'POST',
            body: JSON.stringify({
                vendor_id: activeVendorId,
                pkg: `Custom ${v.category} Package`,
                date: "2026-11-14",
                location: v.location,
                budget: v.price
            })
        });
        
        closeVendorModal();
        const modal = document.getElementById('inquiryModal');
        modal.classList.remove('hidden'); modal.classList.add('flex');
    } catch (err) {
        alert("Failed to submit inquiry: " + err.message);
    }
}

function loadMore() {
    showToastMsg('Loading more vendors...');
    setTimeout(() => showToastMsg('All vendors loaded!'), 1000);
}

// ============ FILTER & SORT ============
function applyFiltersAndSort() {
    const search = document.getElementById('searchInput').value.toLowerCase().trim();
    const loc = document.getElementById('locationInput').value.toLowerCase().trim();
    const activePrices = Array.from(document.querySelectorAll('.price-checkbox:checked')).map(cb => ({ min: parseInt(cb.dataset.min), max: parseInt(cb.dataset.max) }));
    const activeSpecs = Array.from(document.querySelectorAll('.specialty-cb:checked')).map(cb => cb.dataset.spec.toLowerCase());
    const activeCatPill = document.querySelector('.category-pill.bg-primary')?.dataset.cat || '';

    const locDisplay = document.getElementById('locationInput').value.trim() || 'All India';
    document.getElementById('headerLocation').textContent = locDisplay;
    document.getElementById('breadcrumbLocation').textContent = locDisplay;
    document.getElementById('mapModalLocationName').textContent = locDisplay;

    let filtered = ALL_VENDORS.filter(v => {
        const matchSearch = !search || v.title.toLowerCase().includes(search) || v.desc.toLowerCase().includes(search) || v.category.toLowerCase().includes(search);
        const matchLoc = !loc || v.desc.toLowerCase().includes(loc) || v.location.toLowerCase().includes(loc);
        const matchPrice = activePrices.length === 0 || activePrices.some(r => v.price >= r.min && v.price <= r.max);
        const matchRating = v.rating >= activeMinRating;
        const matchSpec = activeSpecs.length === 0 || activeSpecs.some(s => v.specialty.toLowerCase().includes(s));

        // Main Category Matching
        const matchCat = !activeCatPill || v.category === activeCatPill;

        // Sub Category Matching (Only if Venues is selected and a sub-category is active)
        const matchSubCat = !activeSubCategory || v.subCategory === activeSubCategory;

        return matchSearch && matchLoc && matchPrice && matchRating && matchSpec && matchCat && matchSubCat;
    });

    const sort = document.getElementById('sortSelect').value;
    filtered.sort((a, b) => {
        if (sort === 'priceLow') return a.price - b.price;
        if (sort === 'priceHigh') return b.price - a.price;
        if (sort === 'rating') return b.rating - a.rating;
        return a.featured - b.featured;
    });

    currentVisibleVendors = filtered;
    renderVendors(filtered);
}

// ============ MAP ============
function openMap() {
    const loc = document.getElementById('locationInput').value.trim() || 'Mumbai';
    document.getElementById('mapIframe').src = `https://maps.google.com/maps?q=$${encodeURIComponent(loc + ' event vendors')}&t=&z=12&ie=UTF8&iwloc=&output=embed`;
    const container = document.getElementById('mapCardsContainer');
    container.innerHTML = currentVisibleVendors.slice(0, 8).map(v => `
<div class="min-w-[260px] bg-white dark:bg-[#1d3a3a] p-3 rounded-xl shadow-lg snap-center flex items-center gap-3 cursor-pointer hover:ring-2 hover:ring-primary dark:hover:ring-accent-gold transition-all" onclick="openVendorModal(${v.id})">
    <img src="${v.image}" class="w-14 h-14 rounded-lg object-cover flex-shrink-0" onerror="this.src='https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=200'">
    <div class="overflow-hidden">
        <h4 class="font-bold text-sm truncate">${v.title}</h4>
        <p class="text-xs text-[#5e8d8d] truncate">${v.location}</p>
        <p class="font-bold text-sm mt-0.5">${formatPrice(v.price, v.category)}</p>
    </div>
</div>`).join('');
    const modal = document.getElementById('mapModal');
    modal.classList.remove('hidden'); modal.classList.add('flex');
}

function closeMap() {
    const modal = document.getElementById('mapModal');
    modal.classList.add('hidden'); modal.classList.remove('flex');
    document.getElementById('mapIframe').src = '';
}

// ============ INIT ============
document.addEventListener('DOMContentLoaded', async () => {
    // Fetch live verified vendors from API
    try {
        const data = await apiFetch('/api/vendors');
        ALL_VENDORS = data.map(v => ({
            id: v.id,
            title: v.business_name,
            desc: v.services_offered || `${v.category} Specialist in ${v.city}`,
            price: v.starting_price || v.startingPrice || 60000,
            rating: v.rating,
            featured: 1,
            verified: v.status === 'Verified',
            badge: "Verified Partner",
            category: v.category,
            subCategory: v.category === "Venues" ? "Wedding resorts" : "",
            specialty: "Traditional",
            image: v.profile_image || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=800",
            location: v.city,
            packages: v.packages
        }));
    } catch (err) {
        console.error('Error fetching vendors from API:', err);
    }
    
    currentVisibleVendors = [...ALL_VENDORS];

    // Theme
    const themeBtn = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    themeBtn.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark');
        themeIcon.textContent = document.documentElement.classList.contains('dark') ? 'light_mode' : 'dark_mode';
    });

    // Search
    document.getElementById('searchBtn').addEventListener('click', applyFiltersAndSort);
    document.getElementById('searchInput').addEventListener('keypress', e => { if (e.key === 'Enter') applyFiltersAndSort(); });
    document.getElementById('locationInput').addEventListener('keypress', e => { if (e.key === 'Enter') applyFiltersAndSort(); });
    document.getElementById('sortSelect').addEventListener('change', applyFiltersAndSort);
    document.querySelectorAll('.price-checkbox').forEach(cb => cb.addEventListener('change', applyFiltersAndSort));
    document.querySelectorAll('.specialty-cb').forEach(cb => cb.addEventListener('change', applyFiltersAndSort));

    // Rating filters
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

    // Category pills
    document.querySelectorAll('.category-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            // Update active category pill styles
            document.querySelectorAll('.category-pill').forEach(p => {
                p.className = 'category-pill flex-shrink-0 px-4 py-2 rounded-full bg-white dark:bg-[#1d3a3a] border border-[#e0e8e8] dark:border-[#2a4a4a] text-sm font-bold hover:border-primary dark:hover:border-accent-gold transition-all';
            });
            pill.className = 'category-pill flex-shrink-0 px-4 py-2 rounded-full bg-primary text-white text-sm font-bold transition-all';

            // Reset sub-category state when changing main categories
            activeSubCategory = "";

            const cat = pill.dataset.cat;
            const subCatContainer = document.getElementById('subCategoryContainer');

            // If "Venues" is clicked, show sub-categories
            if (cat === "Venues") {
                subCatContainer.classList.remove('hidden');
                renderSubCategories();
            } else {
                subCatContainer.classList.add('hidden');
                subCatContainer.innerHTML = ''; // clear out html
            }

            applyFiltersAndSort();
        });
    });

    // Clear filters
    document.getElementById('clearFilters').addEventListener('click', () => {
        document.getElementById('searchInput').value = '';
        document.getElementById('locationInput').value = '';
        document.querySelectorAll('.price-checkbox').forEach(cb => cb.checked = false);
        document.querySelectorAll('.specialty-cb').forEach(cb => cb.checked = false);
        document.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('bg-primary', 'text-white', 'border-primary'));
        document.getElementById('sortSelect').value = 'featured';

        // Reset categories & subcategories
        document.querySelectorAll('.category-pill').forEach((p, i) => {
            if (i === 0) p.className = 'category-pill flex-shrink-0 px-4 py-2 rounded-full bg-primary text-white text-sm font-bold transition-all';
            else p.className = 'category-pill flex-shrink-0 px-4 py-2 rounded-full bg-white dark:bg-[#1d3a3a] border border-[#e0e8e8] dark:border-[#2a4a4a] text-sm font-bold hover:border-primary dark:hover:border-accent-gold transition-all';
        });

        document.getElementById('subCategoryContainer').classList.add('hidden');
        activeSubCategory = "";
        activeMinRating = 0;
        applyFiltersAndSort();
    });

    // Map
    document.getElementById('openMapBtn').addEventListener('click', openMap);
    document.getElementById('closeMapBtn').addEventListener('click', closeMap);
    document.getElementById('mapModal').addEventListener('click', e => { if (e.target === document.getElementById('mapModal')) closeMap(); });

    // Close modals on backdrop
    document.getElementById('vendorModal').addEventListener('click', e => { if (e.target === document.getElementById('vendorModal')) closeVendorModal(); });

    // URL params
    const params = new URLSearchParams(window.location.search);
    const cat = params.get('category');
    const city = params.get('city');
    if (cat) {
        document.getElementById('searchInput').value = cat;
        // Activate matching pill
        document.querySelectorAll('.category-pill').forEach(p => {
            if (p.dataset.cat === cat) {
                p.className = 'category-pill flex-shrink-0 px-4 py-2 rounded-full bg-primary text-white text-sm font-bold transition-all';
                if (cat === "Venues") {
                    document.getElementById('subCategoryContainer').classList.remove('hidden');
                    renderSubCategories();
                }
            } else {
                p.className = 'category-pill flex-shrink-0 px-4 py-2 rounded-full bg-white dark:bg-[#1d3a3a] border border-[#e0e8e8] dark:border-[#2a4a4a] text-sm font-bold hover:border-primary dark:hover:border-accent-gold transition-all';
            }
        });
    }
    if (city) document.getElementById('locationInput').value = city;

    applyFiltersAndSort();
});