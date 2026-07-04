import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { LayoutDashboard, ShoppingCart, FileText, Users, Settings, LogOut } from "lucide-react";
import {
  Sidebar as SidebarComponent,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/store/authStore";
import { formatters } from "@/utils/formatters";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
  { icon: ShoppingCart, label: "POS Sales", href: "/dashboard?tab=pos" },
  { icon: FileText, label: "Tally Vouchers", href: "/dashboard?tab=tally" },
  { icon: Users, label: "Team", href: "/team" },
  { icon: Settings, label: "Settings", href: "/settings" },
];

export function Sidebar() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = async () => {
    logout();
    window.location.href = "/login";
  };

  const initials = user ? formatters.initials(user.full_name) : "U";

  return (
    <SidebarComponent collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <SidebarHeader className="px-4 py-4">
        <Link
          to="/"
          className="flex items-center gap-2 font-extrabold text-xl tracking-tight text-sidebar-foreground select-none group-data-[collapsible=icon]:justify-center"
        >
          <span className="text-primary">λ</span>
          <span className="text-sidebar-foreground/70 font-bold text-lg group-data-[collapsible=icon]:hidden">
            gorix
          </span>
        </Link>
      </SidebarHeader>

      <SidebarSeparator className="bg-sidebar-border" />

      {/* Nav */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/40 uppercase tracking-widest text-[10px]">
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ icon: Icon, label, href }) => (
                <SidebarMenuItem key={label}>
                  <SidebarMenuButton
                    asChild
                    tooltip={label}
                    className="rounded-xl hover:bg-sidebar-accent text-sidebar-foreground/60 hover:text-sidebar-foreground"
                  >
                    <Link to={href}>
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarSeparator />

      {/* User footer */}
      <SidebarFooter className="p-3">
        <div className="flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/50 px-3 py-2.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback
              suppressHydrationWarning
              className="bg-gradient-to-tr from-primary to-success text-primary-foreground text-[11px] font-extrabold"
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-[12px] font-bold text-sidebar-foreground">
              {user?.full_name ?? "User"}
            </p>
            <p className="truncate text-[10px] text-sidebar-foreground/50">{user?.email ?? ""}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Sign out"
            className="h-7 w-7 shrink-0 text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 group-data-[collapsible=icon]:hidden"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </SidebarFooter>

      {/* Drag rail to resize */}
      <SidebarRail />
    </SidebarComponent>
  );
}

export default Sidebar;
