import type { Metadata } from "next";
import { Hind_Siliguri, Plus_Jakarta_Sans } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Providers } from "./providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });
const hind = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["500", "600"],
  variable: "--font-hind",
});

// The workspace reads the chosen demo account in the browser, so navigations are not expected
// to be instant from a server prefetch. Opt out of instant-navigation validation.
export const instant = false;

export const metadata: Metadata = {
  title: { default: "Shetu", template: "%s · Shetu" },
  description:
    "Shetu keeps a job safe while its owner is on leave: it finds the work nobody wrote down, checks the cover plan and guards the return.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${jakarta.variable} ${hind.variable}`}>
      <body>
        <Providers>
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
          <Toaster position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
