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
  toggle:
    "fixed top-4 left-4 z-50 p-3 text-foreground major-mono hover:opacity-70 transition-all duration-200",
  backdrop: "fixed inset-0 bg-black/20 z-40",
  container:
    "fixed top-0 left-0 z-50 w-80 h-screen overflow-y-auto bg-background text-foreground",
  section: "p-4 sm:p-6 lg:p-10 border-b-2 border-border",
  sectionLast: "p-4 sm:p-6 lg:p-10",
  heading: "major-mono text-lg font-normal text-foreground mb-4",
  link: "flex items-center gap-3 p-2 major-mono text-lg text-foreground hover:bg-foreground hover:text-background transition-all duration-200",
} as const;

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  return (
    <div className="relative min-h-screen">
      <button
        onClick={toggleSidebar}
        className={SIDEBAR_STYLES.toggle}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className={SIDEBAR_STYLES.backdrop} onClick={closeSidebar} />
      )}

      <div
        className={SIDEBAR_STYLES.container}
        style={{
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 300ms ease-in-out",
        }}
      >
        <FloatingSidebar onClose={closeSidebar} />
      </div>

      <main>{children}</main>
    </div>
  );
}

function FloatingSidebar({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex flex-col pt-20">
      <div className="absolute top-4 left-4">
        <button
          onClick={onClose}
          className="p-3 text-foreground major-mono hover:opacity-70 transition-all duration-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <SidebarSection title="Trending">
        <NavigationMenu items={NAVIGATION_ITEMS} />
      </SidebarSection>

      <SidebarSection title="" isLast>
        <NavigationLink to="/about" icon={Info} label="About" />
      </SidebarSection>
    </div>
  );
}

interface SidebarSectionProps {
  title: string;
  children: React.ReactNode;
  isLast?: boolean;
}

function SidebarSection({
  title,
  children,
  isLast = false,
}: SidebarSectionProps) {
  return (
    <div
      className={isLast ? SIDEBAR_STYLES.sectionLast : SIDEBAR_STYLES.section}
    >
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
