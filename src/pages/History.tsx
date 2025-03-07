
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { DonatorHistory } from "@/components/DonatorHistory";
import MainNav from "@/components/MainNav";

const History = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate("/register");
      }
    });

    return () => checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white">
      <MainNav />
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold text-center mb-8">Donation History</h1>
        <DonatorHistory />
      </div>
    </div>
  );
};

export default History;
