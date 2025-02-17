
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, addDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import MainNav from "@/components/MainNav";
import { Label } from "@/components/ui/label";
import GoogleMapReact from 'google-map-react';

const SchoolRegister = () => {
  const [schoolName, setSchoolName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [latitude, setLatitude] = useState(6.927079); // Default to Sri Lanka
  const [longitude, setLongitude] = useState(79.861244);
  const [schoolImage, setSchoolImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleMapClick = ({ lat, lng }: { lat: number; lng: number }) => {
    setLatitude(lat);
    setLongitude(lng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create user account with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // For now, we'll just store the image as a URL
      // In a real app, you would upload this to Firebase Storage
      const schoolData = {
        name: schoolName,
        email,
        address,
        phoneNumber,
        location: {
          latitude,
          longitude
        },
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
      toast({
        title: "Error registering school",
        description: error.message,
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
                  placeholder="Create a password"
                  required
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

              <div>
                <Label>Location (Click on map to select)</Label>
                <div className="h-[400px] w-full rounded-lg overflow-hidden mb-4">
                  <GoogleMapReact
                    bootstrapURLKeys={{ key: 'YOUR_GOOGLE_MAPS_API_KEY' }}
                    defaultCenter={{
                      lat: 6.927079,
                      lng: 79.861244
                    }}
                    defaultZoom={8}
                    onClick={handleMapClick}
                  >
                    <Marker lat={latitude} lng={longitude} />
                  </GoogleMapReact>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(Number(e.target.value))}
                    placeholder="Latitude"
                    required
                    disabled
                  />
                  <Input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(Number(e.target.value))}
                    placeholder="Longitude"
                    required
                    disabled
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="schoolImage">School Image</Label>
                <Input
                  id="schoolImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSchoolImage(e.target.files?.[0] || null)}
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

const Marker = () => (
  <div className="w-4 h-4 bg-red-500 rounded-full -translate-x-2 -translate-y-2" />
);

export default SchoolRegister;

