import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Providers from "@/components/Providers";
import AuthButton from "@/components/AuthButton";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SkillStore — The Skills Marketplace for Claude",
  description:
    "Browse, install, and personalize verified skills for Claude. The open marketplace for AI prompt engineering.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-white text-gray-900`}>
        <Providers>
          {/* Header */}
          <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
              <div className="flex items-center gap-8">
                <Link href="/" className="text-lg font-bold text-gray-900 tracking-tight">
                  SkillStore
                </Link>
                <nav className="hidden sm:flex items-center gap-5 text-sm text-gray-600">
                  <Link href="/skills" className="hover:text-gray-900 transition-colors">
                    Browse
                  </Link>
                  <Link href="/how-it-works" className="hover:text-gray-900 transition-colors">
                    How It Works
                  </Link>
                  <Link href="/pricing" className="hover:text-gray-900 transition-colors">
                    Pricing
                  </Link>
                  <Link href="/submit" className="hover:text-gray-900 transition-colors">
                    Submit
                  </Link>
                </nav>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="hidden sm:inline-flex text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </Link>
                <AuthButton />
              </div>
            </div>
          </header>

          {/* Main */}
          <main className="min-h-[calc(100vh-8rem)]">{children}</main>

          {/* Footer */}
          <footer className="border-t border-gray-100 py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
              <span>SkillStore — Open skills marketplace for Claude</span>
              <div className="flex items-center gap-4">
                <Link href="/pricing" className="hover:text-gray-600 transition-colors">
                  Pricing
                </Link>
                <Link href="/how-it-works" className="hover:text-gray-600 transition-colors">
                  How It Works
                </Link>
                <Link href="/submit" className="hover:text-gray-600 transition-colors">
                  Submit a Skill
                </Link>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
