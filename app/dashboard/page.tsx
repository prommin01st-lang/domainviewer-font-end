"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, AlertTriangle, CalendarClock, Users } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalDomains: number;
  expiredDomains: number;
  upcomingDomains: number;
  totalUsers: number;
}

interface UpcomingDomain {
  id: string;
  name: string;
  expirationDate: string;
  daysUntilExpiration: number;
}

const fetchStats = async (): Promise<DashboardStats> => {
  const res = await api.get("/dashboard/stats");
  return res.data;
};

const fetchUpcoming = async (): Promise<UpcomingDomain[]> => {
  const res = await api.get("/dashboard/upcoming");
  return res.data;
};

export default function DashboardPage() {
  useRequireAuth();
  const { user } = useAuth();
  const isOwner = user?.role === 0;

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: fetchStats,
  });

  const { data: upcoming, isLoading: upcomingLoading } = useQuery({
    queryKey: ["dashboardUpcoming"],
    queryFn: fetchUpcoming,
  });

  return (
    <div className="space-y-8 animate-in-fade">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-gradient">แดชบอร์ด</h1>
        <p className="text-muted-foreground">ภาพรวมระบบ Domain Viewer และสถานะการแจ้งเตือน</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">Domain ทั้งหมด</p>
                <div className="text-3xl font-bold mt-2 tracking-tight">
                  {statsLoading ? <Skeleton className="h-9 w-16" /> : stats?.totalDomains ?? 0}
                </div>
              </div>
              <div className="p-4 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <Globe className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground group-hover:text-orange-500 transition-colors">ใกล้หมดอายุ (30 วัน)</p>
                <div className="text-3xl font-bold mt-2 tracking-tight text-orange-500">
                  {statsLoading ? <Skeleton className="h-9 w-16" /> : stats?.upcomingDomains ?? 0}
                </div>
              </div>
              <div className="p-4 bg-orange-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <CalendarClock className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground group-hover:text-destructive transition-colors">หมดอายุแล้ว</p>
                <div className="text-3xl font-bold mt-2 tracking-tight text-destructive">
                  {statsLoading ? <Skeleton className="h-9 w-16" /> : stats?.expiredDomains ?? 0}
                </div>
              </div>
              <div className="p-4 bg-destructive/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        {isOwner && (
          <Card className="glass-card overflow-hidden group">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground group-hover:text-emerald-500 transition-colors">ผู้ใช้งาน</p>
                  <div className="text-3xl font-bold mt-2 tracking-tight">
                    {statsLoading ? <Skeleton className="h-9 w-16" /> : stats?.totalUsers ?? 0}
                  </div>
                </div>
                <div className="p-4 bg-emerald-500/10 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upcoming Domains */}
      <Card className="glass-card">
        <CardHeader className="border-b border-border/50 bg-muted/30">
          <CardTitle className="text-xl">Domain ใกล้หมดอายุ</CardTitle>
          <p className="text-sm text-muted-foreground">รายการ Domain ที่จะหมดอายุเร็วๆ นี้</p>
        </CardHeader>
        <CardContent className="p-0">
          {upcomingLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : upcoming && upcoming.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-bold py-4">Domain</TableHead>
                    <TableHead className="font-bold py-4">วันหมดอายุ</TableHead>
                    <TableHead className="font-bold py-4">เหลือเวลา</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcoming.map((domain) => (
                    <TableRow key={domain.id} className="hover:bg-muted/30 transition-colors group">
                      <TableCell className="py-4">
                        <Link href={`/domains`} className="font-semibold text-primary hover:underline underline-offset-4">
                          {domain.name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground py-4">
                        {new Date(domain.expirationDate).toLocaleDateString("th-TH", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric"
                        })}
                      </TableCell>
                      <TableCell className="py-4">
                        <span
                          className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold shadow-sm",
                            domain.daysUntilExpiration <= 7
                              ? "bg-destructive/10 text-destructive border border-destructive/20 animate-pulse"
                              : domain.daysUntilExpiration <= 30
                              ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                              : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          )}
                        >
                          {domain.daysUntilExpiration} วัน
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <Globe className="h-16 w-16 opacity-10" />
              <p className="text-lg">ไม่มี Domain ที่ใกล้หมดอายุในขณะนี้</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

