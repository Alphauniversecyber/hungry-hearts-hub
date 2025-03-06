
import { NavigationMenu, NavigationMenuList, NavigationMenuItem } from "@/components/ui/navigation-menu";
import { Link } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { Menu, X, User, History, LogOut, Gift, LogIn, LayoutDashboard, Apple } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";

const MainNav = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = auth.currentUser;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || null);
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      } else {
        setUserRole(null);
      }
    };

    fetchUserRole();
  }, [user]);

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

  const isAdmin = userRole === "school_admin";

  return (
    <nav className="border-b bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-2xl font-display font-semibold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-2">
            <Apple size={28} className="text-primary-600" />
            <span className="font-bold">FeedNet</span>
          </Link>

          <button
            onClick={toggleMenu}
            className="md:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="hidden md:flex items-center gap-6">
            <NavigationMenu>
              <NavigationMenuList className="gap-6">
                {user ? (
                  <>
                    {isAdmin && (
                      <NavigationMenuItem>
                        <Link to="/admin" className="nav-link flex items-center gap-2">
                          <LayoutDashboard size={18} className="text-gray-500" />
                          Dashboard
                        </Link>
                      </NavigationMenuItem>
                    )}
                    <NavigationMenuItem>
                      <Link to="/donate" className="nav-link flex items-center gap-2">
                        <Gift size={18} className="text-gray-500" />
                        Donate
                      </Link>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <Link to="/history" className="nav-link flex items-center gap-2">
                        <History size={18} className="text-gray-500" />
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
                        className="nav-link hover:bg-gray-100 flex items-center gap-2"
                      >
                        <LogOut size={18} className="text-gray-500" />
                        Logout
                      </Button>
                    </NavigationMenuItem>
                  </>
                ) : (
                  <NavigationMenuItem>
                    <Link to="/login" className="nav-link flex items-center gap-2">
                      <LogIn size={18} className="text-gray-500" />
                      Sign In
                    </Link>
                  </NavigationMenuItem>
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden mt-4 space-y-4 bg-white rounded-lg p-4 shadow-lg border border-gray-100">
            <div className="flex flex-col space-y-2">
              {user ? (
                <>
                  {isAdmin && (
                    <Link 
                      to="/admin" 
                      className="nav-link p-2 hover:bg-gray-50 rounded-md flex items-center gap-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <LayoutDashboard size={18} className="text-gray-500" />
                      Dashboard
                    </Link>
                  )}
                  <Link 
                    to="/donate" 
                    className="nav-link p-2 hover:bg-gray-50 rounded-md flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Gift size={18} className="text-gray-500" />
                    Donate
                  </Link>
                  <Link 
                    to="/history" 
                    className="nav-link p-2 hover:bg-gray-50 rounded-md flex items-center gap-2"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <History size={18} className="text-gray-500" />
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
                    className="nav-link w-full justify-start p-2 hover:bg-gray-50 flex items-center gap-2"
                  >
                    <LogOut size={18} className="text-gray-500" />
                    Logout
                  </Button>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="nav-link p-2 hover:bg-gray-50 rounded-md flex items-center gap-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <LogIn size={18} className="text-gray-500" />
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
