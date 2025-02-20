export interface School {
  id: string;
  name: string;
  email: string;
  address: string;
  phoneNumber: string;
  location: {
    latitude: number;
    longitude: number;
  };
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
