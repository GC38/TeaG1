import React, { useState, useEffect, createContext, useContext } from 'react';
import { db } from './lib/firebase';
import { collection, onSnapshot, query, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { ShoppingCart, ClipboardList, Store, User, ChevronRight, X, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, CartItem, Order, Category, OrderStatus } from './types';
import { INITIAL_PRODUCTS, TOPPINGS, SUGAR_LEVELS, ICE_LEVELS } from './lib/constants';
import { cn } from './lib/utils';

// --- Context ---
interface CartContextType {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};

// --- Main App Component ---
export default function App() {
  const [view, setView] = useState<'customer' | 'admin'>('customer');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Sync products from Firestore or Seed
  useEffect(() => {
    const q = query(collection(db, 'products'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Seed initial data if empty (for demo)
        INITIAL_PRODUCTS.forEach(async (p) => {
          await addDoc(collection(db, 'products'), p);
        });
      } else {
        const productList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];
        setProducts(productList);
      }
    });

    return () => unsubscribe();
  }, []);

  const addToCart = (item: CartItem) => {
    setCart(prev => {
      const existing = prev.find(i => 
        i.productId === item.productId && 
        i.size === item.size && 
        i.sugar === item.sugar && 
        i.ice === item.ice && 
        JSON.stringify(i.toppings) === JSON.stringify(item.toppings)
      );
      if (existing) {
        return prev.map(i => i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prev, { ...item, id: Math.random().toString(36).substr(2, 9) }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  
  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQty = Math.max(1, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }));
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, total }}>
      <div className="min-h-screen bg-stone-50 font-sans text-stone-900">
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
                <Store size={24} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">TeaOrder API</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setView('customer')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  view === 'customer' ? "bg-emerald-50 text-emerald-700" : "text-stone-500 hover:text-stone-900"
                )}
              >
                點餐系統
              </button>
              <button 
                onClick={() => setView('admin')}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  view === 'admin' ? "bg-emerald-50 text-emerald-700" : "text-stone-500 hover:text-stone-900"
                )}
              >
                後台管理
              </button>
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
              >
                <ShoppingCart size={24} />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
                    {cart.reduce((s, i) => s + i.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {view === 'customer' ? (
            <OrderingSystem products={products} />
          ) : (
            <AdminPanel />
          )}
        </main>

        <AnimatePresence>
          {isCartOpen && <CartDrawer onClose={() => setIsCartOpen(false)} />}
        </AnimatePresence>
      </div>
    </CartContext.Provider>
  );
}

// --- Components ---

function OrderingSystem({ products }: { products: Product[] }) {
  const categories: Category[] = ['香片綠茶', '原茶', '特調', '鮮奶', '奶茶', '期間限定'];
  const [activeCategory, setActiveCategory] = useState<Category>('香片綠茶');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(p => p.category === activeCategory);

  return (
    <div className="flex flex-col gap-8">
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all",
              activeCategory === cat 
                ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" 
                : "bg-white text-stone-600 border border-stone-200 hover:border-emerald-300"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={product.id}
            onClick={() => setSelectedProduct(product)}
            className="group bg-white p-6 rounded-2xl border border-stone-200 hover:border-emerald-500 hover:shadow-xl hover:shadow-stone-200/50 transition-all cursor-pointer relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">{product.name}</h3>
                <p className="text-xs text-stone-400 mt-1 uppercase tracking-widest">{product.category}</p>
              </div>
              <div className="flex flex-col items-end">
                {product.priceM && <span className="text-sm font-medium text-stone-500">M ${product.priceM}</span>}
                <span className="text-lg font-bold text-emerald-600">L ${product.priceL}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-stone-400">
              <span className="text-xs">自訂品項</span>
              <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* customization Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <CustomizationModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomizationModal({ product, onClose }: { product: Product, onClose: () => void }) {
  const { addToCart } = useCart();
  const [size, setSize] = useState<'M' | 'L'>(product.priceM ? 'M' : 'L');
  const [sugar, setSugar] = useState<any>('正常');
  const [ice, setIce] = useState<any>('正常');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);

  const basePrice = size === 'M' ? (product.priceM || product.priceL) : product.priceL;
  const toppingsPrice = selectedToppings.reduce((sum, name) => {
    const topping = TOPPINGS.find(t => t.name === name);
    return sum + (topping?.price || 0);
  }, 0);
  const totalPrice = (basePrice + toppingsPrice) * quantity;

  const handleAdd = () => {
    addToCart({
      id: '', // Will be set in addToCart
      productId: product.id,
      productName: product.name,
      size,
      sugar,
      ice,
      toppings: selectedToppings as any,
      price: basePrice + toppingsPrice,
      quantity
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
          <div>
            <h2 className="text-2xl font-bold">{product.name}</h2>
            <p className="text-stone-500 text-sm">自訂口味與加料</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-8">
          {/* Size */}
          <section>
            <h4 className="text-sm font-bold text-stone-400 mb-3 uppercase tracking-wider">規格</h4>
            <div className="flex gap-3">
              {product.priceM && (
                <button
                  onClick={() => setSize('M')}
                  className={cn(
                    "flex-1 py-3 rounded-xl border-2 transition-all",
                    size === 'M' ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-bold" : "border-stone-100 text-stone-500"
                  )}
                >
                  中杯 (M) ${product.priceM}
                </button>
              )}
              <button
                onClick={() => setSize('L')}
                className={cn(
                  "flex-1 py-3 rounded-xl border-2 transition-all",
                  size === 'L' ? "border-emerald-600 bg-emerald-50 text-emerald-700 font-bold" : "border-stone-100 text-stone-500"
                )}
              >
                大杯 (L) ${product.priceL}
              </button>
            </div>
          </section>

          {/* Sugar */}
          <section>
            <h4 className="text-sm font-bold text-stone-400 mb-3 uppercase tracking-wider">甜度</h4>
            <div className="grid grid-cols-5 gap-2">
              {SUGAR_LEVELS.map(level => (
                <button
                  key={level}
                  onClick={() => setSugar(level)}
                  className={cn(
                    "py-2 text-xs rounded-lg border transition-all",
                    sugar === level ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200" : "bg-white border-stone-200 text-stone-600"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </section>

          {/* Ice */}
          <section>
            <h4 className="text-sm font-bold text-stone-400 mb-3 uppercase tracking-wider">冰量</h4>
            <div className="grid grid-cols-6 gap-2">
              {ICE_LEVELS.map(level => (
                <button
                  key={level}
                  onClick={() => setIce(level)}
                  className={cn(
                    "py-2 text-[10px] md:text-xs rounded-lg border transition-all",
                    ice === level ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200" : "bg-white border-stone-200 text-stone-600"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </section>

          {/* Toppings */}
          <section>
            <h4 className="text-sm font-bold text-stone-400 mb-3 uppercase tracking-wider">加料區</h4>
            <div className="flex flex-wrap gap-2">
              {TOPPINGS.map(topping => (
                <button
                  key={topping.name}
                  onClick={() => {
                    setSelectedToppings(prev => 
                      prev.includes(topping.name) 
                        ? prev.filter(t => t !== topping.name) 
                        : [...prev, topping.name]
                    );
                  }}
                  className={cn(
                    "px-4 py-2 text-xs rounded-full border transition-all flex items-center gap-2",
                    selectedToppings.includes(topping.name) 
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-medium" 
                      : "bg-white border-stone-200 text-stone-600"
                  )}
                >
                  {topping.name} (+${topping.price})
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="p-6 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-4 bg-white p-1 rounded-xl border border-stone-200">
            <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="p-2 hover:bg-stone-50 rounded-lg text-stone-400">
              <Minus size={18} />
            </button>
            <span className="w-8 text-center font-bold">{quantity}</span>
            <button onClick={() => setQuantity(q => q + 1)} className="p-2 hover:bg-stone-50 rounded-lg text-stone-400">
              <Plus size={18} />
            </button>
          </div>
          <button 
            onClick={handleAdd}
            className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-3 hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
          >
            加入購物車 <span className="opacity-60">|</span> ${totalPrice}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CartDrawer({ onClose }: { onClose: () => void }) {
  const { cart, total, updateQuantity, removeFromCart, clearCart } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (!customerName || !customerPhone) {
      alert('請填寫姓名與電話');
      return;
    }
    setIsSubmitting(true);
    try {
      const order: Omit<Order, 'id'> = {
        customerName,
        customerPhone,
        items: cart,
        totalPrice: total,
        status: 'pending',
        createdAt: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'orders'), order);
      setSubmittedId(docRef.id);
      clearCart();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedId) {
    return (
      <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-end p-0 sm:p-4">
        <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div 
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          className="relative bg-white w-full max-w-md h-[50vh] sm:h-auto sm:rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4"
        >
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-2xl font-bold">訂單已送出！</h2>
          <p className="text-stone-500">訂單編號：{submittedId}</p>
          <p className="text-sm text-stone-400">請等候服務人員叫號</p>
          <button 
            onClick={onClose}
            className="mt-4 w-full bg-stone-900 text-white py-3 rounded-xl font-bold"
          >
            回首頁
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] flex justify-end">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative bg-white w-full max-w-md h-full shadow-2xl flex flex-col"
      >
        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShoppingCart size={22} className="text-emerald-600" />
            購物車
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-stone-400 gap-4">
              <ShoppingCart size={48} strokeWidth={1} />
              <p>購物車是空的</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-4">
                <div className="flex-1">
                  <h4 className="font-bold">{item.productName}</h4>
                  <p className="text-xs text-stone-500 flex flex-wrap gap-x-2">
                    <span>{item.size === 'M' ? '中杯' : '大杯'}</span>
                    <span>/</span>
                    <span>{item.sugar}</span>
                    <span>/</span>
                    <span>{item.ice}</span>
                    {item.toppings.length > 0 && (
                      <>
                        <span>/</span>
                        <span>{item.toppings.join(', ')}</span>
                      </>
                    )}
                  </p>
                  <p className="text-emerald-600 font-bold mt-1">${item.price * item.quantity}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-3 bg-stone-50 p-1 rounded-lg border border-stone-200">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white rounded">
                      <Minus size={14} />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white rounded">
                      <Plus size={14} />
                    </button>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-[10px] text-stone-400 hover:text-red-500 underline">
                    移除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 bg-stone-50 border-t border-stone-200 space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1">姓名</label>
                  <input 
                    type="text" 
                    placeholder="點餐人姓名"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full bg-white border border-stone-200 px-4 py-2 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-400 uppercase tracking-widest pl-1">電話</label>
                  <input 
                    type="tel" 
                    placeholder="聯絡電話"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full bg-white border border-stone-200 px-4 py-2 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <span className="text-stone-500 font-medium">總計</span>
                <span className="text-3xl font-bold text-emerald-600">${total}</span>
              </div>
              <button 
                onClick={handleCheckout}
                disabled={isSubmitting}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold text-white shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-3",
                  isSubmitting ? "bg-emerald-400 cursor-not-allowed" : "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]"
                )}
              >
                {isSubmitting ? '處理中...' : '確認下單'}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// --- Admin Panel ---

function AdminPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('pending');

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orderList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date()
      })) as Order[];
      setOrders(orderList);
    });

    return () => unsubscribe();
  }, []);

  const filteredOrders = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  const updateStatus = async (id: string, status: OrderStatus) => {
    // In real app, we use updateDoc
    const { updateDoc, doc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'orders', id), { 
      status,
      updatedAt: serverTimestamp() 
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">訂單管理系統</h2>
        <div className="flex bg-white p-1 rounded-xl border border-stone-200 overflow-x-auto">
          {(['pending', 'preparing', 'completed', 'cancelled', 'all'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                filter === s ? "bg-stone-900 text-white" : "text-stone-400 hover:text-stone-900"
              )}
            >
              {s === 'pending' ? '待處理' : s === 'preparing' ? '準備中' : s === 'completed' ? '已完成' : s === 'cancelled' ? '已取消' : '全部'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-dashed border-stone-300 text-center text-stone-400">
            目前沒有符合條件的訂單
          </div>
        ) : (
          filteredOrders.map(order => (
            <motion.div 
              layout
              key={order.id}
              className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-stone-100 p-2 rounded-lg text-stone-600">
                        <User size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg">{order.customerName}</h4>
                        <p className="text-xs text-stone-400">{order.customerPhone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-stone-400">
                        {order.createdAt instanceof Date ? order.createdAt.toLocaleTimeString() : ''}
                      </p>
                      <p className="text-xs font-mono text-stone-300 mt-1">ID: {order.id?.slice(-6)}</p>
                    </div>
                  </div>

                  <div className="bg-stone-50 rounded-xl p-4 space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-start text-sm">
                        <div className="flex-1">
                          <span className="font-bold text-stone-800">x{item.quantity} {item.productName}</span>
                          <p className="text-[10px] text-stone-500">
                            {item.size} / {item.sugar} / {item.ice} {item.toppings.length > 0 && `+ ${item.toppings.join(', ')}`}
                          </p>
                        </div>
                        <span className="text-stone-400 font-medium">${item.price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="pt-3 border-t border-stone-200 flex justify-between items-center">
                      <span className="text-xs font-bold text-stone-400">總計金額</span>
                      <span className="text-xl font-black text-emerald-600">${order.totalPrice}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 min-w-[140px]">
                  <StatusBadge status={order.status} />
                  <div className="grid grid-cols-1 gap-2 mt-auto">
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => updateStatus(order.id!, 'preparing')}
                        className="bg-stone-900 text-white text-xs font-bold py-2 rounded-lg hover:bg-stone-800"
                      >
                        開始製作
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button 
                        onClick={() => updateStatus(order.id!, 'completed')}
                        className="bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-emerald-700"
                      >
                        通知取餐
                      </button>
                    )}
                    {(order.status === 'pending' || order.status === 'preparing') && (
                      <button 
                        onClick={() => updateStatus(order.id!, 'cancelled')}
                        className="bg-red-50 text-red-500 text-xs font-bold py-2 rounded-lg hover:bg-red-100"
                      >
                        取消訂單
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: OrderStatus }) {
  const configs = {
    pending: { label: '待處理', class: 'bg-amber-50 text-amber-600 border-amber-200' },
    preparing: { label: '製作中', class: 'bg-blue-50 text-blue-600 border-blue-200' },
    completed: { label: '已完成', class: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    cancelled: { label: '已取消', class: 'bg-stone-50 text-stone-500 border-stone-200' },
  };
  const config = configs[status];
  return (
    <span className={cn("px-3 py-1 rounded-full text-[10px] font-bold border text-center uppercase tracking-wider", config.class)}>
      {config.label}
    </span>
  );
}
