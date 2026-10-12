import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme-provider";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative inline-flex h-8 w-14 items-center rounded-full border-2 border-border bg-background transition-colors hover:opacity-70"
      aria-label="Toggle theme"
    >
      <span
        className={`inline-block h-6 w-6 transform rounded-full bg-foreground transition-transform ${
          theme === "dark" ? "translate-x-7" : "translate-x-1"
        }`}
      >
        {theme === "dark" ? (
          <Moon className="h-4 w-4 m-1 text-background" />
        ) : (
          <Sun className="h-4 w-4 m-1 text-background" />
        )}
      </span>
    </button>
  );
}
