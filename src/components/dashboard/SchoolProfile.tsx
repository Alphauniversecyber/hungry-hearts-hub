
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { School } from "@/types/school";

interface SchoolProfileProps {
  school: School;
  setSchool: (school: School) => void;
}

export const SchoolProfile = ({ school, setSchool }: SchoolProfileProps) => {
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingFoodNeeded, setEditingFoodNeeded] = useState(false);
  const [updatedSchool, setUpdatedSchool] = useState<School>(school);
  const { toast } = useToast();

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(phone);
  };

  const handleUpdateProfile = async () => {
    try {
      if (!validatePhoneNumber(updatedSchool.phoneNumber)) {
        throw new Error("Phone number must be exactly 10 digits");
      }

      await updateDoc(doc(db, "schools", school.id), {
        name: updatedSchool.name,
        address: updatedSchool.address,
        phoneNumber: updatedSchool.phoneNumber,
        location: updatedSchool.location
      });

      setSchool(updatedSchool);
      setEditingProfile(false);
      toast({
        title: "Profile updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateTotalFoodNeeded = async () => {
    try {
      if (!updatedSchool.totalFoodNeeded || updatedSchool.totalFoodNeeded <= 0) {
        throw new Error("Please enter a valid quantity");
      }

      await updateDoc(doc(db, "schools", school.id), {
        totalFoodNeeded: updatedSchool.totalFoodNeeded
      });

      setSchool(updatedSchool);
      setEditingFoodNeeded(false);
      toast({
        title: "Total food needed updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error updating total food needed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-8">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold mb-4">School Profile</h2>
        {editingProfile ? (
          <div className="space-y-4">
            <div>
              <Label>School Name</Label>
              <Input
                value={updatedSchool.name}
                onChange={(e) => setUpdatedSchool(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea
                value={updatedSchool.address}
                onChange={(e) => setUpdatedSchool(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div>
              <Label>Phone Number (10 digits)</Label>
              <Input
                value={updatedSchool.phoneNumber}
                onChange={(e) => setUpdatedSchool(prev => ({ ...prev, phoneNumber: e.target.value }))}
                pattern="\d{10}"
                title="Phone number must be exactly 10 digits"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateProfile}>Save Changes</Button>
              <Button variant="outline" onClick={() => {
                setEditingProfile(false);
                setUpdatedSchool(school);
              }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p><strong>Name:</strong> {school.name}</p>
            <p><strong>Email:</strong> {school.email}</p>
            <p><strong>Address:</strong> {school.address}</p>
            <p><strong>Phone:</strong> {school.phoneNumber}</p>
            <Button onClick={() => setEditingProfile(true)}>Edit Profile</Button>
          </div>
        )}
      </div>

      <div className="border-t pt-6 space-y-4">
        <h2 className="text-xl font-semibold mb-4">Total Food Needed</h2>
        {editingFoodNeeded ? (
          <div className="space-y-4">
            <div>
              <Label>Total Quantity Needed</Label>
              <Input
                type="number"
                min="1"
                value={updatedSchool.totalFoodNeeded || 0}
                onChange={(e) => setUpdatedSchool(prev => ({ 
                  ...prev, 
                  totalFoodNeeded: Number(e.target.value) 
                }))}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdateTotalFoodNeeded}>Save Total Quantity</Button>
              <Button variant="outline" onClick={() => {
                setEditingFoodNeeded(false);
                setUpdatedSchool(school);
              }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p><strong>Total Food Needed:</strong> {school.totalFoodNeeded || 0}</p>
            <Button onClick={() => setEditingFoodNeeded(true)}>Update Total Food Needed</Button>
          </div>
        )}
      </div>
    </div>
  );
};
