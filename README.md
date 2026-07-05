# 🎉 Eazeevent

> **Make your Event Easy and Grand!**

Eazeevent is a comprehensive, production-ready Event Management and Booking Platform. It bridges the gap between event hosts (customers) and event service providers (vendors), offering an all-in-one suite for budget tracking, guest lists, RSVPs, interactive timelines, automated payments, and real-time communication, all guided by an **AI Event Planner Concierge** powered by Gemini.

---

## ✨ Key Features

### 🤵 Customer Portal
*   **Comprehensive Dashboard:** Live event status tracker, budget indicators, countdown timers, and recent activities.
*   **Budget & Expense Tracker:** Visual budget meters alerting users of "On Track" or "At Risk" spending, category-wise breakdowns, and payment tracking.
*   **Guest & RSVP Management:** Add guests, track RSVP status (Attending, Declined, Pending), and send invitations.
*   **Event Timeline Builder:** Hourly schedule organizer to manage wedding or event day flow seamlessly.
*   **Checklist Organizer:** Keep track of pending and completed tasks with due dates.
*   **Vendor Marketplace:** Search and filter verified vendors by category, city, price, and ratings, view package details, and submit inquiries.

### 🏢 Vendor Dashboard
*   **Business Profile:** Showcase category, services, pricing, packages, and promotional/profile images.
*   **Booking Management:** Manage and confirm customer bookings and track incoming inquiries.
*   **Calendar & Blocked Dates:** Block specific event dates to manage availability.
*   **Reviews & Testimonials:** Read customer reviews and reply directly to feedback.
*   **Eazee Boost:** Premium options to boost visibility on the platform (boosted status).

### 🤖 AI & Communication
*   **AI Concierge (Eazee AI):** Integrated chat powered by the Gemini API to consult on wedding dates, budgets, recommended vendors, and checklist planning.
*   **Real-time Negotiation Chat:** Direct communication channel between customer and vendor for each active inquiry.

### 💳 Payments & Finance
*   **Razorpay Integration:** Secure digital transaction flow for deposits and payments.
*   **Transaction Logs:** Clear visibility of payout splits, platform commission, and refunds.

### 👑 Admin Control Panel
*   **Overview Analytics:** Track total users, vendors, bookings, revenue, and support tickets.
*   **Vendor Verification:** Review uploaded business proof files and verify vendor profiles.
*   **Finance & Commissions:** Configure platform-wide commissions (default: 5%), track transactions, and disburse payouts.
*   **System Settings:** Put the site in maintenance mode, configure support emails, update Gemini API keys, and more.

---

## 🛠 Tech Stack

### Frontend
*   **Styling:** HTML5, TailwindCSS, CSS3 Variables, Google Fonts (Inter, Playfair Display), Google Material Symbols.
*   **Logic:** Modern Vanilla JavaScript (ES6+), dynamic DOM rendering, Fetch API client, state management via LocalStorage.

### Backend
*   **Framework:** FastAPI (Python 3.9+)
*   **Database ORM:** SQLAlchemy
*   **Authentication:** JWT (JSON Web Tokens), Passlib (Bcrypt hashing)
*   **Database Engines:** SQLite (Local Dev / default) | PostgreSQL (Docker Production)
*   **API Clients:** Requests (Gemini API Integration), Razorpay SDK

---

## 📂 Project Structure

```text
Minor_Proj/
├── backend/                  # FastAPI Backend Application
│   ├── app/                  # Application core source code
│   │   ├── routers/          # API Route Modules (auth, admin, customer, vendor, ai, payments, chat)
│   │   ├── config.py         # App configuration & environments
│   │   ├── database.py       # SQLAlchemy engine & session maker
│   │   ├── deps.py           # Endpoint dependency injections (security, db sessions)
│   │   ├── main.py           # FastAPI application initialization & middleware
│   │   ├── models.py         # SQLAlchemy Database Schema
│   │   ├── notifications.py  # Email and notification dispatcher
│   │   ├── schemas.py        # Pydantic schemas for data validation
│   │   └── security.py       # Password hashing & JWT generation
│   ├── Dockerfile            # Container definition for backend
│   ├── requirements.txt      # Python dependencies
│   ├── seed.py               # Clean DB init & Admin seeder
│   └── test_api.py           # Comprehensive integration test suite
├── css/                      # Global frontend stylesheets
│   └── global.css            # Custom CSS utilities & variables
├── js/                       # Core frontend JavaScript files
│   ├── index.js              # Landing page and general scripts
│   ├── dashboard.js          # Customer dashboard controls
│   ├── vendors.js            # Vendor browsing & inquiries
│   ├── vendor_dashboard.js   # Vendor panel business logic
│   └── admin.js              # Admin portal & data charts
├── index.html                # Platform Landing Page
├── dashboard.html            # Customer Dashboard
├── vendors.html              # Vendor Marketplace
├── vendor_dashboard.html     # Vendor Management Panel
├── admin_*.html              # Administration portal pages (overview, finance, customers, settings, vendors)
├── docker-compose.yml        # Multi-container orchestration (FastAPI + PostgreSQL)
└── README.md                 # Project Documentation
```

---

## ⚙️ Local Development Setup

### 1. Prerequisites
*   Python 3.9 or higher installed
*   Git installed
*   A modern web browser

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a Python virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   *   **Windows (PowerShell):** `.\venv\Scripts\Activate.ps1`
   *   **Windows (CMD):** `.\venv\Scripts\activate.bat`
   *   **Linux/macOS:** `source venv/bin/activate`
4. Install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Configure your environment variables:
   *   Duplicate `.env.example` and name it `.env`
   *   Fill in values (a strong secret key, Gemini API key, Razorpay API credentials, SMTP mail credentials):
   ```ini
   SECRET_KEY=generate_a_long_random_key_here_for_production
   API_BASE_URL=http://127.0.0.1:8000
   
   # SMTP Configuration (optional, for email updates)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   SMTP_FROM_EMAIL=noreply@eazeevent.com
   
   # Razorpay Configuration (optional, for payments)
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   ```
6. Seed the database to create standard setup and default admin user:
   ```bash
   python seed.py
   ```
   *Note: This creates a default sqlite database `eazeevent.db` and seeds a default admin account:*
   *   **Admin Email:** `admin@eazeevent.com`
   *   **Admin Password:** `admin123`
7. Run the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   *The backend documentation will be accessible at: `http://127.0.0.1:8000/docs`*

### 3. Frontend Setup
The frontend uses standard static HTML/JS files that consume backend APIs.
1. Open the project root folder.
2. Serve the static files using any local dev server, or simply open `index.html` in your browser. (For a full experience, serving via a local server such as VS Code's **Live Server** extension, Python's built-in http server `python -m http.server 5500`, or Node's `serve` package is recommended to avoid CORS issues with file origins).
3. The frontend is configured to target `http://127.0.0.1:8000` by default.

---

## 🐳 Docker Deployment

To launch the backend along with a production-ready PostgreSQL database container:

1. Make sure Docker and Docker Compose are installed on your machine.
2. In the root directory, run:
   ```bash
   docker-compose up --build -d
   ```
3. This spins up:
   *   **PostgreSQL Database:** Running on port `5432` inside the network.
   *   **FastAPI Backend:** Built, configured to communicate with PostgreSQL, and exposed on port `8000`.
4. Run migrations/database seeding inside the web container:
   ```bash
   docker-compose exec web python seed.py
   ```

---

## 🔐 Security & Features
*   **Password Hashing:** Passwords are encrypted before storing using `bcrypt`.
*   **JSON Web Tokens (JWT):** Secure session handling and role authentication across endpoints.
*   **Static File Management:** Automatic management and validation of image and identity proof uploads for vendors.
