
import { useState } from "react";
import { TotalFoodNeeded } from "./TotalFoodNeeded";
import { FoodItemForm } from "./FoodItemForm";
import { FoodItemsTable } from "./FoodItemsTable";
import { FoodItem, School } from "@/types/school";

interface FoodItemsProps {
  schoolId: string;
  foodItems: FoodItem[];
  setFoodItems: (items: FoodItem[]) => void;
  school: School;
  setSchool: (school: School) => void;
}

export const FoodItems = ({ 
  schoolId, 
  foodItems, 
  setFoodItems, 
  school, 
  setSchool 
}: FoodItemsProps) => {
  const [editingFoodItem, setEditingFoodItem] = useState<FoodItem | null>(null);

  return (
    <div className="space-y-8">
      <TotalFoodNeeded school={school} setSchool={setSchool} />
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">
          {editingFoodItem ? "Edit Food Item" : "Add New Food Item"}
        </h2>
        
        <FoodItemForm
          schoolId={schoolId}
          editingFoodItem={editingFoodItem}
          setEditingFoodItem={setEditingFoodItem}
          setFoodItems={setFoodItems}
        />

        <FoodItemsTable
          schoolId={schoolId}
          foodItems={foodItems}
          setFoodItems={setFoodItems}
          onEdit={setEditingFoodItem}
        />
      </div>
    </div>
  );
};
