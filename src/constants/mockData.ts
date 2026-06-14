import type {
  AdminSummary,
  CustomerProfile,
  Dispute,
  Notification,
  Order,
  Payment,
  Product,
  Review,
  User,
  Vendor,
  VendorCategory,
} from "@/types";

// MOCK DATA: Data sementara untuk pengembangan UI
// TODO API: Ganti seluruh mock data ini dengan response API backend
export const mockUsers: User[] = [
  { id: "u1", name: "Alya Putri", email: "alya@example.com", role: "CUSTOMER", status: "ACTIVE" },
  {
    id: "u2",
    name: "Atelier Aurora",
    email: "vendor@example.com",
    role: "VENDOR",
    status: "ACTIVE",
  },
  { id: "u3", name: "Admin PYW", email: "admin@example.com", role: "ADMIN", status: "ACTIVE" },
];
export const mockCustomers: CustomerProfile[] = [
  {
    id: "c1",
    userId: "u1",
    name: "Alya Putri",
    phone: "081234567890",
    address: "Jakarta Selatan",
    wedding: {
      weddingDate: "2026-11-21",
      location: "The Glass House",
      city: "Jakarta",
      province: "DKI Jakarta",
      eventType: "Pernikahan",
      theme: "Modern Romantic",
      estimatedGuests: 500,
      estimatedBudget: 250000000,
      neededCategories: ["Venue", "Catering", "Photography"],
    },
  },
];
export const mockCategories: VendorCategory[] = [
  "Catering",
  "Wedding Organizer",
  "Decoration",
  "Makeup Artist",
  "Photography",
  "Videography",
  "Venue",
  "Entertainment",
  "Invitation",
  "Souvenir",
  "Sound System & Lighting",
  "MC",
  "Wedding Cake",
  "Henna",
  "Transportation",
  "Jewelry",
  "Live Streaming",
].map((name, index) => ({ id: `cat-${index + 1}`, name, icon: "Sparkles" }));
export const mockVendors: Vendor[] = [
  {
    id: "v1",
    name: "Atelier Aurora",
    ownerName: "Nadia Rahman",
    description: "Dekorasi pernikahan modern dengan detail personal.",
    city: "Jakarta",
    categories: ["Decoration", "Wedding Organizer"],
    rating: 4.9,
    status: "VERIFIED_ACTIVE",
    image:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "v2",
    name: "Rasa & Cerita",
    ownerName: "Bima Santoso",
    description: "Catering premium dengan menu Nusantara kontemporer.",
    city: "Bandung",
    categories: ["Catering"],
    rating: 4.8,
    status: "VERIFIED_ACTIVE",
    image:
      "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "v3",
    name: "Lumiere Studio",
    ownerName: "Dewi Anggraeni",
    description: "Foto dan film pernikahan yang hangat dan editorial.",
    city: "Surabaya",
    categories: ["Photography", "Videography"],
    rating: 4.7,
    status: "PENDING_VERIFICATION",
    image:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80",
  },
];
export const mockProducts: Product[] = [
  {
    id: "p1",
    vendorId: "v1",
    name: "Aurora Signature Decoration",
    category: "Decoration",
    description: "Dekorasi lengkap akad dan resepsi dengan konsep personal.",
    price: 45000000,
    minimumDp: 13500000,
    duration: "12 jam",
    guestCapacity: 600,
    serviceArea: "Jabodetabek",
    status: "ACTIVE",
    image: mockVendors[0].image,
  },
  {
    id: "p2",
    vendorId: "v2",
    name: "Nusantara Grand Buffet",
    category: "Catering",
    description: "Paket buffet premium untuk resepsi besar.",
    price: 85000000,
    minimumDp: 25000000,
    duration: "6 jam",
    guestCapacity: 500,
    serviceArea: "Bandung Raya",
    status: "ACTIVE",
    image: mockVendors[1].image,
  },
];
export const mockOrders: Order[] = [
  {
    id: "o1",
    number: "PYW-260601",
    customerName: "Alya Putri",
    vendorName: "Atelier Aurora",
    productName: "Aurora Signature Decoration",
    eventDate: "2026-11-21",
    location: "The Glass House, Jakarta",
    total: 45000000,
    status: "CONFIRMED",
    paymentStatus: "PAID",
  },
  {
    id: "o2",
    number: "PYW-260602",
    customerName: "Alya Putri",
    vendorName: "Rasa & Cerita",
    productName: "Nusantara Grand Buffet",
    eventDate: "2026-11-21",
    location: "The Glass House, Jakarta",
    total: 85000000,
    status: "PENDING_PAYMENT",
    paymentStatus: "WAITING_VERIFICATION",
  },
];
export const mockPayments: Payment[] = [
  {
    id: "pay1",
    orderNumber: "PYW-260602",
    customerName: "Alya Putri",
    vendorName: "Rasa & Cerita",
    amount: 25000000,
    status: "WAITING_VERIFICATION",
    uploadedAt: "2026-06-06",
  },
];
export const mockReviews: Review[] = [
  {
    id: "r1",
    vendorName: "Atelier Aurora",
    customerName: "Sinta & Raka",
    rating: 5,
    comment: "Tim sangat responsif dan hasil dekorasinya indah.",
    status: "VISIBLE",
  },
];
export const mockNotifications: Notification[] = [
  {
    id: "n1",
    title: "Pembayaran sedang diverifikasi",
    message: "Bukti pembayaran pesanan PYW-260602 telah diterima.",
    createdAt: "2026-06-06",
    read: false,
  },
];
export const mockAdminSummary: AdminSummary = {
  totalUsers: 12840,
  totalVendors: 864,
  pendingVendors: 18,
  totalProducts: 3240,
  totalOrders: 6842,
  pendingPayments: 27,
  openDisputes: 9,
  revenue: 2840000000,
};
export const mockDisputes: Dispute[] = [
  {
    id: "d1",
    reporter: "Alya Putri",
    reportedParty: "Vendor Contoh",
    reason: "Layanan tidak sesuai deskripsi",
    status: "IN_REVIEW",
  },
];
