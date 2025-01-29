import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, addDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Donation {
  id: string;
  userId: string;
  foodItemId: string;
  quantity: string;
  note: string;
  status: string;
  createdAt: string;
}

const AdminDashboard = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [newFoodItem, setNewFoodItem] = useState({ name: "", description: "" });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdmin = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/login");
      }
    });

    return () => checkAdmin();
  }, [navigate]);

  useEffect(() => {
    const fetchTodaysDonations = async () => {
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const q = query(
          collection(db, "donations"),
          where("createdAt", ">=", today.toISOString())
        );

        const querySnapshot = await getDocs(q);
        const donationsList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Donation[];

        setDonations(donationsList);
      } catch (error) {
        console.error("Error fetching donations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTodaysDonations();
  }, []);

  const handleAddFoodItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "foodItems"), {
        name: newFoodItem.name,
        description: newFoodItem.description,
        createdAt: Timestamp.now()
      });

      toast({
        title: "Food item added successfully",
      });

      setNewFoodItem({ name: "", description: "" });
    } catch (error: any) {
      toast({
        title: "Error adding food item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({
        title: "Logged out successfully",
      });
      navigate("/login");
    } catch (error) {
      toast({
        title: "Error logging out",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Add New Food Item</h2>
            <form onSubmit={handleAddFoodItem} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Food Item Name"
                  value={newFoodItem.name}
                  onChange={(e) => setNewFoodItem(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Textarea
                  placeholder="Description"
                  value={newFoodItem.description}
                  onChange={(e) => setNewFoodItem(prev => ({ ...prev, description: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit">Add Food Item</Button>
            </form>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Today's Donations</h2>
            {donations.length === 0 ? (
              <p className="text-gray-600">No donations today</p>
            ) : (
              <div className="space-y-4">
                {donations.map((donation) => (
                  <div key={donation.id} className="border p-4 rounded">
                    <p><strong>Food Item ID:</strong> {donation.foodItemId}</p>
                    <p><strong>Quantity:</strong> {donation.quantity}</p>
                    <p><strong>Note:</strong> {donation.note}</p>
                    <p><strong>Status:</strong> {donation.status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;