export interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  moq: number;
  material: string;
  sizes: string[];
  rating: number;
  image: string;
  color?: string;
}

export interface Message {
  id: string;
  sender: 'bot' | 'user' | 'system';
  content: string;
  type?: 'text' | 'product' | 'proposal';
  product?: Product;
  timestamp: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
  color?: string;
  size?: string;
}

export interface Proposal {
  status: string;
  validUntil: string;
}
