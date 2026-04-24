"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  Users,
  Bell,
  Settings,
  Shield,
  Menu,
  X,
  LogOut,
  LogIn,
  UserCircle,
  Sun,
  Moon,
} from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";

const navItems = [
  { href: "/dashboard", label: "แดชบอร์ด", icon: LayoutDashboard, ownerOnly: false },
  { href: "/domains", label: "รายการ Domain", icon: Globe, ownerOnly: false },
  { href: "/users", label: "ผู้ใช้งาน", icon: Users, ownerOnly: true },
  { href: "/notification-logs", label: "ประวัติแจ้งเตือน", icon: Bell, ownerOnly: true },
  { href: "/allowed-domains", label: "โดเมนที่อนุญาต", icon: Shield, ownerOnly: true },
  { href: "/settings", label: "ตั้งค่า", icon: Settings, ownerOnly: false },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme, mounted } = useTheme();

  const activeItem = navItems.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <div className="min-h-screen flex bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-card border-r border-border transform transition-all duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-border bg-card/50 backdrop-blur-sm">
          <Link href="/domains" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg premium-gradient flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <Globe className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold text-gradient">
              DomainViewer
            </span>
          </Link>
          <button
            className="lg:hidden p-2 rounded-xl hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-160px)]">
          {navItems
            .filter((item) => !item.ownerOnly || user?.role === 0)
            .map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"}`} />
                  {item.label}
                </Link>
              );
            })}
        </nav>

        {/* User section at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card/50 backdrop-blur-md">
          {isAuthenticated && user ? (
            <div className="space-y-3">
              <Link
                href="/profile"
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  pathname === "/profile"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <UserAvatar name={user.name} avatarUrl={user.avatarUrl} bgColor={user.avatarBgColor} size={36} className="shadow-sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {user.name}
                  </p>
                  <p className="text-xs opacity-70 truncate">{user.email}</p>
                </div>
                <UserCircle className="h-4 w-4 shrink-0 opacity-40" />
              </Link>
              <Button
                variant="ghost"
                className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                size="sm"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                ออกจากระบบ
              </Button>
            </div>
          ) : (
            <Link href="/login" className="block w-full">
              <Button variant="outline" className="w-full rounded-xl" size="sm">
                <LogIn className="mr-2 h-4 w-4" />
                เข้าสู่ระบบ
              </Button>
            </Link>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        {/* Top bar */}
        <header className="h-16 sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden rounded-xl hover:bg-muted"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-bold text-foreground">
              {activeItem?.label || "Domain Viewer"}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {mounted && (
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl hover:bg-muted transition-all active:scale-95 text-muted-foreground hover:text-foreground"
                title={theme === "dark" ? "สว่าง" : "มืด"}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-background/50 custom-scrollbar animate-in-fade">
          <div className="max-w-7xl mx-auto p-4 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
