import { useState } from "react";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FoodItem, School } from "@/types/school";

interface FoodItemsProps {
  schoolId: string;
  foodItems: FoodItem[];
  setFoodItems: (items: FoodItem[]) => void;
  school: School;
  setSchool: (school: School) => void;
}

export const FoodItems = ({ schoolId, foodItems, setFoodItems, school, setSchool }: FoodItemsProps) => {
  const [newFoodItem, setNewFoodItem] = useState({ 
    name: "", 
    description: ""
  });
  const [editingFoodItem, setEditingFoodItem] = useState<FoodItem | null>(null);
  const [editingTotal, setEditingTotal] = useState(false);
  const [updatedTotal, setUpdatedTotal] = useState(school.totalFoodNeeded || 0);
  const { toast } = useToast();

  const handleUpdateTotalNeeded = async () => {
    try {
      if (updatedTotal < 0) {
        throw new Error("Total food needed cannot be negative");
      }

      await updateDoc(doc(db, "schools", school.id), {
        totalFoodNeeded: updatedTotal
      });

      setSchool({ ...school, totalFoodNeeded: updatedTotal });
      setEditingTotal(false);
      toast({
        title: "Total food needed updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error updating total food needed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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

  const handleEditFoodItem = async (item: FoodItem) => {
    setEditingFoodItem(item);
    setNewFoodItem({ 
      name: item.name, 
      description: item.description || ""
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
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Total Food Needed</h2>
        {editingTotal ? (
          <div className="space-y-4">
            <div>
              <Label>Update Total Food Needed</Label>
              <Input
                type="number"
                min="0"
                value={updatedTotal}
                onChange={(e) => setUpdatedTotal(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateTotalNeeded}>Save Changes</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingTotal(false);
                  setUpdatedTotal(school.totalFoodNeeded || 0);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-lg">Current Total Needed: <span className="font-semibold">{school.totalFoodNeeded || 0}</span></p>
            <Button onClick={() => setEditingTotal(true)}>Update Total Needed</Button>
          </div>
        )}
      </div>

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

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">Food Items List</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Current Quantity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {foodItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.description || "N/A"}</TableCell>
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
    </div>
  );
};
