import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, Address } from '@/lib/api'
import { Mail, Shield, CheckCircle, Package, ArrowLeft, Loader2, CreditCard, MapPin, Navigation, Plus, Map, Calendar } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { useAuth } from '@/context/AuthContext'

export default function BuyerCheckout() {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  const [cart, setCart] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [step, setStep] = useState(1)
  const [mfrHolidays, setMfrHolidays] = useState<Record<string, any>>({})

  // Address States
  const [addresses, setAddresses] = useState<Address[]>([])
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null)
  
  const [showNewAddress, setShowNewAddress] = useState(false)
  const [locating, setLocating] = useState(false)
  const [saveToBook, setSaveToBook] = useState(true)

  const [newAddressForm, setNewAddressForm] = useState<Partial<Address>>({
    fullName: '',
    companyName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
    isDefault: false
  })

  // Other form states
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [otpSent, setOtpSent] = useState(false)
  const [otpEntered, setOtpEntered] = useState('')

  useEffect(() => {
    Promise.all([
      api.getCart().catch(e => ({ items: [] })),
      api.getAddresses().catch(e => [])
    ]).then(([cartRes, addrRes]) => {
      if (cartRes?.items) setCart(cartRes.items)
      if (addrRes && Array.isArray(addrRes)) {
        setAddresses(addrRes)
        const def = addrRes.find(a => a.isDefault) || addrRes[0]
        if (def) setSelectedAddress(def)
      }
      
      // Check holidays for manufacturers in cart
      if (cartRes?.items) {
        const mfrIds = Array.from(new Set(cartRes.items.map((i: any) => i.product?.manufacturer?._id).filter(Boolean)))
        mfrIds.forEach(id => {
          api.checkManufacturerHoliday(id as string)
            .then(info => {
              if (info.isOnHoliday) {
                setMfrHolidays(prev => ({ ...prev, [id as string]: info }))
              }
            }).catch(() => {})
        })
      }

      setLoading(false)
    })
  }, [])

  // Pincode auto-fill effect
  useEffect(() => {
    if (newAddressForm.pincode?.length === 6) {
      fetch(`https://api.postalpincode.in/pincode/${newAddressForm.pincode}`)
        .then(res => res.json())
        .then(data => {
          if (data[0].Status === 'Success') {
            const po = data[0].PostOffice[0]
            setNewAddressForm(prev => ({
              ...prev,
              city: prev.city || po.District,
              state: prev.state || po.State
            }))
          }
        }).catch(console.error)
    }
  }, [newAddressForm.pincode])

  const cartTotal = cart.reduce((s, i) => s + (i.product?.price ?? 0) * i.quantity, 0)
  
  // Group by manufacturer
  const groupedCart = cart.reduce((acc, item) => {
    const mId = item.product?.manufacturer?._id
    if (!mId) return acc
    if (!acc[mId]) acc[mId] = []
    acc[mId].push(item)
    return acc
  }, {})

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const { latitude, longitude } = pos.coords
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
        const data = await res.json()
        const { address } = data || {}
        
        if (address) {
          setNewAddressForm(prev => ({
            ...prev,
            fullName: user?.name || prev.fullName,
            companyName: user?.company || prev.companyName,
            addressLine1: address.road || address.neighbourhood || address.suburb || '',
            addressLine2: address.residential || address.county || '',
            city: address.city || address.town || address.village || address.state_district || '',
            state: address.state || '',
            pincode: address.postcode || '',
            country: address.country || 'India'
          }))
          setShowNewAddress(true)
        }
      } catch (e) {
        alert('Failed to fetch address from location.')
      } finally {
        setLocating(false)
      }
    }, () => {
      alert('Unable to retrieve your location. Please check browser permissions.')
      setLocating(false)
    })
  }

  const handleSaveNewAddress = async () => {
    if (!newAddressForm.fullName || !newAddressForm.phone || !newAddressForm.addressLine1 || !newAddressForm.city || !newAddressForm.state || !newAddressForm.pincode) {
      alert('Please fill all mandatory fields.')
      return
    }
    if (newAddressForm.phone.length !== 10) {
      alert('Phone number must be 10 digits.')
      return
    }

    setProcessing(true)
    try {
      if (saveToBook) {
        const res = await api.addAddress(newAddressForm)
        setAddresses(prev => [...prev, res])
        setSelectedAddress(res)
      } else {
        // Just use it for this session without saving id
        setSelectedAddress({ ...newAddressForm } as Address)
      }
      setShowNewAddress(false)
    } catch (e: any) {
      alert('Failed to save address: ' + e.message)
    } finally {
      setProcessing(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Please select a delivery address.')
      return
    }

    if (!otpSent) {
      setOtpSent(true)
      return
    }

    if (otpEntered.length !== 4) {
      alert('Please enter a standard 4-digit mock OTP (e.g. 1234).')
      return
    }

    setProcessing(true)
    try {
      for (const mId in groupedCart) {
        const items = groupedCart[mId]
        const subtotal = items.reduce((s: number, i: any) => s + (i.product?.price ?? 0) * i.quantity, 0)
        const total = subtotal * 1.18
        
        await api.placeOrder({
          manufacturer: mId,
          items: items.map((i: any) => `${i.product.name} (x${i.quantity})`).join(', '),
          value: `₹${total.toLocaleString('en-IN')}`,
          valueRaw: total,
          products: items.map((i: any) => ({
            product: i.product._id,
            quantity: i.quantity
          })),
          expectedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          deliveryAddress: selectedAddress
        })
      }

      await api.clearCart()
      setStep(3)
    } catch (e: any) {
      alert(e.message || 'Failed to place order.')
    } finally {
      setProcessing(false)
    }
  }

  const isAnyMfrOff = Object.keys(mfrHolidays).length > 0
  const holidayMfrNames = Object.values(mfrHolidays).map(h => h.manufacturer?.company || 'a supplier')

  if (loading) {
    return (
      <div className="min-h-screen bg-sp-bg flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#7C3AED]" />
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-sp-bg flex flex-col items-center justify-center p-6 text-center">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[2rem] shadow-xl p-10 max-w-md w-full border border-sp-border">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Order Submitted!</h2>
          <p className="text-slate-500 mb-8 leading-relaxed">
            Your orders have been sent to the respective manufacturers. They will be reviewed and processed shortly.
            A confirmation email has been dispatched.
          </p>
          <button onClick={() => navigate('/buyer/orders')} className="w-full py-4 rounded-xl bg-[#7C3AED] text-white font-bold hover:bg-[#6D28D9] transition-colors">
            Track Orders
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-sp-bg font-['Inter']">
      <header className="bg-white border-b border-sp-border px-6 py-4 sticky top-0 z-10 text-center flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 transition-colors font-semibold">
          <ArrowLeft size={18} /> Back
        </button>
        <h2 className="text-xl font-black text-slate-800 tracking-tight">Checkout</h2>
        <div className="w-20" />
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 grid lg:grid-cols-3 gap-8">
        
        {/* Left Col: Forms */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-sp-border rounded-[1.5rem] p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="text-[#7C3AED]" size={20} /> Delivery Address
              </h3>
              {!showNewAddress && (
                <button
                  onClick={() => setShowNewAddress(true)}
                  className="text-[#7C3AED] text-sm font-bold flex items-center gap-1 hover:underline"
                >
                  <Plus size={16} /> Add New Address
                </button>
              )}
            </div>

            {showNewAddress ? (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4 bg-slate-50 p-6 rounded-2xl border border-sp-border">
                <div className="flex items-center justify-between mb-4">
                   <h4 className="font-bold text-slate-800">New Address</h4>
                   <button onClick={handleUseCurrentLocation} disabled={locating} className="flex items-center gap-1 text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full font-bold hover:bg-blue-100 transition-colors">
                     {locating ? <Loader2 size={14} className="animate-spin" /> : <Navigation size={14} />} 
                     Use My Current Location
                   </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name *</label>
                    <input type="text" value={newAddressForm.fullName} onChange={e => setNewAddressForm({...newAddressForm, fullName: e.target.value})} className="w-full p-3 bg-white border border-sp-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C4B5FD]"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Phone Number *</label>
                    <input type="text" maxLength={10} value={newAddressForm.phone} onChange={e => setNewAddressForm({...newAddressForm, phone: e.target.value.replace(/\D/g, '')})} className="w-full p-3 bg-white border border-sp-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C4B5FD]"/>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Company Name (Optional)</label>
                  <input type="text" value={newAddressForm.companyName} onChange={e => setNewAddressForm({...newAddressForm, companyName: e.target.value})} className="w-full p-3 bg-white border border-sp-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C4B5FD]"/>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Address Line 1 *</label>
                  <input type="text" placeholder="Building, Street Name, Area" value={newAddressForm.addressLine1} onChange={e => setNewAddressForm({...newAddressForm, addressLine1: e.target.value})} className="w-full p-3 bg-white border border-sp-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C4B5FD]"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Address Line 2</label>
                  <input type="text" placeholder="Landmark, Locality (Optional)" value={newAddressForm.addressLine2} onChange={e => setNewAddressForm({...newAddressForm, addressLine2: e.target.value})} className="w-full p-3 bg-white border border-sp-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C4B5FD]"/>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Pincode *</label>
                    <input type="text" maxLength={6} placeholder="6 digits" value={newAddressForm.pincode} onChange={e => setNewAddressForm({...newAddressForm, pincode: e.target.value.replace(/\D/g, '')})} className="w-full p-3 bg-white border border-sp-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C4B5FD]"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">City *</label>
                    <input type="text" value={newAddressForm.city} onChange={e => setNewAddressForm({...newAddressForm, city: e.target.value})} className="w-full p-3 bg-white border border-sp-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C4B5FD]"/>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">State *</label>
                    <input type="text" value={newAddressForm.state} onChange={e => setNewAddressForm({...newAddressForm, state: e.target.value})} className="w-full p-3 bg-white border border-sp-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#C4B5FD]"/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Country</label>
                    <input type="text" disabled value={newAddressForm.country} className="w-full p-3 bg-slate-100 border border-sp-border rounded-xl text-sm text-slate-500"/>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 pb-4">
                  <input type="checkbox" id="save" checked={saveToBook} onChange={e => setSaveToBook(e.target.checked)} className="w-4 h-4 text-[#7C3AED] rounded focus:ring-[#7C3AED]" />
                  <label htmlFor="save" className="text-sm font-semibold text-slate-700">Save to Address Book for future use</label>
                </div>
                
                {saveToBook && (
                  <div className="flex items-center gap-2 pb-4">
                    <input type="checkbox" id="default" checked={newAddressForm.isDefault} onChange={e => setNewAddressForm({...newAddressForm, isDefault: e.target.checked})} className="w-4 h-4 text-[#7C3AED] rounded focus:ring-[#7C3AED]" />
                    <label htmlFor="default" className="text-sm font-semibold text-slate-700">Make this my default address</label>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={() => setShowNewAddress(false)} className="flex-1 py-3 bg-white border border-sp-border text-slate-600 font-bold rounded-xl hover:bg-slate-50">Cancel</button>
                  <button disabled={processing} onClick={handleSaveNewAddress} className="flex-1 py-3 bg-[#7C3AED] text-white font-bold rounded-xl hover:bg-[#6D28D9] flex items-center justify-center gap-2">
                    {processing && <Loader2 size={16} className="animate-spin" />} Use this Address
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {addresses.length === 0 ? (
                   <div className="sm:col-span-2 text-center p-8 bg-slate-50 rounded-2xl border-2 border-dashed border-sp-border">
                      <MapPin size={32} className="mx-auto text-slate-300 mb-2" />
                      <p className="text-slate-500 font-medium mb-3">No saved addresses found.</p>
                      <button onClick={() => setShowNewAddress(true)} className="text-sm bg-white border border-sp-border px-4 py-2 rounded-full font-bold text-slate-700 shadow-sm hover:border-[#7C3AED]">Add Address Now</button>
                   </div>
                ) : addresses.map(addr => (
                  <div 
                    key={addr._id} 
                    onClick={() => setSelectedAddress(addr)}
                    className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedAddress?._id === addr._id ? 'border-[#7C3AED] bg-[#F5F3FF]' : 'border-sp-border hover:border-[#C4B5FD] bg-white'}`}
                  >
                    {addr.isDefault && (
                      <span className="absolute top-3 right-3 bg-slate-100 text-slate-600 text-[10px] font-black uppercase px-2 py-1 rounded-md">Default</span>
                    )}
                    <h4 className="font-bold text-slate-800 text-sm mb-1 pr-12">{addr.fullName}</h4>
                    {addr.companyName && <p className="text-xs font-semibold text-slate-600 mb-2">{addr.companyName}</p>}
                    <p className="text-xs text-slate-500 leading-relaxed mb-1">
                      {addr.addressLine1}, {addr.addressLine2 && `${addr.addressLine2},`}
                      <br/>{addr.city}, {addr.state} {addr.pincode}
                    </p>
                    <p className="text-xs font-semibold text-slate-600 mt-2 flex items-center gap-1">
                      <CreditCard size={12} className="opacity-0" /> Phone: {addr.phone}
                    </p>
                    
                    {selectedAddress?._id === addr._id && (
                      <div className="absolute -top-2 -right-2 bg-[#7C3AED] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        <CheckCircle size={14} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-sp-border rounded-[1.5rem] p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
              <CreditCard className="text-[#7C3AED]" size={20} /> Payment Terms
            </h3>
            <div className="flex flex-col gap-3">
              {[
                { id: 'bank_transfer', label: 'Bank Transfer (NEFT/RTGS/Wire)' },
                { id: 'letter_of_credit', label: 'Letter of Credit (L/C)' },
                { id: 'credit_card', label: 'Corporate Credit Card / Netbanking' }
              ].map(opt => (
                <label key={opt.id} className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${paymentMethod === opt.id ? 'border-[#7C3AED] bg-[#F5F3FF]' : 'border-sp-border hover:border-[#C4B5FD]'}`}>
                  <input type="radio" name="payment" value={opt.id} checked={paymentMethod === opt.id} onChange={() => setPaymentMethod(opt.id)} className="w-4 h-4 text-[#7C3AED] focus:ring-[#7C3AED]" />
                  <span className={`text-sm font-semibold ${paymentMethod === opt.id ? 'text-[#7C3AED]' : 'text-slate-600'}`}>{opt.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              * Note: For standard B2B orders, selecting 'Bank Transfer' will generate an invoice requiring payment before dispatch. For approved credit lines, orders are processed instantly.
            </p>
          </div>
        </div>

        {/* Right Col: Summary & Actions */}
        <div className="space-y-6">
          <div className="bg-white border border-sp-border rounded-[1.5rem] p-6 shadow-md sticky top-24">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-sp-border pb-4">Order Summary</h3>
            
            <div className="space-y-4 mb-6 max-h-64 overflow-y-auto pr-2">
              {cart.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden border border-sp-border flex-shrink-0">
                    {item.product?.image ? <img src={item.product.image} alt={item.product.name} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 m-auto text-slate-300 mt-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{item.product?.name || 'Unknown Item'}</p>
                    <p className="text-xs text-slate-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-black text-slate-800">
                    ₹{((item.product?.price || 0) * item.quantity).toLocaleString('en-IN')}
                  </p>
                </div>
              ))}
              {cart.length === 0 && <p className="text-sm text-slate-400 py-4">Your cart is empty.</p>}
            </div>

            <div className="border-t border-sp-border pt-4 space-y-3 mb-6">
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>Subtotal</span>
                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-500 font-medium">
                <span>Estimated Tax (18% GST)</span>
                <span>₹{(cartTotal * 0.18).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-sp-border">
                <span>Total Amount</span>
                <span>₹{(cartTotal * 1.18).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Mock OTP Area */}
            <AnimatePresence>
              {otpSent && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mb-6 overflow-hidden">
                  <div className="bg-[#EDE9FE] rounded-xl p-4 border border-[#D8D0F8]">
                    <p className="text-xs text-slate-600 mb-2 flex items-center gap-2 font-semibold">
                      <Mail className="text-[#7C3AED] w-4 h-4" /> Verification OTP sent to email!
                    </p>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         maxLength={4} 
                         value={otpEntered} 
                         onChange={e => setOtpEntered(e.target.value.replace(/\D/g, ''))} 
                         placeholder="1234" 
                         className="flex-1 p-3 text-center tracking-widest font-mono text-lg rounded-xl border border-white focus:outline-none focus:ring-2 focus:ring-[#7C3AED]"
                       />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Holiday Warning */}
            {isAnyMfrOff && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Calendar size={14} /> Manufacturer on Holiday
                </div>
                <p>
                  Some manufacturers in your cart (<b>{holidayMfrNames.join(', ')}</b>) are currently away. 
                  Your order will be accepted but reviewed when they return.
                </p>
              </div>
            )}

            <button 
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || !selectedAddress || processing}
              className={`w-full py-4 rounded-xl flex items-center justify-center gap-2 font-extrabold text-sm transition-all ${
                 cart.length === 0 || !selectedAddress 
                 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                 : 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-xl hover:shadow-2xl hover:-translate-y-0.5'
              }`}
            >
              {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-4 h-4" />}
              {otpSent ? 'Verify & Confirm Order' : 'Place Order Securely'}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}


