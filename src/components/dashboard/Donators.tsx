import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db, deleteUserCompletely } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Donation, FoodItem, User } from "@/types/school";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Search, User as UserIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DonatorDetails } from "./DonatorDetails";

interface DonatorsProps {
  schoolId: string;
  foodItems: FoodItem[];
}

export const Donators = ({ schoolId, foodItems }: DonatorsProps) => {
  const [donators, setDonators] = useState<User[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDonator, setSelectedDonator] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDonators();
  }, [schoolId]);

  const fetchDonators = async () => {
    try {
      setLoading(true);
      const donationsQuery = query(
        collection(db, "donations"),
        where("schoolId", "==", schoolId)
      );
      
      const donationsSnapshot = await getDocs(donationsQuery);
      const donationsData = donationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Donation[];
      setDonations(donationsData);
      
      const donatorIds = [...new Set(donationsData.map(donation => donation.userId))];
      
      const donatorPromises = donatorIds.map(async (id) => {
        try {
          const userDoc = await getDoc(doc(db, "users", id));
          if (userDoc.exists()) {
            return {
              id: userDoc.id,
              ...userDoc.data()
            } as User;
          }
          return null;
        } catch (error) {
          console.error("Error fetching donator:", error);
          return null;
        }
      });
      
      const donatorResults = await Promise.all(donatorPromises);
      const filteredDonators = donatorResults.filter(Boolean) as User[];
      setDonators(filteredDonators);
    } catch (error) {
      console.error("Error fetching donators:", error);
      toast({
        title: "Error fetching donators",
        description: "Please try again later",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const filteredDonators = donators.filter(donator => 
    donator.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donator.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    donator.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectDonator = (donator: User) => {
    setSelectedDonator(donator);
  };

  const handleCloseDetails = () => {
    setSelectedDonator(null);
    fetchDonators();
  };

  const downloadDonatorsExcel = () => {
    const headers = ["Name", "Email", "Phone", "Total Donations"];
    const data = donators.map(donator => {
      const userDonations = donations.filter(d => d.userId === donator.id);
      return [
        donator.name || "Unknown",
        donator.email || "Unknown",
        donator.phone || "Unknown",
        userDonations.length.toString()
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
    a.download = `donators-list-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (selectedDonator) {
    return (
      <DonatorDetails 
        donator={selectedDonator} 
        donations={donations.filter(d => d.userId === selectedDonator.id)} 
        foodItems={foodItems}
        onClose={handleCloseDetails}
      />
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          Donators
        </h2>
        <Button 
          onClick={downloadDonatorsExcel} 
          disabled={donators.length === 0}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Download Excel
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="Search donators..."
          value={searchTerm}
          onChange={handleSearchChange}
        />
        {searchTerm && (
          <button 
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setSearchTerm("")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-center py-6">Loading donators...</p>
      ) : filteredDonators.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-10">
            <UserIcon className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500">
              {searchTerm ? "No donators found matching your search" : "No donators available"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Total Donations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDonators.map((donator) => {
                const userDonations = donations.filter(d => d.userId === donator.id);
                return (
                  <TableRow 
                    key={donator.id}
                    className="cursor-pointer hover:bg-primary/5"
                    onClick={() => handleSelectDonator(donator)}
                  >
                    <TableCell className="font-medium">{donator.name || "Unknown"}</TableCell>
                    <TableCell>{donator.email || "Unknown"}</TableCell>
                    <TableCell>{donator.phone || "Unknown"}</TableCell>
                    <TableCell>{userDonations.length}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
