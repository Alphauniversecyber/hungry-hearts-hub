
import { useState } from "react";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { School } from "@/types/school";

interface FoodItem {
  id: string;
  name: string;
  description: string;
  schoolId: string;
}

interface DonationFormProps {
  foodItems: FoodItem[];
  school: School | null;
  setSchool: (school: School) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const DonationForm = ({ 
  foodItems, 
  school, 
  setSchool,
  isLoading,
  setIsLoading 
}: DonationFormProps) => {
  const [selectedFood, setSelectedFood] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("You must be logged in to donate");
      }

      const selectedSchoolId = localStorage.getItem("selectedSchoolId");
      if (!selectedSchoolId) {
        throw new Error("No school selected. Please return to home page and select a school");
      }

      const quantityNum = parseInt(quantity);
      
      if (school?.totalFoodNeeded !== undefined) {
        if (quantityNum > school.totalFoodNeeded) {
          throw new Error(`Maximum donation amount is ${school.totalFoodNeeded}`);
        }
      }

      await addDoc(collection(db, "donations"), {
        userId: user.uid,
        foodItemId: selectedFood,
        schoolId: selectedSchoolId,
        quantity: quantityNum,
        note,
        status: "pending",
        createdAt: new Date().toISOString()
      });

      if (school?.totalFoodNeeded !== undefined) {
        const newTotal = Math.max(0, school.totalFoodNeeded - quantityNum);
        await updateDoc(doc(db, "schools", selectedSchoolId), {
          totalFoodNeeded: newTotal
        });
        setSchool({...school, totalFoodNeeded: newTotal});
      }

      toast({
        title: "Thank you for your donation!",
        description: "We will contact you soon to arrange the pickup.",
      });

      setSelectedFood("");
      setQuantity("");
      setNote("");
    } catch (error: any) {
      toast({
        title: "Error submitting donation",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      <div>
        <label className="block text-sm font-medium mb-1">Food Item</label>
        <select
          value={selectedFood}
          onChange={(e) => setSelectedFood(e.target.value)}
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-oswald"
          required
          disabled={isLoading}
        >
          <option value="">Select a food item</option>
          {foodItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Quantity</label>
        <Input
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Enter quantity"
          required
          min="1"
          max={school?.totalFoodNeeded}
          disabled={isLoading}
          className="font-oswald"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Additional Notes
        </label>
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Any special instructions or notes"
          className="min-h-[100px] font-oswald"
          disabled={isLoading}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full font-oswald text-base sm:text-lg"
        disabled={isLoading}
      >
        {isLoading ? "Submitting..." : "Submit Donation"}
      </Button>
    </form>
  );
};
