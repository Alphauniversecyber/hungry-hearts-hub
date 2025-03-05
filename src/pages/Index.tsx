import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import MainNav from "@/components/MainNav";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { ArrowRight, Heart } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  const handleDonate = () => {
    localStorage.setItem("selectedSchoolId", "puhulwella-national-college");
    navigate("/donate");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-orange-50">
      <MainNav />
      
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
          <h1 className="font-sigmar text-4xl md:text-6xl lg:text-7xl bg-gradient-to-r from-primary-600 to-secondary bg-clip-text text-transparent animate-fade-in">
            FeedNet
          </h1>
          
          <h2 className="font-oswald text-2xl md:text-4xl text-gray-800 max-w-2xl leading-tight">
            Nourishing Future Leaders, One Meal at a Time
          </h2>
          
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed font-light">
            Join our mission to ensure no student goes hungry at Puhulwella National College. 
            Together, we can make a lasting difference in our school community.
          </p>

          <div className={`grid ${isLoggedIn ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'} gap-4 w-full max-w-md mt-8`}>
            <Button
              onClick={handleDonate}
              className={`h-12 text-lg font-oswald bg-primary hover:bg-primary-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${isLoggedIn ? 'mx-auto w-full sm:w-64' : ''}`}
            >
              Donate Now
              <Heart className="h-5 w-5" />
            </Button>

            {!isLoggedIn && (
              <Button
                onClick={() => navigate("/login")}
                variant="outline"
                className="h-12 text-lg font-oswald hover:bg-primary/5 border-2 flex items-center justify-center gap-2"
              >
                Sign In
                <ArrowRight className="h-5 w-5" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-16">
            <div className="bg-white/50 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-primary/10">
              <h3 className="font-oswald text-xl text-primary-700 mb-2">Easy Donation</h3>
              <p className="text-gray-600">Simple and straightforward process to contribute food items</p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-primary/10">
              <h3 className="font-oswald text-xl text-primary-700 mb-2">Direct Impact</h3>
              <p className="text-gray-600">Your donations directly help students in need</p>
            </div>
            <div className="bg-white/50 backdrop-blur-sm p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border border-primary/10">
              <h3 className="font-oswald text-xl text-primary-700 mb-2">Community Support</h3>
              <p className="text-gray-600">Building stronger communities through collective action</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
