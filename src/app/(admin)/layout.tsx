import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import { Providers } from "@/components/admin/providers";
import { SITE_URL } from "@/lib/supabase/config";
import "./admin.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", weight: ["600", "700", "800"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Admin", template: "%s · DepEd Bayugan Admin" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable}`} suppressHydrationWarning>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
