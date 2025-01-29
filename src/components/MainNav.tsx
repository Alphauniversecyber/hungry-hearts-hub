import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { Link } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

const MainNav = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const user = auth.currentUser;

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
              </>
            ) : (
              <NavigationMenuItem>
                <Button 
                  variant="ghost" 
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-primary"
                >
                  Logout
                </Button>
              </NavigationMenuItem>
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  );
};

export default MainNav;