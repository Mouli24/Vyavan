# B2B Procurement & Manufacturing Intelligence Platform

A high-fidelity, enterprise-grade B2B platform designed for the diverse manufacturing ecosystem and small-scale industries. This platform synchronizes manufacturing nodes with buyer entities through advanced logistics, secure escrow governance, and behavioral risk detection.

## 🚀 Key Modules

### 🏦 Treasury & Financial Clearing
- **Escrow Governance**: Multi-stage fund protection with automated release cycles.
- **Yield Analytics**: Real-time commission reporting and month-over-month yield metrics.
- **Anomaly Detection**: Advanced risk monitoring for payment failures and suspicious litigation requests.

### 📦 Lifecycle Transaction Tracking
- **Order Command Center**: 360° visibility into procurement sequences with vertical time-series logging.
- **Fulfillment Monitoring**: Real-time latency detection for shipment lags and acknowledgement delays (SLA tracking).

### ⚖️ Dispute & Litigation Suite
- **Administrative Tribunal**: Triple-panel resolution suite (Buyer Evidence vs. Manufacturer Rebuttal vs. Audit Trail).
- **Escrow-Integrated Verdicts**: Automated refund triggers and partial settlement execution.
- **Risk Ranking**: Intelligent identification of high-friction platform nodes (Manufacturer Dispute Rates).

### 📈 Platform Intelligence (Analytics)
- **Economic GMV Trends**: Professional data visualization of revenue trajectories.
- **Sector Dominance**: Market vertical analysis with behavioral sentiment alerts.
- **Geospatial Density**: State-wise transaction heatmapping and urban center density tracking.

### 🛡️ Risk & Fraud Control
- **Anti-Fraud Engine**: Automated flagging for duplicate IPs, account takeover patterns, and high-cancellation behavior.
- **Verification Queues**: SLA-monitored application triage for manufacturers and buyers.

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, TailwindCSS, Lucide-React, Motion (Framer), Recharts.
- **Backend**: Node.js, Express, MongoDB (Mongoose).
- **Storage**: Cloudinary (Product & Document Vault).
- **Communication**: multi-channel Broadcast Engine (In-app, Email).

---

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (Local or Atlas)
- Cloudinary Account (for media)

### 1. Repository Setup
```bash
git clone <your-repo-link>
cd b2b-project
```

### 2. Backend Configuration
Navigate to the backend directory:
```bash
cd backend
npm install
```
Create a `.env` file in the `backend` folder:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_ultra_secure_secret
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```
Start the backend server:
```bash
npm run dev
```

### 3. Frontend Configuration
Navigate to the frontend directory:
```bash
cd ../frontend
npm install
```
Create a `.env` file in the `frontend` folder:
```env
VITE_API_URL=http://localhost:5000/api
```
Start the frontend development server:
```bash
npm run dev
```

---

## 👥 User Roles

- **Admin**: Full platform governance, fiscal oversight, litigation authority, and deep analytics access.
- **Manufacturer**: Inventory management, bulk procurement fulfillment, and performance tracking.
- **Buyer**: Product discovery, transaction negotiation, and order lifecycle tracking.

---

## 📜 License
Privately developed for the Global B2B Manufacturing Platform. Proprietary & Confidential.
