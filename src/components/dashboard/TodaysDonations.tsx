
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Donation, FoodItem } from "@/types/school";

interface TodaysDonationsProps {
  donations: Donation[];
  foodItems: FoodItem[];
}

export const TodaysDonations = ({ donations, foodItems }: TodaysDonationsProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Today's Donations</h2>
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
