
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { School } from "@/types/school";

interface TotalFoodNeededProps {
  school: School;
  setSchool: (school: School) => void;
}

export const TotalFoodNeeded = ({ school, setSchool }: TotalFoodNeededProps) => {
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

  return (
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
  );
};
