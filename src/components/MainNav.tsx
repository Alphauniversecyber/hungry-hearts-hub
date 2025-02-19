
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from "@/components/ui/navigation-menu";
import { Link } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Menu, X } from "lucide-react";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      const schoolsSnapshot = await getDocs(collection(db, "schools"));
      const schoolsList = schoolsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as School[];
      setSchools(schoolsList);

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

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="border-b bg-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold text-primary">
            FeedNet
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-gray-600 hover:text-primary"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
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
                {user ? (
                  <>
                    <NavigationMenuItem>
                      <Link to="/history" className="text-gray-600 hover:text-primary">
                        History
                      </Link>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <Link to="/donate" className="text-gray-600 hover:text-primary">
                        Donate
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
                ) : (
                  <NavigationMenuItem>
                    <Link to="/register" className="text-gray-600 hover:text-primary">
                      Sign In
                    </Link>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-4">
            <Select value={selectedSchool} onValueChange={handleSchoolSelect}>
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

            <div className="flex flex-col space-y-2">
              {user ? (
                <>
                  <Link 
                    to="/history" 
                    className="text-gray-600 hover:text-primary p-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    History
                  </Link>
                  <Link 
                    to="/donate" 
                    className="text-gray-600 hover:text-primary p-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Donate
                  </Link>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="text-gray-600 hover:text-primary w-full justify-start"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Link 
                  to="/register" 
                  className="text-gray-600 hover:text-primary p-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default MainNav;
