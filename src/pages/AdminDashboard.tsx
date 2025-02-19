import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

interface School {
  id: string;
  name: string;
  email: string;
  address: string;
  phoneNumber: string;
  location: {
    latitude: number;
    longitude: number;
  };
}

interface Donation {
  id: string;
  userId: string;
  foodItemId: string;
  quantity: string;
  note: string;
  createdAt: string;
  userName?: string;
  schoolId: string;
}

interface FoodItem {
  id: string;
  name: string;
  description?: string;
  schoolId: string;
}

const AdminDashboard = () => {
  const [school, setSchool] = useState<School | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [newFoodItem, setNewFoodItem] = useState({ name: "", description: "" });
  const [editingFoodItem, setEditingFoodItem] = useState<FoodItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [updatedSchool, setUpdatedSchool] = useState<School | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdmin = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        navigate("/admin-login");
        return;
      }

      try {
        const schoolsRef = collection(db, "schools");
        const q = query(schoolsRef, where("adminId", "==", user.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const schoolData = {
            id: querySnapshot.docs[0].id,
            ...querySnapshot.docs[0].data()
          } as School;
          setSchool(schoolData);
          setUpdatedSchool(schoolData);
        }
      } catch (error) {
        console.error("Error fetching school data:", error);
      }
    });

    return () => checkAdmin();
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      if (!school) return;

      try {
        const foodItemsQuery = query(
          collection(db, "foodItems"),
          where("schoolId", "==", school.id)
        );
        const foodItemsSnapshot = await getDocs(foodItemsQuery);
        const foodItemsList = foodItemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as FoodItem[];
        setFoodItems(foodItemsList);

        const today = Timestamp.fromDate(new Date());
        today.toDate().setHours(0, 0, 0, 0);
        
        const donationsQuery = query(
          collection(db, "donations"),
          where("schoolId", "==", school.id)
        );
        
        const donationsSnapshot = await getDocs(donationsQuery);
        const donationsList = await Promise.all(
          donationsSnapshot.docs
            .filter(doc => {
              const createdAt = new Date(doc.data().createdAt);
              const todayStart = new Date();
              todayStart.setHours(0, 0, 0, 0);
              return createdAt >= todayStart;
            })
            .map(async doc => {
              const donationData = doc.data();
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
            })
        ) as Donation[];

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
  }, [school, toast]);

  const handleUpdateProfile = async () => {
    if (!updatedSchool || !school) return;

    try {
      await updateDoc(doc(db, "schools", school.id), {
        name: updatedSchool.name,
        address: updatedSchool.address,
        phoneNumber: updatedSchool.phoneNumber,
        location: updatedSchool.location
      });

      setSchool(updatedSchool);
      setEditingProfile(false);
      toast({
        title: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
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
        schoolId: school?.id,
        createdAt: Timestamp.now()
      });

      toast({
        title: "Food item added successfully",
      });

      const foodItemsQuery = query(
        collection(db, "foodItems"),
        where("schoolId", "==", school?.id)
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
    setNewFoodItem({ name: item.name, description: item.description || "" });
  };

  const handleUpdateFoodItem = async () => {
    if (!editingFoodItem || !school) return;

    try {
      if (editingFoodItem.schoolId !== school.id) {
        throw new Error("You don't have permission to edit this food item");
      }

      await updateDoc(doc(db, "foodItems", editingFoodItem.id), {
        name: newFoodItem.name,
        description: newFoodItem.description,
      });

      toast({
        title: "Food item updated successfully",
      });

      const foodItemsQuery = query(
        collection(db, "foodItems"),
        where("schoolId", "==", school.id)
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
    if (!school) return;

    try {
      const foodItem = foodItems.find(item => item.id === id);
      if (foodItem?.schoolId !== school.id) {
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
          <h1 className="text-3xl font-bold">School Dashboard</h1>
          <Button onClick={handleLogout} variant="outline">
            Logout
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="donations">Today's Donations</TabsTrigger>
            <TabsTrigger value="foodItems">Food Items</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="bg-white p-6 rounded-lg shadow">
            {school && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">School Profile</h2>
                {editingProfile ? (
                  <div className="space-y-4">
                    <div>
                      <Label>School Name</Label>
                      <Input
                        value={updatedSchool?.name}
                        onChange={(e) => setUpdatedSchool(prev => ({ ...prev!, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Address</Label>
                      <Textarea
                        value={updatedSchool?.address}
                        onChange={(e) => setUpdatedSchool(prev => ({ ...prev!, address: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Phone Number</Label>
                      <Input
                        value={updatedSchool?.phoneNumber}
                        onChange={(e) => setUpdatedSchool(prev => ({ ...prev!, phoneNumber: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleUpdateProfile}>Save Changes</Button>
                      <Button variant="outline" onClick={() => {
                        setEditingProfile(false);
                        setUpdatedSchool(school);
                      }}>Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p><strong>Name:</strong> {school.name}</p>
                    <p><strong>Email:</strong> {school.email}</p>
                    <p><strong>Address:</strong> {school.address}</p>
                    <p><strong>Phone:</strong> {school.phoneNumber}</p>
                    <Button onClick={() => setEditingProfile(true)}>Edit Profile</Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="donations" className="bg-white p-6 rounded-lg shadow">
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
          </TabsContent>

          <TabsContent value="foodItems" className="bg-white p-6 rounded-lg shadow">
            <div className="space-y-6">
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
