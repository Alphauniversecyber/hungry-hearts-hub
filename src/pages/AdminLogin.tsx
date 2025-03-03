
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, authenticateSchoolAdmin } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import MainNav from "@/components/MainNav";
import { Link } from "react-router-dom";
import { Loading } from "@/components/ui/loading";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate email format first
    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      await authenticateSchoolAdmin(email, password);
      
      toast({
        title: "Login successful",
        description: "Welcome back to your school dashboard!",
      });
      navigate("/admin");
    } catch (error: any) {
      let errorMessage = "Login failed";
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/user-not-found':
          errorMessage = "No account found with this email address";
          break;
        case 'auth/wrong-password':
          errorMessage = "Incorrect password";
          break;
        case 'auth/invalid-email':
          errorMessage = "Invalid email format";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later";
          break;
        default:
          errorMessage = error.message || "Invalid credentials";
      }

      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <MainNav />
      <div className="flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md relative overflow-hidden">
          {isLoading && <Loading message="Logging in..." />}
          
          <h2 className="text-3xl font-oswald font-bold text-gray-900 mb-6 text-center">
            School Login
          </h2>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="School Email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                required
                disabled={isLoading}
                className="w-full font-oswald"
              />
            </div>
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full font-oswald"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 font-oswald text-lg"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            <div className="space-y-2 text-center">
              <p className="text-sm text-gray-600 font-oswald">
                Don't have a school account?{" "}
                <Link to="/school-register" className="text-primary hover:underline">
                  Register your school
                </Link>
              </p>
              <p className="text-sm text-gray-600 font-oswald">
                <Link to="/super-admin-login" className="text-primary hover:underline">
                  Super Admin Login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
