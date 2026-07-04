import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Sidebar from "@/components/shared/Sidebar";
import Header from "@/components/shared/Header";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider className="min-h-screen bg-background">
      <Sidebar />
      <SidebarInset className="bg-background">
        <Header />
        <main className="flex-1 space-y-6 overflow-y-auto p-5 md:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default DashboardLayout;
