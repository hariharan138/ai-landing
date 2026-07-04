import { useState } from "react";
import { Bell, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuthStore } from "@/store/authStore";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [notificationCount] = useState(0);

  const handleLogout = async () => {
    logout();
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background/80 px-5 py-3.5 backdrop-blur-xl">
      <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-secondary" />

      <div className="flex-1 min-w-0">
        <h1 className="text-[14px] font-bold text-foreground">Dashboard</h1>
        <p className="hidden text-[11px] text-muted-foreground sm:block" suppressHydrationWarning>
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <ThemeToggle />

      <Button
        variant="ghost"
        size="icon"
        className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {notificationCount > 0 && (
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
        )}
      </Button>

      <Button
        variant="ghost"
        onClick={handleLogout}
        className="hidden h-9 gap-1.5 border border-border text-[12px] text-muted-foreground hover:border-destructive/20 hover:bg-destructive/10 hover:text-destructive sm:flex"
      >
        <LogOut className="h-3.5 w-3.5" />
        Sign out
      </Button>
    </header>
  );
}

export default Header;
