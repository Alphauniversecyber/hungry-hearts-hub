import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { auth, db, fetchWithAuth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Edit, Plus } from "lucide-react"; 
import { Loading } from "@/components/ui/loading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { School, User } from "@/types/school";

const SuperAdminDashboard = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [donators, setDonators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("schools");
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleEditSchool = (school: School) => {
    console.log("Edit school clicked:", school);
    navigate(`/super-admin/edit/school/${school.id}`);
  };

  const handleEditDonator = (donator: User) => {
    console.log("Edit donator clicked:", donator);
    navigate(`/super-admin/edit/user/${donator.id}`);
  };

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        setLoading(true);
        
        await fetchWithAuth(async () => {
          console.log("Authenticated as superadmin, fetching data...");
          
          const schoolsCollection = collection(db, "schools");
          const schoolsSnapshot = await getDocs(schoolsCollection);
          const schoolsList = schoolsSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || "",
              email: data.email || "",
              address: data.address || "",
              phoneNumber: data.phoneNumber || "",
              phone: data.phone || data.phoneNumber || "", 
              status: data.status || "pending",
              totalFoodNeeded: data.totalFoodNeeded || 0
            } as School;
          });
          
          setSchools(schoolsList);
          console.log("Schools fetched:", schoolsList);

          const usersCollection = collection(db, "users");
          const usersSnapshot = await getDocs(usersCollection);
          const usersList = usersSnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name || "",
              email: data.email || "",
              phone: data.phone || "",
              role: data.role || "",
              createdAt: data.createdAt || new Date().toISOString(),
              schoolId: data.schoolId
            } as User;
          });
          
          const donatorsList = usersList.filter(user => user.role === "donor");
          setDonators(donatorsList);
          console.log("Donators fetched:", donatorsList);
          
          return { success: true };
        });
      } catch (error: any) {
        console.error("Error fetching data:", error);
        
        if (error.message === "User not authenticated") {
          setAuthError("You are not logged in. Please log in.");
          navigate("/super-admin-login");
        } else if (error.message === "User not authorized as superadmin") {
          setAuthError("You don't have permission to view this page.");
          navigate("/login");
        } else {
          setAuthError("An error occurred. Please try logging in again.");
          toast({
            title: "Error fetching data",
            description: error.message,
            variant: "destructive",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [toast, navigate]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate("/login");
      toast({
        title: "Logged out successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error logging out",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <Loading message="Loading data..." />;
  }

  if (authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Error</h2>
          <p className="text-gray-700 mb-6">{authError}</p>
          <Button onClick={() => navigate("/super-admin-login")} className="w-full">
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-oswald text-center sm:text-left">
            Super Admin Dashboard
          </h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => navigate("/school-register")} 
              className="flex-1 sm:flex-none text-sm sm:text-base font-oswald"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add School
            </Button>
            <Button 
              onClick={handleLogout} 
              variant="outline"
              className="flex-1 sm:flex-none text-sm sm:text-base font-oswald"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg md:text-xl font-oswald">
                Total Schools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                {schools.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg md:text-xl font-oswald">
                Active Schools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-green-600">
                {schools.filter(school => school.status === "active").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base sm:text-lg md:text-xl font-oswald">
                Total Donators
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600">
                {donators.length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="schools" onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start mb-4">
            <TabsTrigger value="schools" className="text-sm sm:text-base font-oswald">Schools</TabsTrigger>
            <TabsTrigger value="donators" className="text-sm sm:text-base font-oswald">Donators</TabsTrigger>
          </TabsList>
          
          <TabsContent value="schools">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl md:text-2xl font-oswald">
                  Registered Schools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm md:text-base font-oswald">School Name</TableHead>
                        <TableHead className="text-xs sm:text-sm md:text-base font-oswald hidden md:table-cell">Email</TableHead>
                        <TableHead className="text-xs sm:text-sm md:text-base font-oswald hidden sm:table-cell">Phone</TableHead>
                        <TableHead className="text-xs sm:text-sm md:text-base font-oswald">Status</TableHead>
                        <TableHead className="text-xs sm:text-sm md:text-base font-oswald">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schools.length > 0 ? (
                        schools.map((school) => (
                          <TableRow key={school.id}>
                            <TableCell className="text-xs sm:text-sm md:text-base font-medium">
                              {school.name}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm md:text-base hidden md:table-cell">
                              {school.email}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm md:text-base hidden sm:table-cell">
                              {school.phone || school.phoneNumber}
                            </TableCell>
                            <TableCell>
                              <span className={`text-xs sm:text-sm inline-flex items-center rounded-full px-2.5 py-0.5 font-medium
                                ${school.status === 'active' ? 'bg-green-100 text-green-800' :
                                school.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'}`}>
                                {school.status ? school.status.charAt(0).toUpperCase() + school.status.slice(1) : 'Pending'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <Button
                                onClick={() => handleEditSchool(school)}
                                size="sm"
                                variant="outline"
                                className="text-xs sm:text-sm"
                                type="button"
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            No schools found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="donators">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl md:text-2xl font-oswald">
                  Registered Donators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm md:text-base font-oswald">Name</TableHead>
                        <TableHead className="text-xs sm:text-sm md:text-base font-oswald hidden md:table-cell">Email</TableHead>
                        <TableHead className="text-xs sm:text-sm md:text-base font-oswald hidden sm:table-cell">Phone</TableHead>
                        <TableHead className="text-xs sm:text-sm md:text-base font-oswald">Registered On</TableHead>
                        <TableHead className="text-xs sm:text-sm md:text-base font-oswald">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {donators.length > 0 ? (
                        donators.map((donator) => (
                          <TableRow key={donator.id}>
                            <TableCell className="text-xs sm:text-sm md:text-base font-medium">
                              {donator.name}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm md:text-base hidden md:table-cell">
                              {donator.email}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm md:text-base hidden sm:table-cell">
                              {donator.phone}
                            </TableCell>
                            <TableCell className="text-xs sm:text-sm md:text-base">
                              {donator.createdAt ? new Date(donator.createdAt).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Button
                                onClick={() => handleEditDonator(donator)}
                                size="sm"
                                variant="outline"
                                className="text-xs sm:text-sm"
                                type="button"
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                Edit
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                            No donators found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
