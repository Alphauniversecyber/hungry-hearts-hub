import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, updateDoc, getDoc, deleteDoc, collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import MainNav from "@/components/MainNav";
import { School, FoodItem } from "@/types/school";
import { Plus, Trash } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface User {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
}

interface FormData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
}

interface FoodItemForm {
  name: string;
  description: string;
}

const SuperAdminEdit = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<School | User | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phoneNumber: "",
    password: ""
  });
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [newFoodItem, setNewFoodItem] = useState<FoodItemForm>({
    name: "",
    description: ""
  });
  const [totalFoodNeeded, setTotalFoodNeeded] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) {
          toast({
            title: "Error",
            description: "No ID provided",
            variant: "destructive",
          });
          navigate("/super-admin");
          return;
        }

        const docRef = doc(db, type === "school" ? "schools" : "users", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const docData = docSnap.data();
          const formattedData = {
            id: docSnap.id,
            ...docData,
            name: docData.name || "",
            email: docData.email || "",
            phoneNumber: docData.phoneNumber || docData.phone || "",
            totalFoodNeeded: docData.totalFoodNeeded || 0
          };

          setData(formattedData as School | User);
          setFormData({
            name: formattedData.name,
            email: formattedData.email,
            phoneNumber: formattedData.phoneNumber,
            password: ""
          });
          setTotalFoodNeeded(formattedData.totalFoodNeeded || 0);
        } else {
          toast({
            title: "Error",
            description: "Document not found",
            variant: "destructive",
          });
          navigate("/super-admin");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error fetching data",
          variant: "destructive",
        });
        navigate("/super-admin");
      }
    };

    const fetchFoodItems = async () => {
      if (type === "school" && id) {
        const foodItemsQuery = query(collection(db, "foodItems"), where("schoolId", "==", id));
        const foodItemsSnapshot = await getDocs(foodItemsQuery);
        const foodItemsList = foodItemsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as FoodItem));
        setFoodItems(foodItemsList);
      }
    };

    fetchData();
    fetchFoodItems();
  }, [id, type, toast, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!id || !type || !data) return;

      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        toast({
          title: "Invalid phone number",
          description: "Phone number must be exactly 10 digits",
          variant: "destructive",
        });
        return;
      }

      const collection = type === "school" ? "schools" : "users";
      const updateData: Record<string, any> = {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
      };

      if (type === "school") {
        updateData.totalFoodNeeded = totalFoodNeeded;
      }

      if (formData.password) {
        if (formData.password.length < 6) {
          toast({
            title: "Invalid password",
            description: "Password must be at least 6 characters",
            variant: "destructive",
          });
          return;
        }
        updateData.password = formData.password;
      }

      await updateDoc(doc(db, collection, id), updateData);

      toast({
        title: "Updated successfully",
      });

      navigate("/super-admin");
    } catch (error: any) {
      toast({
        title: "Error updating",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      if (!id || !type) return;

      const collection = type === "school" ? "schools" : "users";
      await deleteDoc(doc(db, collection, id));

      toast({
        title: "Deleted successfully",
      });

      navigate("/super-admin");
    } catch (error: any) {
      toast({
        title: "Error deleting",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddFoodItem = async () => {
    try {
      if (!id || !newFoodItem.name) return;

      const foodItemData = {
        ...newFoodItem,
        schoolId: id,
      };

      const docRef = await addDoc(collection(db, "foodItems"), foodItemData);
      setFoodItems([...foodItems, { id: docRef.id, ...foodItemData }]);
      
      setNewFoodItem({
        name: "",
        description: ""
      });

      toast({
        title: "Food item added successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error adding food item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteFoodItem = async (foodItemId: string) => {
    try {
      await deleteDoc(doc(db, "foodItems", foodItemId));
      setFoodItems(foodItems.filter(item => item.id !== foodItemId));
      toast({
        title: "Food item deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting food item",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50">
      <MainNav />
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    </div>;
  }

  if (!data) {
    return <div className="min-h-screen bg-gray-50">
      <MainNav />
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-lg">No data found</p>
        </div>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />
      <div className="container mx-auto p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">
              Edit {type === "school" ? "School" : "Donator"}
            </h1>
            <Button variant="outline" onClick={() => navigate("/super-admin")}>
              Back
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  disabled
                />
                <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  required
                  pattern="\d{10}"
                  title="Phone number must be exactly 10 digits"
                />
              </div>

              {type === "school" && (
                <div>
                  <Label>Total Food Needed</Label>
                  <Input
                    type="number"
                    min="0"
                    value={totalFoodNeeded}
                    onChange={(e) => setTotalFoodNeeded(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
              )}

              <div>
                <Label>New Password (leave empty to keep current)</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  minLength={6}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/super-admin")}>
                Cancel
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive">Delete Account</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the account
                      and remove all associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>

          {type === "school" && (
            <div className="mt-8 bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">Food Items</h2>
              
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={newFoodItem.name}
                      onChange={(e) => setNewFoodItem(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Food item name"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={newFoodItem.description}
                      onChange={(e) => setNewFoodItem(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Description"
                    />
                  </div>
                </div>
                <Button onClick={handleAddFoodItem} className="flex items-center gap-2">
                  <Plus size={16} />
                  Add Food Item
                </Button>
              </div>

              <div className="space-y-4">
                {foodItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteFoodItem(item.id)}
                    >
                      <Trash size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminEdit;
