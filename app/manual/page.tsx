"use client";

import { useRequireAuth } from "@/hooks/use-require-auth";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard,
  Globe,
  Users,
  Settings,
  Bell,
  Shield,
  UserCircle,
  LogIn,
  LogOut,
  Plus,
  Pencil,
  Trash2,
  Download,
  Upload,
  Mail,
  AlertTriangle,
  FileText,
  Send,
  Lock,
  Unlock,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="glass-card overflow-hidden scroll-mt-24" id={title}>
      <CardHeader className="bg-muted/30 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className="text-lg">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-4">{children}</CardContent>
    </Card>
  );
}

function Step({ number, title, children }: { number: number; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold shrink-0">
          {number}
        </div>
        {children && <div className="w-px flex-1 bg-border my-1" />}
      </div>
      <div className="flex-1 pb-4">
        <p className="font-semibold text-sm">{title}</p>
        {children && <div className="mt-2 text-sm text-muted-foreground space-y-1">{children}</div>}
      </div>
    </div>
  );
}

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10 text-sm">
      <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
      <span className="text-muted-foreground">{children}</span>
    </div>
  );
}

function RoleBadge({ role }: { role: "owner" | "employee" }) {
  if (role === "owner") {
    return (
      <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100">
        <Users className="h-3 w-3 mr-1" />
        เจ้าของ (Owner)
      </Badge>
    );
  }
  return (
    <Badge variant="outline">
      <UserCircle className="h-3 w-3 mr-1" />
      พนักงาน (Employee)
    </Badge>
  );
}

export default function ManualPage() {
  useRequireAuth();
  const { user } = useAuth();
  const isOwner = user?.role === 0;

  return (
    <div className="space-y-8 animate-in-fade">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gradient">คู่มือการใช้งาน</h1>
        <p className="text-muted-foreground">เรียนรู้วิธีใช้งานระบบ DomainViewer ทีละขั้นตอน</p>
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {[
          { icon: LogIn, label: "เข้าสู่ระบบ", href: "#เข้าสู่ระบบ" },
          { icon: LayoutDashboard, label: "แดชบอร์ด", href: "#แดชบอร์ด" },
          { icon: Globe, label: "รายการ Domain", href: "#รายการDomain" },
          { icon: Users, label: "ผู้ใช้งาน", href: "#ผู้ใช้งาน" },
          { icon: Settings, label: "ตั้งค่า", href: "#ตั้งค่า" },
          { icon: Bell, label: "ประวัติแจ้งเตือน", href: "#ประวัติแจ้งเตือน" },
          { icon: Shield, label: "โดเมนที่อนุญาต", href: "#โดเมนที่อนุญาต" },
          { icon: UserCircle, label: "โปรไฟล์", href: "#โปรไฟล์" },
        ].map((item) => (
          <a
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 p-3 rounded-xl border border-border/50 bg-card/50 hover:bg-muted transition-all text-sm font-medium group"
          >
            <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            {item.label}
            <ChevronRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        ))}
      </div>

      {/* Permission Matrix */}
      <Section icon={Users} title="สิทธิ์การใช้งาน">
        <p className="text-sm text-muted-foreground mb-4">
          ระบบแบ่งผู้ใช้ออกเป็น 2 ระดับ ดังนี้
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-semibold">ฟีเจอร์</th>
                <th className="text-center py-2 px-3 font-semibold">
                  <RoleBadge role="owner" />
                </th>
                <th className="text-center py-2 px-3 font-semibold">
                  <RoleBadge role="employee" />
                </th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              {[
                ["ดู Domain", true, true],
                ["เพิ่ม/แก้ไข Domain", true, true],
                ["ลบ Domain", true, false],
                ["Import/Export CSV", true, false],
                ["จัดการผู้ใช้งาน", true, false],
                ["จัดการตั้งค่าแจ้งเตือน", true, false],
                ["จัดการเทมเพลตอีเมล", true, false],
                ["จัดการโดเมนที่อนุญาต", true, false],
                ["ดูประวัติแจ้งเตือน", true, false],
                ["ส่งรายงาน Domain List", true, false],
                ["ดูแดชบอร์ด", true, true],
                ["แก้ไขโปรไฟล์ตัวเอง", true, true],
              ].map(([feature, owner, employee], i) => (
                <tr key={i} className="border-b border-border/50">
                  <td className="py-2 px-3">{feature as string}</td>
                  <td className="text-center py-2 px-3">{owner ? "✅" : "❌"}</td>
                  <td className="text-center py-2 px-3">{employee ? "✅" : "❌"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Login */}
      <Section icon={LogIn} title="เข้าสู่ระบบ">
        <div className="space-y-2">
          <Step number={1} title="เปิดหน้าเข้าสู่ระบบ">
            <p>คลิกเมนู <strong>เข้าสู่ระบบ</strong> จากแถบด้านข้าง หรือระบบจะ redirect อัตโนมัติหากยังไม่ได้ล็อกอิน</p>
          </Step>
          <Step number={2} title="กรอกอีเมลและรหัสผ่าน">
            <p>ใช้บัญชีที่มีอยู่ในระบบ หรือติดต่อเจ้าของระบบเพื่อขอสร้างบัญชีใหม่</p>
          </Step>
          <Step number={3} title="เข้าใช้งาน">
            <p>หลังเข้าสู่ระบบสำเร็จ ระบบจะพาไปยังหน้า <strong>รายการ Domain</strong> โดยอัตโนมัติ</p>
          </Step>
        </div>
        <Tip>หากลืมรหัสผ่าน ให้ติดต่อเจ้าของระบบ (Owner) เพื่อขอรีเซ็ตรหัสผ่าน</Tip>
      </Section>

      {/* Dashboard */}
      <Section icon={LayoutDashboard} title="แดชบอร์ด">
        <p className="text-sm text-muted-foreground">
          แดชบอร์ดแสดงภาพรวมสำคัญของระบบ ประกอบด้วย:
        </p>
        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
          <li>จำนวน Domain ทั้งหมด ที่ใช้งานอยู่ และที่ใกล้หมดอายุ</li>
          <li>จำนวนผู้ใช้งานในระบบ</li>
          <li>ตารางแสดง Domain ที่ใกล้หมดอายุที่สุด 10 รายการแรก</li>
        </ul>
        <Tip>ใช้แดชบอร์ดเพื่อตรวจสอบสถานะโดยรวมได้อย่างรวดเร็วโดยไม่ต้องเข้าไปดูรายละเอียดทีละ Domain</Tip>
      </Section>

      {/* Domains */}
      <Section icon={Globe} title="รายการ Domain">
        <p className="text-sm text-muted-foreground mb-4">
          หน้าหลักของระบบสำหรับจัดการ Domain ทั้งหมด
        </p>

        <div className="space-y-2">
          <Step number={1} title="ค้นหาและกรอง">
            <p>ใช้ช่องค้นหาด้านบนเพื่อค้นหาด้วยชื่อ Domain หรือรายละเอียด รองรับการค้นหาแบบ Real-time</p>
          </Step>
          <Step number={2} title="เพิ่ม Domain">
            <p>
              คลิกปุ่ม <Plus className="inline h-3.5 w-3.5" /> <strong>เพิ่ม Domain</strong> กรอกข้อมูล:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-0.5">
              <li>ชื่อ Domain (จำเป็น)</li>
              <li>รายละเอียด (อาจเว้นว่าง)</li>
              <li>วันที่จดทะเบียน และวันหมดอายุ (จำเป็น)</li>
              <li>ผู้จดทะเบียน และผู้ให้บริการ (อาจเว้นว่าง)</li>
            </ul>
          </Step>
          <Step number={3} title="แก้ไข Domain">
            <p>
              คลิกไอคอน <Pencil className="inline h-3.5 w-3.5" /> ในตารางเพื่อแก้ไขข้อมูล Domain ที่มีอยู่
            </p>
          </Step>
          <Step number={4} title="ลบ Domain">
            <p>
              คลิกไอคอน <Trash2 className="inline h-3.5 w-3.5 text-destructive" /> เพื่อลบ Domain (เฉพาะ Owner)
              ระบบจะทำการลบแบบ Soft Delete ไม่ลบออกจากฐานข้อมูลจริง
            </p>
          </Step>
          <Step number={5} title="จัดการผู้รับแจ้งเตือน">
            <p>
              คลิกไอคอน <Mail className="inline h-3.5 w-3.5" /> เพื่อเลือกผู้ใช้ที่จะได้รับอีเมลแจ้งเตือน
              เมื่อ Domain ใกล้หมดอายุ (เฉพาะ Owner สามารถแก้ไขได้)
            </p>
          </Step>
          <Step number={6} title="Import / Export CSV">
            <p>
              <Download className="inline h-3.5 w-3.5" /> <strong>Export:</strong> ดาวน์โหลดรายการ Domain ทั้งหมดเป็นไฟล์ CSV (UTF-8)
            </p>
            <p>
              <Upload className="inline h-3.5 w-3.5" /> <strong>Import:</strong> อัปโหลดไฟล์ CSV เพื่อเพิ่ม Domain เป็นชุด (เฉพาะ Owner)
            </p>
          </Step>
        </div>

        <Tip>Domain ที่เหลือวันหมดอายุน้อยกว่า 30 วันจะแสดงแถบสีแดง/ส้ม เพื่อเตือนภัยล่วงหน้า</Tip>
      </Section>

      {/* Users */}
      {isOwner && (
        <Section icon={Users} title="ผู้ใช้งาน">
          <p className="text-sm text-muted-foreground mb-4">
            จัดการบัญชีผู้ใช้งานทั้งหมดในระบบ (เฉพาะ Owner)
          </p>
          <div className="space-y-2">
            <Step number={1} title="เพิ่มผู้ใช้งาน">
              <p>คลิก <strong>เพิ่มผู้ใช้งาน</strong> กรอกชื่อ อีเมล รหัสผ่าน (ขั้นต่ำ 6 ตัวอักษร) และเลือกบทบาท</p>
            </Step>
            <Step number={2} title="ล็อค / ปลดล็อค">
              <p>
                คลิกไอคอน <Lock className="inline h-3.5 w-3.5" /> / <Unlock className="inline h-3.5 w-3.5" /> เพื่อล็อคหรือปลดล็อคบัญชีผู้ใช้
                ผู้ใช้ที่ถูกล็อคจะไม่สามารถเข้าสู่ระบบได้
              </p>
            </Step>
            <Step number={3} title="ลบผู้ใช้">
              <p>
                คลิกไอคอน <Trash2 className="inline h-3.5 w-3.5 text-destructive" /> เพื่อลบผู้ใช้ (Soft Delete)
                ไม่สามารถลบตัวเองหรือเจ้าของคนสุดท้ายได้
              </p>
            </Step>
          </div>
          <Tip>หากต้องการเปลี่ยนรหัสผ่านของตัวเอง ให้ใช้เมนู "โปรไฟล์" แทน</Tip>
        </Section>
      )}

      {/* Settings */}
      <Section icon={Settings} title="ตั้งค่า">
        <p className="text-sm text-muted-foreground mb-4">
          หน้าตั้งค่ามี 3 แท็บหลัก ดังนี้
        </p>

        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              การแจ้งเตือน
            </h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>เปิด/ปิดการแจ้งเตือนอัตโนมัติ</li>
              <li>ตั้งค่าระยะเวลาแจ้งเตือนล่วงหน้า: เดือน สัปดาห์ และวัน</li>
              <li>ระบบจะส่งอีเมลอัตโนมัติทุกวันเวลา 00:00 น. ตามเวลาท้องถิ่น</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-blue-500" />
              เทมเพลตอีเมล
            </h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>ปรับแต่งหัวข้อและเนื้อหาอีเมลแจ้งเตือน (รองรับ HTML)</li>
              <li>Placeholder ที่ใช้ได้: <code>{"{DomainName}"}</code>, <code>{"{ExpirationDate}"}</code>, <code>{"{DaysUntilExpiration}"}</code>, <code>{"{DomainTable}"}</code></li>
              <li>หากแก้ไขผิดพลาด สามารถกดปุ่ม <strong>ค่าเริ่มต้น</strong> เพื่อคืนค่าเดิมได้ทันที</li>
              <li>สามารถเปิด/ปิดการใช้งานเทมเพลตแต่ละประเภทได้แยกกัน</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
              <Send className="h-4 w-4 text-green-500" />
              รายงาน Domain
            </h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>ส่งรายงานรายการ Domain ทั้งหมดไปยังอีเมลที่เลือกแบบ On-demand</li>
              <li>เลือกผู้รับจากรายชื่อผู้ใช้ในระบบได้หลายคนพร้อมกัน</li>
            </ul>
          </div>
        </div>

        <Tip>เฉพาะ Owner เท่านั้นที่สามารถแก้ไขตั้งค่าได้ Employee ดูได้อย่างเดียว</Tip>
      </Section>

      {/* Notification Logs */}
      {isOwner && (
        <Section icon={Bell} title="ประวัติแจ้งเตือน">
          <p className="text-sm text-muted-foreground">
            ตรวจสอบประวัติการส่งอีเมลทั้งหมดในระบบ รวมถึง:
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>วันที่และเวลาที่ส่ง</li>
            <li>ผู้รับอีเมล</li>
            <li>Domain ที่เกี่ยวข้อง</li>
            <li>ประเภทการแจ้งเตือน (ก่อนหมดอายุ / หมดอายุแล้ว)</li>
            <li>สถานะ (สำเร็จ / ล้มเหลว / รอส่งซ้ำ)</li>
          </ul>
          <Tip>ระบบจะป้องกันการส่งซ้ำอัตโนมัติหากเคยส่งแจ้งเตือนสำหรับ Domain และวันหมดอายุนั้นแล้ว</Tip>
        </Section>
      )}

      {/* Allowed Domains */}
      {isOwner && (
        <Section icon={Shield} title="โดเมนที่อนุญาต">
          <p className="text-sm text-muted-foreground">
            จัดการรายชื่อ Email Domain ที่อนุญาตให้ใช้งานในระบบ (Whitelist)
          </p>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>เพิ่ม Domain อีเมล เช่น <code>company.com</code></li>
            <li>ลบ Domain ที่ไม่ต้องการได้ตลอดเวลา</li>
          </ul>
          <Tip>ฟีเจอร์นี้ยังไม่ได้เชื่อมต่อกับการตรวจสอบตอนสมัครสมาชิกในปัจจุบัน</Tip>
        </Section>
      )}

      {/* Profile */}
      <Section icon={UserCircle} title="โปรไฟล์">
        <p className="text-sm text-muted-foreground mb-4">
          จัดการข้อมูลส่วนตัวของบัญชีคุณ
        </p>
        <div className="space-y-2">
          <Step number={1} title="แก้ไขข้อมูลส่วนตัว">
            <p>อัปเดตชื่อและอีเมลได้ตลอดเวลา</p>
          </Step>
          <Step number={2} title="เปลี่ยนรหัสผ่าน">
            <p>กรอกรหัสผ่านปัจจุบัน และรหัสผ่านใหม่ (ขั้นต่ำ 6 ตัวอักษร)</p>
          </Step>
          <Step number={3} title="เลือก Avatar">
            <p>เลือกรูป Avatar SVG จากชุดที่ระบบจัดเตรียมไว้ หรือปล่อยว่างเพื่อใช้ตัวอักษรแรกของชื่อ</p>
          </Step>
        </div>
      </Section>

      {/* Logout */}
      <Section icon={LogOut} title="ออกจากระบบ">
        <p className="text-sm text-muted-foreground">
          คลิกปุ่ม <strong>ออกจากระบบ</strong> ที่ด้านล่างของแถบด้านข้าง ระบบจะลบ Token ออกจากเครื่องและพากลับไปยังหน้าเข้าสู่ระบบ
        </p>
        <Tip>หากใช้งานบนอุปกรณ์สาธารณะ ควรออกจากระบบทุกครั้งหลังใช้งานเสร็จ</Tip>
      </Section>
    </div>
  );
}
