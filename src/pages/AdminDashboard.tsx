import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { School, Donation, FoodItem } from "@/types/school";
import { TodaysDonations } from "@/components/dashboard/TodaysDonations";
import { FoodItems } from "@/components/dashboard/FoodItems";
import { SchoolProfile } from "@/components/dashboard/SchoolProfile";
import { DonationHistory } from "@/components/dashboard/DonationHistory";
import { Donators } from "@/components/dashboard/Donators";
import { Loading } from "@/components/ui/loading";
import { 
  LogOut, 
  Users, 
  ClipboardList, 
  ShoppingBag, 
  History, 
  UserCircle 
} from "lucide-react";

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
        const userDoc = await getDoc(doc(db, "users", user.uid));
        
        if (!userDoc.exists()) {
          toast({
            title: "Access denied",
            description: "You don't have permission to access this dashboard",
            variant: "destructive",
          });
          navigate("/admin-login");
          return;
        }
        
        const userData = userDoc.data();
        if (userData.role !== "school_admin") {
          toast({
            title: "Access denied",
            description: "You don't have permission to access this dashboard",
            variant: "destructive",
          });
          navigate("/admin-login");
          return;
        }
        
        const SCHOOL_ID = "puhulwella-national-college";
        const schoolDoc = await getDoc(doc(db, "schools", SCHOOL_ID));
        
        if (schoolDoc.exists()) {
          const schoolData = {
            id: schoolDoc.id,
            ...schoolDoc.data()
          } as School;
          setSchool(schoolData);
          console.log("School data loaded:", schoolData);
        } else {
          console.log("School document not found, using default data");
          const defaultSchool: School = {
            id: SCHOOL_ID,
            name: "Puhulwella National College",
            email: userData.email,
            address: "Puhulwella, Sri Lanka",
            phoneNumber: "0000000000",
            adminId: user.uid,
            totalFoodNeeded: 0
          };
          setSchool(defaultSchool);
        }
      } catch (error) {
        console.error("Error fetching school data:", error);
        toast({
          title: "Error loading dashboard",
          description: "Please try again later",
          variant: "destructive",
        });
      }
    });

    return () => checkAdmin();
  }, [navigate, toast]);

  useEffect(() => {
    const fetchData = async () => {
      if (!school) return;

      try {
        setLoading(true);
        console.log("Fetching data for school:", school.id);
        
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
        console.log("Food items loaded:", foodItemsList.length);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const donationsQuery = query(
          collection(db, "donations"),
          where("schoolId", "==", school.id)
        );
        
        const donationsSnapshot = await getDocs(donationsQuery);
        const allDonations = await Promise.all(
          donationsSnapshot.docs.map(async docSnapshot => {
            const donationData = docSnapshot.data();
            
            let userName = "Unknown User";
            try {
              const userRef = doc(db, "users", donationData.userId);
              const userDoc = await getDoc(userRef);
              if (userDoc.exists()) {
                const userData = userDoc.data();
                userName = userData?.name || "Unknown User";
              }
            } catch (error) {
              console.error("Error fetching user data:", error);
            }
            
            return {
              id: docSnapshot.id,
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

        const todaysDonations = allDonations.filter(donation => {
          const donationDate = new Date(donation.createdAt);
          return donationDate >= today && donationDate.getDate() === today.getDate();
        });

        setDonations(todaysDonations);
        console.log("Today's donations loaded:", todaysDonations.length);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error fetching data",
          description: "Please try again later",
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
    return <Loading message="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold font-oswald">
            {school?.name || "School"} Dashboard
          </h1>
          <Button 
            onClick={handleLogout} 
            variant="outline"
            className="w-full sm:w-auto flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>

        <Tabs defaultValue="todays-donations" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-2 border border-primary/10">
            <TabsList className="w-full flex flex-wrap justify-start gap-2">
              <TabsTrigger 
                value="todays-donations"
                className="flex-1 sm:flex-none text-sm sm:text-base font-oswald flex items-center gap-2"
              >
                <ClipboardList className="h-4 w-4" />
                <span>Today's Donations</span>
              </TabsTrigger>
              <TabsTrigger 
                value="food-items"
                className="flex-1 sm:flex-none text-sm sm:text-base font-oswald flex items-center gap-2"
              >
                <ShoppingBag className="h-4 w-4" />
                <span>Food Items</span>
              </TabsTrigger>
              <TabsTrigger 
                value="history"
                className="flex-1 sm:flex-none text-sm sm:text-base font-oswald flex items-center gap-2"
              >
                <History className="h-4 w-4" />
                <span>Donation History</span>
              </TabsTrigger>
              <TabsTrigger 
                value="donators"
                className="flex-1 sm:flex-none text-sm sm:text-base font-oswald flex items-center gap-2"
              >
                <Users className="h-4 w-4" />
                <span>Donators</span>
              </TabsTrigger>
              <TabsTrigger 
                value="profile"
                className="flex-1 sm:flex-none text-sm sm:text-base font-oswald flex items-center gap-2"
              >
                <UserCircle className="h-4 w-4" />
                <span>Profile</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 border border-primary/10">
            <TabsContent value="todays-donations" className="mt-0">
              <TodaysDonations donations={donations} foodItems={foodItems} />
            </TabsContent>

            <TabsContent value="food-items" className="mt-0">
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

            <TabsContent value="history" className="mt-0">
              {school && (
                <DonationHistory
                  schoolId={school.id}
                  foodItems={foodItems}
                />
              )}
            </TabsContent>

            <TabsContent value="donators" className="mt-0">
              {school && (
                <Donators
                  schoolId={school.id}
                  foodItems={foodItems}
                />
              )}
            </TabsContent>

            <TabsContent value="profile" className="mt-0">
              {school && (
                <SchoolProfile
                  school={school}
                  setSchool={setSchool}
                />
              )}
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
