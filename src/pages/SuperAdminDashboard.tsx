import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Edit, Plus } from "lucide-react";
import { Loading } from "@/components/ui/loading";

interface School {
  id: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  status: "active" | "pending" | "rejected";
  totalFoodNeeded: number;
}

const SuperAdminDashboard = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const schoolsCollection = collection(db, "schools");
        const schoolsSnapshot = await getDocs(schoolsCollection);
        const schoolsList = schoolsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as School[];
        setSchools(schoolsList);
      } catch (error: any) {
        toast({
          title: "Error fetching schools",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
  }, [toast]);

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
    return <Loading message="Loading schools..." />;
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
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-yellow-600">
                {schools.filter(school => school.status === "pending").length}
              </p>
            </CardContent>
          </Card>
        </div>

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
                  {schools.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell className="text-xs sm:text-sm md:text-base font-medium">
                        {school.name}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm md:text-base hidden md:table-cell">
                        {school.email}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm md:text-base hidden sm:table-cell">
                        {school.phone}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs sm:text-sm inline-flex items-center rounded-full px-2.5 py-0.5 font-medium
                          ${school.status === 'active' ? 'bg-green-100 text-green-800' :
                          school.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'}`}>
                          {school.status.charAt(0).toUpperCase() + school.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button
                          onClick={() => navigate(`/super-admin/edit/${school.id}`)}
                          size="sm"
                          variant="outline"
                          className="text-xs sm:text-sm"
                        >
                          <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
