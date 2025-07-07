import { Home, SquareUserRound, Info } from "lucide-react";
import { Link } from "react-router-dom";
import {
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

// Menu items.
const items = [
  {
    title: "Repos",
    url: "/",
    icon: Home,
  },
  {
    title: "Developers",
    url: "/developers",
    icon: SquareUserRound,
  },
];

export function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main>
        <SidebarTrigger />
        {children}
      </main>
    </SidebarProvider>
  );
}

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <TrendingGroup />
      </SidebarContent>
      <SidebarFooter>
        <FooterGroup />
      </SidebarFooter>
    </Sidebar>
  );
}

function TrendingGroup() {
  return (
    <SidebarGroup>
      <SidebarHeader className="major-mono">Trending</SidebarHeader>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link to={item.url} className="major-mono">
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function FooterGroup() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild>
          <Link to="/about" className="major-mono">
            <Info />
            <span>About</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
