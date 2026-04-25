"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, unwrapPagedList } from "@/lib/api";
import axios from "axios";
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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAuth } from "@/contexts/auth-context";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, Trash2, Lock, Unlock, Search } from "lucide-react";
import { DataTablePagination } from "@/components/data-table-pagination";
import { UserAvatar } from "@/components/user-avatar";
import { toast } from "sonner";

import { PagedList, User } from "@/lib/types";



const fetchUsers = async (
  page: number,
  pageSize: number,
  search: string,
  role: string
): Promise<PagedList<User>> => {
  const params: Record<string, unknown> = { page, pageSize };
  if (search) params.search = search;
  if (role) params.role = role;
  const response = await api.get("/users", { params });
  return response.data;
};

export default function UsersPage() {
  useRequireAuth();
  const { user: currentUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "1",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const isOwner = currentUser?.role === 0;

  useEffect(() => {
    if (!authLoading && currentUser && currentUser.role !== 0) {
      router.replace("/domains");
    }
  }, [currentUser, authLoading, router]);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ["users", page, pageSize, search, roleFilter],
    queryFn: () => fetchUsers(page, pageSize, search, roleFilter),
    enabled: currentUser?.role === 0,
  });

  const usersDataUnwrapped = unwrapPagedList<User>(usersData);
  const users = usersDataUnwrapped.items;

  const createUser = useMutation({
    mutationFn: async (data: {
      name: string;
      email: string;
      password: string;
      role: number;
    }) => {
      const response = await api.post("/users", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setPage(1);
      toast.success("สร้างผู้ใช้สำเร็จ");
      setIsDialogOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "1" });
    },
    onError: (error: unknown) => {
      let message = "สร้างผู้ใช้ไม่สำเร็จ";
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      }
      toast.error(message);
    },
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("ลบผู้ใช้สำเร็จ");
    },
    onError: (error: unknown) => {
      let message = "ลบผู้ใช้ไม่สำเร็จ";
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      }
      toast.error(message);
    },
  });

  const toggleBanUser = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/users/${id}/ban`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("อัปเดตสถานะสำเร็จ");
    },
    onError: (error: unknown) => {
      let message = "อัปเดตสถานะไม่สำเร็จ";
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        message = error.response.data.message;
      }
      toast.error(message);
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast.error("รูปแบบอีเมลไม่ถูกต้อง");
      return;
    }
    if (newUser.password.length < 6) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    createUser.mutate({
      name: newUser.name,
      email: newUser.email,
      password: newUser.password,
      role: parseInt(newUser.role),
    });
  };

  if (!authLoading && currentUser && currentUser.role !== 0) {
    return null;
  }

  return (
    <div className="space-y-8 animate-in-fade">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gradient">จัดการผู้ใช้งาน</h1>
          <p className="text-muted-foreground mt-1">จัดการสิทธิ์และบัญชีผู้ใช้งานทั้งหมดในระบบ</p>
        </div>
        {isOwner && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl premium-gradient shadow-lg hover:shadow-primary/30 transition-all active:scale-95 px-6">
              <Plus className="mr-2 h-5 w-5" />
              เพิ่มผู้ใช้งาน
            </Button>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>เพิ่มผู้ใช้ใหม่</DialogTitle>
                <DialogDescription>
                  สร้างบัญชีผู้ใช้งานใหม่ในระบบ (เฉพาะ Owner)
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">ชื่อ-นามสกุล</Label>
                  <Input
                    id="name"
                    placeholder="ชื่อ นามสกุล"
                    value={newUser.name}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@company.com"
                    value={newUser.email}
                    onChange={(e) =>
                      setNewUser((prev) => ({ ...prev, email: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">รหัสผ่าน</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">บทบาท</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) =>
                      setNewUser((prev) => ({ ...prev, role: value || "1" }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกบทบาท" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">เจ้าของ</SelectItem>
                      <SelectItem value="1">พนักงาน</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={createUser.isPending}
                    className="w-full"
                  >
                    {createUser.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        กำลังสร้าง...
                      </>
                    ) : (
                      "สร้างผู้ใช้"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full max-w-md group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="ค้นหาชื่อหรืออีเมล..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-10 h-11 rounded-xl bg-card border-border/50 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
        </div>
        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v || ""); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-48 h-11 rounded-xl bg-card border-border/50">
            <SelectValue>
              {roleFilter === "0" ? "เจ้าของ" : roleFilter === "1" ? "พนักงาน" : "ทุกบทบาท"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="">ทุกบทบาท</SelectItem>
            <SelectItem value="0">เจ้าของ</SelectItem>
            <SelectItem value="1">พนักงาน</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="glass-card overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <CardTitle className="text-lg">รายชื่อผู้ใช้งาน</CardTitle>
          <CardDescription>รายชื่อและระดับสิทธิ์ของผู้ใช้งานทั้งหมดในองค์กร</CardDescription>
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
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>อีเมล</TableHead>
                  <TableHead>สิทธิ์</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>บัญชี</TableHead>
                  <TableHead>วันที่สร้าง</TableHead>
                  {isOwner && <TableHead className="w-32"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={isOwner ? 7 : 6}
                      className="text-center text-gray-500 py-8"
                    >
                      ยังไม่มีผู้ใช้งาน
                    </TableCell>
                  </TableRow>
                ) : (
                  users?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          <UserAvatar name={user.name} avatarUrl={user.avatarUrl} bgColor={user.avatarBgColor} size={32} />
                          {user.name}
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.role === 0 ? (
                          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
                            เจ้าของ
                          </Badge>
                        ) : (
                          <Badge variant="outline">พนักงาน</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
                          <Badge
                            variant="outline"
                            className="text-green-600"
                          >
                            ใช้งาน
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-gray-400"
                          >
                            ไม่ใช้งาน
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {user.isBanned ? (
                          <Badge variant="destructive">ล็อค</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600">ปกติ</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString("th-TH")}
                      </TableCell>
                      {isOwner && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {user.id !== currentUser?.id && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title={user.isBanned ? "ปลดล็อค" : "ล็อค"}
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setLockModalOpen(true);
                                  }}
                                  disabled={toggleBanUser.isPending}
                                >
                                  {user.isBanned ? (
                                    <Unlock className="h-4 w-4 text-orange-500" />
                                  ) : (
                                    <Lock className="h-4 w-4 text-amber-500" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setDeleteModalOpen(true);
                                  }}
                                  disabled={deleteUser.isPending}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          {usersDataUnwrapped.totalPages > 1 && (
            <DataTablePagination
              pageIndex={usersDataUnwrapped.pageIndex}
              totalPages={usersDataUnwrapped.totalPages}
              totalCount={usersDataUnwrapped.totalCount}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            />
          )}
        </CardContent>
      </Card>

      {/* Lock/Unlock Modal */}
      <Dialog open={lockModalOpen} onOpenChange={setLockModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedUser?.isBanned ? "ปลดล็อคผู้ใช้" : "ล็อคผู้ใช้"}</DialogTitle>
            <DialogDescription>
              คุณต้องการ{selectedUser?.isBanned ? "ปลดล็อค" : "ล็อค"}ผู้ใช้ <strong>{selectedUser?.name}</strong> ใช่หรือไม่?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setLockModalOpen(false)}>ยกเลิก</Button>
            <Button
              variant={selectedUser?.isBanned ? "default" : "destructive"}
              onClick={() => {
                if (selectedUser) toggleBanUser.mutate(selectedUser.id);
                setLockModalOpen(false);
              }}
              disabled={toggleBanUser.isPending}
            >
              {selectedUser?.isBanned ? "ปลดล็อค" : "ล็อค"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>ลบผู้ใช้</DialogTitle>
            <DialogDescription>
              คุณต้องการลบผู้ใช้ <strong>{selectedUser?.name}</strong> ใช่หรือไม่?
              การกระทำนี้ไม่สามารถย้อนกลับได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>ยกเลิก</Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedUser) deleteUser.mutate(selectedUser.id);
                setDeleteModalOpen(false);
              }}
              disabled={deleteUser.isPending}
            >
              ลบผู้ใช้
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
