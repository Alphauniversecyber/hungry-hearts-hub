
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { FoodItem } from "@/types/school";
import { Edit, Trash } from "lucide-react";

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

  const handleEditClick = (item: FoodItem) => {
    console.log("Edit button clicked for item:", item);
    onEdit(item);
  };

  return (
    <div className="mt-6 overflow-x-auto">
      <h3 className="text-lg font-semibold mb-3 font-oswald">Food Items List</h3>
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-oswald">Name</TableHead>
              <TableHead className="font-oswald hidden sm:table-cell">Description</TableHead>
              <TableHead className="font-oswald">Quantity</TableHead>
              <TableHead className="font-oswald">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {foodItems.length > 0 ? (
              foodItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium font-oswald">{item.name}</TableCell>
                  <TableCell className="hidden sm:table-cell font-oswald">{item.description || "N/A"}</TableCell>
                  <TableCell className="font-oswald">{item.currentQuantity || 0}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditClick(item)}
                        className="p-2"
                        type="button"
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteFoodItem(item.id)}
                        className="p-2"
                        type="button"
                      >
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                  No food items found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
