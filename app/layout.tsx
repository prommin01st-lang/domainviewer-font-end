"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Layout } from "@/components/layout";
import { ThemeProvider } from "@/contexts/theme-context";
import { usePathname } from "next/navigation";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground transition-colors">
        <ThemeProvider>
          <Providers>
            {isAuthPage ? (
              <>{children}</>
            ) : (
              <Layout>{children}</Layout>
            )}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
