
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc, query, where, getDocs, setDoc, doc } from "firebase/firestore";
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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    if (!schoolName.trim()) {
      toast({
        title: "Invalid school name",
        description: "Please enter your school name",
        variant: "destructive",
      });
      return false;
    }

    if (!validateEmail(email)) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return false;
    }

    if (password.length < 6) {
      toast({
        title: "Invalid password",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return false;
    }

    if (!address.trim()) {
      toast({
        title: "Invalid address",
        description: "Please enter your school address",
        variant: "destructive",
      });
      return false;
    }

    if (!phoneNumber.trim()) {
      toast({
        title: "Invalid phone number",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const checkSchoolExists = async (email: string) => {
    try {
      const schoolsRef = collection(db, "schools");
      const q = query(schoolsRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking if school exists:", error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);

    try {
      // First check if school already exists
      const schoolExists = await checkSchoolExists(email);
      if (schoolExists) {
        toast({
          title: "Registration failed",
          description: "A school with this email already exists",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Create user account with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create the school document with status field
      const schoolData = {
        name: schoolName,
        email,
        address,
        phoneNumber,
        adminId: user.uid,
        createdAt: new Date().toISOString(),
        status: "pending", // Set initial status as pending
        totalFoodNeeded: 0 // Initialize with 0
      };

      // Create school in collection
      const schoolRef = await addDoc(collection(db, "schools"), schoolData);
      
      // Also create a user document for this admin
      await setDoc(doc(db, "users", user.uid), {
        name: schoolName,
        email,
        phone: phoneNumber,
        role: "school_admin",
        createdAt: new Date().toISOString(),
        schoolId: schoolRef.id,
        uid: user.uid
      });

      toast({
        title: "School registered successfully",
        description: "Your school registration is pending approval. You can now login with your school account.",
      });

      navigate("/admin-login");
    } catch (error: any) {
      let errorMessage = "An error occurred during registration";
      
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "This email is already registered. Please use a different email or login instead.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Please enter a valid email address";
      } else if (error.code === "auth/operation-not-allowed") {
        errorMessage = "Email/password accounts are not enabled. Please contact support.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password should be at least 6 characters long";
      } else if (error.message) {
        errorMessage = error.message;
      }

      console.error("School registration error:", error);
      
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
                  onChange={(e) => setEmail(e.target.value.trim())}
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
