
import { School } from "@/types/school";

interface SchoolInfoProps {
  school: School | null;
  isAcceptingDonations: boolean;
}

export const SchoolInfo = ({ school, isAcceptingDonations }: SchoolInfoProps) => {
  if (!school) {
    return null;
  }

  if (!isAcceptingDonations) {
    return (
      <div className="text-center py-8">
        <p className="text-lg font-semibold text-green-600">
          This school has received all the food they needed. Thank you for your support!
        </p>
      </div>
    );
  }

  return (
    <div className="mb-6 p-6 bg-white/80 backdrop-blur-sm rounded-md border border-primary/10 shadow-sm">
      <h2 className="font-oswald text-xl font-semibold mb-4 text-primary-700">School Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="font-medium text-gray-700">Contact:</p>
          <p className="font-oswald">{school.phoneNumber || school.phone || "Not available"}</p>
        </div>
        
        <div>
          <p className="font-medium text-gray-700">Food Still Needed:</p>
          <p className="font-oswald text-lg font-semibold text-primary-600">{school.totalFoodNeeded || 0} units</p>
        </div>
      </div>
    </div>
  );
};
