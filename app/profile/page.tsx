"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { api } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/user-avatar";
import { AvatarSVG } from "@/components/avatar-svg";
import { AVATAR_LIST } from "@/lib/avatars";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#fee2e2", "#ffedd5", "#fef3c7", "#ecfccb", "#d1fae5",
  "#ccfbf1", "#cffafe", "#e0f2fe", "#dbeafe", "#e0e7ff",
  "#f3e8ff", "#fce7f3", "#f3f4f6", "#e5e7eb", "#d1d5db",
];

export default function ProfilePage() {
  useRequireAuth();
  const { user, isLoading: authLoading, refreshUser } = useAuth();

  const [draft, setDraft] = useState<{
    name?: string;
    avatarUrl?: string | null;
    avatarBgColor?: string | null;
  }>({});

  const name = draft.name ?? user?.name ?? "";
  const selectedAvatar = draft.avatarUrl ?? user?.avatarUrl ?? "";
  const selectedBgColor = draft.avatarBgColor ?? user?.avatarBgColor ?? "";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const updateProfile = useMutation({
    mutationFn: async (data: { name: string; avatarUrl: string | null; avatarBgColor: string | null }) => {
      const res = await api.put("/auth/me", data);
      return res.data;
    },
    onSuccess: () => {
      setDraft({});
      refreshUser();
      toast.success("อัปเดตโปรไฟล์สำเร็จ");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "อัปเดตโปรไฟล์ไม่สำเร็จ");
    },
  });

  const changePassword = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const res = await api.post("/auth/change-password", data);
      return res.data;
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("กรุณากรอกชื่อ");
      return;
    }
    updateProfile.mutate({
      name: name.trim(),
      avatarUrl: selectedAvatar || null,
      avatarBgColor: selectedBgColor || null,
    });
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("กรุณากรอกรหัสผ่านให้ครบถ้วน");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }
    changePassword.mutate({ currentPassword, newPassword });
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in-fade max-w-3xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-gradient">โปรไฟล์ส่วนตัว</h1>
        <p className="text-muted-foreground">จัดการข้อมูลส่วนตัว สัญรูป (Avatar) และความปลอดภัยของบัญชี</p>
      </div>

      <Card className="glass-card overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="text-xl">ข้อมูลส่วนตัว</CardTitle>
          <CardDescription>ปรับแต่งชื่อ Avatar และโทนสีที่ต้องการแสดงผล</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6 p-4 rounded-2xl bg-muted/20 border border-border/50">
            <div className="relative group">
              <UserAvatar
                name={user?.name || ""}
                avatarUrl={selectedAvatar}
                bgColor={selectedBgColor}
                size={80}
                className="ring-4 ring-background shadow-xl"
              />
              <div className="absolute inset-0 rounded-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-bold tracking-tight">{user?.name}</p>
              <p className="text-sm text-muted-foreground font-medium">{user?.email}</p>
              <Badge variant="secondary" className="mt-2 px-3 py-1 bg-primary/10 text-primary border-primary/20">
                {user?.role === 0 ? "เจ้าของ (Owner)" : "พนักงาน (Employee)"}
              </Badge>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">ชื่อ</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="ชื่อ นามสกุล"
              />
            </div>

            {/* Avatar Selector */}
            <div className="space-y-4">
              <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground px-1">เลือก Avatar</Label>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3 p-4 rounded-2xl bg-muted/20 border border-border/50">
                {AVATAR_LIST.map((avatar) => (
                  <button
                    key={avatar}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, avatarUrl: avatar }))}
                    className={cn(
                      "relative p-2 rounded-xl border-2 transition-all hover:scale-110 active:scale-95 group",
                      selectedAvatar === avatar
                        ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
                        : "border-transparent bg-background hover:border-border hover:bg-muted"
                    )}
                  >
                    <AvatarSVG
                      file={avatar}
                      bgColor={selectedBgColor}
                      size={44}
                      className="mx-auto drop-shadow-sm group-hover:drop-shadow-md transition-all"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Background Color Picker */}
            <div className="space-y-2">
              <Label>สีพื้นหลัง Avatar</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setDraft((prev) => ({ ...prev, avatarBgColor: color }))}
                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                      selectedBgColor === color ? "border-gray-900 scale-110" : "border-gray-200"
                    }`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                <div className="flex items-center gap-2 ml-2">
                  <input
                    type="color"
                    value={selectedBgColor || "#f3f4f6"}
                    onChange={(e) => setDraft((prev) => ({ ...prev, avatarBgColor: e.target.value }))}
                    className="w-8 h-8 p-0 border-0 rounded-full overflow-hidden cursor-pointer"
                    title="เลือกสีเอง"
                  />
                  {selectedBgColor && (
                    <button
                      type="button"
                      onClick={() => setDraft((prev) => ({ ...prev, avatarBgColor: "" }))}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      รีเซ็ต
                    </button>
                  )}
                </div>
              </div>
            </div>

            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                "บันทึกโปรไฟล์"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>เปลี่ยนรหัสผ่าน</CardTitle>
          <CardDescription>เปลี่ยนรหัสผ่านบัญชีของคุณ</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">รหัสผ่านปัจจุบัน</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">รหัสผ่านใหม่</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" disabled={changePassword.isPending}>
              {changePassword.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังเปลี่ยนรหัสผ่าน...
                </>
              ) : (
                "เปลี่ยนรหัสผ่าน"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
