
export interface School {
  id: string;
  name: string;
  email: string;
  address: string;
  phoneNumber: string;
  totalFoodNeeded?: number;
  status?: "active" | "pending" | "rejected";
  phone?: string; // Alternative field name used in the dashboard
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  createdAt: string;
  schoolId?: string;
}

export interface Donation {
  id: string;
  userId: string;
  foodItemId: string;
  quantity: string;
  note: string;
  createdAt: string;
  userName?: string;
  schoolId: string;
}

export interface FoodItem {
  id: string;
  name: string;
  description?: string;
  schoolId: string;
  quantityNeeded?: number;
  currentQuantity?: number;
}

export interface DetailedDonation extends Donation {
  userName: string;
  userEmail: string;
  userPhone: string;
  schoolName: string;
  foodItemName: string;
}
