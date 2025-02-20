
import { useState } from "react";
import { collection, query, where, getDocs, addDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { FoodItem } from "@/types/school";

interface FoodItemFormProps {
  schoolId: string;
  editingFoodItem: FoodItem | null;
  setEditingFoodItem: (item: FoodItem | null) => void;
  setFoodItems: (items: FoodItem[]) => void;
}

export const FoodItemForm = ({ 
  schoolId, 
  editingFoodItem, 
  setEditingFoodItem,
  setFoodItems 
}: FoodItemFormProps) => {
  const [newFoodItem, setNewFoodItem] = useState({ 
    name: editingFoodItem?.name || "", 
    description: editingFoodItem?.description || ""
  });
  const { toast } = useToast();

  const handleAddFoodItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "foodItems"), {
        name: newFoodItem.name,
        description: newFoodItem.description,
        schoolId: schoolId,
        currentQuantity: 0,
        createdAt: Timestamp.now()
      });

      toast({
        title: "Food item added successfully",
      });

      const foodItemsQuery = query(
        collection(db, "foodItems"),
        where("schoolId", "==", schoolId)
      );
      const snapshot = await getDocs(foodItemsQuery);
      const updatedFoodItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FoodItem[];
      setFoodItems(updatedFoodItems);
      setNewFoodItem({ name: "", description: "" });
    } catch (error: any) {
      toast({
        title: "Error adding food item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateFoodItem = async () => {
    if (!editingFoodItem) return;

    try {
      if (editingFoodItem.schoolId !== schoolId) {
        throw new Error("You don't have permission to edit this food item");
      }

      await updateDoc(doc(db, "foodItems", editingFoodItem.id), {
        name: newFoodItem.name,
        description: newFoodItem.description
      });

      toast({
        title: "Food item updated successfully",
      });

      const foodItemsQuery = query(
        collection(db, "foodItems"),
        where("schoolId", "==", schoolId)
      );
      const snapshot = await getDocs(foodItemsQuery);
      const updatedFoodItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FoodItem[];
      setFoodItems(updatedFoodItems);
      setEditingFoodItem(null);
      setNewFoodItem({ name: "", description: "" });
    } catch (error: any) {
      toast({
        title: "Error updating food item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={editingFoodItem ? handleUpdateFoodItem : handleAddFoodItem} className="space-y-4">
      <div>
        <Label>Food Item Name</Label>
        <Input
          type="text"
          value={newFoodItem.name}
          onChange={(e) => setNewFoodItem(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>
      <div>
        <Label>Description (Optional)</Label>
        <Textarea
          value={newFoodItem.description}
          onChange={(e) => setNewFoodItem(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>
      <div className="flex gap-2">
        <Button type="submit">
          {editingFoodItem ? "Update Food Item" : "Add Food Item"}
        </Button>
        {editingFoodItem && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setEditingFoodItem(null);
              setNewFoodItem({ name: "", description: "" });
            }}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
};
