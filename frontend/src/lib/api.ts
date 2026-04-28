const BASE = import.meta.env.VITE_API_URL ?? 'https://vyavan-api-production.up.railway.app/api';

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

  googleLogin: (token: string, role?: string) =>
    request<{ token: string; user: User }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token, role }),
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

  updateLanguage: (language: string) =>
    request<User>('/auth/language', { 
      method: 'PATCH', 
      body: JSON.stringify({ language }) 
    }),

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

  analyzeProductImage: (imageUrl: string, instruction?: string) =>
    request<{
      product_type: string;
      quality_score: number;
      issues: string[];
      suggestions: string[];
      background_type: string;
      lighting_quality: string;
    }>('/ai/analyze-image', { method: 'POST', body: JSON.stringify({ imageUrl, instruction }) }),

  smartListerAnalyze: async (front?: File, back?: File) => {
    const formData = new FormData();
    if (front) formData.append('front', front);
    if (back) formData.append('back', back);
    
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api';
    
    const res = await fetch(`${base}/product-lister/analyze`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Analysis failed' }));
      throw new Error(err.message);
    }
    
    return res.json() as Promise<{
      success: boolean;
      cloudinaryUrls: { front?: string; back?: string };
      analysis: {
        name: string;
        category: string;
        shortDescription: string;
        description: string;
        specs: Record<string, string>;
        keyFeatures: string[];
        seoTags: string[];
        hsCode: string;
        packagingType: string;
        suggestedPrice: number;
        suggestedMoq: number;
      };
    }>;
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  getOrders: (params?: { status?: string }) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string,string>).toString() : '';
    return request<Order[]>(`/orders${qs}`);
  },

  // ── Cart ──────────────────────────────────────────────────────────────────
  getCart: () => request<any>('/cart'),
  addToCart: (productId: string, quantity: number, isSample?: boolean) => 
    request<any>('/cart/add', { method: 'POST', body: JSON.stringify({ productId, quantity, isSample: !!isSample }) }),
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
    payment_term?: string;
    appliedRewardValue?: number;
    appliedGroupId?: string;
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

  // ── Negotiation (New) ───────────────────────────────────────────────────
  getNegotiations: () => request<Negotiation[]>('/negotiation'),
  
  getNegotiation: (id: string) => request<Negotiation & { rounds: NegotiationRound[] }>(`/negotiation/${id}`),

  initiateNegotiation: (data: { 
    manufacturer: string; 
    product: string; 
    quantity: number; 
    offeredPrice: number; 
    message: string 
  }) => request<Negotiation>('/negotiation', { method: 'POST', body: JSON.stringify(data) }),

  counterOffer: (id: string, data: { offeredPrice: number; message: string }) =>
    request<NegotiationRound>(`/negotiation/${id}/counter`, { method: 'POST', body: JSON.stringify(data) }),

  updateNegotiationStatus: (id: string, status: 'Accepted' | 'Rejected') =>
    request<Negotiation>(`/negotiation/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // ── Existing Deals (Legacy) ───────────────────────────────────────────────
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

  getAdminManufacturers: (params?: { status?: string; page?: number; limit?: number; name?: string; city?: string; state?: string; plan?: string; sector?: string; sortBy?: string }) => {
    const qs = params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined && v !== '').map(([k,v]) => [k, String(v)]))).toString() : '';
    return request<{ data: any[]; total: number; page: number }>(`/admin/manufacturers${qs}`);
  },

  getAdminBuyers: (params?: { page?: number; limit?: number; status?: string; search?: string; type?: string; sortBy?: string }) => {
    const qs = params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined && v !== '').map(([k,v]) => [k, String(v)]))).toString() : '';
    return request<{ data: any[]; total: number; page: number }>(`/admin/buyers${qs}`);
  },

  getAdminBuyerProfile: (id: string) =>
    request<{ user: any; profile: any; orders: any[]; favorites: any[]; complaints: any[]; activity: any[] }>(`/admin/buyers/${id}/profile`),

  getAdminBuyerActivityStats: (id: string) =>
    request<{ loginFrequency: any[]; queries: any[]; cart: any }>(`/admin/buyers/${id}/activity-stats`),

  getGlobalActivityLogs: (params?: { page?: number; limit?: number; user?: string; action?: string; isSuspicious?: boolean }) => {
    const qs = params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)]))).toString() : '';
    return request<{ data: any[]; total: number; page: number }>(`/admin/logs/global${qs}`);
  },

  getAdminManufacturerProfile: (id: string) =>
    request<{ user: any; profile: any; stats: any }>(`/admin/manufacturers/${id}/profile`),

  getAdminManufacturerBuyers: (id: string) =>
    request<{ buyers: any[] }>(`/admin/manufacturers/${id}/buyers`),

  changeManufacturerPlan: (id: string, plan: string) =>
    request<any>(`/admin/manufacturers/${id}/plan`, { method: 'PATCH', body: JSON.stringify({ plan }) }),

  resetManufacturerPassword: (id: string) =>
    request<any>(`/admin/manufacturers/${id}/reset-password`, { method: 'POST' }),

  suspendManufacturer: (id: string) =>
    request<any>(`/admin/manufacturers/${id}/suspend`, { method: 'PATCH' }),

  approveManufacturer: (id: string) =>
    request<any>(`/admin/manufacturers/${id}/approve`, { method: 'PATCH' }),

  rejectManufacturer: (id: string, reason?: string) =>
    request<any>(`/admin/manufacturers/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),

  requestMoreDocs: (id: string, note: string) =>
    request<any>(`/admin/manufacturers/${id}/request-docs`, { method: 'PATCH', body: JSON.stringify({ note }) }),

  getEscrowMetrics: () =>
    request<{ totalHeld: number; orders: any[] }>('/admin/finance/escrow'),

  getCommissionHistory: () =>
    request<any[]>('/admin/finance/commissions'),

  getAnalyticGMV: (days: number = 30) =>
    request<any[]>(`/admin/analytics/gmv-trend?days=${days}`),

  getAnalyticSectors: () =>
    request<any[]>('/admin/analytics/sectors'),

  getAnalyticGeo: () =>
    request<any[]>('/admin/analytics/geography'),

  getPricingPlans: () =>
    request<{ plans: any[]; stats: any[] }>('/admin/plans'),

  overrideUserPlan: (data: { userId: string; planType: string; reason: string }) =>
    request<any>('/admin/plans/override', { method: 'POST', body: JSON.stringify(data) }),

  getBroadcasts: () =>
    request<any[]>('/admin/broadcasts'),

  createBroadcast: (data: any) =>
    request<any>('/admin/broadcasts', { method: 'POST', body: JSON.stringify(data) }),

  getDisputeAnalytics: () =>
    request<{ ranking: any[]; resolutionStats: any[] }>('/admin/complaints/analytics/dispute-rate'),

  getDisputeDetail: (id: string) =>
    request<{ complaint: any; order: any }>(`/admin/complaints/${id}`),

  resolveDispute: (id: string, data: { decision: string; refundAmount: number; adminNote: string }) =>
    request<any>(`/admin/complaints/${id}/dispute-resolve`, { method: 'PATCH', body: JSON.stringify(data) }),

  resolveAdminComplaint: (id: string, data: { status: string; adminNote?: string }) =>
    request<any>(`/admin/complaints/${id}/resolve`, { method: 'PATCH', body: JSON.stringify(data) }),

  getAdminOrders: (params?: { page?: number; status?: string; search?: string; sector?: string; minVal?: number; maxVal?: number; startDate?: string; endDate?: string }) => {
    const qs = params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)]))).toString() : '';
    return request<{ data: any[]; total: number; page: number }>(`/admin/orders${qs}`);
  },

  getStuckOrders: () =>
    request<{ notDispatched: any[]; notConfirmed: any[] }>('/admin/orders/stuck'),

  getAdminOrderDetail: (id: string) =>
    request<any>(`/admin/orders/${id}`),

  updateOrderAdminNotes: (id: string, notes: string) =>
    request<any>(`/admin/orders/${id}/admin-notes`, { method: 'PATCH', body: JSON.stringify({ notes }) }),

  updateOrderEscrow: (id: string, status: string) =>
    request<any>(`/admin/orders/${id}/escrow`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  nudgePartner: (id: string) =>
    request<any>(`/admin/orders/${id}/remind`, { method: 'POST' }),

  getAdminBuyersList: (params?: { status?: string; page?: number; limit?: number }) => {
    const qs = params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)]))).toString() : '';
    return request<{ data: any[]; total: number }>(`/admin/buyers${qs}`);
  },

  approveBuyer: (id: string) =>
    request<any>(`/admin/manufacturers/${id}/approve`, { method: 'PATCH' }), // Reusing verification logic

  rejectBuyer: (id: string, reason?: string) =>
    request<any>(`/admin/manufacturers/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ reason }) }),

  suspendUser: (id: string, reason?: string) =>
    request<any>(`/admin/manufacturers/${id}/suspend`, { method: 'PATCH', body: JSON.stringify({ reason }) }),

  resetUserPassword: (id: string) =>
    request<any>(`/admin/manufacturers/${id}/reset-password`, { method: 'POST' }),

  flagRelationship: (data: { manufacturerId: string; buyerId: string; isSuspicious: boolean; reason?: string }) =>
    request<any>('/admin/relationships/flag', { method: 'PATCH', body: JSON.stringify(data) }),

  getSystemFlags: (params?: { status?: string; severity?: string; type?: string }) => {
    const qs = params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([,v]) => v !== undefined).map(([k,v]) => [k, String(v)]))).toString() : '';
    return request<any[]>(`/admin/flags${qs}`);
  },

  runFraudScan: () =>
    request<any>('/admin/flags/run-scan', { method: 'POST' }),

  resolveFlag: (id: string, data: { status: string; note: string }) =>
    request<any>(`/admin/flags/${id}/resolve`, { method: 'PATCH', body: JSON.stringify(data) }),

  getFlagSummary: () =>
    request<any[]>('/admin/flags/summary'),

  revokeSubuser: (id: string) =>
    request<any>(`/admin/sub-users/${id}/revoke`, { method: 'PATCH' }),

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

  getAiShipmentPlan: () =>
    request<any>('/shipments/ai-plan'),

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

  getOnboardingAdvice: () =>
    request<any>('/manufacturer/onboarding-assistant'),

  // ── Credit & Payment Terms (New) ───────────────────────────────────────────
  getCreditPaymentSettings: (mfrId: string) =>
    request<PaymentSettings>(`/credit-terms/manufacturers/${mfrId}/payment-settings`),

  updateCreditPaymentSettings: (mfrId: string, data: Partial<PaymentSettings>) =>
    request<PaymentSettings>(`/credit-terms/manufacturers/${mfrId}/payment-settings`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getBuyerPaymentTerms: (mfrId: string, buyerId: string) =>
    request<BuyerTerms & { outstanding_balance: number }>(`/credit-terms/manufacturers/${mfrId}/buyers/${buyerId}/terms`),

  updateBuyerPaymentTerms: (mfrId: string, buyerId: string, data: any) =>
    request<BuyerTerms>(`/credit-terms/manufacturers/${mfrId}/buyers/${buyerId}/terms`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteBuyerPaymentTerms: (mfrId: string, buyerId: string) =>
    request<any>(`/credit-terms/manufacturers/${mfrId}/buyers/${buyerId}/terms`, { method: 'DELETE' }),

  getReceivables: (mfrId: string, params?: { status?: string; buyer_id?: string; sort?: string }) => {
    const qs = params ? '?' + new URLSearchParams(Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined))).toString() : '';
    return request<{ list: Receivable[]; summary: any }>(`/credit-terms/manufacturers/${mfrId}/receivables${qs}`);
  },

  markPaymentPaid: (recordId: string, data: any) =>
    request<any>(`/credit-terms/payment-records/${recordId}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  sendPaymentReminder: (recordId: string) =>
    request<any>(`/credit-terms/payment-records/${recordId}/send-reminder`, { method: 'POST' }),
  
  getRemindersLog: (mfrId: string) =>
    request<any[]>(`/credit-terms/manufacturers/${mfrId}/reminders-log`),

  getCheckoutAvailableTerms: (params: { mfr_id: string; buyer_id: string; order_amount: number }) => {
    const qs = '?' + new URLSearchParams({
      manufacturer_id: params.mfr_id,
      buyer_id: params.buyer_id,
      order_amount: params.order_amount.toString()
    }).toString();
    return request<{ available_terms: PaymentTerm[]; restricted: boolean; reason: 'credit_limit' | 'overdue_flag' | null }>(`/credit-terms/checkout/available-terms${qs}`);
  },

  extractProductDetails: async (images: File[]) => {
    const formData = new FormData();
    images.forEach(img => formData.append('images', img));
    
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE}/product-lister/extract-multi`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message ?? 'Extraction failed');
    }
    return res.json() as Promise<{
      success: boolean;
      imageUrls: string[];
      analysis: {
        name: string;
        category: string;
        description: string;
        specs: Record<string, string>;
        pricing_guess: number;
        moq_guess: number;
        payment_terms_guess: string[];
      };
    }>;
  },

  // ── Reviews ───────────────────────────────────────────────────────────────
  getReviews: (manufacturerId: string) =>
    request<Review[]>(`/reviews/manufacturer/${manufacturerId}`),

  submitReview: (data: {
    orderId: string;
    ratings: { quality: number; delivery: number; communication: number };
    comment?: string;
    images?: string[];
  }) => request<Review>('/reviews', { method: 'POST', body: JSON.stringify(data) }),

  editReview: (id: string, data: {
    ratings?: { quality: number; delivery: number; communication: number };
    comment?: string;
    images?: string[];
  }) => request<Review>(`/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  replyToReview: (id: string, text: string) =>
    request<Review>(`/reviews/${id}/reply`, { method: 'PATCH', body: JSON.stringify({ text }) }),

  // ── groups ───────────────────────────────────────────────────────────────
  getBuyerPool: () => request<BuyerPoolMember[]>('/groups/pool'),
  
  getGroups: () => request<BuyerGroup[]>('/groups'),
  
  createGroup: (data: Partial<BuyerGroup>) => 
    request<BuyerGroup>('/groups', { method: 'POST', body: JSON.stringify(data) }),
    
  addMembersToGroup: (groupId: string, buyerIds: string[]) =>
    request<{ message: string }>('/groups/members/add', { method: 'POST', body: JSON.stringify({ groupId, buyerIds }) }),
    
  removeMemberFromGroup: (buyerId: string) =>
    request<{ message: string }>('/groups/members/remove', { method: 'DELETE', body: JSON.stringify({ buyerId }) }),
    
  checkGroupReward: (manufacturerId: string) =>
    request<{ hasReward: boolean, groupId?: string, groupName?: string, rewardType?: string, rewardValue?: number }>(`/groups/check/${manufacturerId}`),
    
  getMyRewards: () => 
    request<any[]>('/groups/my-rewards'),

  activateManufacturer: (code: string) =>
    request<any>('/manufacturer/activate', { method: 'POST', body: JSON.stringify({ code }) }),
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
  isActivated?: boolean;
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
  status: 'In Production' | 'Pending Payment' | 'Shipped' | 'Delivered' | 'Cancelled' | 'New' | 'Confirmed' | 'Rejected';
  expectedDate: string;
  products?: { product: string | Product; quantity: number; isSample: boolean; price: number }[];
  isReviewed?: boolean;
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
  requestedTerm?: string;
  buyer?: string | User;
  manufacturer?: string | User;
  product?: string | Product;
  negotiationHistory?: {
    round: number;
    offeredBy: 'buyer' | 'manufacturer';
    price: number;
    term?: string;
    message: string;
    createdAt: string;
  }[];
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

export interface Negotiation {
  _id: string;
  buyer: string | User;
  manufacturer: string | User;
  product: string | Product;
  quantity: number;
  currentOfferPrice: number;
  status: 'Initiated' | 'Active' | 'Accepted' | 'Rejected' | 'Expired';
  totalRounds: number;
  maxRounds: number;
  expiresAt: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface NegotiationRound {
  _id: string;
  negotiationId: string;
  sender: string | User;
  senderRole: 'buyer' | 'manufacturer';
  offeredPrice: number;
  message: string;
  roundNumber: number;
  isLatest: boolean;
  isRead: boolean;
  createdAt: string;
}

export type PaymentTerm = 'advance_100' | 'split_50_50' | 'net_15' | 'net_30';
export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue';

export interface PaymentSettings {
  id: string;
  manufacturer_id: string;
  allowed_terms: PaymentTerm[];
  default_terms: PaymentTerm;
}

export interface BuyerTerms {
  id: string;
  manufacturer_id: string;
  buyer_id: string;
  allowed_terms: PaymentTerm[];
  credit_limit: number;
  is_flagged: boolean;
  notes?: string;
  buyer?: { id: string; user_id: string; name: string }; // Optional for display
}

export interface Receivable {
  id: string;
  order_id: string;
  payment_term: PaymentTerm;
  total_amount: number;
  amount_paid: number;
  amount_due: number;
  due_date: string;
  status: PaymentStatus;
  days_overdue?: number;
  buyer_name?: string;
}

export interface Review {
  _id: string;
  order: string;
  buyer: string | User;
  manufacturer: string;
  ratings: {
    quality: number;
    delivery: number;
    communication: number;
    overall: number;
  };
  comment?: string;
  images?: string[];
  manufacturerReply?: {
    text: string;
    repliedAt: string;
  };
  isEdited: boolean;
  isFlagged: boolean;
  createdAt: string;
}

export interface BuyerGroup {
  _id: string;
  name: string;
  description?: string;
  rewardType: 'percentage_discount' | 'flat_discount' | 'free_shipping' | 'priority_badge';
  rewardValue: number;
  isActive: boolean;
  memberCount?: number;
}

export interface BuyerPoolMember {
  _id: string;
  name: string;
  email: string;
  lastLogin?: string;
  accountAgeMonths: number;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  currentGroup?: { id: string, name: string } | null;
}
