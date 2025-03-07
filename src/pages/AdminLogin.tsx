
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, authenticateSchoolAdmin } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import MainNav from "@/components/MainNav";
import { Loading } from "@/components/ui/loading";
import { Label } from "@/components/ui/label";
import { LockIcon, ShieldIcon } from "lucide-react";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      console.log("Attempting to authenticate school admin:", email);
      
      await authenticateSchoolAdmin(email, password);
      
      toast({
        title: "Login successful",
        description: "Welcome back to Puhulwella National College dashboard!",
      });
      navigate("/admin");
    } catch (error: any) {
      let errorMessage = "Login failed";
      console.error("School admin login error:", error);
      
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
        title: "Access Denied",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <MainNav />
      <div className="flex items-center justify-center p-8">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md relative overflow-hidden border border-primary/10">
          {isLoading && <Loading message="Logging in..." />}
          
          <div className="flex items-center justify-center mb-4">
            <ShieldIcon className="h-10 w-10 text-primary" />
          </div>
          
          <h2 className="text-3xl font-oswald font-bold text-gray-900 mb-2 text-center">
            Puhulwella National College
          </h2>
          <p className="text-center text-gray-600 mb-6">Staff Login Portal</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Staff Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your staff email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.trim())}
                  required
                  disabled={isLoading}
                  className="w-full pl-10 font-oswald"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <span className="text-gray-500">@</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="w-full pl-10 font-oswald"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <LockIcon className="h-4 w-4 text-gray-500" />
                </div>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 font-oswald text-lg"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login to School Dashboard"}
            </Button>
          </form>
          
          <p className="mt-4 text-center text-sm text-gray-500">
            * Only authorized staff members of Puhulwella National College can access this portal
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
