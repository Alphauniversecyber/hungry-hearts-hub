
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Donation, FoodItem } from "@/types/school";

interface TodaysDonationsProps {
  donations: Donation[];
  foodItems: FoodItem[];
}

export const TodaysDonations = ({ donations, foodItems }: TodaysDonationsProps) => {
  const downloadTodayExcel = () => {
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
    a.download = `todays-donations-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Today's Donations</h2>
        <Button onClick={downloadTodayExcel} disabled={donations.length === 0}>
          Download Excel
        </Button>
      </div>
      
      {donations.length === 0 ? (
        <p className="text-gray-600">No donations today</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Donor</TableHead>
              <TableHead>Food Item</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {donations.map((donation) => (
              <TableRow key={donation.id}>
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
