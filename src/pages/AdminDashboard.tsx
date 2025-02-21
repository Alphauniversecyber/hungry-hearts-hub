
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { School, Donation, FoodItem } from "@/types/school";
import { TodaysDonations } from "@/components/dashboard/TodaysDonations";
import { FoodItems } from "@/components/dashboard/FoodItems";
import { SchoolProfile } from "@/components/dashboard/SchoolProfile";
import { DonationHistory } from "@/components/dashboard/DonationHistory";

const AdminDashboard = () => {
  const [school, setSchool] = useState<School | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(true);
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

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = Timestamp.fromDate(today);
        
        const donationsQuery = query(
          collection(db, "donations"),
          where("schoolId", "==", school.id),
          where("createdAt", ">=", todayTimestamp.toDate().toISOString())
        );
        
        const donationsSnapshot = await getDocs(donationsQuery);
        const donationsList = await Promise.all(
          donationsSnapshot.docs.map(async doc => {
            const donationData = doc.data();
            const userDoc = await getDocs(query(
              collection(db, "users"),
              where("uid", "==", donationData.userId)
            ));
            const userName = userDoc.docs[0]?.data()?.name || "Unknown User";
            
            return {
              id: doc.id,
              userId: donationData.userId,
              foodItemId: donationData.foodItemId,
              quantity: donationData.quantity,
              note: donationData.note || "",
              createdAt: donationData.createdAt,
              userName: userName,
              schoolId: school.id,
              status: "completed"
            } as Donation;
          })
        );

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

        <Tabs defaultValue="todays-donations" className="space-y-6">
          <TabsList>
            <TabsTrigger value="todays-donations">Today's Donations</TabsTrigger>
            <TabsTrigger value="food-items">Food Items</TabsTrigger>
            <TabsTrigger value="history">Donation History</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="todays-donations">
            <TodaysDonations donations={donations} foodItems={foodItems} />
          </TabsContent>

          <TabsContent value="food-items">
            {school && (
              <FoodItems
                schoolId={school.id}
                foodItems={foodItems}
                setFoodItems={setFoodItems}
                school={school}
                setSchool={setSchool}
              />
            )}
          </TabsContent>

          <TabsContent value="history">
            {school && (
              <DonationHistory
                schoolId={school.id}
                foodItems={foodItems}
              />
            )}
          </TabsContent>

          <TabsContent value="profile">
            {school && (
              <SchoolProfile
                school={school}
                setSchool={setSchool}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
