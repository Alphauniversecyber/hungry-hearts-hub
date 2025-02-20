
import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Donation, FoodItem } from "@/types/school";

interface DonationHistoryProps {
  schoolId: string;
  foodItems: FoodItem[];
}

export const DonationHistory = ({ schoolId, foodItems }: DonationHistoryProps) => {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDonations();
  }, [schoolId]);

  const fetchDonations = async () => {
    try {
      const donationsQuery = query(
        collection(db, "donations"),
        where("schoolId", "==", schoolId),
        orderBy("createdAt", "desc")
      );
      
      const donationsSnapshot = await getDocs(donationsQuery);
      const donationsList = await Promise.all(
        donationsSnapshot.docs.map(async doc => {
          const donationData = doc.data();
          const userDoc = await getDocs(query(
            collection(db, "users"),
            where("uid", "==", donationData.userId)
          ));
          const userName = userDoc.docs[0]?.data()?.name || "Unknown User";
          return {
            id: doc.id,
            ...donationData,
            userName
          };
        })
      ) as Donation[];

      setDonations(donationsList);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching donations:", error);
      toast({
        title: "Error fetching donation history",
        variant: "destructive",
      });
    }
  };

  const downloadExcel = () => {
    const headers = ["Date", "Donor", "Food Item", "Quantity", "Note"];
    const data = donations.map(donation => [
      new Date(donation.createdAt).toLocaleDateString(),
      donation.userName,
      foodItems.find(item => item.id === donation.foodItemId)?.name || "Unknown Item",
      donation.quantity,
      donation.note || "N/A"
    ]);

    const csvContent = [
      headers.join(","),
      ...data.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `donations-history-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Donation History</h2>
        <Button onClick={downloadExcel}>
          Download Excel
        </Button>
      </div>

      {donations.length === 0 ? (
        <p className="text-gray-600">No donation history available</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Donor</TableHead>
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
                <TableCell>{donation.userName}</TableCell>
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
    </div>
  );
};
