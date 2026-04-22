import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import './i18n' // Import i18n configuration

// Pages
import HomePage               from './pages/HomePage'
import LoginPage              from './pages/LoginPage'

// Layouts
import BuyerLayout            from './components/layout/BuyerLayout'
import ManufacturerLayout     from './components/layout/ManufacturerLayout'
import AdminLayout            from './components/layout/AdminLayout'

// Buyer pages
import BuyerDashboard         from './pages/buyer/BuyerDashboard'
import BuyerBrowse            from './pages/buyer/BuyerBrowse'
import BuyerOrders            from './pages/buyer/BuyerOrders'
import ScheduleCall           from './pages/buyer/ScheduleCall'
import BuyerComplaints        from './pages/buyer/BuyerComplaints'
import BuyerShipments         from './pages/buyer/BuyerShipments'
import BuyerCheckout          from './pages/buyer/BuyerCheckout'
import BuyerNegotiation       from './pages/buyer/BuyerNegotiation'

// Manufacturer pages
import Overview               from './pages/manufacturer/Overview'
import MyStore                from './pages/manufacturer/MyStore'
import ManufacturerOrders     from './pages/manufacturer/ManufacturerOrders'
import Inventory              from './pages/manufacturer/Inventory'
import Shipment               from './pages/manufacturer/Shipment'
import Negotiation            from './pages/manufacturer/Negotiation'
import Payment                from './pages/manufacturer/Payment'
import Complaints             from './pages/manufacturer/Complaints'
import Onboarding             from './pages/manufacturer/Onboarding'
import ManufacturerSettings   from './pages/manufacturer/ManufacturerSettings'
import ScheduledCalls         from './pages/manufacturer/ScheduledCalls'
import HolidaySettings        from './pages/manufacturer/HolidaySettings'
import ManufacturerReviews     from './pages/manufacturer/ManufacturerReviews'
import ManufacturerGroups      from './pages/manufacturer/ManufacturerGroups'
import BuyerPool                from './pages/manufacturer/BuyerPool'

// Admin pages
import AdminDashboard         from './pages/admin/AdminDashboard'
import AdminManufacturers     from './pages/admin/AdminManufacturers'
import AdminVerification      from './pages/admin/AdminVerification'
import AdminComplaints        from './pages/admin/AdminComplaints'
import AdminAnalytics         from './pages/admin/AdminAnalytics'
import AdminBuyers            from './pages/admin/AdminBuyers'
import AdminOrders            from './pages/admin/AdminOrders'
import AdminSettings          from './pages/admin/AdminSettings'
import AdminPayments          from './pages/admin/AdminPayments'
import AdminContent           from './pages/admin/AdminContent'
import AdminComingSoon        from './pages/admin/AdminComingSoon'
import AdminManufacturerDetail from './pages/admin/AdminManufacturerDetail'

// Public pages
import CompanyStorefront      from './pages/company/CompanyStorefront'

// ── Protected route wrapper ──────────────────────────────────────────────────
function ProtectedRoute({
  children,
  allowedRole,
  redirectTo = '/login',
}: {
  children: React.ReactNode
  allowedRole?: 'buyer' | 'manufacturer' | 'admin'
  redirectTo?: string
}) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-sp-purple border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to={redirectTo} replace />
  if (allowedRole && user.role !== allowedRole) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />
    if (user.role === 'manufacturer') return <Navigate to="/manufacturer/overview" replace />
    return <Navigate to="/buyer/dashboard" replace />
  }
  return <>{children}</>
}

export default function App() {
  return (
    <>
      <Routes>
        {/* ── Public routes ── */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* ── Public company storefront ── */}
        <Route path="/company/:id" element={<CompanyStorefront />} />

        {/* ── Buyer routes ── */}
        <Route path="/buyer" element={
          <ProtectedRoute allowedRole="buyer">
            <BuyerLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"   element={<BuyerDashboard />} />
          <Route path="browse"      element={<BuyerBrowse />} />
          <Route path="orders"      element={<BuyerOrders />} />
          <Route path="shipments"   element={<BuyerShipments />} />
          <Route path="complaints"  element={<BuyerComplaints />} />
          <Route path="schedule"    element={<ScheduleCall />} />
          <Route path="checkout"    element={<BuyerCheckout />} />
          <Route path="negotiation" element={<BuyerNegotiation />} />
        </Route>

        {/* Search accessible without login */}
        <Route path="/browse" element={<BuyerBrowse />} />

        {/* ── Manufacturer routes ── */}
        <Route path="/manufacturer" element={
          <ProtectedRoute allowedRole="manufacturer">
            <ManufacturerLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview"     element={<Overview />} />
          <Route path="store"        element={<MyStore />} />
          <Route path="orders"       element={<ManufacturerOrders />} />
          <Route path="inventory"    element={<Inventory />} />
          <Route path="shipment"     element={<Shipment />} />
          <Route path="negotiation"  element={<Negotiation />} />
          <Route path="payment"      element={<Payment />} />
          <Route path="complaints"   element={<Complaints />} />
          <Route path="scheduled-calls" element={<ScheduledCalls />} />
          <Route path="holidays"        element={<HolidaySettings />} />
          <Route path="settings"        element={<ManufacturerSettings />} />
          <Route path="reviews"         element={<ManufacturerReviews />} />
          <Route path="groups"          element={<ManufacturerGroups />} />
          <Route path="groups/pool"     element={<BuyerPool />} />
        </Route>

        <Route path="/manufacturer/onboarding" element={
          <ProtectedRoute allowedRole="manufacturer">
            <Onboarding />
          </ProtectedRoute>
        } />

        {/* ── Admin routes ── */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard"      element={<AdminDashboard />} />
          <Route path="manufacturers"  element={<AdminManufacturers />} />
          <Route path="manufacturers/:id" element={<AdminManufacturerDetail />} />
          <Route path="verification"   element={<AdminVerification />} />
          <Route path="buyers"         element={<AdminBuyers />} />
          <Route path="orders"         element={<AdminOrders />} />
          <Route path="complaints"     element={<AdminComplaints />} />
          <Route path="payments"       element={<AdminPayments />} />
          <Route path="analytics"      element={<AdminAnalytics />} />
          <Route path="content"        element={<AdminContent />} />
          <Route path="settings"       element={<AdminSettings />} />

          {/* Placeholders for new modules */}
          <Route path="monitoring/*"   element={<AdminComingSoon />} />
          <Route path="orders/stuck"   element={<AdminComingSoon />} />
          <Route path="disputes/*"     element={<AdminComingSoon />} />
          <Route path="finance/*"      element={<AdminComingSoon />} />
          <Route path="analytics/*"    element={<AdminComingSoon />} />
          <Route path="plans"          element={<AdminComingSoon />} />
          <Route path="communicate/*"  element={<AdminComingSoon />} />
          <Route path="settings/*"     element={<AdminComingSoon />} />
        </Route>

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
