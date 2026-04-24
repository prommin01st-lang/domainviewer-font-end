"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { AppUser, DomainRecipient } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users } from "lucide-react";
import { toast } from "sonner";

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

interface RecipientsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: Domain | null;
  isOwner: boolean;
}

export function RecipientsDialog({
  open,
  onOpenChange,
  domain,
  isOwner,
}: RecipientsDialogProps) {
  const [overrides, setOverrides] = useState<Map<string, boolean>>(new Map());
  const queryClient = useQueryClient();

  const { data: users } = useQuery<AppUser[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data.items;
    },
    enabled: open,
  });

  const { data: recipients, isLoading: recipientsLoading } = useQuery<DomainRecipient[]>({
    queryKey: ["recipients", domain?.id],
    queryFn: async () => {
      const res = await api.get(`/domains/${domain!.id}/recipients`);
      return res.data;
    },
    enabled: !!domain?.id && open,
  });

  const recipientsMutation = useMutation({
    mutationFn: async ({ domainId, userIds }: { domainId: string; userIds: string[] }) => {
      await api.put(`/domains/${domainId}/recipients`, { userIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recipients", domain?.id] });
      toast.success("บันทึกผู้รับแจ้งเตือนสำเร็จ");
      onOpenChange(false);
    },
    onError: () => toast.error("ไม่สามารถบันทึกผู้รับแจ้งเตือนได้"),
  });

  const isSelected = (userId: string) => {
    if (overrides.has(userId)) return overrides.get(userId)!;
    return recipients?.some(r => r.userId === userId) ?? false;
  };

  const toggle = (userId: string) => {
    setOverrides(prev => new Map(prev).set(userId, !isSelected(userId)));
  };

  const handleSave = () => {
    if (!domain) return;
    const selectedIds = users?.filter(u => isSelected(u.id)).map(u => u.id) || [];
    recipientsMutation.mutate({ domainId: domain.id, userIds: selectedIds });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">ผู้รับแจ้งเตือน</DialogTitle>
          <DialogDescription className="text-sm">
            เลือกผู้ใช้ที่จะได้รับอีเมลแจ้งเตือนสำหรับ Domain <span className="font-bold text-primary">{domain?.name}</span>
            {!isOwner && <span className="block mt-2 text-destructive font-medium text-xs bg-destructive/10 p-2 rounded-lg italic">คุณสามารถดูผู้รับแจ้งเตือนได้เท่านั้น (เฉพาะ Owner ที่สามารถแก้ไขได้)</span>}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-80 overflow-y-auto py-2 custom-scrollbar pr-2">
          {recipientsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          ) : users?.length === 0 ? (
            <div className="text-center py-8 opacity-50">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">ไม่มีผู้ใช้ในระบบ</p>
            </div>
          ) : (
            users?.map((user) => (
              <label key={user.id} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-muted cursor-pointer transition-colors border border-transparent hover:border-border group">
                <input
                  type="checkbox"
                  checked={isSelected(user.id)}
                  onChange={() => toggle(user.id)}
                  disabled={!isOwner}
                  className="h-5 w-5 rounded-md border-border text-primary focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                />
                <div className="flex-1">
                  <p className="text-sm font-semibold group-hover:text-primary transition-colors">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </label>
            ))
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl">
            {isOwner ? "ยกเลิก" : "ปิด"}
          </Button>
          {isOwner && (
            <Button 
              onClick={handleSave} 
              disabled={recipientsMutation.isPending}
              className="rounded-xl premium-gradient"
            >
              {recipientsMutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
