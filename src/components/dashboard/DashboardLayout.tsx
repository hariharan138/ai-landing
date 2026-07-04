import { useEffect, useState, type ReactNode } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  ShoppingCart,
  FileText,
  Settings,
  LogOut,
  UserCircle,
  Package,
  Truck,
  Building2,
  Sparkles,
  BarChart3,
  UtensilsCrossed,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  getStoredUser,
  clearTokens,
  logout as apiLogout,
  getMe,
  updateStoredUser,
} from "@/lib/auth";
import { BranchFilterProvider } from "@/contexts/BranchFilterContext";
import { DateRangeProvider } from "@/contexts/DateRangeContext";
import { LocationSwitcher } from "@/components/dashboard/LocationSwitcher";
import { DateRangePicker } from "@/components/dashboard/DateRangePicker";

export type NavItem = {
  icon: React.ElementType;
  label: string;
  to: string;
  count?: number;
  badge?: string;
};

const MAIN_ITEMS: NavItem[] = [
  { icon: LayoutDashboard, label: "Overview", to: "/dashboard" },
  { icon: ShoppingCart, label: "POS Sales", to: "/dashboard/pos" },
  { icon: FileText, label: "Tally / Accounting", to: "/dashboard/tally" },
];

const OPS_ITEMS: NavItem[] = [
  { icon: Package, label: "Inventory", to: "/dashboard/inventory" },
  { icon: Truck, label: "Suppliers", to: "/dashboard/suppliers" },
  { icon: Building2, label: "Branches", to: "/dashboard/branches" },
  { icon: Star, label: "Reviews", to: "/dashboard/reviews" },
];

const AI_ITEMS: NavItem[] = [
  { icon: Sparkles, label: "PlatePilot AI", to: "/dashboard/ai", badge: "AI" },
  { icon: BarChart3, label: "Reports", to: "/dashboard/reports" },
];

const ADMIN_ITEMS: NavItem[] = [
  { icon: UserCircle, label: "Profile", to: "/dashboard/profile" },
  { icon: Settings, label: "Settings", to: "/dashboard/settings" },
];

export const NAV_ITEMS = [...MAIN_ITEMS, ...OPS_ITEMS, ...AI_ITEMS, ...ADMIN_ITEMS];

function NavSection({
  items,
  label,
  pathname,
}: {
  items: NavItem[];
  label: string;
  pathname: string;
}) {
  return (
    <SidebarGroup className="px-2 py-1">
      <SidebarGroupLabel className="px-2 pb-1.5 pt-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="gap-0.5">
          {items.map(({ icon: Icon, label: itemLabel, to, count, badge }) => {
            const isActive = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
            return (
              <SidebarMenuItem key={to}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={itemLabel}
                  className={cn(
                    "group/nav h-10 rounded-xl text-[13px] font-medium text-sidebar-foreground/65",
                    "transition-[background,box-shadow,transform,color] duration-200 ease-out",
                    "hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                    "hover:translate-x-1 group-data-[collapsible=icon]:hover:translate-x-0",
                    "active:scale-[0.98] group-data-[collapsible=icon]:active:scale-100",
                    "group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:rounded-lg",
                    "data-[active=true]:bg-transparent data-[active=true]:text-inherit",
                    isActive && [
                      "bg-sidebar-accent/50 text-sidebar-foreground translate-x-1",
                      "shadow-[inset_0_1px_0_0_oklch(1_0_0/8%)]",
                      "hover:bg-sidebar-accent hover:shadow-[0_4px_24px_oklch(0.62_0.19_260/18%)]",
                      "group-data-[collapsible=icon]:translate-x-0",
                      "group-data-[collapsible=icon]:!bg-sidebar-primary group-data-[collapsible=icon]:text-sidebar-primary-foreground",
                      "group-data-[collapsible=icon]:shadow-[0_0_14px_oklch(0.62_0.19_260/35%)]",
                      "group-data-[collapsible=icon]:ring-2 group-data-[collapsible=icon]:ring-sidebar-primary/30",
                      "group-data-[collapsible=icon]:hover:!bg-sidebar-primary group-data-[collapsible=icon]:hover:shadow-[0_0_18px_oklch(0.62_0.19_260/45%)]",
                    ],
                  )}
                >
                  <Link
                    to={to as any}
                    className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0"
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-200",
                        "group-data-[collapsible=icon]:h-auto group-data-[collapsible=icon]:w-auto group-data-[collapsible=icon]:rounded-none group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:ring-0",
                        isActive
                          ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_0_18px_oklch(0.62_0.19_260/40%)] ring-2 ring-sidebar-primary/30 group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:text-inherit group-data-[collapsible=icon]:shadow-none group-data-[collapsible=icon]:ring-0"
                          : "bg-transparent group-hover/nav:bg-sidebar-foreground/10 group-hover/nav:scale-110 group-hover/nav:ring-1 group-hover/nav:ring-sidebar-foreground/10 group-data-[collapsible=icon]:group-hover/nav:scale-100 group-data-[collapsible=icon]:group-hover/nav:ring-0 group-data-[collapsible=icon]:group-hover/nav:bg-transparent",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover/nav:scale-105 group-data-[collapsible=icon]:group-hover/nav:scale-100" />
                    </span>
                    <span
                      className={cn(
                        "transition-colors duration-200 group-data-[collapsible=icon]:hidden",
                        isActive && "font-semibold text-sidebar-primary",
                      )}
                    >
                      {itemLabel}
                    </span>
                  </Link>
                </SidebarMenuButton>
                {badge && (
                  <SidebarMenuBadge className="rounded bg-primary/15 px-1.5 text-[9px] font-bold tracking-wider text-primary">
                    {badge}
                  </SidebarMenuBadge>
                )}
                {count !== undefined && (
                  <SidebarMenuBadge
                    className={cn(
                      "rounded-md bg-sidebar-border/60 text-[10px] font-semibold text-sidebar-foreground/60",
                      isActive && "bg-sidebar-primary/15 text-sidebar-primary",
                    )}
                  >
                    {count}
                  </SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function DashboardLayout({ children }: { children?: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!getStoredUser()) navigate({ to: "/login" });
  }, [navigate]);

  const profileQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const fresh = await getMe();
      if (fresh) updateStoredUser(fresh);
      return fresh;
    },
    enabled: !!getStoredUser(),
    staleTime: 30_000,
  });

  const [storedUser, setStoredUser] = useState<ReturnType<typeof getStoredUser>>(null);
  useEffect(() => {
    setStoredUser(getStoredUser());
  }, []);
  const user = profileQuery.data ?? storedUser;

  const handleLogout = async () => {
    try {
      await apiLogout();
    } catch {
      clearTokens();
    }
    toast.success("Signed out successfully.");
    navigate({ to: "/login" });
  };

  const initials = (user?.full_name ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const role = (user as any)?.role ?? "Owner";

  return (
    <BranchFilterProvider>
      <DateRangeProvider>
        <SidebarProvider className="dashboard-shell min-h-screen bg-background">
        <Sidebar collapsible="icon" className="border-r border-sidebar-border/80 bg-sidebar">
          {/* Logo Header */}
          <SidebarHeader className="!gap-0 !p-0 h-14 shrink-0 border-b border-sidebar-border/80">
            <div className="flex h-full w-full items-center justify-between gap-2 px-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
              <Link
                to="/"
                className="flex min-w-0 flex-1 items-center gap-3 select-none group-data-[collapsible=icon]:flex-none group-data-[collapsible=icon]:justify-center"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
                  <UtensilsCrossed className="h-4 w-4" />
                </span>
                <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                  <p className="truncate text-[15px] font-bold leading-tight tracking-tight text-sidebar-foreground">
                    PlatePilot
                  </p>
                  <p className="truncate text-[10px] leading-tight text-sidebar-primary/80 font-medium">
                    Restaurant OS
                  </p>
                </div>
              </Link>
              <SidebarTrigger
                title="Collapse sidebar"
                className="h-9 w-9 shrink-0 rounded-xl text-sidebar-foreground/50 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground group-data-[collapsible=icon]:hidden"
              />
            </div>
          </SidebarHeader>

          {/* Navigation */}
          <SidebarContent className="py-2 overflow-x-hidden">
            <NavSection items={MAIN_ITEMS} label="Main" pathname={pathname} />
            <SidebarSeparator className="mx-3 my-1 bg-sidebar-border/60" />
            <NavSection items={OPS_ITEMS} label="Operations" pathname={pathname} />
            <SidebarSeparator className="mx-3 my-1 bg-sidebar-border/60" />
            <NavSection items={AI_ITEMS} label="Intelligence" pathname={pathname} />
            <SidebarSeparator className="mx-3 my-1 bg-sidebar-border/60" />
            <NavSection items={ADMIN_ITEMS} label="Administration" pathname={pathname} />
          </SidebarContent>

          {/* Footer — Tenant + User */}
          <SidebarFooter className="border-t border-sidebar-border/80 p-3 gap-2">
            {/* User profile */}
            <Link
              to="/dashboard/profile"
              className="flex items-center gap-2.5 rounded-xl px-2 py-2 transition-all duration-200 hover:bg-sidebar-accent/80 group-data-[collapsible=icon]:justify-center"
            >
              <Avatar className="h-8 w-8 shrink-0 ring-2 ring-sidebar-border/60">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                <p className="truncate text-[12px] font-semibold leading-tight text-sidebar-foreground">
                  {user?.full_name ?? "User"}
                </p>
                <p className="truncate text-[10px] text-sidebar-foreground/50">{role}</p>
              </div>
            </Link>

            {/* Actions row */}
            <div className="flex items-center gap-1 group-data-[collapsible=icon]:hidden">
              <ThemeToggle
                buttonClassName="text-sidebar-foreground/55 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                contentAlign="center"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-8 flex-1 justify-start gap-2 rounded-lg px-2 text-[11px] font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-destructive"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </Button>
            </div>
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

          <MainPanel onLogout={handleLogout} userName={user?.full_name ?? "there"}>
            {children}
          </MainPanel>
        </SidebarProvider>
      </DateRangeProvider>
    </BranchFilterProvider>
  );
}

function MainPanel({
  onLogout,
  children,
  userName,
}: {
  onLogout: () => void;
  children?: ReactNode;
  userName: string;
}) {
  const { state } = useSidebar();
  const firstName = userName.split(" ")[0] ?? userName;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <SidebarInset className="flex flex-col overflow-hidden bg-background dashboard-canvas">
      <header className="sticky top-0 z-[var(--z-sticky)] shrink-0 border-b border-border/60 bg-card/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[4.25rem] w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6 md:px-8">
          {state === "collapsed" && (
            <SidebarTrigger className="h-9 w-9 shrink-0 rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground [&_svg]:size-4" />
          )}

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {greeting}, {firstName}!
            </h1>
            <p className="hidden text-[12px] text-muted-foreground sm:block">
              Here&apos;s what&apos;s happening at your restaurant today.
            </p>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-2.5">
            <div
              className="hidden h-9 shrink-0 items-center rounded-full border border-border/60 bg-muted/50 px-3 text-[12px] font-medium text-muted-foreground sm:flex"
              suppressHydrationWarning
            >
              {new Date().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>

            <ThemeToggle className="hidden sm:inline-flex" contentAlign="center" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onLogout}
              className="hidden h-9 gap-1.5 rounded-xl text-[12px] font-medium text-muted-foreground hover:text-destructive xl:flex"
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Location switcher + date range — the owner's first touch every visit */}
      <div className="shrink-0 border-b border-border/60 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1600px] items-center gap-3 px-4 py-2.5 sm:px-6 md:px-8">
          <div className="min-w-0 flex-1">
            <LocationSwitcher />
          </div>
          <DateRangePicker />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 md:px-8 md:py-6">
        <div className="mx-auto w-full max-w-[1600px]">{children ?? <Outlet />}</div>
      </div>
    </SidebarInset>
  );
}
