export interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  compare_price?: number | null;
  description: string;
  image: string;
  gallery: string[];
  colors: string[];
  sizes: string[];
  is_new?: boolean;
  is_featured?: boolean;
  rating?: number;
  created_at?: string;
}

export interface CartItem {
  productId: number;
  name: string;
  price: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
}
