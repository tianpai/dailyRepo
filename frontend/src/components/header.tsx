import { ModeToggle } from "./mode-toggle";
import { type ReactNode } from "react";
import { Link } from "react-router-dom";

export function HeaderContainer({ children }: { children: ReactNode }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center bg-background/95 backdrop-blur-sm w-full border-b border-border h-16 px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
// Similarly for other components
export function HeaderTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight">
      {children}
    </h1>
  );
}

export function HeaderActions({ children }: { children: ReactNode }) {
  return <div className="flex items-center gap-4">{children}</div>;
}

export function Header() {
  return (
    <HeaderContainer>
      <div></div>
      <HeaderActions>
        <Link
          to="/"
          className="major-mono text-lg font-normal text-foreground hover:opacity-70 transition-opacity"
        >
          DAILY REPO
        </Link>
        <ModeToggle />
      </HeaderActions>
    </HeaderContainer>
  );
}
