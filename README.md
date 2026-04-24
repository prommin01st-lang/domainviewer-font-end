# DomainViewer Frontend

Frontend สำหรับระบบจัดการ Domain ติดตามวันหมดอายุ และแจ้งเตือนผ่าน Email

สร้างด้วย Next.js 16 + TypeScript + Tailwind CSS v4 + shadcn/ui

---

## Tech Stack

- **Next.js** 16.2.4 (App Router)
- **React** 19.2.4
- **TypeScript** 5.x
- **Tailwind CSS** 4.x
- **shadcn/ui** v4 (Base UI primitives)
- **TanStack Query** 5.x
- **Axios** 1.x
- **date-fns** 4.x

---

## Project Structure

```
app/
  domains/          หน้าจัดการ Domain (CRUD + Import/Export CSV)
    components/     RecipientsDialog, DomainFormDialog, DeleteDomainDialog
  users/            จัดการผู้ใช้ (Owner only)
  allowed-domains/  จัดการ Allowed Email Domains
  notification-logs/ ประวัติการส่งอีเมล
  settings/         ตั้งค่าระบบ (Alert + Email Template)
  dashboard/        สรุปภาพรวม
  profile/          โปรไฟล์ผู้ใช้
  login/            หน้า Login
  layout.tsx        Root Layout (Providers)

components/
  ui/               shadcn/ui primitives
  avatar-svg.tsx    Avatar แบบ Inline SVG

contexts/
  auth-context.tsx    JWT Auth (Access/Refresh Token)
  theme-context.tsx   Dark/Light Mode

hooks/
  use-require-auth.ts  Route Guard

lib/
  api.ts        Axios instance + JWT interceptors
  types.ts      Shared TypeScript interfaces
  utils.ts      cn() helper
```

---

## Environment Variables

สร้างไฟล์ `.env.local` จาก `.env.example`:

```bash
cp .env.example .env.local
```

| Variable | Description | Default |
| --- | --- | --- |
| API Proxy | Backend calls proxied via Next.js rewrites | Configured in `next.config.ts` |

> ตัวแปรทั้งหมดต้องขึ้นต้นด้วย `NEXT_PUBLIC_` เพื่อให้เข้าถึงได้จาก Browser
> `.env.local` ถูก `.gitignore` บล็อกไม่ให้ขึ้น Git อยู่แล้ว

---

## Getting Started

```bash
# Install dependencies
npm install

# Run dev server
npm run dev
# Open http://localhost:3000

# Build for production
npm run build
npm start

# Lint
npm run lint
```

---

## Authentication

ระบบใช้ JWT Bearer Token แบบคู่:

- **Access Token** (15 นาที) - เก็บใน localStorage + แนบทุก request
- **Refresh Token** (30 วัน) - ใช้ refresh เมื่อ Access Token หมดอายุ

ฟีเจอร์ความปลอดภัย:
- Token refresh race condition ป้องกันด้วย subscriber queue
- Auth context ใช้ useMemo + useCallback ป้องกัน re-render storm
- Route Guard (useRequireAuth) redirect ไป login หากไม่มี token

---

## Features

- **Dark Mode** - สลับ Light/Dark ได้ทั้งระบบ พร้อม localStorage persistence
- **CSV Import/Export** - นำเข้า/ส่งออกรายการ Domain เป็นไฟล์ CSV
- **Role-based Access** - Owner เห็นทุกเมนู / Employee เห็นแค่ Domain, Settings, Profile
- **Inline SVG Avatars** - Avatar แบบ SVG render แบบ inline พร้อม inject background color
- **Responsive** - รองรับ Mobile / Tablet / Desktop

---

## Notes

- หน้า `/register` redirect ไป `/login` เสมอ (ระบบปิดการสมัครเอง)
- ทุก list endpoint ใช้ Pagination (`PagedList<T>`) - เข้าถึงข้อมูลผ่าน `.items`
- `Select` ของ shadcn/ui มีปัญหากับ empty string - ใช้ sentinel value `"all"` แทน `""`
