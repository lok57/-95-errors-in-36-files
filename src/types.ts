export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  media: ProductMedia[];
  category: string;
  inStock?: boolean;
  createdAt: string;
  updatedAt: string;
  sizes?: string[];
  image?: string;
}

export interface ProductMedia {
  url: string;
  type: 'image' | 'video';
}

export interface ProductMedia {
  url: string;
  type: 'image' | 'video';
}

export interface CartItem extends Product {
  quantity: number;
  size?: string;
  image?: string;
}

export type MediaFile = {
  id: string;
  type: 'image' | 'video';
  file: File;
  preview: string;
};
