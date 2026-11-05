import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Patent Review Console",
  description: "Review queue for provisional patent disclosures from AI Patent Analyzer.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
