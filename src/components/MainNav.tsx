
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { Link } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";

interface School {
  id: string;
  name: string;
  address: string;
}

const MainNav = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = auth.currentUser;
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

      // Check if there's a previously selected school
      const savedSchoolId = localStorage.getItem("selectedSchoolId");
      if (savedSchoolId) {
        setSelectedSchool(savedSchoolId);
      }
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

  const handleLogout = async () => {
    try {
      await auth.signOut();
      toast({
        title: "Logged out successfully",
      });
      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error logging out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-primary">
          Hungry Hearts Hub
        </Link>

        <div className="flex items-center gap-6">
          <Select value={selectedSchool} onValueChange={handleSchoolSelect}>
            <SelectTrigger className="w-[300px]">
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

          <NavigationMenu>
            <NavigationMenuList className="gap-6">
              <NavigationMenuItem>
                <Link to="/" className="text-gray-600 hover:text-primary">
                  Home
                </Link>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <Link to="/donate" className="text-gray-600 hover:text-primary">
                  Donate
                </Link>
              </NavigationMenuItem>
              {!user ? (
                <>
                  <NavigationMenuItem>
                    <Link to="/login" className="text-gray-600 hover:text-primary">
                      Login
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link to="/register" className="text-gray-600 hover:text-primary">
                      Register
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link to="/admin-login" className="text-gray-600 hover:text-primary">
                      School Login
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link to="/school-register" className="text-gray-600 hover:text-primary">
                      Register School
                    </Link>
                  </NavigationMenuItem>
                </>
              ) : (
                <>
                  <NavigationMenuItem>
                    <Link to="/admin" className="text-gray-600 hover:text-primary">
                      Dashboard
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Button 
                      variant="ghost" 
                      onClick={handleLogout}
                      className="text-gray-600 hover:text-primary"
                    >
                      Logout
                    </Button>
                  </NavigationMenuItem>
                </>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      </div>
    </nav>
  );
};

export default MainNav;
