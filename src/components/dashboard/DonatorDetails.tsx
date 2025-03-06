
import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Download, ArrowLeft, History, Edit, User, Check, X } from "lucide-react";
import { Donation, FoodItem, User as UserType } from "@/types/school";

interface DonatorDetailsProps {
  donator: UserType;
  donations: Donation[];
  foodItems: FoodItem[];
  onClose: () => void;
}

export const DonatorDetails = ({ donator, donations, foodItems, onClose }: DonatorDetailsProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(donator.name || "");
  const [email, setEmail] = useState(donator.email || "");
  const [phone, setPhone] = useState(donator.phone || "");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    try {
      setLoading(true);
      const userRef = doc(db, "users", donator.id);
      await updateDoc(userRef, {
        name,
        email,
        phone,
        updatedAt: new Date().toISOString()
      });
      
      toast({
        title: "Donator updated",
        description: "Donator information has been updated successfully",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating donator:", error);
      toast({
        title: "Update failed",
        description: "Failed to update donator information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadDonationHistory = () => {
    // Prepare CSV data
    const headers = ["Date", "Food Item", "Quantity", "Note"];
    const data = donations.map(donation => {
      const foodItem = foodItems.find(item => item.id === donation.foodItemId);
      return [
        new Date(donation.createdAt).toLocaleDateString(),
        foodItem?.name || "Unknown Item",
        donation.quantity,
        donation.note || "N/A"
      ];
    });

    const csvContent = [
      headers.join(","),
      ...data.map(row => row.join(","))
    ].join("\n");

    // Create and trigger download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `donation-history-${donator.name}-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const sortedDonations = [...donations].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-6">
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          onClick={onClose}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Donators
        </Button>
        {!isEditing && (
          <Button 
            variant="outline" 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit Donator
          </Button>
        )}
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span>Details</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            <span>Donation History</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Donator Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input 
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input 
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEditing(false)}
                      className="flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleSave}
                      disabled={loading}
                      className="flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Name</p>
                      <p className="text-lg font-oswald">{donator.name || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Email</p>
                      <p className="text-lg font-oswald">{donator.email || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Phone</p>
                      <p className="text-lg font-oswald">{donator.phone || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Donations</p>
                      <p className="text-lg font-oswald">{donations.length}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Donation History</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadDonationHistory}
                disabled={donations.length === 0}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Excel
              </Button>
            </CardHeader>
            <CardContent>
              {sortedDonations.length === 0 ? (
                <p className="text-center py-4 text-gray-500">No donation history available</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Food Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedDonations.map((donation) => (
                      <TableRow key={donation.id}>
                        <TableCell>
                          {new Date(donation.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {foodItems.find(item => item.id === donation.foodItemId)?.name || "Unknown Item"}
                        </TableCell>
                        <TableCell>{donation.quantity}</TableCell>
                        <TableCell>{donation.note || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
