import {
  Home,
  SquareUserRound,
  Info,
  Flame,
  Search,
  Menu,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { RepoDatePicker } from "@/components/date-picker";

interface NavigationItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    title: "Search",
    url: "/search",
    icon: Search,
  },
  {
    title: "Highlights",
    url: "/",
    icon: Flame,
  },
  {
    title: "Repos",
    url: "/repos",
    icon: Home,
  },
  {
    title: "Developers",
    url: "/developers",
    icon: SquareUserRound,
  },
];

const SIDEBAR_STYLES = {
  toggle: "fixed top-4 left-4 z-50 p-3 text-foreground major-mono hover:opacity-70 transition-all duration-200",
  backdrop: "fixed inset-0 bg-black/20 z-40",
  container: "fixed top-16 left-4 z-50 w-80 h-[calc(100vh-4rem)] overflow-y-auto border-2 bg-background border-border text-foreground transition-all duration-200 animate-in slide-in-from-left-10",
  section: "p-4 sm:p-6 lg:p-10 border-b-2 border-border",
  sectionLast: "p-4 sm:p-6 lg:p-10",
  heading: "major-mono text-lg font-normal text-foreground mb-4",
  link: "flex items-center gap-3 p-2 major-mono text-lg text-foreground hover:bg-foreground hover:text-background transition-all duration-200",
} as const;

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  return (
    <div className="relative min-h-screen">
      <SidebarToggle isOpen={isOpen} onToggle={toggleSidebar} />
      
      {isOpen && (
        <SidebarOverlay onClose={closeSidebar}>
          <FloatingSidebar />
        </SidebarOverlay>
      )}

      <main>{children}</main>
    </div>
  );
}

interface SidebarToggleProps {
  isOpen: boolean;
  onToggle: () => void;
}

function SidebarToggle({ isOpen, onToggle }: SidebarToggleProps) {
  return (
    <button onClick={onToggle} className={SIDEBAR_STYLES.toggle} aria-label="Toggle sidebar">
      {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
    </button>
  );
}

interface SidebarOverlayProps {
  children: React.ReactNode;
  onClose: () => void;
}

function SidebarOverlay({ children, onClose }: SidebarOverlayProps) {
  return (
    <>
      <div className={SIDEBAR_STYLES.backdrop} onClick={onClose} />
      <div className={SIDEBAR_STYLES.container}>
        {children}
      </div>
    </>
  );
}

function FloatingSidebar() {
  return (
    <div className="flex flex-col">
      <SidebarSection title="Select Date">
        <RepoDatePicker />
      </SidebarSection>

      <SidebarSection title="Trending">
        <NavigationMenu items={NAVIGATION_ITEMS} />
      </SidebarSection>

      <SidebarSection title="" isLast>
        <NavigationLink
          to="/about"
          icon={Info}
          label="About"
        />
      </SidebarSection>
    </div>
  );
}

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  isLast?: boolean;
}

function SidebarSection({ title, children, isLast = false }: SidebarSectionProps) {
  return (
    <div className={isLast ? SIDEBAR_STYLES.sectionLast : SIDEBAR_STYLES.section}>
      {title && <h4 className={SIDEBAR_STYLES.heading}>{title}</h4>}
      {children}
    </div>
  );
}

interface NavigationMenuProps {
  items: NavigationItem[];
}

function NavigationMenu({ items }: NavigationMenuProps) {
  return (
    <div className="space-y-2">
      {items.map((item) => (
        <NavigationLink
          key={item.title}
          to={item.url}
          icon={item.icon}
          label={item.title}
        />
      ))}
    </div>
  );
}

interface NavigationLinkProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

function NavigationLink({ to, icon: Icon, label }: NavigationLinkProps) {
  return (
    <Link to={to} className={SIDEBAR_STYLES.link}>
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </Link>
  );
}
