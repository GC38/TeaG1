export type Category = '香片綠茶' | '原茶' | '特調' | '輕鹽奶霜' | '鮮奶' | '奶茶' | '期間限定';

export interface Product {
  id: string;
  name: string;
  category: Category;
  priceM?: number;
  priceL: number;
  available: boolean;
  description?: string;
}

export type SugarLevel = '正常' | '少糖' | '半糖' | '微糖' | '無糖';
export type IceLevel = '正常' | '少冰' | '微冰' | '去冰' | '溫' | '熱';
export type Topping = '珍珠' | '黑糖珍珠' | '茶凍' | '玫瑰膠原' | '椰果' | '蘆薈' | '寒天';

export interface CartItem {
  id: string; // Unique ID for this cart entry (includes variations)
  productId: string;
  productName: string;
  size: 'M' | 'L';
  sugar: SugarLevel;
  ice: IceLevel;
  toppings: Topping[];
  price: number;
  quantity: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'completed' | 'cancelled';

export interface Order {
  id?: string;
  customerName: string;
  customerPhone: string;
  items: CartItem[];
  totalPrice: number;
  status: OrderStatus;
  createdAt: any; // Firestore Timestamp
}
