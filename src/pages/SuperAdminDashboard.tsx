import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { School, DetailedDonation, FoodItem } from "@/types/school";
import MainNav from "@/components/MainNav";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileDown } from "lucide-react";

interface User {
  uid: string;
  name: string;
  email: string;
  phoneNumber: string;
}

const SuperAdminDashboard = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [donations, setDonations] = useState<DetailedDonation[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user || user.email !== "programx010@gmail.com") {
        navigate("/super-admin-login");
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const schoolsSnapshot = await getDocs(collection(db, "schools"));
        const schoolsData = schoolsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as School[];
        setSchools(schoolsData);

        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            uid: doc.id,
            name: data.name,
            email: data.email,
            phoneNumber: data.phone,
            ...data
          } as User;
        });
        setUsers(usersData);
        
        console.log('Users data:', usersData);

        const foodItemsSnapshot = await getDocs(collection(db, "foodItems"));
        const foodItems = foodItemsSnapshot.docs.reduce((acc, doc) => {
          acc[doc.id] = { id: doc.id, ...doc.data() } as FoodItem;
          return acc;
        }, {} as { [key: string]: FoodItem });

        const donationsSnapshot = await getDocs(collection(db, "donations"));
        const donationsPromises = donationsSnapshot.docs.map(async (doc) => {
          const donationData = doc.data();
          const user = usersData.find(u => u.uid === donationData.userId);
          const school = schoolsData.find(s => s.id === donationData.schoolId);
          
          const foodItem = foodItems[donationData.foodItemId];
          const foodItemName = foodItem?.name || "Unknown Food Item";

          return {
            id: doc.id,
            ...donationData,
            userName: user?.name || "Unknown User",
            userEmail: user?.email || "Unknown Email",
            userPhone: user?.phoneNumber || "Not provided",
            schoolName: school?.name || "Unknown School",
            foodItemName
          } as DetailedDonation;
        });

        const detailedDonations = await Promise.all(donationsPromises);
        setDonations(detailedDonations);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  const handleRowClick = (item: any) => {
    setSelectedItem(item);
    setIsDialogOpen(true);
  };

  const handleEdit = () => {
    if (!selectedItem) return;
    
    const type = selectedItem.address ? "school" : "donator";
    const id = selectedItem.id || selectedItem.uid;
    
    console.log("Selected item:", selectedItem);
    console.log("Type:", type);
    console.log("ID:", id);
    
    navigate(`/super-admin-edit/${type}/${id}`);
  };

  const downloadSchoolsExcel = () => {
    const headers = ["School Name", "Email", "Phone Number", "Address", "Total Donations"];
    const data = schools.map(school => [
      school.name,
      school.email,
      school.phoneNumber,
      school.address,
      donations.filter(d => d.schoolId === school.id).length
    ]);

    const csvContent = [
      headers.join(","),
      ...data.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schools-data-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadDonatorsExcel = () => {
    const headers = ["Name", "Email", "Phone Number", "Total Donations"];
    const data = users.map(user => [
      user.name,
      user.email,
      user.phoneNumber || "Not provided",
      donations.filter(d => d.userId === user.uid).length
    ]);

    const csvContent = [
      headers.join(","),
      ...data.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `donators-data-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl md:text-3xl font-heading font-bold text-gray-900 mb-4">
          Super Admin Dashboard
        </h1>

        <Tabs defaultValue="schools" className="space-y-4">
          <TabsList className="w-full flex">
            <TabsTrigger value="schools" className="flex-1">Schools</TabsTrigger>
            <TabsTrigger value="donators" className="flex-1">Donators</TabsTrigger>
          </TabsList>

          <TabsContent value="schools">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 flex justify-end">
                <Button onClick={downloadSchoolsExcel} className="flex items-center gap-2">
                  <FileDown size={18} />
                  Download Excel
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School Name</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead>Phone</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map((school) => (
                      <TableRow
                        key={school.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleRowClick({
                          ...school,
                          donations: donations.filter(d => d.schoolId === school.id)
                        })}
                      >
                        <TableCell>{school.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{school.email}</TableCell>
                        <TableCell>{school.phoneNumber}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="donators">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 flex justify-end">
                <Button onClick={downloadDonatorsExcel} className="flex items-center gap-2">
                  <FileDown size={18} />
                  Download Excel
                </Button>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead className="hidden md:table-cell">Phone</TableHead>
                      <TableHead>Donations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow
                        key={user.uid}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleRowClick({
                          ...user,
                          donations: donations.filter(d => d.userId === user.uid)
                        })}
                      >
                        <TableCell>{user.name}</TableCell>
                        <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          {user.phoneNumber || "Not provided"}
                        </TableCell>
                        <TableCell>
                          {donations.filter(d => d.userId === user.uid).length}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh]">
            <DialogHeader className="flex flex-row items-center justify-between">
              <DialogTitle>
                {selectedItem?.name || selectedItem?.schoolName || "Details"}
              </DialogTitle>
              <Button onClick={handleEdit} className="ml-4">
                Edit
              </Button>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 p-4">
                {selectedItem?.donations ? (
                  <div className="space-y-6">
                    <div className="grid gap-4">
                      <div>
                        <p className="font-semibold">Name:</p>
                        <p>{selectedItem.name}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Email:</p>
                        <p>{selectedItem.email}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Phone Number:</p>
                        <p>{selectedItem.phoneNumber || "Not provided"}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Donation History:</p>
                      <div className="space-y-4">
                        {selectedItem.donations.map((donation: DetailedDonation) => (
                          <div key={donation.id} className="bg-gray-50 p-4 rounded-lg">
                            <p><strong>School:</strong> {donation.schoolName}</p>
                            <p><strong>Food Item:</strong> {donation.foodItemName}</p>
                            <p><strong>Quantity:</strong> {donation.quantity}</p>
                            <p><strong>Date:</strong> {new Date(donation.createdAt).toLocaleDateString()}</p>
                            <p><strong>Note:</strong> {donation.note || "No note"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid gap-4">
                      <div>
                        <p className="font-semibold">School Name:</p>
                        <p>{selectedItem?.name}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Email:</p>
                        <p>{selectedItem?.email}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Address:</p>
                        <p>{selectedItem?.address}</p>
                      </div>
                      <div>
                        <p className="font-semibold">Phone Number:</p>
                        <p>{selectedItem?.phoneNumber}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold mb-2">Donation History:</p>
                      <div className="space-y-4">
                        {selectedItem?.donations?.map((donation: DetailedDonation) => (
                          <div key={donation.id} className="bg-gray-50 p-4 rounded-lg">
                            <p><strong>Donor:</strong> {donation.userName}</p>
                            <p><strong>Food Item:</strong> {donation.foodItemName}</p>
                            <p><strong>Quantity:</strong> {donation.quantity}</p>
                            <p><strong>Date:</strong> {new Date(donation.createdAt).toLocaleDateString()}</p>
                            <p><strong>Note:</strong> {donation.note || "No note"}</p>
                          </div>
                        ))}
                        {(!selectedItem?.donations || selectedItem.donations.length === 0) && (
                          <p className="text-gray-500">No donations received yet</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
