
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Donation } from "@/types/school";

export const DonatorHistory = () => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchDonations = async () => {
      if (!user) return;

      try {
        const donationsQuery = query(
          collection(db, "donations"),
          where("userId", "==", user.uid)
        );
        
        const donationsSnapshot = await getDocs(donationsQuery);
        const donationsList = donationsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            foodItemId: data.foodItemId,
            quantity: data.quantity,
            note: data.note || "",
            createdAt: data.createdAt,
            userName: user.displayName || "Unknown User",
            schoolId: data.schoolId,
            status: "completed"
          } as Donation;
        });

        // Sort by date descending
        const sortedDonations = donationsList.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setDonations(sortedDonations);
      } catch (error) {
        console.error("Error fetching donations:", error);
        toast({
          title: "Error fetching your donation history",
          description: "Please try again later",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, [user, toast]);

  if (loading) {
    return <div className="p-4">Loading your donation history...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <h2 className="text-xl font-semibold mb-6">Your Donation History</h2>

      {donations.length === 0 ? (
        <p className="text-gray-600">You haven't made any donations yet</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>School</TableHead>
              <TableHead>Food Item</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donations.map((donation) => (
              <TableRow key={donation.id}>
                <TableCell>
                  {new Date(donation.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {localStorage.getItem(`school_${donation.schoolId}_name`) || "Unknown School"}
                </TableCell>
                <TableCell>
                  {localStorage.getItem(`foodItem_${donation.foodItemId}_name`) || "Unknown Item"}
                </TableCell>
                <TableCell>{donation.quantity}</TableCell>
                <TableCell>{donation.note || "N/A"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};
