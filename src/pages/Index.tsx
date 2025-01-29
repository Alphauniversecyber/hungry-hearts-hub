import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import MainNav from "@/components/MainNav";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
      <MainNav />
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-gray-900 mb-6">
            Nourishing Future Leaders
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Join our mission to ensure no student goes hungry. Together, we can make
            a difference in our school community.
          </p>
          <div className="space-x-4">
            <Button
              onClick={() => navigate("/register")}
              className="bg-primary hover:bg-primary/90"
            >
              Donate Food
            </Button>
            <Button
              onClick={() => navigate("/admin-login")}
              variant="outline"
              className="border-primary text-primary hover:bg-primary/10"
            >
              Admin Login
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;