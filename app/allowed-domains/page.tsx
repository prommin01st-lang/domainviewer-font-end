"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { DataTablePagination } from "@/components/data-table-pagination";

interface AllowedDomain {
  id: number;
  domain: string;
  createdAt: string;
}

import { PagedList } from "@/lib/types";

const fetchAllowedDomains = async (page: number, pageSize: number): Promise<PagedList<AllowedDomain>> => {
  const response = await api.get("/allowedemaildomains", { params: { page, pageSize } });
  return response.data;
};

export default function AllowedDomainsPage() {
  useRequireAuth();
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [newDomain, setNewDomain] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<AllowedDomain | null>(null);

  useEffect(() => {
    if (!authLoading && user && user.role !== 0) {
      router.replace("/domains");
    }
  }, [user, authLoading, router]);

  const { data: domainsData, isLoading } = useQuery({
    queryKey: ["allowedDomains", page, pageSize],
    queryFn: () => fetchAllowedDomains(page, pageSize),
    enabled: user?.role === 0,
  });

  const domains = domainsData?.items;

  const createMutation = useMutation({
    mutationFn: (domain: string) => api.post("/allowedemaildomains", { domain }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allowedDomains"] });
      setPage(1);
      setNewDomain("");
      toast.success("เพิ่มโดเมนสำเร็จ");
    },
    onError: () => toast.error("ไม่สามารถเพิ่มโดเมนได้"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/allowedemaildomains/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allowedDomains"] });
      toast.success("ลบโดเมนสำเร็จ");
    },
    onError: () => toast.error("ไม่สามารถลบโดเมนได้"),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const domain = newDomain.trim();
    if (!domain) {
      toast.error("กรุณากรอกโดเมน");
      return;
    }
    if (domain.includes("@") || domain.includes(" ") || !domain.includes(".")) {
      toast.error("รูปแบบโดเมนไม่ถูกต้อง (เช่น company.com)");
      return;
    }
    createMutation.mutate(domain);
  };

  if (!authLoading && user && user.role !== 0) {
    return null;
  }

  return (
    <div className="space-y-8 animate-in-fade">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-gradient">โดเมนที่อนุญาต</h1>
        <p className="text-muted-foreground">จัดการ Email Domain ที่อนุญาตให้ใช้งานในระบบ (Whitelist)</p>
      </div>

      <Card className="glass-card overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <CardTitle className="text-lg">เพิ่มโดเมน</CardTitle>
          <CardDescription>เพิ่ม Email Domain ที่อนุญาต (เช่น company.com)</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="company.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="h-11 rounded-xl bg-card border-border/50 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              />
            </div>
            <Button type="submit" disabled={createMutation.isPending} className="rounded-xl premium-gradient shadow-lg hover:shadow-primary/30 transition-all active:scale-95 px-6">
              <Plus className="h-5 w-5 mr-2" />
              เพิ่มโดเมน
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="glass-card overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <CardTitle className="text-lg">รายการโดเมนที่อนุญาต</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>โดเมน</TableHead>
                  <TableHead>วันที่เพิ่ม</TableHead>
                  <TableHead className="text-right">จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-gray-500 py-8">
                      ยังไม่มีโดเมนที่อนุญาต
                    </TableCell>
                  </TableRow>
                ) : (
                  domains?.map((domain) => (
                    <TableRow key={domain.id}>
                      <TableCell className="font-medium">@{domain.domain}</TableCell>
                      <TableCell>{new Date(domain.createdAt).toLocaleDateString("th-TH")}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedDomain(domain);
                            setDeleteModalOpen(true);
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          {domainsData && domainsData.totalPages > 1 && (
            <DataTablePagination
              pageIndex={domainsData.pageIndex}
              totalPages={domainsData.totalPages}
              totalCount={domainsData.totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            />
          )}
        </CardContent>
      </Card>

      {/* Delete Confirm Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ลบโดเมนที่อนุญาต</DialogTitle>
            <DialogDescription>
              คุณต้องการลบโดเมน <strong>@{selectedDomain?.domain}</strong> ใช่หรือไม่?
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>ยกเลิก</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedDomain) deleteMutation.mutate(selectedDomain.id);
                setDeleteModalOpen(false);
              }}
              disabled={deleteMutation.isPending}
            >
              ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
