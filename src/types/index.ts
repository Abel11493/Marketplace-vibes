export type UserRole = 'client' | 'seller' | 'admin';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bannerURL?: string;
  role: UserRole;
  bio?: string;
  location?: string;
  phone?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  isVerified?: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  sellerId: string;
  sellerName: string;
  isFeatured: boolean;
  status: 'available' | 'sold' | 'reserved';
  stock?: number;
  condition?: 'new' | 'used_like_new' | 'used_good' | 'used_fair';
  createdAt: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface Review {
  id: string;
  sellerId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Favorite {
  userId: string;
  productId: string;
  createdAt: string;
}

export interface StudioConfig {
  id: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    borderRadius: string;
    fontFamily: string;
    darkMode: boolean;
  };
  content: {
    heroTitle: string;
    heroSubtitle: string;
    footerText: string;
    siteName: string;
  };
  customStyles?: string;
  updatedAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  targetType: 'product' | 'user';
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}
