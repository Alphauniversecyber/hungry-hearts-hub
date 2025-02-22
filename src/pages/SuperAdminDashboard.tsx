
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
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
import { School, DetailedDonation } from "@/types/school";
import MainNav from "@/components/MainNav";

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

        // Fetch donations with details
        const donationsSnapshot = await getDocs(collection(db, "donations"));
        const donationsPromises = donationsSnapshot.docs.map(async (doc) => {
          const donationData = doc.data();
          const user = usersData.find(u => u.uid === donationData.userId);
          const school = schoolsData.find(s => s.id === donationData.schoolId);
          
          // Fetch food item details
          const foodItemDoc = await getDocs(query(
            collection(db, "foodItems"),
            where("id", "==", donationData.foodItemId)
          ));
          
          const foodItemName = foodItemDoc.docs[0]?.data()?.name || "Unknown Food Item";

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
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-heading font-bold text-gray-900 mb-6">
          Super Admin Dashboard
        </h1>

        <Tabs defaultValue="schools" className="space-y-6">
          <TabsList>
            <TabsTrigger value="schools">Schools</TabsTrigger>
            <TabsTrigger value="donators">Donators</TabsTrigger>
          </TabsList>

          <TabsContent value="schools" className="bg-white rounded-lg shadow-lg p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>School Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Phone Number</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map((school) => (
                  <TableRow
                    key={school.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => handleRowClick(school)}
                  >
                    <TableCell>{school.name}</TableCell>
                    <TableCell>{school.email}</TableCell>
                    <TableCell>{school.address}</TableCell>
                    <TableCell>{school.phoneNumber}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="donators" className="bg-white rounded-lg shadow-lg p-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Total Donations</TableHead>
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
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {donations.filter(d => d.userId === user.uid).length}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedItem?.name || selectedItem?.schoolName || "Details"}
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {selectedItem?.donations ? (
                // Donator details view
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold">Name:</p>
                      <p>{selectedItem.name}</p>
                    </div>
                    <div>
                      <p className="font-semibold">Email:</p>
                      <p>{selectedItem.email}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold mb-2">Donation History:</p>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>School</TableHead>
                          <TableHead>Food Item</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedItem.donations.map((donation: DetailedDonation) => (
                          <TableRow key={donation.id}>
                            <TableCell>{donation.schoolName}</TableCell>
                            <TableCell>{donation.foodItemName}</TableCell>
                            <TableCell>{donation.quantity}</TableCell>
                            <TableCell>
                              {new Date(donation.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ) : (
                // School details view
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
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
                    <p className="font-semibold">Location:</p>
                    <p>Latitude: {selectedItem?.location?.latitude}</p>
                    <p>Longitude: {selectedItem?.location?.longitude}</p>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
