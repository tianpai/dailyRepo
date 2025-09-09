import { useEffect } from "react";

export function BottomDrawer({
  open,
  onClose,
  children,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      return () => document.removeEventListener("keydown", onKey);
    }
  }, [open, onClose]);

  // Prevent background scroll when drawer is open
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.paddingRight = originalPaddingRight;
    };
  }, [open]);

  return (
    <div
      className="fixed inset-0 z-50"
      aria-hidden={!open}
      aria-modal={open}
      role="dialog"
      style={{ pointerEvents: open ? "auto" : "none" }}
    >
      {/* Backdrop */}
      <div
        className={
          "absolute inset-0 bg-black/50 transition-opacity duration-300 motion-safe:duration-300 motion-reduce:transition-none " +
          (open ? "opacity-100" : "opacity-0")
        }
        onClick={onClose}
      />
      {/* Panel */}
      <div
        className={
          `absolute inset-x-0 bottom-0 z-10 mx-auto w-full sm:w-[720px] bg-background text-foreground border-t-2 border-border rounded-t-lg shadow-xl will-change-transform ${className} ` +
          (open ? "translate-y-0" : "translate-y-[105%]") +
          " transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        }
        style={{ maxHeight: "100vh" }}
      >
        <div
          className="p-3 sm:p-4 overflow-y-auto overscroll-contain"
          style={{
            maxHeight: "calc(100vh - 1rem)",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
