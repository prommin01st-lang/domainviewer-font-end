"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Globe, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      toast.success("เข้าสู่ระบบสำเร็จ");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message =
        err.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] premium-gradient opacity-20 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[30%] h-[30%] bg-blue-500 opacity-10 blur-[100px] rounded-full" />

      <Card className="w-full max-w-md glass-card relative z-10 animate-in-fade border-border/50">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl premium-gradient shadow-xl shadow-primary/20 scale-110">
            <Globe className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-gradient">เข้าสู่ระบบ</CardTitle>
          <CardDescription className="text-base mt-2">
            DomainViewer Management System
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5 pt-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold ml-1">อีเมลผู้ใช้งาน</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 rounded-xl bg-background/50 border-border/50 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" title="password" className="text-sm font-semibold">รหัสผ่าน</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 rounded-xl bg-background/50 border-border/50 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-6 pt-2 pb-8">
            <Button type="submit" className="w-full h-12 rounded-xl premium-gradient text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-[0.98]" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  กำลังตรวจสอบข้อมูล...
                </>
              ) : (
                "เข้าสู่ระบบ"
              )}
            </Button>
            <div className="text-center space-y-2">
              <p className="text-xs text-muted-foreground bg-muted/30 py-2 px-4 rounded-full inline-block">
                กรุณาติดต่อผู้ดูแลระบบเพื่อขอรับบัญชีผู้ใช้งาน
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

