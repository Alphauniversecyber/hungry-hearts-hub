
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword, AuthErrorCodes } from "firebase/auth";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import MainNav from "@/components/MainNav";
import { Label } from "@/components/ui/label";

const SchoolRegister = () => {
  const [schoolName, setSchoolName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const checkSchoolExists = async (email: string) => {
    const schoolsRef = collection(db, "schools");
    const q = query(schoolsRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First check if school already exists
      const schoolExists = await checkSchoolExists(email);
      if (schoolExists) {
        throw new Error("A school with this email already exists");
      }

      // Validate password
      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }

      // Create user account with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const schoolData = {
        name: schoolName,
        email,
        address,
        phoneNumber,
        adminId: user.uid,
        createdAt: new Date().toISOString()
      };

      await addDoc(collection(db, "schools"), schoolData);

      toast({
        title: "School registered successfully",
        description: "You can now login with your school account.",
      });

      navigate("/admin-login");
    } catch (error: any) {
      let errorMessage = "An error occurred during registration";
      
      // Handle specific Firebase Auth errors
      if (error.code === AuthErrorCodes.EMAIL_EXISTS || 
          error.message === "EMAIL_EXISTS" ||
          error.message.includes("EMAIL_EXISTS")) {
        errorMessage = "This email is already registered. Please use a different email or login instead.";
      } else if (error.code === AuthErrorCodes.WEAK_PASSWORD) {
        errorMessage = "Password should be at least 6 characters long";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Registration failed",
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
      <div className="p-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8">Register Your School</h1>
          <div className="bg-white p-6 rounded-lg shadow">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="Enter school name"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="email">School Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter school email"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password (min. 6 characters)"
                  required
                  minLength={6}
                  disabled={isLoading}
                />
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter school address"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="Enter phone number"
                  required
                  disabled={isLoading}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Registering..." : "Register School"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolRegister;
