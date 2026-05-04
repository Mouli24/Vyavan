import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import './i18n' // Import i18n configuration

// Pages
const HomePage               = lazy(() => import('./pages/HomePage'))
const LoginPage              = lazy(() => import('./pages/LoginPage'))

// Layouts
const BuyerLayout            = lazy(() => import('./components/layout/BuyerLayout'))
const ManufacturerLayout     = lazy(() => import('./components/layout/ManufacturerLayout'))
const AdminLayout            = lazy(() => import('./components/layout/AdminLayout'))

// Buyer pages
const BuyerDashboard         = lazy(() => import('./pages/buyer/BuyerDashboard'))
const BuyerBrowse            = lazy(() => import('./pages/buyer/BuyerBrowse'))
const BuyerOrders            = lazy(() => import('./pages/buyer/BuyerOrders'))
const ScheduleCall           = lazy(() => import('./pages/buyer/ScheduleCall'))
const BuyerComplaints        = lazy(() => import('./pages/buyer/BuyerComplaints'))
const BuyerShipments         = lazy(() => import('./pages/buyer/BuyerShipments'))
const BuyerCheckout          = lazy(() => import('./pages/buyer/BuyerCheckout'))
const BuyerNegotiation       = lazy(() => import('./pages/buyer/BuyerNegotiation'))

// Manufacturer pages
const Overview               = lazy(() => import('./pages/manufacturer/Overview'))
const MyStore                = lazy(() => import('./pages/manufacturer/MyStore'))
const ManufacturerOrders     = lazy(() => import('./pages/manufacturer/ManufacturerOrders'))
const Inventory              = lazy(() => import('./pages/manufacturer/Inventory'))
const Shipment               = lazy(() => import('./pages/manufacturer/Shipment'))
const Negotiation            = lazy(() => import('./pages/manufacturer/Negotiation'))
const Payment                = lazy(() => import('./pages/manufacturer/Payment'))
const Complaints             = lazy(() => import('./pages/manufacturer/Complaints'))
const Onboarding             = lazy(() => import('./pages/manufacturer/Onboarding'))
const ManufacturerSettings   = lazy(() => import('./pages/manufacturer/ManufacturerSettings'))
const ScheduledCalls         = lazy(() => import('./pages/manufacturer/ScheduledCalls'))
const HolidaySettings        = lazy(() => import('./pages/manufacturer/HolidaySettings'))
const PaymentSettingsPage    = lazy(() => import('./pages/manufacturer/PaymentSettingsPage'))
const ReceivablesDashboard   = lazy(() => import('./pages/manufacturer/ReceivablesDashboard'))
const ManufacturerReviews     = lazy(() => import('./pages/manufacturer/ManufacturerReviews'))
const ManufacturerGroups      = lazy(() => import('./pages/manufacturer/ManufacturerGroups'))
const BuyerPool                = lazy(() => import('./pages/manufacturer/BuyerPool'))

// Admin pages
const AdminDashboard         = lazy(() => import('./pages/admin/AdminDashboard'))
const AdminManufacturers     = lazy(() => import('./pages/admin/AdminManufacturers'))
const AdminVerification      = lazy(() => import('./pages/admin/AdminVerification'))
const AdminComplaints        = lazy(() => import('./pages/admin/AdminComplaints'))
const AdminAnalytics         = lazy(() => import('./pages/admin/AdminAnalytics'))
const AdminBuyers            = lazy(() => import('./pages/admin/AdminBuyers'))
const AdminOrders            = lazy(() => import('./pages/admin/AdminOrders'))
const AdminSettings          = lazy(() => import('./pages/admin/AdminSettings'))
const AdminPayments          = lazy(() => import('./pages/admin/AdminPayments'))
const AdminContent           = lazy(() => import('./pages/admin/AdminContent'))
const AdminComingSoon        = lazy(() => import('./pages/admin/AdminComingSoon'))
const AdminManufacturerDetail = lazy(() => import('./pages/admin/AdminManufacturerDetail'))
const AdminBuyerDetail      = lazy(() => import('./pages/admin/AdminBuyerDetail'))
const AdminBuyerVerification = lazy(() => import('./pages/admin/AdminBuyerVerification'))
const AdminGlobalActivity   = lazy(() => import('./pages/admin/AdminGlobalActivity'))
const AdminFraudCenter      = lazy(() => import('./pages/admin/AdminFraudCenter'))
const AdminOrderDetail      = lazy(() => import('./pages/admin/AdminOrderDetail'))
const AdminStuckOrders      = lazy(() => import('./pages/admin/AdminStuckOrders'))
const AdminDisputeResolution = lazy(() => import('./pages/admin/AdminDisputeResolution'))
const AdminReturns           = lazy(() => import('./pages/admin/AdminReturns'))
const AdminPlans             = lazy(() => import('./pages/admin/AdminPlans'))

// Public pages
const CompanyStorefront      = lazy(() => import('./pages/company/CompanyStorefront'))

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
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-sp-purple border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <Routes>
        {/* ... existing routes ... */}
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
        <Route path="settings/payments" element={<PaymentSettingsPage />} />
        <Route path="receivables"     element={<ReceivablesDashboard />} />
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
          <Route path="buyers/:id"     element={<AdminBuyerDetail />} />
          <Route path="buyers/verification" element={<AdminBuyerVerification />} />
          <Route path="orders"         element={<AdminOrders />} />
          <Route path="orders/:id"     element={<AdminOrderDetail />} />
          <Route path="orders/stuck"   element={<AdminStuckOrders />} />
          <Route path="complaints"     element={<AdminComplaints />} />
          <Route path="complaints/:id/resolution" element={<AdminDisputeResolution />} />
          <Route path="disputes/returns" element={<AdminReturns />} />
          <Route path="finance/escrow" element={<AdminPayments />} />
          <Route path="finance/commission" element={<AdminPayments />} />
          <Route path="finance/refunds" element={<AdminPayments />} />
          <Route path="payments"       element={<AdminPayments />} />
          <Route path="analytics"      element={<AdminAnalytics />} />
          <Route path="analytics/sectors" element={<AdminAnalytics />} />
          <Route path="analytics/geography" element={<AdminAnalytics />} />
          <Route path="analytics/performance" element={<AdminAnalytics />} />
          <Route path="logs"           element={<AdminGlobalActivity />} />
          <Route path="fraud"          element={<AdminFraudCenter />} />
          <Route path="content"        element={<AdminContent />} />
          <Route path="plans"          element={<AdminPlans />} />
          <Route path="settings"       element={<AdminSettings />} />
          <Route path="communicate/*"  element={<AdminComingSoon />} />
          <Route path="settings/*"     element={<AdminComingSoon />} />
        </Route>

        {/* ── Catch-all ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
