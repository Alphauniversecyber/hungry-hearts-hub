
import { School } from "@/types/school";

interface SchoolInfoProps {
  school: School | null;
  isAcceptingDonations: boolean;
}

export const SchoolInfo = ({ school, isAcceptingDonations }: SchoolInfoProps) => {
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
    <div className="mb-6 p-4 bg-gray-50 rounded-md">
      <h2 className="font-semibold mb-2">School Food Needs</h2>
      <p>Total Food Still Needed: {school?.totalFoodNeeded || 0}</p>
    </div>
  );
};
