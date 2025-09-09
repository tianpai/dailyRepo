import { useState, useEffect, useRef } from "react";
import { CircleHelp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MobilePopupProps {
  content: string;
  className?: string;
  popupWidth?: string;
  trigger?: React.ReactNode;
}

export function MobilePopup({
  content,
  className = "",
  popupWidth = "w-64",
  trigger,
}: MobilePopupProps) {
  const isMobile = useIsMobile();
  const [showPopup, setShowPopup] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setShowPopup(false);
      }
    }

    if (showPopup) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showPopup]);

  if (isMobile) {
    return (
      <div className={`relative ${className}`} ref={popupRef}>
        <button
          onClick={() => setShowPopup(!showPopup)}
          className="text-description hover:text-foreground cursor-pointer"
        >
          {trigger || <CircleHelp className="w-5 h-5" />}
        </button>
        {showPopup && (
          <div
            className={`absolute right-0 top-6 z-10 ${popupWidth} p-3 border-2 border-border bg-background text-foreground major-mono text-xs shadow-lg`}
          >
            <p>{content}</p>
            <button
              onClick={() => setShowPopup(false)}
              className="mt-2 px-2 py-1 border-1 border-border text-xs hover:bg-border transition-colors"
            >
              CLOSE
            </button>
          </div>
        )}
      </div>
    );
  }

  // Desktop: use regular tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`cursor-help ${className}`}>
            {trigger || (
              <CircleHelp className="w-5 h-5 text-description hover:text-foreground" />
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{content}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
