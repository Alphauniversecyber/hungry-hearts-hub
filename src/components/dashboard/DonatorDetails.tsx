
import { useState } from "react";
import { doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db, auth, deleteUserCompletely } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  ArrowLeft, 
  History, 
  Edit, 
  User, 
  Check, 
  X, 
  KeyRound, 
  Trash, 
  Shield,
  Loader,
  AlertTriangle
} from "lucide-react";
import { Donation, FoodItem, User as UserType } from "@/types/school";
import { sendPasswordResetEmail, getAuth } from "firebase/auth";
import { Loading } from "@/components/ui/loading";

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
  const [passwordResetLoading, setPasswordResetLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{success: boolean, message: string} | null>(null);
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

  const handleSendPasswordReset = async () => {
    if (!donator.email) {
      toast({
        title: "Cannot reset password",
        description: "This user doesn't have an email address",
        variant: "destructive",
      });
      return;
    }

    try {
      setPasswordResetLoading(true);
      await sendPasswordResetEmail(auth, donator.email);
      toast({
        title: "Password reset email sent",
        description: `A password reset link has been sent to ${donator.email}`,
      });
    } catch (error: any) {
      console.error("Error sending password reset:", error);
      toast({
        title: "Failed to send password reset",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
    } finally {
      setPasswordResetLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      setDeleteResult(null);
      
      const result = await deleteUserCompletely(donator.id);
      setDeleteResult(result);
      
      if (result.success) {
        toast({
          title: "Account data deleted",
          description: result.message || "The donator data has been permanently deleted",
        });
        
        // Only close if complete success or we're in development mode
        if (result.message.includes("completely deleted") || 
            result.message.includes("development mode") ||
            window.location.hostname === "localhost" || 
            window.location.hostname === "127.0.0.1") {
          setTimeout(() => onClose(), 3000); // Give user time to read message before closing
        }
      } else {
        throw new Error(result.message || "Failed to delete user");
      }
    } catch (error: any) {
      console.error("Error deleting account:", error);
      setDeleteResult({
        success: false,
        message: error.message || "Failed to delete the donator account"
      });
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete the donator account",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCloseAfterDelete = () => {
    onClose();
  };

  const downloadDonationHistory = () => {
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

  if (deleteLoading) {
    return <Loading message="Deleting account data..." />;
  }

  // Show post-deletion screen with result message
  if (deleteResult) {
    return (
      <div className="bg-white p-6 rounded-lg shadow space-y-6 flex flex-col items-center justify-center min-h-[300px]">
        <div className="text-center p-6 max-w-md">
          <div className="flex justify-center mb-4">
            {deleteResult.success ? (
              <Check className="h-16 w-16 text-green-500" />
            ) : (
              <AlertTriangle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <h2 className="text-2xl font-bold font-oswald mb-4">
            {deleteResult.success ? "Account Data Deleted" : "Deletion Issue"}
          </h2>
          <p className="text-gray-600 mb-8">
            {deleteResult.message}
          </p>
          <Button 
            onClick={handleCloseAfterDelete}
            className="w-full"
          >
            Return to Donators List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-3 sm:p-6 rounded-lg shadow space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
        <Button 
          variant="ghost" 
          onClick={onClose}
          className="flex items-center gap-2 w-full sm:w-auto justify-start"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Donators
        </Button>
        
        <div className="flex flex-col sm:flex-row gap-2">
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
          
          <Button
            variant="outline"
            onClick={handleSendPasswordReset}
            disabled={passwordResetLoading || !donator.email}
            className="flex items-center gap-2"
          >
            {passwordResetLoading ? <Loader className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Reset Password
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="flex items-center gap-2"
              >
                <Trash className="h-4 w-4" />
                Delete Account
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the donator account and all associated records. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={deleteLoading}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  {deleteLoading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <Trash className="h-4 w-4 mr-2" />}
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="w-full sm:w-auto flex flex-wrap">
          <TabsTrigger value="details" className="flex items-center gap-2 flex-1 sm:flex-none">
            <User className="h-4 w-4" />
            <span>Details</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2 flex-1 sm:flex-none">
            <History className="h-4 w-4" />
            <span>Donation History</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2 flex-1 sm:flex-none">
            <Shield className="h-4 w-4" />
            <span>Security</span>
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
                  <div className="flex flex-col sm:flex-row sm:justify-end gap-2 mt-4">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4 sm:gap-0">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Donation History
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadDonationHistory}
                disabled={donations.length === 0}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <Download className="h-4 w-4" />
                Download Excel
              </Button>
            </CardHeader>
            <CardContent>
              {sortedDonations.length === 0 ? (
                <p className="text-center py-4 text-gray-500">No donation history available</p>
              ) : (
                <div className="overflow-x-auto">
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
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Account Security
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Password Management</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Send a password reset link to the user's email address
                </p>
                <Button
                  onClick={handleSendPasswordReset}
                  disabled={passwordResetLoading || !donator.email}
                  className="flex items-center gap-2"
                >
                  {passwordResetLoading ? <Loader className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  Send Password Reset Email
                </Button>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-medium text-destructive mb-2">Danger Zone</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Permanently delete this account and all associated data
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive" 
                      className="flex items-center gap-2"
                    >
                      <Trash className="h-4 w-4" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the donator account and all associated records. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={deleteLoading}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        {deleteLoading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <Trash className="h-4 w-4 mr-2" />}
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
