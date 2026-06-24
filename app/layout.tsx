import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { InlineScript } from "@/components/inline-script";

const THEME_SCRIPT = `try{if(localStorage.getItem('cms-theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Status Daily — CMS",
  description: "Admin CMS for the Status Daily app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Apply saved theme before first paint (no flash). Runs on the server-
            rendered HTML; inert on the client to avoid React's script warning. */}
        <InlineScript html={THEME_SCRIPT} />
        {children}
      </body>
    </html>
  );
}
