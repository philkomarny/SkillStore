import type { Metadata } from "next";
import { IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import Providers from "@/components/Providers";
import AuthButton from "@/components/AuthButton";

const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "eduSkillsMP — Verified Claude Skills for Education",
  description:
    "The community-driven catalog of verified Claude skills built for higher education and K-12. Browse by role. Install with confidence. Refine for your campus.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ibmPlex.variable} ${jetbrains.variable} font-sans antialiased bg-terminal-bg text-[#1a1a1a]`}>
        <Providers>
          {/* Header */}
          <header className="sticky top-0 z-50 bg-[#FAFAF8]/90 backdrop-blur-md border-b border-terminal-border">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
              <div className="flex items-center gap-8">
                <Link href="/" className="flex-shrink-0 font-mono font-bold text-lg">
                  <span className="text-accent">edu</span>SkillsMP
                </Link>
                <nav className="hidden sm:flex items-center gap-4 font-mono text-[13px] text-muted">
                  <Link href="/skills" className="hover:text-[#1a1a1a] transition-colors">
                    $ browse --skills
                  </Link>
                  <Link href="/how-it-works" className="hover:text-[#1a1a1a] transition-colors">
                    $ --how-it-works
                  </Link>
                  <Link href="/pricing" className="hover:text-[#1a1a1a] transition-colors">
                    $ --pricing
                  </Link>
                  <Link href="/submit" className="hover:text-[#1a1a1a] transition-colors">
                    $ submit
                  </Link>
                </nav>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href="/dashboard"
                  className="hidden sm:inline-flex font-mono text-[13px] text-muted hover:text-[#1a1a1a] transition-colors"
                >
                  Your Refinery
                </Link>
                <AuthButton />
              </div>
            </div>
          </header>

          {/* Main */}
          <main className="min-h-[calc(100vh-8rem)]">{children}</main>

          {/* Footer */}
          <footer className="border-t border-terminal-border py-8">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-tertiary font-mono">
              <span>eduSkillsMP — Verified Claude skills for education, by education.</span>
              <div className="flex items-center gap-4">
                <Link href="/pricing" className="hover:text-muted transition-colors">
                  $ --pricing
                </Link>
                <Link href="/how-it-works" className="hover:text-muted transition-colors">
                  $ --how-it-works
                </Link>
                <Link href="/submit" className="hover:text-muted transition-colors">
                  $ submit
                </Link>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
