# AI-powered Web Application Firewall (WAF)

## Overview
This is an advanced, AI-driven Web Application Firewall (WAF) solution designed to detect and mitigate Cross-Site Scripting (XSS) and SQL Injection (SQLi) attacks in real time. It combines machine learning models, a robust FastAPI backend, and a modern React dashboard to provide actionable security insights and automated protection for your web applications.

---

## Features
- **AI-Powered Detection**: Utilizes trained ML models to identify XSS and SQLi payloads with high accuracy.
- **Centralized Orchestration**: FastAPI backend coordinates detection, event storage, and blocklist management.
- **Real-Time Dashboard**: React-based frontend for monitoring threats, blocklist management, and analytics.
- **Automated Blocking**: High-confidence threats are auto-blocked; manual controls for security teams.
- **MongoDB Integration**: Stores events, blocklists, and analytics data for persistent, scalable operations.
- **Extensible Microservices**: Modular detection services for XSS and SQLi, easily upgradable.
- **Comprehensive Analytics**: Visualize attack trends, model performance, and system health.
- **Secure by Design**: Hardened .gitignore, environment variable management, and no sensitive data in repo.

---

## Architecture

```
+-------------------+      +-------------------+      +-------------------+
|   Web Application | ---> |                   | ---> |   Detection       |
|   (Your App/API)  |      |   FastAPI Agent   |      |   Microservices   |
+-------------------+      +-------------------+      +-------------------+
         |                        |                            |
         |                        |                            |
         |                        v                            v
         |                MongoDB Atlas                XSS/SQLi ML Models
         |                        |
         |                        v
         |                React Dashboard
         v
   NGINX WAF (optional)
```

- **FastAPI Agent**: Central API, event processing, blocklist, and orchestration.
- **Detection Microservices**: Separate XSS and SQLi ML model APIs (Python, pickle/joblib models).
- **MongoDB**: Stores events, blocklists, and analytics.
- **React Dashboard**: Modern UI for monitoring, analytics, and manual controls.
- **NGINX WAF**: (Optional) Enforces blocklist at the web server layer.

---

## Folder Structure

```
AI-Powered-Web-Application-Firewall-(WAF)/
├── Backend/
│   ├── agent/
│   │   └── main.py           # FastAPI agent (core logic)
│   ├── xss_service/          # XSS detection microservice
│   ├── sqli_service/         # SQLi detection microservice
│   ├── .env                  # Backend environment variables (not committed)
│   └── ...
├── frontend/
│   ├── src/
│   │   ├── components/       # UI components
│   │   ├── pages/            # Dashboard pages
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API service layer
│   │   └── ...
│   ├── public/
│   ├── package.json
│   ├── .gitignore
│   └── ...
├── README.md
└── ...
```

---

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/UsamaSani/AI-powered-Web-Application-Firewall-WAF-.git
cd frontend
```

### 2. Backend Setup
- **Python 3.9+** required.
- Create and activate a virtual environment:
  ```bash
  python -m venv venv
  source venv/Scripts/activate 
  ```
- Install dependencies:
  ```bash
  pip install -r requirements.txt
  ```
- Configure environment variables in `Backend/.env`:
  ```env
  MONGODB_URL=mongodb://localhost:27017
  XSS_SERVICE_URL=http://localhost:8001
  SQLI_SERVICE_URL=http://localhost:8002
  NGINX_CONTAINER=security-waf
  BLOCK_THRESHOLD=0.8
  ALERT_THRESHOLD=0.5
  ```
- Start the FastAPI agent:
  ```bash
  uvicorn agent.main:app --reload
  ```
- Start XSS and SQLi microservices (see their respective folders for instructions).

### 3. Frontend Setup
- Navigate to the frontend directory:
  ```bash
  cd frontend
  ```
- Install dependencies:
  ```bash
  npm install
  # or
  bun install
  ```
- Start the development server:
  ```bash
  npm run dev
  # or
  bun run dev
  ```
- Access the dashboard at [http://localhost:5173](http://localhost:5173)

---

## Usage
- **Dashboard**: Monitor security events, view analytics, manage blocklist.
- **API**: Integrate with your app via REST endpoints (see FastAPI docs at `/docs`).
- **Block/Unblock**: Manually block or unblock IPs via dashboard or API.
- **Analytics**: Review model performance, threat trends, and system health.

---

## Security & Best Practices
- **.env files**: Store all secrets and connection strings in `.env` (never commit to git).
- **Model/Data Files**: All model files (`.pkl`, `.joblib`, etc.) and sensitive data are git-ignored.
- **Production**: Use HTTPS, secure MongoDB, and restrict dashboard access.
- **NGINX Integration**: For production, use the blocklist with NGINX for real-time blocking.

---

## API Endpoints (Backend)
- `POST /analyze` — Analyze a payload for XSS/SQLi (returns action, confidence, details)
- `GET /events` — List recent security events
- `GET /events/{id}` — Get event details
- `POST /block/{ip}` — Manually block an IP/hostname
- `POST /unblock/{ip}` — Unblock an IP
- `GET /blocklist` — List all blocked IPs
- `GET /stats` — Dashboard statistics
- `GET /analytics` — Model and detection analytics
- `GET /health` — Service health check

---

## Contributing
1. Fork the repo and create a feature branch.
2. Follow code style and security best practices.
3. Submit a pull request with a clear description.

---

## License
This project is licensed under the MIT License.

---

## Acknowledgments
- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [MongoDB](https://www.mongodb.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)

