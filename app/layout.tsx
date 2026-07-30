import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Alongside",
  description: "A quieter space to think, plan, and remember what helps.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
