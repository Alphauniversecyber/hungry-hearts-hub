
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { School, DetailedDonation, FoodItem } from "@/types/school";
import MainNav from "@/components/MainNav";
import { ScrollArea } from "@/components/ui/scroll-area";

interface User {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
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
        // Fetch schools
        const schoolsSnapshot = await getDocs(collection(db, "schools"));
        const schoolsData = schoolsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as School[];
        setSchools(schoolsData);

        // Fetch users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data()
        })) as User[];
        setUsers(usersData);

        // First, fetch all food items to have them in memory
        const foodItemsSnapshot = await getDocs(collection(db, "foodItems"));
        const foodItems = foodItemsSnapshot.docs.reduce((acc, doc) => {
          acc[doc.id] = { id: doc.id, ...doc.data() } as FoodItem;
          return acc;
        }, {} as { [key: string]: FoodItem });

        // Fetch donations with details
        const donationsSnapshot = await getDocs(collection(db, "donations"));
        const donationsPromises = donationsSnapshot.docs.map(async (doc) => {
          const donationData = doc.data();
          const user = usersData.find(u => u.uid === donationData.userId);
          const school = schoolsData.find(s => s.id === donationData.schoolId);
          
          // Get food item from our cached foodItems
          const foodItem = foodItems[donationData.foodItemId];
          const foodItemName = foodItem?.name || "Unknown Food Item";

          console.log('Food Item Debug:', {
            foodItemId: donationData.foodItemId,
            foodItem,
            foodItemName
          });

          return {
            id: doc.id,
            ...donationData,
            userName: user?.name || "Unknown User",
            userEmail: user?.email || "Unknown Email",
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
            <DialogHeader>
              <DialogTitle>
                {selectedItem?.name || selectedItem?.schoolName || "Details"}
              </DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 p-4">
                {selectedItem?.donations ? (
                  // Donator details view
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
                  // School details view
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
