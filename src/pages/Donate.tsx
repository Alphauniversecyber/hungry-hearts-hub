
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import MainNav from "@/components/MainNav";
import { School } from "@/types/school";
import { SchoolInfo } from "@/components/donate/SchoolInfo";
import { DonationForm } from "@/components/donate/DonationForm";

interface FoodItem {
  id: string;
  name: string;
  description: string;
  schoolId: string;
}

const Donate = () => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
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
          const schoolData = { id: schoolDoc.id, ...schoolDoc.data() } as School;
          setSchool(schoolData);
          localStorage.setItem(`school_${schoolDoc.id}_name`, schoolData.name);
        }

        // Query food items for the selected school only
        const foodItemsQuery = query(
          collection(db, "foodItems"),
          where("schoolId", "==", selectedSchoolId)
        );
        const foodSnapshot = await getDocs(foodItemsQuery);
        const items = foodSnapshot.docs.map(doc => {
          const data = doc.data();
          localStorage.setItem(`foodItem_${doc.id}_name`, data.name);
          return {
            id: doc.id,
            ...data
          } as FoodItem;
        });
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

  useEffect(() => {
    const handleSchoolChange = () => {
      window.location.reload();
    };

    window.addEventListener('schoolChanged', handleSchoolChange);
    return () => window.removeEventListener('schoolChanged', handleSchoolChange);
  }, []);

  const isAcceptingDonations = !school?.totalFoodNeeded || school.totalFoodNeeded > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <MainNav />
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Donate Food</h1>
          <div className="bg-white p-6 rounded-lg shadow">
            {school && (
              <SchoolInfo 
                school={school} 
                isAcceptingDonations={isAcceptingDonations} 
              />
            )}
            
            {isAcceptingDonations && (
              <DonationForm
                foodItems={foodItems}
                school={school}
                setSchool={setSchool}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Donate;
