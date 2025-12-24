import { Providers } from "@/components/Providers";
import "./globals.css";
import type { Metadata } from "next";
import Analytics from "@/components/Analytics";

export const metadata: Metadata = {
  title: "Next blog | Home",
  description: "A Next.js blog app where user can read and write blog posts",
};

// Using system fonts instead of Google Fonts to avoid network issues
const fontClass = "font-sans";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`light ${fontClass}`}>
      <Analytics />
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
