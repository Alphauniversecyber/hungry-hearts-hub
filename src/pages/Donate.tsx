
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, getDocs, query, where, getDoc, doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import MainNav from "@/components/MainNav";
import { School } from "@/types/school";

interface FoodItem {
  id: string;
  name: string;
  description: string;
  schoolId: string;
}

const Donate = () => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [school, setSchool] = useState<School | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/register");
      }
    });

    return () => checkAuth();
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const selectedSchoolId = localStorage.getItem("selectedSchoolId");
        if (!selectedSchoolId) {
          toast({
            title: "No school selected",
            description: "Please select a school first",
            variant: "destructive",
          });
          return;
        }

        // Fetch school data
        const schoolDoc = await getDoc(doc(db, "schools", selectedSchoolId));
        if (schoolDoc.exists()) {
          setSchool({ id: schoolDoc.id, ...schoolDoc.data() } as School);
        }

        // Query food items for the selected school only
        const foodItemsQuery = query(
          collection(db, "foodItems"),
          where("schoolId", "==", selectedSchoolId)
        );
        const foodSnapshot = await getDocs(foodItemsQuery);
        const items = foodSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FoodItem[];
        setFoodItems(items);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error fetching food items",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [toast]);

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
      
      // Check if donation exceeds total needed
      if (school?.totalFoodNeeded !== undefined) {
        if (quantityNum > school.totalFoodNeeded) {
          throw new Error(`Maximum donation amount is ${school.totalFoodNeeded}`);
        }
      }

      // Create donation
      await addDoc(collection(db, "donations"), {
        userId: user.uid,
        foodItemId: selectedFood,
        schoolId: selectedSchoolId,
        quantity,
        note,
        status: "pending",
        createdAt: new Date().toISOString()
      });

      // Update school's total food needed
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

  // Check if school is no longer accepting donations
  const isAcceptingDonations = !school?.totalFoodNeeded || school.totalFoodNeeded > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <MainNav />
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Donate Food</h1>
          <div className="bg-white p-6 rounded-lg shadow">
            {school && (
              <div className="mb-6 p-4 bg-gray-50 rounded-md">
                <h2 className="font-semibold mb-2">School Food Needs</h2>
                <p>Total Food Still Needed: {school.totalFoodNeeded || 0}</p>
              </div>
            )}
            
            {!isAcceptingDonations ? (
              <div className="text-center py-8">
                <p className="text-lg font-semibold text-green-600">
                  This school has received all the food they needed. Thank you for your support!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Food Item</label>
                  <select
                    value={selectedFood}
                    onChange={(e) => setSelectedFood(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
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
                    className="min-h-[100px]"
                    disabled={isLoading}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? "Submitting..." : "Submit Donation"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Donate;
