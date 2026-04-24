"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { PagedList, AppUser } from "@/lib/types";
import { RecipientsDialog } from "./components/recipients-dialog";
import { DomainFormDialog, DomainFormData } from "./components/domain-form-dialog";
import { DeleteDomainDialog } from "./components/delete-domain-dialog";
import { useState, useRef } from "react";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAuth } from "@/contexts/auth-context";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { toast } from "sonner";
import { Plus, Pencil, Trash2, Users, Search, Download, Upload, Globe } from "lucide-react";
import { DataTablePagination } from "@/components/data-table-pagination";
import { format } from "date-fns";

interface Domain {
  id: string;
  name: string;
  description: string | null;
  registrationDate: string | null;
  expirationDate: string;
  registrant: string | null;
  registrar: string | null;
  imageUrl: string | null;
  isActive: boolean;
  createdBy: string | null;
  creatorName: string | null;
  createdAt: string;
  updatedAt: string | null;
  daysUntilExpiration: number;
}

const fetchDomains = async (page: number, pageSize: number, search: string): Promise<PagedList<Domain>> => {
  const response = await api.get("/domains", {
    params: { page, pageSize, search },
  });
  return response.data;
};

const getExpirationBadge = (days: number) => {
  if (days < 0) return <Badge variant="destructive" className="rounded-full px-3 shadow-sm">หมดอายุแล้ว</Badge>;
  if (days <= 7) return <Badge variant="destructive" className="rounded-full px-3 shadow-sm animate-pulse">{days} วัน</Badge>;
  if (days <= 30) return <Badge variant="secondary" className="rounded-full px-3 bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 hover:bg-orange-200 shadow-sm border-none">{days} วัน</Badge>;
  return <Badge variant="outline" className="rounded-full px-3 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 shadow-sm">{days} วัน</Badge>;
};

export default function DomainsPage() {
  useRequireAuth();
  const { user } = useAuth();
  const isOwner = user?.role === 0;
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRecipientsOpen, setIsRecipientsOpen] = useState(false);
  const [recipientsDialogKey, setRecipientsDialogKey] = useState(0);
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [selectedRecipientDomain, setSelectedRecipientDomain] = useState<Domain | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editInitialData, setEditInitialData] = useState<Partial<DomainFormData>>();

  const { data: usersList } = useQuery<AppUser[]>({
    queryKey: ["usersList"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data.items;
    },
  });

  const { data: domainsData, isLoading } = useQuery({
    queryKey: ["domains", page, pageSize, search],
    queryFn: () => fetchDomains(page, pageSize, search),
  });

  const domains = domainsData?.items;

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post("/domains", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      setPage(1);
      setIsCreateOpen(false);
      toast.success("เพิ่ม Domain สำเร็จ");
    },
    onError: () => toast.error("ไม่สามารถเพิ่ม Domain ได้"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      api.put(`/domains/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      setIsEditOpen(false);
      toast.success("แก้ไข Domain สำเร็จ");
    },
    onError: () => toast.error("ไม่สามารถแก้ไข Domain ได้"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/domains/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["domains"] });
      setIsDeleteOpen(false);
      toast.success("ลบ Domain สำเร็จ");
    },
    onError: () => toast.error("ไม่สามารถลบ Domain ได้"),
  });


  const openEdit = (domain: Domain) => {
    setSelectedDomain(domain);
    setEditInitialData({
      name: domain.name,
      description: domain.description || "",
      registrationDate: domain.registrationDate ? new Date(domain.registrationDate) : undefined,
      expirationDate: new Date(domain.expirationDate),
      registrant: domain.registrant || "",
      registrar: domain.registrar || "",
      imageUrl: domain.imageUrl || "",
    });
    setIsEditOpen(true);
  };

  const openDelete = (domain: Domain) => {
    setSelectedDomain(domain);
    setIsDeleteOpen(true);
  };

  const openRecipients = (domain: Domain) => {
    setSelectedRecipientDomain(domain);
    setRecipientsDialogKey(k => k + 1);
    setIsRecipientsOpen(true);
  };

  const handleCreateSubmit = (data: DomainFormData) => {
    createMutation.mutate({
      ...data,
      registrationDate: data.registrationDate ? format(data.registrationDate, "yyyy-MM-dd") : null,
      expirationDate: data.expirationDate ? format(data.expirationDate, "yyyy-MM-dd") : "",
    });
  };

  const handleEditSubmit = (data: DomainFormData) => {
    if (!selectedDomain) return;
    updateMutation.mutate({
      id: selectedDomain.id,
      data: {
        ...data,
        isActive: true,
        registrationDate: data.registrationDate ? format(data.registrationDate, "yyyy-MM-dd") : null,
        expirationDate: data.expirationDate ? format(data.expirationDate, "yyyy-MM-dd") : "",
      },
    });
  };

  const handleExport = async () => {
    try {
      const res = await api.get("/domains/export", { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `domains-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("ส่งออก CSV สำเร็จ");
    } catch {
      toast.error("ไม่สามารถส่งออก CSV ได้");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await api.post("/domains/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(res.data.message || "นำเข้าสำเร็จ");
      queryClient.invalidateQueries({ queryKey: ["domains"] });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "ไม่สามารถนำเข้า CSV ได้");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-8 animate-in-fade">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">รายการ Domain</h1>
          <p className="text-muted-foreground mt-1">จัดการและตรวจสอบวันหมดอายุ Domain ทั้งหมดของคุณ</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={handleExport} className="rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95">
            <Download className="h-4 w-4 mr-2 text-primary" />
            <span className="hidden sm:inline">ส่งออก CSV</span>
            <span className="sm:hidden">ส่งออก</span>
          </Button>
          {isOwner && (
            <>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95">
                <Upload className="h-4 w-4 mr-2 text-primary" />
                <span className="hidden sm:inline">นำเข้า CSV</span>
                <span className="sm:hidden">นำเข้า</span>
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv"
                className="hidden"
                onChange={handleImport}
              />
            </>
          )}
          <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl premium-gradient shadow-lg hover:shadow-primary/30 transition-all active:scale-95 px-6">
            <Plus className="h-5 w-5 mr-2" />
            เพิ่ม Domain
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full max-w-md group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="ค้นหา Domain, ผู้จดทะเบียน..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 h-11 rounded-xl bg-card border-border/50 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
        </div>
      </div>

      <Card className="glass-card overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Domain ทั้งหมด</CardTitle>
              <CardDescription>แสดงรายการ Domain และสถานะการจดทะเบียน</CardDescription>
            </div>
            <Badge variant="outline" className="rounded-lg px-2.5 py-0.5 bg-background font-mono text-xs">
              {domainsData?.totalCount || 0} รายการ
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent border-border/50">
                    <TableHead className="w-[200px] font-bold">ชื่อ Domain</TableHead>
                    <TableHead className="font-bold">ผู้จดทะเบียน</TableHead>
                    <TableHead className="font-bold">ผู้รับจดทะเบียน</TableHead>
                    <TableHead className="font-bold">วันหมดอายุ</TableHead>
                    <TableHead className="font-bold">เหลือเวลา</TableHead>
                    <TableHead className="text-right font-bold">จัดการ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {domains?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-16">
                        <div className="flex flex-col items-center gap-3">
                          <Globe className="h-12 w-12 opacity-10" />
                          <p>ยังไม่มีรายการ Domain ในระบบ</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    domains?.map((domain) => (
                      <TableRow key={domain.id} className="group transition-colors hover:bg-muted/30">
                        <TableCell className="font-semibold text-primary">{domain.name}</TableCell>
                        <TableCell className="text-muted-foreground">{domain.registrant || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {domain.registrar ? (
                            <Badge variant="secondary" className="font-normal bg-primary/10 text-primary border-none">
                              {domain.registrar}
                            </Badge>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-muted-foreground tabular-nums">
                          {new Date(domain.expirationDate).toLocaleDateString("th-TH", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </TableCell>
                        <TableCell>{getExpirationBadge(domain.daysUntilExpiration)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isOwner && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => openEdit(domain)}
                                  className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                                  title="แก้ไข"
                                  aria-label={`แก้ไข ${domain.name}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => openDelete(domain)}
                                  className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
                                  title="ลบ"
                                  aria-label={`ลบ ${domain.name}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openRecipients(domain)} 
                              className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary transition-all"
                              title="ผู้รับแจ้งเตือน"
                              aria-label={`ผู้รับแจ้งเตือนสำหรับ ${domain.name}`}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
          <div className="p-4 border-t border-border/50 bg-muted/20">
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
          </div>
        </CardContent>
      </Card>

      <DomainFormDialog
        mode="create"
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onSubmit={handleCreateSubmit}
        isPending={createMutation.isPending}
        usersList={usersList}
      />

      <DomainFormDialog
        mode="edit"
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        initialData={editInitialData}
        domainName={selectedDomain?.name}
        onSubmit={handleEditSubmit}
        isPending={updateMutation.isPending}
        usersList={usersList}
      />

      <DeleteDomainDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        domain={selectedDomain}
        onConfirm={(id) => deleteMutation.mutate(id)}
        isPending={deleteMutation.isPending}
      />

      <RecipientsDialog
        open={isRecipientsOpen}
        onOpenChange={setIsRecipientsOpen}
        domain={selectedRecipientDomain}
        isOwner={isOwner}
        key={recipientsDialogKey}
      />
    </div>
  );
}
