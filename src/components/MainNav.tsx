
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from "@/components/ui/navigation-menu";
import { Link } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { Menu, X, User } from "lucide-react";

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
    // Dispatch custom event for school change
    window.dispatchEvent(new Event('schoolChanged'));
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
    <nav className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-display font-semibold text-primary-600 hover:text-primary-700 transition-colors">
            FeedNet
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Select value={selectedSchool} onValueChange={handleSchoolSelect}>
              <SelectTrigger className="w-[300px] bg-white">
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
                      <Link to="/donate" className="nav-link">
                        Donate
                      </Link>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <Link to="/history" className="nav-link">
                        History
                      </Link>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <Link to="/profile" className="nav-link flex items-center gap-2">
                        <User size={18} className="text-gray-500" />
                        Profile
                      </Link>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <Button 
                        variant="ghost" 
                        onClick={handleLogout}
                        className="nav-link hover:bg-gray-100"
                      >
                        Logout
                      </Button>
                    </NavigationMenuItem>
                  </>
                ) : (
                  <NavigationMenuItem>
                    <Link to="/login" className="nav-link">
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
          <div className="md:hidden mt-4 space-y-4 bg-white rounded-lg p-4 shadow-lg border border-gray-100">
            <Select value={selectedSchool} onValueChange={handleSchoolSelect}>
              <SelectTrigger className="w-full bg-white">
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
                    to="/donate" 
                    className="nav-link p-2 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Donate
                  </Link>
                  <Link 
                    to="/history" 
                    className="nav-link p-2 hover:bg-gray-50 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    History
                  </Link>
                  <Link 
                    to="/profile" 
                    className="nav-link p-2 hover:bg-gray-50 rounded-md flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User size={18} className="text-gray-500" />
                    Profile
                  </Link>
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="nav-link w-full justify-start p-2 hover:bg-gray-50"
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="nav-link p-2 hover:bg-gray-50 rounded-md"
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
