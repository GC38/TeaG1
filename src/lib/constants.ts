import { Product } from '../types';

export const INITIAL_PRODUCTS: Omit<Product, 'id'>[] = [
  // 香片綠茶
  { name: '香片姍姍', category: '香片綠茶', priceL: 35, available: true },
  { name: '香片奶綠', category: '香片綠茶', priceM: 45, priceL: 55, available: true },
  { name: '香片釀梅綠', category: '香片綠茶', priceL: 65, available: true },
  { name: '香片葡萄柚綠', category: '香片綠茶', priceM: 55, priceL: 65, available: true },
  { name: '香片凍檸綠', category: '香片綠茶', priceL: 65, available: true },
  { name: '香片鮮奶綠', category: '香片綠茶', priceM: 55, priceL: 65, available: true },
  
  // 原茶
  { name: '李果紅', category: '原茶', priceL: 35, available: true },
  { name: '深焙烏龍', category: '原茶', priceL: 35, available: true },
  { name: '烏龍青', category: '原茶', priceL: 35, available: true },
  { name: '不知青', category: '原茶', priceL: 35, available: true },
  { name: '熟藏金萱', category: '原茶', priceL: 35, available: true },
  { name: '黃金芯芽', category: '原茶', priceL: 45, available: true },
  
  // 特調
  { name: '蘋果紅', category: '特調', priceM: 50, priceL: 55, available: true },
  { name: '蘋果寒天凍', category: '特調', priceL: 75, available: true },
  { name: '冬瓜玉露', category: '特調', priceM: 30, priceL: 40, available: true },
  { name: '鮮檸檬冬瓜', category: '特調', priceM: 40, priceL: 55, available: true },
  { name: '鮮檸青', category: '特調', priceM: 50, priceL: 55, available: true },

  // 鮮奶
  { name: '沐嵐鮮奶紅', category: '鮮奶', priceM: 50, priceL: 65, available: true },
  { name: '深焙鮮奶烏', category: '鮮奶', priceM: 55, priceL: 65, available: true },
  { name: '半熟鮮奶茶', category: '鮮奶', priceM: 60, priceL: 70, available: true },
  { name: '黑糖珍珠鮮奶', category: '鮮奶', priceM: 60, priceL: 75, available: true },
  { name: '靜岡抹茶鮮', category: '鮮奶', priceM: 60, priceL: 75, available: true },

  // 奶茶
  { name: '珍珠奶茶', category: '奶茶', priceL: 55, available: true },
  { name: '沐嵐奶茶', category: '奶茶', priceM: 45, priceL: 55, available: true },
  { name: '深焙烏龍奶', category: '奶茶', priceM: 45, priceL: 55, available: true },
];

export const SUGAR_LEVELS: string[] = ['正常', '少糖', '半糖', '微糖', '無糖'];
export const ICE_LEVELS: string[] = ['正常', '少冰', '微冰', '去冰', '溫', '熱'];
export const TOPPINGS: { name: string; price: number }[] = [
  { name: '珍珠', price: 10 },
  { name: '黑糖珍珠', price: 10 },
  { name: '茶凍', price: 10 },
  { name: '玫瑰膠原', price: 10 },
  { name: '椰果', price: 10 },
  { name: '蘆薈', price: 10 },
  { name: '寒天', price: 15 },
];
