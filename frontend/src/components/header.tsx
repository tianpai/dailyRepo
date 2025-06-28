import { ModeToggle } from "./mode-toggle";
import { type ReactNode } from "react";
import { Link } from "react-router-dom";

export function HeaderContainer({ children }: { children: ReactNode }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center bg-background w-full border-b">
      {children}
    </div>
  );
}
// Similarly for other components
export function HeaderTitle({ children }: { children: ReactNode }) {
  return (
    <h1 className="scroll-m-20 p-5 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-balance">
      {children}
    </h1>
  );
}

export function HeaderActions({ children }: { children: ReactNode }) {
  return <div className="p-5 pr-10">{children}</div>;
}

export function Header() {
  return (
    <HeaderContainer>
      <HeaderTitle>
        <Link
          to="/"
          className="hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          dAiLy Repo
        </Link>
      </HeaderTitle>
      <HeaderActions>
        <div className="flex items-center space-x-4">
          <Link
            to="/about"
            className="major-mono text-sm font-medium hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            About
          </Link>
          <ModeToggle />
        </div>
      </HeaderActions>
    </HeaderContainer>
  );
}
