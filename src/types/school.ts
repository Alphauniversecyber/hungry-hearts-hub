
export interface School {
  id: string;
  name: string;
  email: string;
  address: string;
  phoneNumber: string;
  totalFoodNeeded?: number;
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
  userPhone: string; // Added phone number
  schoolName: string;
  foodItemName: string;
}
