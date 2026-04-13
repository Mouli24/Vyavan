import { Outlet } from 'react-router-dom'

// Buyer pages each have their own headers.
// This layout just provides the background wrapper.
export default function BuyerLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-sp-bg">
      <Outlet />
    </div>
  )
}
