
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FoodItem } from "@/types/school";

interface FoodItemsTableProps {
  schoolId: string;
  foodItems: FoodItem[];
  setFoodItems: (items: FoodItem[]) => void;
  onEdit: (item: FoodItem) => void;
}

export const FoodItemsTable = ({ schoolId, foodItems, setFoodItems, onEdit }: FoodItemsTableProps) => {
  const { toast } = useToast();

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
                    onClick={() => onEdit(item)}
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
  );
};
