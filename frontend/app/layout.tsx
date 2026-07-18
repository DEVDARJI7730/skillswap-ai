import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/store/app-context";

export const metadata: Metadata = {
  title: "SkillSwap AI - AI-Powered Peer-to-Peer Learning & Roadmaps",
  description: "Exchange programming skills, generate custom Gemini roadmaps, run assessments and collaborate on capstone projects with compatible student matches.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
