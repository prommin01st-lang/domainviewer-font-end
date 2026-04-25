"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAuth } from "@/contexts/auth-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Send, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertSettings {
  id: number;
  alertMonths: number | null;
  alertWeeks: number | null;
  alertDays: number | null;
  isEnabled: boolean;
  updatedAt: string;
}

interface EmailTemplate {
  id: number;
  type: string;
  subject: string;
  body: string;
  isEnabled: boolean;
  updatedAt: string;
}

import { AppUser } from "@/lib/types";

const fetchSettings = async (): Promise<AlertSettings> => {
  const response = await api.get("/alertsettings");
  return response.data;
};

const updateSettings = async (data: Partial<AlertSettings>): Promise<AlertSettings> => {
  const response = await api.put("/alertsettings", data);
  return response.data;
};

const fetchTemplates = async (): Promise<EmailTemplate[]> => {
  const response = await api.get("/emailtemplates");
  return response.data;
};

const updateTemplate = async (type: string, data: Partial<EmailTemplate>): Promise<EmailTemplate> => {
  const response = await api.put(`/emailtemplates/${type}`, data);
  return response.data;
};

const resetTemplate = async (type: string): Promise<EmailTemplate> => {
  const response = await api.post(`/emailtemplates/${type}/reset`);
  return response.data;
};

const fetchUsers = async (): Promise<AppUser[]> => {
  const response = await api.get("/users", { params: { pageSize: 1000 } });
  return response.data.items;
};

const sendDomainListReport = async (toEmails: string[]): Promise<unknown> => {
  const response = await api.post("/email/send-domain-list", { toEmails });
  return response.data;
};

function AlertSettingsForm({ settings }: { settings: AlertSettings }) {
  const { user } = useAuth();
  const isOwner = user?.role === 0;
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<AlertSettings>>({
    alertMonths: settings.alertMonths,
    alertWeeks: settings.alertWeeks,
    alertDays: settings.alertDays,
    isEnabled: settings.isEnabled,
  });

  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alertSettings"] });
      toast.success("บันทึกการตั้งค่าสำเร็จ");
    },
    onError: () => {
      toast.error("ไม่สามารถบันทึกการตั้งค่าได้");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in-fade">
      <div className="space-y-6">
        <div className="flex items-center justify-between rounded-2xl border border-border/50 p-6 bg-muted/30 glass-card">
          <div className="space-y-1">
            <Label className="text-base font-semibold">เปิดใช้งานการแจ้งเตือน</Label>
            <p className="text-sm text-muted-foreground">ระบบจะส่งอีเมลแจ้งเตือนไปยังผู้รับโดยอัตโนมัติเมื่อใกล้ถึงวันหมดอายุ</p>
          </div>
          <div className="relative inline-flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={formData.isEnabled ?? true}
              onChange={(e) => setFormData((prev) => ({ ...prev, isEnabled: e.target.checked }))}
              disabled={!isOwner}
              className="peer sr-only"
              id="enable-notifications"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-widest px-1">
            ระยะเวลาแจ้งเตือนล่วงหน้า (ระบุได้สูงสุด 3 ช่วงเวลา)
          </h3>
          <div className="grid gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all bg-card/50 backdrop-blur-sm">
              <div className="flex-1 space-y-1 mb-4 sm:mb-0">
                <Label htmlFor="alertMonths" className="text-base font-semibold">แจ้งเตือนระดับเดือน</Label>
                <p className="text-sm text-muted-foreground">ส่งการแจ้งเตือนรอบแรกล่วงหน้า (ปกติ 1 เดือน)</p>
              </div>
              <div className="flex items-center gap-4">
                <Input id="alertMonths" type="number" min={0} max={12} placeholder="0" 
                  className="w-24 text-center font-bold text-lg h-12 rounded-xl border-border/50 bg-muted/20"
                  value={formData.alertMonths ?? ""} disabled={!isOwner}
                  onChange={(e) => setFormData((prev) => ({ ...prev, alertMonths: e.target.value ? parseInt(e.target.value) : null }))} />
                <span className="text-sm font-semibold w-16 text-muted-foreground">เดือน</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all bg-card/50 backdrop-blur-sm">
              <div className="flex-1 space-y-1 mb-4 sm:mb-0">
                <Label htmlFor="alertWeeks" className="text-base font-semibold">แจ้งเตือนระดับสัปดาห์</Label>
                <p className="text-sm text-muted-foreground">ส่งการแจ้งเตือนรอบที่สองล่วงหน้า (ปกติ 1 สัปดาห์)</p>
              </div>
              <div className="flex items-center gap-4">
                <Input id="alertWeeks" type="number" min={0} max={52} placeholder="0" 
                  className="w-24 text-center font-bold text-lg h-12 rounded-xl border-border/50 bg-muted/20"
                  value={formData.alertWeeks ?? ""} disabled={!isOwner}
                  onChange={(e) => setFormData((prev) => ({ ...prev, alertWeeks: e.target.value ? parseInt(e.target.value) : null }))} />
                <span className="text-sm font-semibold w-16 text-muted-foreground">สัปดาห์</span>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-border/50 p-6 shadow-sm hover:shadow-md transition-all bg-card/50 backdrop-blur-sm">
              <div className="flex-1 space-y-1 mb-4 sm:mb-0">
                <Label htmlFor="alertDays" className="text-base font-semibold">แจ้งเตือนระดับวัน</Label>
                <p className="text-sm text-muted-foreground">ส่งการแจ้งเตือนรอบสุดท้ายล่วงหน้า (ปกติ 3 วัน)</p>
              </div>
              <div className="flex items-center gap-4">
                <Input id="alertDays" type="number" min={0} max={365} placeholder="0" 
                  className="w-24 text-center font-bold text-lg h-12 rounded-xl border-border/50 bg-muted/20"
                  value={formData.alertDays ?? ""} disabled={!isOwner}
                  onChange={(e) => setFormData((prev) => ({ ...prev, alertDays: e.target.value ? parseInt(e.target.value) : null }))} />
                <span className="text-sm font-semibold w-16 text-muted-foreground">วัน</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isOwner && (
        <Button type="submit" disabled={mutation.isPending} className="w-full sm:w-auto px-10 h-12 rounded-xl premium-gradient shadow-lg hover:shadow-primary/30 transition-all active:scale-95 text-lg font-semibold">
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              กำลังบันทึก...
            </>
          ) : "บันทึกการตั้งค่า"}
        </Button>
      )}
      {!isOwner && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 text-sm italic">
          <Loader2 className="h-4 w-4" />
          คุณสามารถดูการตั้งค่าได้เท่านั้น (เฉพาะ Owner ที่สามารถแก้ไขได้)
        </div>
      )}
    </form>
  );
}

function EmailTemplatesForm() {
  const { user } = useAuth();
  const isOwner = user?.role === 0;
  const queryClient = useQueryClient();
  const { data: templates, isLoading } = useQuery({
    queryKey: ["emailTemplates"],
    queryFn: fetchTemplates,
    enabled: isOwner,
  });

  const [editing, setEditing] = useState<Record<string, Partial<EmailTemplate>>>({});

  const mutation = useMutation({
    mutationFn: ({ type, data }: { type: string; data: Partial<EmailTemplate> }) => updateTemplate(type, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast.success("บันทึกเทมเพลตสำเร็จ");
    },
    onError: () => toast.error("ไม่สามารถบันทึกเทมเพลตได้"),
  });

  const resetMutation = useMutation({
    mutationFn: (type: string) => resetTemplate(type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emailTemplates"] });
      toast.success("คืนค่าเทมเพลตเริ่มต้นสำเร็จ");
    },
    onError: () => toast.error("ไม่สามารถคืนค่าเทมเพลตเริ่มต้นได้"),
  });

  if (!isOwner) {
    return (
      <div className="p-6 text-center text-muted-foreground italic border border-dashed rounded-2xl bg-muted/20">
        คุณสามารถดูเทมเพลตได้เท่านั้น (เฉพาะ Owner ที่สามารถแก้ไขได้)
      </div>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-64 w-full rounded-2xl" />;
  }

  const getEdit = (t: EmailTemplate) => editing[t.type] || {};

  const handleSave = (template: EmailTemplate) => {
    const edit = getEdit(template);
    mutation.mutate({
      type: template.type,
      data: {
        subject: edit.subject ?? template.subject,
        body: edit.body ?? template.body,
        isEnabled: edit.isEnabled ?? template.isEnabled,
      },
    });
  };

  const updateEdit = (type: string, field: keyof EmailTemplate, value: string | boolean) => {
    setEditing((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  };

  const placeholders = "{DomainName}, {ExpirationDate}, {DaysUntilExpiration}, {DomainTable}";

  return (
    <div className="space-y-8 animate-in-fade">
      <div className="rounded-2xl border border-primary/20 p-5 bg-primary/10 backdrop-blur-sm shadow-sm group">
        <p className="text-sm font-medium text-primary">
          <strong className="text-primary mr-2">💡 Placeholder ที่ใช้ได้:</strong> 
          <span className="font-mono bg-primary/5 px-2 py-1 rounded border border-primary/10 group-hover:border-primary/30 transition-colors">
            {placeholders}
          </span>
        </p>
      </div>
      {templates?.map((template) => {
        const edit = getEdit(template);
        return (
          <Card key={template.type} className="glass-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {template.type === "ExpirationAlert"
                      ? "แจ้งเตือนวันหมดอายุ"
                      : template.type === "ExpiredAlert"
                      ? "แจ้งเตือน Domain หมดอายุแล้ว"
                      : "รายงานรายการ Domain"}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">ตั้งค่ารูปแบบอีเมลที่ส่งให้ผู้ใช้งาน</p>
                </div>
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium">เปิดใช้งาน</Label>
                  <div className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={(edit.isEnabled ?? template.isEnabled)}
                      onChange={(e) => updateEdit(template.type, "isEnabled", e.target.checked)}
                      className="peer sr-only"
                      id={`enable-${template.type}`}
                    />
                    <div className="w-10 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <div className="space-y-2">
                <Label className="font-semibold">หัวข้ออีเมล</Label>
                <Input
                  value={(edit.subject ?? template.subject)}
                  onChange={(e) => updateEdit(template.type, "subject", e.target.value)}
                  className="rounded-xl border-border/50 bg-muted/20 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold">เนื้อหา (รองรับ HTML)</Label>
                <Textarea
                  value={(edit.body ?? template.body)}
                  onChange={(e) => updateEdit(template.type, "body", e.target.value)}
                  rows={10}
                  className="font-mono text-sm rounded-xl border-border/50 bg-muted/20 custom-scrollbar focus:ring-primary/20"
                />
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => resetMutation.mutate(template.type)}
                  disabled={resetMutation.isPending}
                  className="rounded-xl px-4 h-11 border-border/50 hover:bg-muted transition-all active:scale-95"
                >
                  {resetMutation.isPending && resetMutation.variables === template.type ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RotateCcw className="h-4 w-4 mr-2" />
                  )}
                  ค่าเริ่มต้น
                </Button>
                <Button
                  onClick={() => handleSave(template)}
                  disabled={mutation.isPending}
                  className="rounded-xl px-6 h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/10 transition-all active:scale-95"
                >
                  {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  บันทึกเทมเพลต
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function DomainReportForm() {
  const { user } = useAuth();
  const isOwner = user?.role === 0;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const { data: usersList } = useQuery({
    queryKey: ["usersList"],
    queryFn: fetchUsers,
    enabled: isOwner && isDialogOpen,
  });

  const sendMutation = useMutation({
    mutationFn: sendDomainListReport,
    onSuccess: () => {
      setIsDialogOpen(false);
      setSelectedUsers(new Set());
      toast.success("ส่งรายงานสำเร็จ");
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || "ส่งรายงานไม่สำเร็จ");
    },
  });

  const toggleUser = (id: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSend = () => {
    const emails = usersList?.filter((u) => selectedUsers.has(u.id)).map((u) => u.email) || [];
    if (emails.length === 0) {
      toast.error("กรุณาเลือกผู้รับอย่างน้อย 1 คน");
      return;
    }
    sendMutation.mutate(emails);
  };

  if (!isOwner) {
    return (
      <div className="p-6 text-center text-muted-foreground italic border border-dashed rounded-2xl bg-muted/20">
        คุณสามารถดูการตั้งค่าได้เท่านั้น (เฉพาะ Owner ที่สามารถแก้ไขได้)
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in-fade">
      <Card className="glass-card overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50">
          <CardTitle className="text-lg">ส่งรายงาน Domain</CardTitle>
          <CardDescription>ส่งรายการ Domain ทั้งหมดในระบบไปยังอีเมลที่เลือก (On-demand)</CardDescription>
        </CardHeader>
        <CardContent className="p-8 flex flex-col items-center justify-center text-center">
          <div className="mb-6 p-4 rounded-full bg-primary/10">
            <Send className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">ส่งรายงานฉบับสมบูรณ์</h3>
          <p className="text-muted-foreground mb-8 max-w-sm">
            เลือกผู้ใช้งานที่ต้องการส่งรายงานรายการโดเมนทั้งหมด พร้อมสถานะและวันหมดอายุ
          </p>
          <Button onClick={() => setIsDialogOpen(true)} className="rounded-xl px-8 h-12 premium-gradient shadow-lg hover:shadow-primary/30 transition-all active:scale-95">
            <Send className="h-5 w-5 mr-2" />
            เลือกผู้รับและส่งรายงาน
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl overflow-hidden p-0 gap-0">
          <DialogHeader className="p-6 bg-muted/30 border-b border-border/50">
            <DialogTitle>เลือกผู้รับรายงาน</DialogTitle>
            <DialogDescription>เลือกผู้ใช้ที่จะได้รับรายงาน Domain ทั้งหมด</DialogDescription>
          </DialogHeader>
          <div className="p-4 space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
            {usersList?.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">ไม่มีผู้ใช้ในระบบ</div>
            ) : (
              usersList?.map((u) => (
                <label key={u.id} className="flex items-center space-x-4 p-3 rounded-xl hover:bg-primary/5 cursor-pointer transition-colors group">
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(u.id)}
                    onChange={() => toggleUser(u.id)}
                    className="h-5 w-5 rounded-md border-border text-primary focus:ring-primary/20"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold group-hover:text-primary transition-colors">{u.name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </label>
              ))
            )}
          </div>
          <DialogFooter className="p-6 bg-muted/30 border-t border-border/50 gap-2">
            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl">ยกเลิก</Button>
            <Button onClick={handleSend} disabled={sendMutation.isPending} className="rounded-xl premium-gradient px-6 shadow-md">
              {sendMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              ส่งรายงานทันที
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SettingsTabs({ settings }: { settings: AlertSettings | undefined }) {
  const [activeTab, setActiveTab] = useState("alert");
  const tabs = [
    { id: "alert", label: "การแจ้งเตือน" },
    { id: "templates", label: "เทมเพลตอีเมล" },
    { id: "report", label: "รายงาน Domain" },
  ];

  return (
    <div className="w-full">
      <div className="flex gap-2 p-1 mb-8 bg-muted/50 rounded-2xl w-full sm:w-fit border border-border/50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 sm:flex-none px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300",
              activeTab === tab.id
                ? "bg-background text-primary shadow-sm ring-1 ring-border/50"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-in-fade">
        {activeTab === "alert" && (
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle className="text-xl">ตั้งค่าการแจ้งเตือน</CardTitle>
              <CardDescription>กำหนดระยะเวลาการส่งแจ้งเตือนก่อนที่ Domain จะหมดอายุ</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {settings && <AlertSettingsForm key={settings.id} settings={settings} />}
            </CardContent>
          </Card>
        )}

        {activeTab === "templates" && (
          <Card className="glass-card overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50">
              <CardTitle className="text-xl">เทมเพลตอีเมล</CardTitle>
              <CardDescription>ปรับแต่งหัวข้อและเนื้อหาของอีเมลแจ้งเตือนระบบ</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <EmailTemplatesForm />
            </CardContent>
          </Card>
        )}

        {activeTab === "report" && (
          <div className="max-w-3xl">
            <DomainReportForm />
          </div>
        )}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  useRequireAuth();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["alertSettings"],
    queryFn: fetchSettings,
  });

  if (isLoading) {
    return (
      <div className="space-y-8 animate-in-fade">
        <div className="space-y-4">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-6 w-full max-w-md rounded-xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in-fade">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight text-gradient">ตั้งค่าระบบ</h1>
        <p className="text-muted-foreground">จัดการการแจ้งเตือน เทมเพลตอีเมล และระบบรายงานอัตโนมัติ</p>
      </div>

      <SettingsTabs settings={settings} />
    </div>
  );
}

