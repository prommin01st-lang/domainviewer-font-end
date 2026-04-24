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
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, Users } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { AppUser } from "@/lib/types";
import { toast } from "sonner";

const REGISTRAR_OPTIONS = [
  "THNIC",
  "Z.com",
  "NetDesignHost",
  "ReadyPlanet",
  "SiamWebHosting",
  "Hostneverdie",
  "Cloudflare",
  "Namecheap",
  "GoDaddy",
];

export interface DomainFormData {
  name: string;
  description: string;
  registrationDate: Date | undefined;
  expirationDate: Date | undefined;
  registrant: string;
  registrar: string;
  registrarOther: string;
  imageUrl: string;
}

interface DomainFormDialogProps {
  mode: "create" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: Partial<DomainFormData>;
  domainName?: string;
  onSubmit: (data: DomainFormData) => void;
  isPending: boolean;
  usersList?: AppUser[];
}

function isOtherRegistrar(value: string) {
  return value !== "" && !REGISTRAR_OPTIONS.includes(value);
}

function normalizeInitialData(data?: Partial<DomainFormData>): DomainFormData {
  const registrar = data?.registrar || "";
  const isOther = isOtherRegistrar(registrar);
  return {
    name: data?.name || "",
    description: data?.description || "",
    registrationDate: data?.registrationDate,
    expirationDate: data?.expirationDate,
    registrant: data?.registrant || "",
    registrar: isOther ? "__other__" : registrar,
    registrarOther: isOther ? registrar : "",
    imageUrl: data?.imageUrl || "",
  };
}

export function DomainFormDialog({
  mode,
  open,
  onOpenChange,
  initialData,
  domainName,
  onSubmit,
  isPending,
  usersList,
}: DomainFormDialogProps) {
  const [formData, setFormData] = useState<DomainFormData>(() =>
    normalizeInitialData(initialData)
  );
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.expirationDate) {
      toast.error("กรุณากรอกชื่อ Domain และวันหมดอายุ");
      return;
    }
    if (!formData.name.includes(".")) {
      toast.error("ชื่อ Domain ไม่ถูกต้อง (ต้องมีจุด เช่น example.com)");
      return;
    }
    if (formData.registrar === "__other__" && !formData.registrarOther.trim()) {
      toast.error("กรุณากรอกชื่อผู้จดทะเบียน");
      return;
    }

    const registrarValue =
      formData.registrar === "__other__"
        ? formData.registrarOther.trim()
        : formData.registrar.trim();

    onSubmit({
      ...formData,
      registrar: registrarValue,
    });
  };

  const idPrefix = mode === "create" ? "" : "edit-";
  const title = mode === "create" ? "เพิ่ม Domain ใหม่" : "แก้ไขข้อมูล Domain";
  const description =
    mode === "create" ? (
      "กรอกข้อมูลรายละเอียด Domain ที่ต้องการจดทะเบียนใหม่"
    ) : (
      <>
        อัปเดตข้อมูลรายละเอียดของ{" "}
        <span className="text-primary font-bold">{domainName}</span>
      </>
    );
  const submitLabel = mode === "create" ? "บันทึก Domain" : "บันทึกการแก้ไข";

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setFormData(normalizeInitialData(initialData));
          setFormKey((k) => k + 1);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold tracking-tight">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form key={formKey} onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}name`} className="text-sm font-semibold">
                ชื่อ Domain <span className="text-destructive">*</span>
              </Label>
              <Input
                id={`${idPrefix}name`}
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={mode === "create" ? "example.com" : undefined}
                required
                className="rounded-xl h-11"
              />
            </div>
            <div className="space-y-2 flex flex-col">
              <Label className="text-sm font-semibold">
                วันหมดอายุ <span className="text-destructive">*</span>
              </Label>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "w-full justify-start text-left font-normal rounded-xl h-11",
                    !formData.expirationDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {formData.expirationDate ? (
                    format(formData.expirationDate, "PP", { locale: th })
                  ) : (
                    <span>เลือกวันที่</span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-2xl border-border/50">
                  <Calendar
                    mode="single"
                    selected={formData.expirationDate}
                    onSelect={(date) =>
                      setFormData({ ...formData, expirationDate: date })
                    }
                    initialFocus
                    captionLayout="dropdown"
                    startMonth={new Date(1990, 0)}
                    endMonth={new Date(2100, 11)}
                    className="rounded-2xl"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}description`} className="text-sm font-semibold">
              รายละเอียดเพิ่มเติม
            </Label>
            <Textarea
              id={`${idPrefix}description`}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="resize-y rounded-xl min-h-[100px]"
              placeholder="ระบุรายละเอียดสั้นๆ เกี่ยวกับ Domain นี้"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2 flex flex-col">
              <Label className="text-sm font-semibold">วันที่จดทะเบียน</Label>
              <Popover>
                <PopoverTrigger
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "w-full justify-start text-left font-normal rounded-xl h-11",
                    !formData.registrationDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                  {formData.registrationDate ? (
                    format(formData.registrationDate, "PP", { locale: th })
                  ) : (
                    <span>เลือกวันที่</span>
                  )}
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl overflow-hidden shadow-2xl border-border/50">
                  <Calendar
                    mode="single"
                    selected={formData.registrationDate}
                    onSelect={(date) =>
                      setFormData({ ...formData, registrationDate: date })
                    }
                    initialFocus
                    captionLayout="dropdown"
                    startMonth={new Date(1990, 0)}
                    endMonth={new Date(2100, 11)}
                    className="rounded-2xl"
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${idPrefix}registrar`} className="text-sm font-semibold">
                ผู้รับจดทะเบียน (Registrar)
              </Label>
              <Select
                value={formData.registrar}
                onValueChange={(value) =>
                  setFormData({ ...formData, registrar: value || "" })
                }
              >
                <SelectTrigger
                  id={`${idPrefix}registrar`}
                  className="rounded-xl h-11"
                >
                  <SelectValue placeholder="เลือกผู้รับจดทะเบียน" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {REGISTRAR_OPTIONS.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                  <SelectItem value="__other__">อื่นๆ</SelectItem>
                </SelectContent>
              </Select>
              {formData.registrar === "__other__" && (
                <Input
                  value={formData.registrarOther}
                  onChange={(e) =>
                    setFormData({ ...formData, registrarOther: e.target.value })
                  }
                  placeholder="ระบุชื่อผู้รับจดทะเบียน"
                  className="mt-2 rounded-xl h-11"
                />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}registrant`} className="text-sm font-semibold">
              ผู้จดทะเบียน (Owner)
            </Label>
            <div className="relative">
              <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                list={`users-list-${idPrefix || "create"}`}
                id={`${idPrefix}registrant`}
                value={formData.registrant}
                onChange={(e) =>
                  setFormData({ ...formData, registrant: e.target.value })
                }
                placeholder="ชื่อบริษัทหรือเจ้าของ"
                className="pl-10 rounded-xl h-11"
              />
            </div>
            <datalist id={`users-list-${idPrefix || "create"}`}>
              {usersList?.map((u) => (
                <option key={u.id} value={u.name} />
              ))}
            </datalist>
          </div>
          <DialogFooter className="pt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl h-11 px-6"
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="rounded-xl premium-gradient h-11 px-8 shadow-lg shadow-primary/20"
            >
              {isPending ? "กำลังบันทึก..." : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
