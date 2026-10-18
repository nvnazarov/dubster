"use client";
import { Geist, Geist_Mono } from "next/font/google";
import React from "react";

import "@/app/global.css";
import AuthContext from "@/components/shared/auth/context";
import { makeState } from "@/lib/state";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// export const metadata: Metadata = {
//   title: "Dubster",
//   description: "Challenge your voice in action!",
// };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <AuthContext value={makeState({ userID: "0" })}>
        <body>{children}</body>
      </AuthContext>
    </html>
  );
}
