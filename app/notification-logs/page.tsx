"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { DataTablePagination } from "@/components/data-table-pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NotificationLog {
  id: string;
  domainId: string;
  domainName: string;
  userId: string;
  userEmail: string;
  alertType: string;
  sentAt: string;
  status: number;
  errorMessage: string | null;
  expirationDate: string;
}

import { PagedList } from "@/lib/types";

interface DomainOption {
  id: string;
  name: string;
}

const fetchLogs = async (
  page: number,
  pageSize: number,
  domainId?: string,
  status?: number
): Promise<PagedList<NotificationLog>> => {
  const params: Record<string, unknown> = { page, pageSize };
  if (domainId) params.domainId = domainId;
  if (status !== undefined) params.status = status;
  const response = await api.get("/notificationlogs", { params });
  return response.data;
};

const getStatusBadge = (status: number) => {
  switch (status) {
    case 0:
      return <Badge variant="secondary">รอดำเนินการ</Badge>;
    case 1:
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">สำเร็จ</Badge>;
    case 2:
      return <Badge variant="destructive">ล้มเหลว</Badge>;
    default:
      return <Badge variant="outline">ไม่ทราบ</Badge>;
  }
};

export default function NotificationLogsPage() {
  useRequireAuth();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [domainFilter, setDomainFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!authLoading && user && user.role !== 0) {
      router.replace("/domains");
    }
  }, [user, authLoading, router]);

  const { data: logsData, isLoading } = useQuery({
    queryKey: ["notificationLogs", page, pageSize, domainFilter, statusFilter],
    queryFn: () => fetchLogs(
      page,
      pageSize,
      domainFilter || undefined,
      statusFilter ? parseInt(statusFilter) : undefined
    ),
    enabled: user?.role === 0,
  });

  const { data: domainsList } = useQuery<DomainOption[]>({
    queryKey: ["domainsList"],
    queryFn: async () => {
      const res = await api.get("/domains", { params: { pageSize: 1000 } });
      return res.data.items.map((d: { id: string; name: string }) => ({ id: d.id, name: d.name }));
    },
    enabled: user?.role === 0,
  });

  const logs = logsData?.items;

  if (!authLoading && user && user.role !== 0) {
    return null;
  }

  return (
    <div className="space-y-8 animate-in-fade">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-gradient">ประวัติการแจ้งเตือน</h1>
        <p className="text-muted-foreground">บันทึกการส่งอีเมลแจ้งเตือนวันหมดอายุถึงผู้ใช้งาน</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Select value={domainFilter} onValueChange={(v) => { setDomainFilter(v || ""); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-64 h-11 rounded-xl bg-card border-border/50">
            <SelectValue>
              {domainsList?.find((d) => d.id === domainFilter)?.name || "ทุก Domain"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="">ทุก Domain</SelectItem>
            {domainsList?.map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v || ""); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48 h-11 rounded-xl bg-card border-border/50">
            <SelectValue placeholder="ทุกสถานะ" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="">ทุกสถานะ</SelectItem>
            <SelectItem value="0">รอดำเนินการ</SelectItem>
            <SelectItem value="1">สำเร็จ</SelectItem>
            <SelectItem value="2">ล้มเหลว</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="glass-card overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <CardTitle className="text-lg">ประวัติทั้งหมด</CardTitle>
          <CardDescription>รายการบันทึกการส่งแจ้งเตือนย้อนหลัง</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Domain</TableHead>
                  <TableHead>ผู้รับ</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่ส่ง</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                      ยังไม่มีประวัติการแจ้งเตือน
                    </TableCell>
                  </TableRow>
                ) : (
                  logs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.domainName}</TableCell>
                      <TableCell>{log.userEmail}</TableCell>
                      <TableCell>{log.alertType}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>{new Date(log.sentAt).toLocaleString("th-TH")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          {logsData && logsData.totalPages > 1 && (
            <DataTablePagination
              pageIndex={logsData.pageIndex}
              totalPages={logsData.totalPages}
              totalCount={logsData.totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
