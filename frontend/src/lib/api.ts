const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  // Ensure it doesn't end with a slash
  url = url.replace(/\/$/, '');
  // Ensure it ends with /api
  if (!url.endsWith('/api')) {
    url += '/api';
  }
  return url;
};

const BASE = getBaseUrl();

function getToken() {
  return localStorage.getItem('token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export const api = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (data: RegisterPayload) =>
    request<{ token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  onboardManufacturer: (data: any) =>
    request<any>('/manufacturer/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  me: () => request<User>('/auth/me'),

  // ── Products ──────────────────────────────────────────────────────────────
  getProducts: (params?: { category?: string; manufacturer?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string,string>).toString() : '';
    return request<Product[]>(`/products${qs}`);
  },

  getMyProducts: () => request<Product[]>('/products/mine'),

  createProduct: (data: Partial<Product>) =>
    request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),

  updateProduct: (id: string, data: Partial<Product>) =>
    request<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteProduct: (id: string) =>
    request<{ message: string }>(`/products/${id}`, { method: 'DELETE' }),

  // ── Orders ────────────────────────────────────────────────────────────────
  getOrders: (params?: { status?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string,string>).toString() : '';
    return request<Order[]>(`/orders${qs}`);
  },

  // ── Cart ──────────────────────────────────────────────────────────────────
  getCart: () => request<any>('/cart'),
  addToCart: (productId: string, quantity: number) => 
    request<any>('/cart/add', { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  updateCart: (items: { product: string; quantity: number }[]) => 
    request<any>('/cart/update', { method: 'PATCH', body: JSON.stringify({ items }) }),
  clearCart: () => request<any>('/cart/clear', { method: 'DELETE' }),

  placeOrder: (data: {
    manufacturer: string;
    items: string;
    value: string;
    valueRaw: number;
    expectedDate: string;
    products?: { product: string; quantity: number }[];
    deliveryAddress?: Address;
  }) => request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),

  updateOrderStatus: (id: string, status: string) =>
    request<Order>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  confirmOrder: (id: string) =>
    request<Order>(`/orders/${id}/confirm`, { method: 'PATCH' }),
  rejectOrder: (id: string, reason: string) =>
    request<Order>(`/orders/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),
  packOrder: (id: string) =>
    request<Order>(`/orders/${id}/pack`, { method: 'PATCH' }),
  dispatchOrder: (id: string, data: { carrier: string; trackingNumber: string; lorryReceiptUrl?: string; invoiceUrl?: string }) =>
    request<any>(`/orders/${id}/dispatch`, { method: 'PATCH', body: JSON.stringify(data) }),
  markDelivered: (id: string) =>
    request<Order>(`/orders/${id}/delivered`, { method: 'PATCH' }),

  // ── Shipments ─────────────────────────────────────────────────────────────
  getShipments: () => request<Shipment[]>('/shipments'),

  getMyShipments: () => request<Shipment[]>('/shipments/my'),

  getShipmentTracking: (id: string) => 
    request<any[]>(`/shipments/${id}/track`),

  createShipment: (data: Record<string, any>) =>
    request<any>('/shipments', { method: 'POST', body: JSON.stringify(data) }),

  updateShipment: (id: string, data: Partial<Shipment>) =>
    request<Shipment>(`/shipments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // ── Deals ─────────────────────────────────────────────────────────────────
  getDeals: () => request<Deal[]>('/deals'),

  getBuyerDeals: () => request<Deal[]>('/deals/buyer'),

  createDeal: (data: Partial<Deal> & { message?: string }) =>
    request<Deal>('/deals', { method: 'POST', body: JSON.stringify(data) }),

  updateDeal: (id: string, data: Partial<Deal> & { message?: string }) =>
    request<Deal>(`/deals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  convertDealToOrder: (id: string, deliveryAddress: any) =>
    request<any>(`/deals/${id}/convert`, { method: 'POST', body: JSON.stringify({ deliveryAddress }) }),

  // ── Messages ──────────────────────────────────────────────────────────────
  getMessages: (dealId: string) => request<Message[]>(`/messages?deal=${dealId}`),

  sendMessage: (data: { deal: string; content: string; type?: string }) =>
    request<Message>('/messages', { method: 'POST', body: JSON.stringify(data) }),

  // ── Complaints ────────────────────────────────────────────────────────────
  getComplaints: (params?: { status?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string,string>).toString() : '';
    return request<Complaint[]>(`/complaints${qs}`);
  },

  getMyComplaints: (params?: { status?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string,string>).toString() : '';
    return request<Complaint[]>(`/complaints/my${qs}`);
  },

  fileComplaint: (data: {
    title: string; description: string; category: string;
    manufacturer: string; company: string; evidence?: string[];
  }) => request<Complaint>('/complaints', { method: 'POST', body: JSON.stringify(data) }),

  respondComplaint: (id: string, data: { response?: string; resolution?: object; status?: string }) =>
    request<Complaint>(`/complaints/${id}/respond`, { method: 'PATCH', body: JSON.stringify(data) }),

  escalateComplaint: (id: string) =>
    request<Complaint>(`/complaints/${id}/escalate`, { method: 'PATCH' }),

  // ── Payments ──────────────────────────────────────────────────────────────
  getManufacturerPaymentSummary: () =>
    request<any>('/manufacturer/payment/summary'),

  getManufacturerEarnings: (period: string) => 
    request<any>(`/manufacturer/payment/earnings?period=${period}`),

  getActiveSettlement: () =>
    request<any>('/manufacturer/payment/settlement/active'),

  getTransactions: (params: { page: number, limit: number, type?: string, status?: string, search?: string }) => {
    const query = new URLSearchParams({
      page: params.page.toString(),
      limit: params.limit.toString(),
      ...(params.type && { type: params.type }),
      ...(params.status && { status: params.status }),
      ...(params.search && { search: params.search }),
    }).toString();
    return request<any>(`/manufacturer/payment/transactions?${query}`);
  },

  getBanks: () =>
    request<any>('/manufacturer/payment/banks'),

  addBank: (data: any) =>
    request<any>('/manufacturer/payment/banks', { method: 'POST', body: JSON.stringify(data) }),

  deleteBank: (bankId: string) =>
    request<any>(`/manufacturer/payment/banks/${bankId}`, { method: 'DELETE' }),

  generateCustomReport: (data: { type: string, period: string, format: 'pdf' | 'excel' }) =>
    request<any>('/manufacturer/payment/report/generate', { method: 'POST', body: JSON.stringify(data) }),

  withdrawFunds: (amount: number, bankId?: string) =>
    request<any>('/manufacturer/payment/withdraw', { method: 'POST', body: JSON.stringify({ amount, bankId }) }),

  downloadSettlementReport: () =>
    request<any>('/manufacturer/payment/report'),

  downloadManufacturerReport: async (period: string = '6months') => {
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
    const res = await fetch(`${base}/manufacturer/payment/report?format=pdf&period=${period}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    });
    if (!res.ok) throw new Error('Download failed');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'settlement-report.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  getAdminStats: () => request<any>('/admin/stats'),

  getAdminAnalytics: () => request<any>('/admin/analytics'),

  getAdminManufacturers: (params?: { status?: string; page?: number; limit?: number }) => {
    const qs = params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)]))).toString() : '';
    return request<{ data: any[]; total: number; page: number }>(`/admin/manufacturers${qs}`);
  },

  approveManufacturer: (id: string) =>
    request<any>(`/admin/manufacturers/${id}/approve`, { method: 'PATCH' }),

  rejectManufacturer: (id: string, reason?: string) =>
    request<any>(`/admin/manufacturers/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),

  getAdminComplaints: (params?: { status?: string; limit?: number }) => {
    const qs = params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)]))).toString() : '';
    return request<{ data: any[]; total: number }>(`/admin/complaints${qs}`);
  },

  resolveAdminComplaint: (id: string, data: { status: string; adminNote?: string }) =>
    request<any>(`/admin/complaints/${id}/resolve`, { method: 'PATCH', body: JSON.stringify(data) }),

  getAdminOrders: (params?: { status?: string; page?: number }) => {
    const qs = params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)]))).toString() : '';
    return request<{ data: any[]; total: number }>(`/admin/orders${qs}`);
  },

  getAdminBuyers: (params?: { page?: number }) => {
    const qs = params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)]))).toString() : '';
    return request<{ data: any[]; total: number }>(`/admin/buyers${qs}`);
  },

  // ── Notifications ─────────────────────────────────────────────────────────
  getNotifications: (params?: { limit?: number; unreadOnly?: boolean }) => {
    const qs = params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)]))).toString() : '';
    return request<{ notifications: Notification[]; unreadCount: number }>(`/notifications${qs}`);
  },

  markNotificationRead: (id: string) =>
    request<Notification>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    request<{ message: string }>('/notifications/read-all', { method: 'PATCH' }),

  deleteNotification: (id: string) =>
    request<{ message: string }>(`/notifications/${id}`, { method: 'DELETE' }),

  // ── Schedule / Calls ──────────────────────────────────────────────────────
  getScheduledCalls: () => request<any[]>('/schedule'),

  bookCall: (data: {
    manufacturerId: string;
    scheduledAt: string;
    duration?: number;
    purpose?: string;
    dealId?: string;
  }) => request<any>('/schedule', { method: 'POST', body: JSON.stringify(data) }),

  confirmCall: (id: string, meetingLink?: string) =>
    request<any>(`/schedule/${id}/confirm`, { method: 'PATCH', body: JSON.stringify({ meetingLink }) }),

  cancelCall: (id: string, reason?: string) =>
    request<any>(`/schedule/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({ reason }) }),

  rescheduleCall: (id: string, scheduledAt: string) =>
    request<any>(`/schedule/${id}/reschedule`, { method: 'PATCH', body: JSON.stringify({ scheduledAt }) }),

  getManufacturerAvailability: (manufacturerId: string) =>
    request<any[]>(`/schedule/availability/${manufacturerId}`),

  // ── Companies / Storefronts ───────────────────────────────────────────────
  getCompanies: (params?: { q?: string; category?: string; location?: string; page?: number; limit?: number }) => {
    const qs = params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)]))).toString() : '';
    return request<{ data: any[]; total: number; page: number }>(`/companies${qs}`);
  },

  getCompany: (id: string) => request<{ user: any; profile: any; products: any[] }>(`/companies/${id}`),

  getCompanyByCode: (code: string) => request<any>(`/companies/by-code/${code}`),

  saveCompanyProfile: (data: any) =>
    request<any>('/companies/profile', { method: 'POST', body: JSON.stringify(data) }),

  getMyManufacturerProfile: () => request<any>('/companies/profile/me'),

  // ── KYC / Automated Verification ───────────────────────────────────────────
  verifyGST: (gstNumber: string, panNumber: string) =>
    request<any>('/kyc/gst', { method: 'POST', body: JSON.stringify({ gstNumber, panNumber }) }),

  verifyBank: (data: { accountName: string; accountNumber: string; ifscCode: string }) =>
    request<any>('/kyc/bank-verify', { method: 'POST', body: JSON.stringify(data) }),

  // ── Communication & Context ───────────────────────────────────────────────
  checkCallContext: (mfrId: string) =>
    request<{ canSchedule: boolean; reason?: string }>(`/communication/check-call-context/${mfrId}`),

  getQuickReplies: () =>
    request<any[]>('/communication/quick-replies'),

  saveQuickReply: (data: { title: string; message: string }) =>
    request<any>('/communication/quick-replies', { method: 'POST', body: JSON.stringify(data) }),

  deleteQuickReply: (id: string) =>
    request<any>(`/communication/quick-replies/${id}`, { method: 'DELETE' }),

  // ── Addresses ─────────────────────────────────────────────────────────────
  getAddresses: () => request<Address[]>('/addresses'),

  addAddress: (data: Partial<Address>) =>
    request<Address>('/addresses', { method: 'POST', body: JSON.stringify(data) }),

  updateAddress: (id: string, data: Partial<Address>) =>
    request<Address>(`/addresses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteAddress: (id: string) =>
    request<any>(`/addresses/${id}`, { method: 'DELETE' }),

  // Alias for getting any user/company profile by ID
  getUserProfile: (id: string) => request<any>(`/companies/${id}`),

  // ── Manufacturer stats ────────────────────────────────────────────────────
  getManufacturerStats: () => request<{
    todayRevenue: number;
    todayOrderCount: number;
    pendingConfirmations: number;
    lowStockAlerts: number;
    openComplaints: number;
    upcomingCalls: number;
    totalProducts: number;
  }>('/manufacturer/stats'),

  // ── Shipment (extended) ───────────────────────────────────────────────────
  updateShipmentStatus: (id: string, data: { status: string; location?: string; message?: string }) =>
    request<any>(`/shipments/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),

  checkCombineOrders: () =>
    request<{ groups: { city: string; orders: any[] }[] }>('/shipments/combine-check'),

  getShipmentReminders: () =>
    request<{ reminders: any[] }>('/shipments/reminders/check'),

  getConfirmedOrders: () =>
    request<any[]>('/orders?status=Confirmed'),

  // ── Holiday Calendar ───────────────────────────────────────────────────────
  getHolidaySettings: () =>
    request<any>('/manufacturer/holiday'),

  saveHolidaySettings: (data: {
    weeklyOffDays?: number[];
    holidays?: { date: string; label: string }[];
    backInOfficeDate?: string;
    autoResponse?: string;
    isOnHoliday?: boolean;
  }) => request<any>('/manufacturer/holiday', { method: 'PATCH', body: JSON.stringify(data) }),

  dismissWelcomeBack: () =>
    request<any>('/manufacturer/holiday/dismiss-welcome', { method: 'PATCH' }),

  checkManufacturerHoliday: (manufacturerId: string) =>
    request<{
      isOnHoliday: boolean;
      backInOfficeDate: string;
      autoResponse: string;
      weeklyOffDays: number[];
      holidays: { date: string; label: string }[];
    }>(`/manufacturer/holiday/check/${manufacturerId}`),
};


// ── Shared types ──────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'manufacturer' | 'buyer' | 'admin';
  company?: string;
  location?: string;
  avatar?: string;
  manufacturerStatus?: 'pending' | 'approved' | 'rejected' | 'suspended';
  isActive?: boolean;
  addresses?: Address[];
}

export interface Address {
  _id?: string;
  fullName: string;
  companyName?: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
  isDefault?: boolean;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role: 'manufacturer' | 'buyer' | 'admin';
  company?: string;
  location?: string;
}

export interface Product {
  _id: string;
  name: string;
  price: number;
  priceRaw?: number;
  unit: string;
  moq: number;
  material?: string;
  sizes: string[];
  rating: number;
  image?: string;
  category?: string;
  stock?: number;
  isActive?: boolean;
  manufacturer: string | User;
}

export interface Order {
  _id: string;
  orderId: string;
  buyer: { name: string; location: string; initials: string; ref?: string };
  manufacturer: string | User;
  items: string;
  value: string;
  valueRaw?: number;
  status: 'In Production' | 'Pending Payment' | 'Shipped' | 'Delivered' | 'Cancelled';
  expectedDate: string;
}

export interface Shipment {
  _id?: string;
  shipmentId: string;
  transportType: 'own_vehicle' | 'transport_company' | 'bus_cargo' | 'train_parcel' | 'courier';
  status: 'Processing' | 'Packed' | 'Dispatched' | 'In Transit' | 'Reached Hub' | 'Out for Delivery' | 'Delivered' | 'Delayed';
  arrival?: string;
  progress: number;
  // carrier/courier
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  // own vehicle / transport company
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
  transportCompany?: string;
  // bus cargo
  busServiceName?: string;
  busNumber?: string;
  parcelReceiptNumber?: string;
  departureBusStand?: string;
  destinationBusStand?: string;
  // train parcel
  trainName?: string;
  trainNumber?: string;
  parcelBookingNumber?: string;
  departureStation?: string;
  arrivalStation?: string;
  // common
  origin?: string;
  destination?: string;
  pickupLocation?: string;
  specialInstructions?: string;
  dispatchDate?: string;
  estimatedDelivery?: string;
  manufacturer?: any;
  orders?: any[];
  order?: any;
  trackingEvents?: { status: string; location: string; time: string; message: string }[];
}

export interface Deal {
  _id: string;
  title: string;
  subtitle: string;
  priority: 'HIGH' | 'STANDARD' | 'NEW';
  status: 'Negotiating' | 'Waiting' | 'New Offer' | 'Accepted' | 'Rejected';
  price: string;
  priceRaw?: number;
  time: string;
  round?: number;
  maxRounds?: number;
  expiresAt?: string;
  acceptedAt?: string;
  rejectionReason?: string;
  counterBy?: 'buyer' | 'manufacturer';
  buyer?: string | User;
  manufacturer?: string | User;
  product?: string | Product;
  negotiationHistory?: any[];
}

export interface Message {
  _id: string;
  deal: string;
  sender: User;
  senderRole: string;
  content: string;
  type: 'text' | 'product' | 'proposal';
  createdAt: string;
}

export interface Complaint {
  _id: string;
  complaintId: string;
  title: string;
  company: string;
  category: string;
  status: 'ESCALATED' | 'ADMIN REVIEWED' | 'PENDING' | 'RESOLVED' | 'REJECTED';
  description?: string;
  evidence?: string[];
  response?: string;
  filingDate?: string;
}

export interface Settlement {
  _id: string;
  referenceId: string;
  date: string;
  recipient: string;
  amount: string;
  amountRaw: number;
  status: 'COMPLETED' | 'HELD' | 'PENDING' | 'FAILED';
  type: 'bank' | 'manual' | 'refund';
}

export interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}
