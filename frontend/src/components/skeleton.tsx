import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { LineWobble } from "ldrs/react";
import { useState, useEffect } from "react";
import "ldrs/react/LineWobble.css";

function Countdown() {
  const [counter, setCounter] = useState(45);
  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((prevCounter) => (prevCounter > 0 ? prevCounter - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  return (
    <p>
      Initial loading can take up to {counter} seconds on the free tier of
      Render.
    </p>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="pt-25 px-4">
      <Alert variant="default" className="mb-4">
        <AlertTitle className="h-10">
          <div className="flex justify-center mb-4 text-white">
            <LineWobble
              size="300"
              stroke="3"
              bgOpacity="0.2"
              speed="3"
              color="white"
            />
          </div>
        </AlertTitle>
        <AlertDescription className="flex justify-center text-center">
          <Countdown></Countdown>
        </AlertDescription>
      </Alert>
      <Skeleton className="h-60 w-full mb-4" />
      <div className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="space-y-3 flex justify-center">
            <Skeleton className="h-45 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
