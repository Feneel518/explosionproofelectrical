import type { Metadata } from "next";
import { EB_Garamond, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import FrontendVisitTracker from "@/components/analytics/FrontendVisitTracker";
import {
  SITE_DESCRIPTION,
  SITE_TITLE_DEFAULT,
  SITE_URL,
} from "@/lib/seo/site";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const garamond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE_DEFAULT,
    template: "%s | ExEC",
  },
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${garamond.variable} antialiased font-sans no-scrollbar`}>
        <NuqsAdapter>
          <TooltipProvider>
            <FrontendVisitTracker />
            {children}
          </TooltipProvider>
        </NuqsAdapter>
        <Toaster richColors />
      </body>
    </html>
  );
}
