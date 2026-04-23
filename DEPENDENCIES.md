# Dependency Map & Installation Quick-Start

## Backend Dependencies
Primary configuration in `./backend/package.json`.

- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT, Bcrypt
- **Cloud Storage**: Cloudinary (Multer storage)
- **Exports**: ExcelJS, PDFKit, json2csv
- **Real-time**: Socket.io
- **Utilities**: Node-cron, UUID, Dotenv

## Frontend Dependencies
Primary configuration in `./frontend/package.json`.

- **Core**: React 18, Vite
- **UI & Icons**: Lucide-React, Radix UI, TanStack Table
- **Styling**: TailwindCSS
- **Animations**: Framer Motion (motion/react)
- **Data Vis**: Recharts, Chart.js
- **State/Routing**: React Router Dom, Axios
- **Feedback**: React Hot Toast, Sonner

## Installation Steps

1. **Backend Setup**:
   ```bash
   cd backend
   npm install
   ```

2. **Frontend Setup**:
   ```bash
   cd frontend
   npm install
   ```

3. **Global Service Requirements**:
   - Ensure MongoDB is running (locally or Atlas).
   - Configure `.env` files in both directories according to the README.md instructions.
