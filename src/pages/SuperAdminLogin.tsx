
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import MainNav from "@/components/MainNav";

const SuperAdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Check if it's the super admin credentials
    if (email !== "programx010@gmail.com") {
      toast({
        title: "Access Denied",
        description: "This login is only for super administrators",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, password);
      
      toast({
        title: "Login successful",
        description: "Welcome back, Super Admin!",
      });
      navigate("/super-admin"); // Navigate to super admin dashboard
    } catch (error: any) {
      let errorMessage = "Login failed";
      
      // Handle specific Firebase auth errors
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = "Incorrect password";
          break;
        case 'auth/too-many-requests':
          errorMessage = "Too many failed attempts. Please try again later";
          break;
        default:
          errorMessage = "Invalid credentials";
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
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-3xl font-sigmar text-primary mb-2 text-center">
            FeedNet
          </h2>
          <h3 className="text-xl font-oswald text-gray-600 mb-6 text-center">
            Super Admin Login
          </h3>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                required
                disabled={isLoading}
                className="w-full text-sm sm:text-base"
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
                className="w-full text-sm sm:text-base"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-sm sm:text-base font-oswald"
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Login"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
