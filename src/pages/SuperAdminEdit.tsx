
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import MainNav from "@/components/MainNav";
import { School } from "@/types/school";

interface User {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  phoneNumber?: string;
}

interface FormData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
}

const SuperAdminEdit = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [data, setData] = useState<School | User | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phoneNumber: "",
    password: ""
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) {
          toast({
            title: "Error",
            description: "No ID provided",
            variant: "destructive",
          });
          navigate("/super-admin-dashboard");
          return;
        }

        const docRef = doc(db, type === "school" ? "schools" : "users", id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const docData = docSnap.data();
          const formattedData = {
            id: docSnap.id,
            ...docData,
            // Ensure the required properties exist
            name: docData.name || "",
            email: docData.email || "",
            phoneNumber: docData.phoneNumber || docData.phone || "",
          };

          setData(formattedData as School | User);
          setFormData({
            name: formattedData.name,
            email: formattedData.email,
            phoneNumber: formattedData.phoneNumber,
            password: ""
          });
        } else {
          toast({
            title: "Error",
            description: "Document not found",
            variant: "destructive",
          });
          navigate("/super-admin-dashboard");
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error fetching data",
          variant: "destructive",
        });
        navigate("/super-admin-dashboard");
      }
    };

    fetchData();
  }, [id, type, toast, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!id || !type || !data) return;

      // Validate phone number
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(formData.phoneNumber)) {
        toast({
          title: "Invalid phone number",
          description: "Phone number must be exactly 10 digits",
          variant: "destructive",
        });
        return;
      }

      const collection = type === "school" ? "schools" : "users";
      const updateData: Record<string, string> = {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
      };

      // Only include password if it was changed
      if (formData.password) {
        if (formData.password.length < 6) {
          toast({
            title: "Invalid password",
            description: "Password must be at least 6 characters",
            variant: "destructive",
          });
          return;
        }
        updateData.password = formData.password;
      }

      await updateDoc(doc(db, collection, id), updateData);

      toast({
        title: "Updated successfully",
      });

      navigate("/super-admin-dashboard");
    } catch (error: any) {
      toast({
        title: "Error updating",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50">
      <MainNav />
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    </div>;
  }

  if (!data) {
    return <div className="min-h-screen bg-gray-50">
      <MainNav />
      <div className="container mx-auto p-4">
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-lg">No data found</p>
        </div>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNav />
      <div className="container mx-auto p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-semibold">
              Edit {type === "school" ? "School" : "Donator"}
            </h1>
            <Button variant="outline" onClick={() => navigate("/super-admin-dashboard")}>
              Back
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  disabled
                />
                <p className="text-sm text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <Label>Phone Number</Label>
                <Input
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  required
                  pattern="\d{10}"
                  title="Phone number must be exactly 10 digits"
                />
              </div>

              <div>
                <Label>New Password (leave empty to keep current)</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  minLength={6}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit">Save Changes</Button>
              <Button type="button" variant="outline" onClick={() => navigate("/super-admin-dashboard")}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminEdit;
