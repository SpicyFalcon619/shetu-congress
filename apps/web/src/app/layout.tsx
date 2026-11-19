import type { Metadata } from "next";
import { Hind_Siliguri, Plus_Jakarta_Sans } from "next/font/google";

import { SiteHeader } from "@/components/site-header";

import { Providers } from "./providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const hind = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["500", "600"],
  variable: "--font-hind",
});

export const metadata: Metadata = {
  title: "Shetu",
  description:
    "Shetu keeps a job safe while its owner is on leave: it finds the work nobody wrote down, checks the cover plan and guards the return.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${hind.variable}`}>
      <body className="min-h-screen">
        <Providers>
          <SiteHeader />
          <main className="mx-auto w-full max-w-6xl px-4 pt-8 pb-20 sm:px-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
