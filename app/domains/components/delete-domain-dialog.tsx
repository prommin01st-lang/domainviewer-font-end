"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";

interface Domain {
  id: string;
  name: string;
}

interface DeleteDomainDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain: Domain | null;
  onConfirm: (id: string) => void;
  isPending: boolean;
}

export function DeleteDomainDialog({
  open,
  onOpenChange,
  domain,
  onConfirm,
  isPending,
}: DeleteDomainDialogProps) {
  const [confirmText, setConfirmText] = useState("");

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setConfirmText("");
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-md rounded-2xl border-destructive/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-destructive flex items-center gap-2">
            <Trash2 className="h-6 w-6" />
            ยืนยันการลบ
          </DialogTitle>
          <DialogDescription className="pt-2 text-base">
            คุณแน่ใจหรือไม่ว่าต้องการลบ Domain{" "}
            <strong className="text-foreground">{domain?.name}</strong>?
            <span className="block mt-1 text-sm opacity-80">
              การกระทำนี้จะลบข้อมูลออกจากระบบอย่างถาวร (Soft Delete)
            </span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2.5">
            <Label htmlFor="delete-confirm" className="text-sm font-semibold opacity-70">
              พิมพ์คำว่า{" "}
              <span className="text-destructive font-bold underline">ลบโดเมน</span>{" "}
              เพื่อยืนยันความปลอดภัย
            </Label>
            <Input
              id="delete-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="พิมพ์ที่นี่..."
              className="h-11 rounded-xl border-destructive/30 focus-visible:ring-destructive focus-visible:border-destructive transition-all"
            />
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="rounded-xl h-11 px-6"
          >
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            onClick={() => domain && onConfirm(domain.id)}
            disabled={isPending || confirmText !== "ลบโดเมน"}
            className="rounded-xl h-11 px-8 shadow-lg shadow-destructive/20 flex-1 sm:flex-none"
          >
            {isPending ? "กำลังลบ..." : "ยืนยันการลบ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
