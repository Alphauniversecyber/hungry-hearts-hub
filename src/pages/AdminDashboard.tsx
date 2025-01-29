import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Donation {
  id: string;
  userId: string;
  foodItemId: string;
  quantity: string;
  note: string;
  createdAt: string;
  userName?: string;
}

interface FoodItem {
  id: string;
  name: string;
  description?: string;
}

const AdminDashboard = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [newFoodItem, setNewFoodItem] = useState({ name: "", description: "" });
  const [editingFoodItem, setEditingFoodItem] = useState<FoodItem | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdmin = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/admin-login");
      }
    });

    return () => checkAdmin();
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch food items
        const foodItemsSnapshot = await getDocs(collection(db, "foodItems"));
        const foodItemsList = foodItemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FoodItem[];
        setFoodItems(foodItemsList);

        // Fetch today's donations
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const q = query(
          collection(db, "donations"),
          where("createdAt", ">=", today.toISOString())
        );
        const donationsSnapshot = await getDocs(q);
        const donationsList = await Promise.all(donationsSnapshot.docs.map(async doc => {
          const donationData = doc.data();
          // Fetch user name for each donation
          const userDoc = await getDocs(query(
            collection(db, "users"),
            where("uid", "==", donationData.userId)
          ));
          const userName = userDoc.docs[0]?.data()?.name || "Unknown User";
          return {
            id: doc.id,
            ...donationData,
            userName
          };
        })) as Donation[];

        setDonations(donationsList);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error fetching data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

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

      // Refresh food items list
      const snapshot = await getDocs(collection(db, "foodItems"));
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
    setNewFoodItem({ name: item.name, description: item.description || "" });
  };

  const handleUpdateFoodItem = async () => {
    if (!editingFoodItem) return;

    try {
      await updateDoc(doc(db, "foodItems", editingFoodItem.id), {
        name: newFoodItem.name,
        description: newFoodItem.description,
      });

      toast({
        title: "Food item updated successfully",
      });

      // Refresh food items list
      const snapshot = await getDocs(collection(db, "foodItems"));
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

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({
        title: "Logged out successfully",
      });
      navigate("/admin-login");
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
            <h2 className="text-xl font-semibold mb-4">
              {editingFoodItem ? "Edit Food Item" : "Add New Food Item"}
            </h2>
            <form onSubmit={editingFoodItem ? handleUpdateFoodItem : handleAddFoodItem} className="space-y-4">
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
                  placeholder="Description (Optional)"
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
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {foodItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.description || "N/A"}</TableCell>
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

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Today's Donations</h2>
            {donations.length === 0 ? (
              <p className="text-gray-600">No donations today</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Donor</TableHead>
                    <TableHead>Food Item</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((donation) => (
                    <TableRow key={donation.id}>
                      <TableCell>{donation.userName}</TableCell>
                      <TableCell>
                        {foodItems.find(item => item.id === donation.foodItemId)?.name || "Unknown Item"}
                      </TableCell>
                      <TableCell>{donation.quantity}</TableCell>
                      <TableCell>{donation.note || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;