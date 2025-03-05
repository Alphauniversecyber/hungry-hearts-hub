
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where, getDoc, doc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import MainNav from "@/components/MainNav";
import { School } from "@/types/school";
import { SchoolInfo } from "@/components/donate/SchoolInfo";
import { DonationForm } from "@/components/donate/DonationForm";
import { Loading } from "@/components/ui/loading";

interface FoodItem {
  id: string;
  name: string;
  description: string;
  schoolId: string;
}

const Donate = () => {
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [school, setSchool] = useState<School | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Default school ID for Puhulwella National College
  const DEFAULT_SCHOOL_ID = "puhulwella-national-college";

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
        // Always set Puhulwella National College as the selected school
        localStorage.setItem("selectedSchoolId", DEFAULT_SCHOOL_ID);
        const selectedSchoolId = DEFAULT_SCHOOL_ID;

        // Fetch school data
        const schoolDoc = await getDoc(doc(db, "schools", selectedSchoolId));
        if (schoolDoc.exists()) {
          const schoolData = { id: schoolDoc.id, ...schoolDoc.data() } as School;
          setSchool(schoolData);
          localStorage.setItem(`school_${schoolDoc.id}_name`, schoolData.name);
        } else {
          // Create default school info if not exists
          const defaultSchool: School = {
            id: DEFAULT_SCHOOL_ID,
            name: "Puhulwella National College",
            email: "admin@puhulwella.edu",
            address: "Puhulwella, Sri Lanka",
            phoneNumber: "0000000000",
            totalFoodNeeded: 100
          };
          setSchool(defaultSchool);
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const isAcceptingDonations = !school?.totalFoodNeeded || school.totalFoodNeeded > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <MainNav />
      <div className="p-4 sm:p-6 md:p-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8 font-oswald">
            Donate to Puhulwella National College
          </h1>
          <div className="bg-white/80 backdrop-blur-sm p-4 sm:p-6 rounded-lg shadow-lg relative border border-primary/10">
            {isLoading && <Loading message="Loading school information..." />}
            {isSubmitting && <Loading message="Submitting donation..." />}
            
            {!isLoading && school && (
              <>
                <SchoolInfo 
                  school={school} 
                  isAcceptingDonations={isAcceptingDonations} 
                />
                
                {isAcceptingDonations && (
                  <DonationForm
                    foodItems={foodItems}
                    school={school}
                    setSchool={setSchool}
                    isLoading={isSubmitting}
                    setIsLoading={setIsSubmitting}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Donate;
