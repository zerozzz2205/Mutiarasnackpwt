import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Filter, 
  MessageCircle, 
  Settings, 
  X,
  ChevronRight,
  TrendingUp,
  Package,
  Lock,
  LogOut,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Types ---
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  imageUrl: string;
}

interface Toast {
  message: string;
  type: 'success' | 'error';
  id: number;
}

// --- Constants ---
const STORAGE_KEY = 'mutiara_snack_products';
const AUTH_KEY = 'mutiara_snack_auth';
const WHATSAPP_NUMBER = '628123456789'; 
const ADMIN_PASSWORD = 'Mutiara2026';

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Keripik Tempe Renyah',
    price: 15000,
    category: 'Keripik',
    imageUrl: 'https://images.unsplash.com/photo-1621932953986-15fcfec79685?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: '2',
    name: 'Kacang Telur Spesial',
    price: 20000,
    category: 'Kacang',
    imageUrl: 'https://images.unsplash.com/photo-1599599810694-b5d438096345?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: '3',
    name: 'Peyek Kacang Gurih',
    price: 12000,
    category: 'Peyek',
    imageUrl: 'https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?auto=format&fit=crop&q=80&w=400',
  },
  {
    id: '4',
    name: 'Keripik Singkong Pedas',
    price: 15000,
    category: 'Keripik',
    imageUrl: 'https://images.unsplash.com/photo-1600271886399-52316aff0dfc?auto=format&fit=crop&q=80&w=400',
  }
];

export default function App() {
  // --- State ---
  const [products, setProducts] = useState<Product[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [isLoaded, setIsLoaded] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  // Hidden portal state
  const [logoClicks, setLogoClicks] = useState(0);
  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Form State
  const [passwordInput, setPasswordInput] = useState('');
  const [newProduct, setNewProduct] = useState<Omit<Product, 'id'>>({
    name: '',
    price: 0,
    category: 'Cemilan',
    imageUrl: '',
  });

  // --- Effects ---
  useEffect(() => {
    // Initialize Auth
    const authSession = sessionStorage.getItem(AUTH_KEY);
    if (authSession === 'true') {
      setIsAuthenticated(true);
    }

    // Initialize LocalStorage Products
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setProducts(JSON.parse(saved));
    } else {
      setProducts(INITIAL_PRODUCTS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PRODUCTS));
    }
    setIsLoaded(true);
  }, []);

  // Sync to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    }
  }, [products, isLoaded]);

  // --- Actions ---
  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { message, type, id }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleLogoClick = () => {
    if (isAuthenticated) {
      setIsAdminDashboardOpen(true);
      return;
    }

    const newCount = logoClicks + 1;
    setLogoClicks(newCount);

    if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    
    clickTimeoutRef.current = setTimeout(() => {
      setLogoClicks(0);
    }, 2000);

    if (newCount >= 5) {
      setIsLoginModalOpen(true);
      setLogoClicks(0);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem(AUTH_KEY, 'true');
      setIsLoginModalOpen(false);
      setPasswordInput('');
      setIsAdminDashboardOpen(true);
      addToast('Login Berhasil! Selamat datang Admin.');
    } else {
      addToast('Password Salah! Silakan coba lagi.', 'error');
      setPasswordInput('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(AUTH_KEY);
    setIsAdminDashboardOpen(false);
    addToast('Berhasil Logout.');
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const product: Product = {
      ...newProduct,
      id: Date.now().toString(),
    };
    setProducts(prev => [product, ...prev]);
    setNewProduct({ name: '', price: 0, category: 'Cemilan', imageUrl: '' });
    addToast(`${product.name} telah ditambahkan ke katalog.`);
  };

  const handleDeleteProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    if (window.confirm(`Hapus ${product?.name}?`)) {
      setProducts(prev => prev.filter(p => p.id !== id));
      addToast(`${product?.name || 'Produk'} telah dihapus.`);
    }
  };

  // --- Helpers ---
  const categories = useMemo(() => {
    const cats = ['Semua', ...new Set(products.map(p => p.category))];
    return cats;
  }, [products]);

  const filteredProducts = products.filter(p => 
    activeCategory === 'Semua' || p.category === activeCategory
  );

  const getWhatsAppLink = (productName: string) => {
    const message = `Halo Mutiara Snack, saya mau pesan ${productName}. Apakah masih tersedia?`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div id="app-root" className="min-h-screen bg-[#FDF8F3] text-gray-800 font-sans selection:bg-orange-200">
      
      {/* --- Toast System --- */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-3 w-full max-w-sm px-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`flex items-center gap-3 p-4 rounded-2xl shadow-2xl backdrop-blur-md pointer-events-auto ${
                toast.type === 'success' 
                ? 'bg-green-500/90 text-white' 
                : 'bg-red-500/90 text-white'
              }`}
            >
              {toast.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
              <p className="text-sm font-bold">{toast.message}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* --- Navbar --- */}
      <nav id="navbar" className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div 
            id="logo-trigger"
            onClick={handleLogoClick}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="bg-orange-600 p-2 rounded-xl shadow-lg shadow-orange-200 group-active:scale-95 transition-transform">
              <ShoppingBag className="text-white w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-800 to-orange-600 bg-clip-text text-transparent italic">
                Mutiara Snack
              </h1>
              {logoClicks > 0 && !isAuthenticated && (
                <div className="flex gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i < logoClicks ? 'w-3 bg-orange-500' : 'w-1 bg-orange-100'}`} />
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsAdminDashboardOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors font-bold text-sm"
              >
                <Settings size={16} /> <span>Admin Dashboard</span>
              </button>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 p-2 sm:px-4 sm:py-2 rounded-full bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                title="Keluar"
              >
                <LogOut size={16} /> <span className="hidden sm:inline font-bold text-sm">Logout</span>
              </button>
            </div>
          ) : (
            <div className="text-xs text-orange-200 font-medium italic">UMKM Sidoarjo</div>
          )}
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section id="hero" className="relative py-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 text-center md:text-left">
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-1.5 mb-6 text-sm font-semibold tracking-wider text-orange-600 uppercase bg-orange-100 rounded-full"
            >
              Cemilan Khas Nusantara
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6"
            >
              Renyah di Mulut, <br />
              <span className="text-orange-600">Hangat di Hati.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg text-gray-600 mb-8 max-w-xl"
            >
              Nikmati kelezatan camilan tradisional buatan Ibu Triyanti. Dibuat dengan bahan premium untuk menemani setiap momen santai Anda.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center md:justify-start gap-4"
            >
              <a 
                href="#catalog"
                className="px-8 py-4 bg-orange-600 text-white font-bold rounded-2xl shadow-xl shadow-orange-200 hover:bg-orange-700 hover:-translate-y-1 transition-all flex items-center gap-2"
              >
                Lihat Katalog <ChevronRight size={20} />
              </a>
              <div className="flex -space-x-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-12 h-12 rounded-full border-4 border-white overflow-hidden bg-gray-200">
                    <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="Customer" />
                  </div>
                ))}
                <div className="flex items-center pl-6 text-sm text-gray-500 font-medium">
                  +1k Pembeli Mingguan
                </div>
              </div>
            </motion.div>
          </div>
          <div className="flex-1 relative">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl shadow-orange-100 border-8 border-white"
            >
              <img 
                src="https://images.unsplash.com/photo-1621932953986-15fcfec79685?auto=format&fit=crop&q=80&w=800" 
                alt="Highlight Produk" 
                className="w-full h-auto"
              />
            </motion.div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-700"></div>
          </div>
        </div>
      </section>

      {/* --- Catalog Section --- */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="relative">
            <div className="flex items-center gap-2 text-orange-600 mb-2 font-semibold">
              <TrendingUp size={20} />
              <span>Trending Sekarang</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 italic">Katalog Pilihan</h3>
            {isAuthenticated && (
              <span className="absolute -top-1 -right-24 px-2 py-0.5 bg-orange-100 text-orange-600 text-[10px] uppercase font-black rounded-lg border border-orange-200">
                Mode Management
              </span>
            )}
          </div>

          {/* Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Filter size={20} className="text-orange-400 mr-2 flex-shrink-0" />
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  activeCategory === cat 
                  ? 'bg-orange-600 text-white shadow-lg shadow-orange-100' 
                  : 'bg-white text-gray-600 border border-orange-100 hover:border-orange-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div id="product-grid" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product) => (
              <motion.div
                layout
                id={`product-${product.id}`}
                key={product.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="group bg-white rounded-[2.5rem] overflow-hidden border border-orange-50 hover:shadow-2xl hover:shadow-orange-100 transition-all duration-300 relative"
              >
                {/* Admin Delete Action Overlay */}
                {isAuthenticated && (
                  <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors border-2 border-white"
                      title="Hapus Produk"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}

                <div className="aspect-square overflow-hidden relative">
                  <img 
                    src={product.imageUrl || 'https://via.placeholder.com/400?text=No+Image'} 
                    alt={product.name} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-4 py-1.5 bg-white/90 backdrop-blur-sm text-orange-700 text-xs font-bold rounded-xl shadow-sm border border-orange-50">
                      {product.category}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <h4 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
                    {product.name}
                  </h4>
                  <div className="text-orange-600 font-black text-xl mb-6">
                    {formatCurrency(product.price)}
                  </div>
                  <a 
                    href={getWhatsAppLink(product.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-100 active:scale-95"
                  >
                    <MessageCircle size={20} />
                    <span>Pesan Sekarang</span>
                  </a>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-24 bg-white rounded-[3rem] border border-dashed border-orange-200">
            <Package className="mx-auto text-orange-100 mb-6" size={64} />
            <p className="text-gray-400 font-medium italic text-lg text-balance">Maaf, kategori ini belum tersedia untuk saat ini.</p>
          </div>
        )}
      </section>

      {/* --- Footer --- */}
      <footer id="footer" className="bg-orange-950 text-orange-50 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div>
              <div className="flex items-center gap-2 mb-8" onClick={handleLogoClick}>
                <div className="bg-white p-2.5 rounded-2xl cursor-pointer">
                  <ShoppingBag className="text-orange-950 w-6 h-6" />
                </div>
                <h1 className="text-2xl font-bold italic text-white tracking-tight cursor-pointer">Mutiara Snack</h1>
              </div>
              <p className="text-orange-200/60 mb-8 leading-relaxed text-sm">
                Menghadirkan kehangatan tradisi lewat camilan berkualitas. Resep otentik Ibu Triyanti yang dijaga turun-temurun sejak 2020.
              </p>
            </div>
            <div>
              <h5 className="font-bold text-white mb-8 uppercase tracking-[0.2em] text-xs">Lokasi Outlet</h5>
              <p className="text-orange-200/60 text-sm leading-loose">
                Jl. Niaga Utama No. 12,<br />
                Waru, Sidoarjo <br />
                Jawa Timur, Indonesia
              </p>
            </div>
            <div>
              <h5 className="font-bold text-white mb-8 uppercase tracking-[0.2em] text-xs">Informasi</h5>
              <p className="text-orange-200/60 mb-3 font-mono text-sm">{WHATSAPP_NUMBER}</p>
              <p className="text-orange-200/60 text-sm">mutiarasnack@gmail.com</p>
            </div>
            <div>
              <h5 className="font-bold text-white mb-8 uppercase tracking-[0.2em] text-xs">Operasional</h5>
              <p className="text-orange-200/60 mb-3 text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Sen - Sab: 09:00 - 18:00
              </p>
              <p className="text-orange-200/60 text-sm italic">Minggu: Tutup Pelayanan</p>
            </div>
          </div>
          <div className="pt-10 border-t border-orange-900 flex flex-col md:flex-row items-center justify-between gap-6 text-orange-200/30 text-xs">
            <p>© 2026 Mutiara Snack Gateway. Handmade by Ibu Triyanti.</p>
            <div className="flex gap-8">
              <span className="hover:text-orange-100 cursor-pointer transition-colors">Privacy Policy</span>
              <span className="hover:text-orange-100 cursor-pointer transition-colors">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>

      {/* --- Password Modal --- */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute inset-0 bg-orange-950/80 backdrop-blur-xl" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-sm text-center"
            >
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2 italic">Akses Terbatas</h2>
              <p className="text-sm text-gray-400 mb-8 italic">Silakan masukkan PIN Admin Mutiara Snack</p>
              
              <form onSubmit={handleLogin}>
                <input 
                  autoFocus
                  type="password" 
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  placeholder="Password 2026"
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-orange-50 focus:border-orange-500 outline-none text-center text-xl font-mono tracking-widest transition-all mb-6"
                />
                <button 
                  type="submit"
                  className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl shadow-xl shadow-orange-100 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  Buka Kunci Mode Admin <ArrowRight size={20} />
                </button>
              </form>
              <button 
                onClick={() => setIsLoginModalOpen(false)}
                className="mt-6 text-gray-300 hover:text-orange-600 text-sm font-bold transition-colors"
              >
                Nanti Saja
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Admin Management Dashboard Modal --- */}
      <AnimatePresence>
        {isAdminDashboardOpen && (
          <div id="admin-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdminDashboardOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden"
            >
              <div className="bg-orange-900 p-8 text-white flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-300 uppercase tracking-widest mb-1.5">
                    <Settings size={12} /> Panel Kontrol Ibu Triyanti
                  </div>
                  <h2 className="text-3xl font-black italic">Manajemen Toko</h2>
                </div>
                <button 
                  onClick={() => setIsAdminDashboardOpen(false)}
                  className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-10 max-h-[75vh] overflow-y-auto no-scrollbar bg-white">
                {/* Add Product Form */}
                <div className="mb-14">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                        <Plus size={24} />
                      </div>
                      Tambah Produk Baru
                    </h3>
                  </div>
                  <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-[0.2em]">Nama Produk</label>
                      <input 
                        required
                        type="text" 
                        value={newProduct.name}
                        onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                        placeholder="Keripik Sale Pisang Ambon"
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 focus:border-orange-500 focus:bg-white outline-none transition-all text-sm font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-[0.2em]">Harga (IDR)</label>
                      <input 
                        required
                        type="number" 
                        value={newProduct.price || ''}
                        onChange={e => setNewProduct({...newProduct, price: Number(e.target.value)})}
                        placeholder="25000"
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 focus:border-orange-500 focus:bg-white outline-none transition-all text-sm font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-[0.2em]">Kategori</label>
                      <input 
                        required
                        type="text" 
                        value={newProduct.category}
                        onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                        placeholder="Keripik / Kacang / Olahan"
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 focus:border-orange-500 focus:bg-white outline-none transition-all text-sm font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase ml-1 tracking-[0.2em]">URL Foto Produk</label>
                      <input 
                        required
                        type="url" 
                        value={newProduct.imageUrl}
                        onChange={e => setNewProduct({...newProduct, imageUrl: e.target.value})}
                        placeholder="https://images.unsplash..."
                        className="w-full px-5 py-4 rounded-2xl bg-gray-50 border-2 border-gray-50 focus:border-orange-500 focus:bg-white outline-none transition-all text-sm font-medium"
                      />
                    </div>
                    <button 
                      type="submit"
                      className="md:col-span-2 mt-4 w-full py-5 bg-orange-600 text-white font-black rounded-2xl hover:bg-orange-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-orange-100 active:scale-95"
                    >
                      <Plus size={24} /> Konfirmasi Data Produk
                    </button>
                  </form>
                </div>

                {/* List Managed Products (Mini List) */}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                      <Package size={22} />
                    </div>
                    Semua Item Aktif ({products.length})
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {products.map(p => (
                      <div id={`admin-item-${p.id}`} key={p.id} className="group flex items-center justify-between p-5 bg-gray-50 rounded-3xl border-2 border-gray-50 hover:border-orange-100 transition-all">
                        <div className="flex items-center gap-5">
                          <div className="relative">
                            <img src={p.imageUrl} alt={p.name} className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
                            <div className="absolute -top-2 -left-2 px-2 py-0.5 bg-orange-600 text-white text-[8px] font-black rounded-md uppercase">
                              {p.category}
                            </div>
                          </div>
                          <div>
                            <p className="font-black text-gray-900">{p.name}</p>
                            <p className="text-sm text-orange-600 font-black">{formatCurrency(p.price)}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDeleteProduct(p.id)}
                          className="p-3 bg-white text-red-400 hover:text-white hover:bg-red-500 rounded-2xl transition-all shadow-sm border border-red-50 active:scale-90"
                          title="Hapus"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {products.length === 0 && (
                    <div className="text-center py-10 italic text-gray-400 text-sm">Gudang penyimpanan kosong.</div>
                  )}
                </div>
              </div>
              
              <div className="p-8 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <p className="text-[10px] text-gray-400 italic flex items-center gap-2 uppercase tracking-widest font-bold">
                  <CheckCircle2 size={12} className="text-green-500" /> Auto-Sync: Local Storage Aktif
                </p>
                <div className="text-[10px] font-black text-orange-300">V.2.1.0</div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
