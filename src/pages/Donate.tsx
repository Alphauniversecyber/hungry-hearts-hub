import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const Donate = () => {
  const [foodItem, setFoodItem] = useState("");
  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Donation submission logic will be implemented later
    toast({
      title: "Thank you for your donation!",
      description: "We will contact you soon to arrange the pickup.",
    });
    setFoodItem("");
    setQuantity("");
    setNote("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Donate Food</h1>
        <div className="bg-white p-6 rounded-lg shadow">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Food Item</label>
              <Input
                type="text"
                value={foodItem}
                onChange={(e) => setFoodItem(e.target.value)}
                placeholder="Enter food item name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <Input
                type="text"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity (e.g., 2 kg, 5 packets)"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Additional Notes
              </label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any special instructions or notes"
                className="min-h-[100px]"
              />
            </div>
            <Button type="submit" className="w-full">
              Submit Donation
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Donate;