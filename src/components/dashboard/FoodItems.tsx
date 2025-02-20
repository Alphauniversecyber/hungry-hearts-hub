
import { useState } from "react";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FoodItem } from "@/types/school";

interface FoodItemsProps {
  schoolId: string;
  foodItems: FoodItem[];
  setFoodItems: (items: FoodItem[]) => void;
}

export const FoodItems = ({ schoolId, foodItems, setFoodItems }: FoodItemsProps) => {
  const [newFoodItem, setNewFoodItem] = useState({ 
    name: "", 
    description: "", 
    quantityNeeded: 0 
  });
  const [editingFoodItem, setEditingFoodItem] = useState<FoodItem | null>(null);
  const { toast } = useToast();

  const handleAddFoodItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newFoodItem.quantityNeeded || newFoodItem.quantityNeeded <= 0) {
        throw new Error("Please specify a valid quantity needed");
      }

      await addDoc(collection(db, "foodItems"), {
        name: newFoodItem.name,
        description: newFoodItem.description,
        schoolId: schoolId,
        quantityNeeded: Number(newFoodItem.quantityNeeded),
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
      setNewFoodItem({ name: "", description: "", quantityNeeded: 0 });
    } catch (error: any) {
      toast({
        title: "Error adding food item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditFoodItem = async (item: FoodItem) => {
    setEditingFoodItem(item);
    setNewFoodItem({ 
      name: item.name, 
      description: item.description || "", 
      quantityNeeded: item.quantityNeeded || 0 
    });
  };

  const handleUpdateFoodItem = async () => {
    if (!editingFoodItem) return;

    try {
      if (editingFoodItem.schoolId !== schoolId) {
        throw new Error("You don't have permission to edit this food item");
      }

      await updateDoc(doc(db, "foodItems", editingFoodItem.id), {
        name: newFoodItem.name,
        description: newFoodItem.description,
        quantityNeeded: newFoodItem.quantityNeeded
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
      setNewFoodItem({ name: "", description: "", quantityNeeded: 0 });
    } catch (error: any) {
      toast({
        title: "Error updating food item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteFoodItem = async (id: string) => {
    try {
      const foodItem = foodItems.find(item => item.id === id);
      if (foodItem?.schoolId !== schoolId) {
        throw new Error("You don't have permission to delete this food item");
      }

      await deleteDoc(doc(db, "foodItems", id));
      toast({
        title: "Food item deleted successfully",
      });
      setFoodItems(foodItems.filter(item => item.id !== id));
    } catch (error: any) {
      toast({
        title: "Error deleting food item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold mb-4">
          {editingFoodItem ? "Edit Food Item" : "Add New Food Item"}
        </h2>
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
          <div>
            <Label>Quantity Needed</Label>
            <Input
              type="number"
              value={newFoodItem.quantityNeeded}
              onChange={(e) => setNewFoodItem(prev => ({ ...prev, quantityNeeded: Number(e.target.value) }))}
              min="1"
              required
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
                  setNewFoodItem({ name: "", description: "", quantityNeeded: 0 });
                }}
              >
                Cancel
              </Button>
            )}
          </div>
        </form>

        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Food Items List</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Quantity Needed</TableHead>
                <TableHead>Current Quantity</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {foodItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.description || "N/A"}</TableCell>
                  <TableCell>{item.quantityNeeded || 0}</TableCell>
                  <TableCell>{item.currentQuantity || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditFoodItem(item)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteFoodItem(item.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
