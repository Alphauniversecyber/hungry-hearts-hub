
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect } from "react";

interface School {
  id: string;
  name: string;
  address: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState("");

  useEffect(() => {
    const fetchSchools = async () => {
      const schoolsSnapshot = await getDocs(collection(db, "schools"));
      const schoolsList = schoolsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as School[];
      setSchools(schoolsList);
    };

    fetchSchools();
  }, []);

  const handleSchoolSelect = (schoolId: string) => {
    setSelectedSchool(schoolId);
    localStorage.setItem("selectedSchoolId", schoolId);
    const school = schools.find(s => s.id === schoolId);
    if (school) {
      localStorage.setItem("selectedSchoolName", school.name);
      localStorage.setItem("selectedSchoolAddress", school.address);
    }
  };

  const handleDonate = () => {
    if (!selectedSchool) {
      alert("Please select a school first");
      return;
    }
    navigate("/donate");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <div className="p-4 flex justify-end">
        <h1 className="text-2xl font-bold text-gray-900">FoodShare</h1>
      </div>
      
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto space-y-8">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Nourishing Future Leaders
          </h1>
          
          <p className="text-xl text-gray-600 mb-8">
            Join our mission to ensure no student goes hungry. Together, we can make
            a difference in our school community.
          </p>

          <div className="max-w-sm mx-auto space-y-4">
            <Select onValueChange={handleSchoolSelect}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a school" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((school) => (
                  <SelectItem key={school.id} value={school.id}>
                    {school.name} - {school.address}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleDonate}
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              Donate Food
            </Button>

            <Button
              onClick={() => navigate("/login")}
              variant="outline"
              className="w-full"
            >
              Sign In / Register
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
