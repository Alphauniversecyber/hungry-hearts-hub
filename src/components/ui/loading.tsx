
import { Loader } from "lucide-react";

interface LoadingProps {
  message?: string;
}

export const Loading = ({ message = "Loading..." }: LoadingProps) => {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-3">
        <Loader className="h-8 w-8 text-primary animate-spin" />
        <p className="text-primary font-oswald text-lg animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
};
