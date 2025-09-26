import type { Metadata } from "next";
import { StackProvider, StackTheme } from "@stackframe/stack";
import { stackServerApp } from "../stack/server";
import { Geist, Geist_Mono } from "next/font/google";
import { MixpanelProvider } from "@/components/providers/MixpanelProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Modern Calculator",
  description: "A beautiful and functional calculator with keyboard support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      ><StackProvider app={stackServerApp}><StackTheme>
        <MixpanelProvider>
          {children}
        </MixpanelProvider>
      </StackTheme></StackProvider></body>
    </html>
  );
}
