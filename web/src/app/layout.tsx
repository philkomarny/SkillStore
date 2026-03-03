import type { Metadata } from "next";
import Link from "next/link";
import { getRepoConfig } from "@/lib/github";
import Providers from "@/components/Providers";
import EnterpriseBadge from "@/components/EnterpriseBadge";
import AuthButton from "@/components/AuthButton";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkillStore — Claude Code Skills for Higher Education",
  description:
    "Browse, search, and install curated Claude Code skills for higher education institutions.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const repo = getRepoConfig();

  return (
    <html lang="en">
      <body>
        <Providers>
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <Link href="/" className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-gray-900">
                    SkillStore
                  </span>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                    Higher Ed
                  </span>
                </Link>
                <EnterpriseBadge />
                {repo.isCustom && (
                  <a
                    href="https://github.com/philkomarny/SkillStore"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full hover:text-gray-700"
                  >
                    Fork of philkomarny/SkillStore
                  </a>
                )}
              </div>
              <div className="flex items-center gap-6">
                <Link
                  href="/"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Catalog
                </Link>
                <Link
                  href="/architecture"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  How It Works
                </Link>
                <Link
                  href="/enterprise"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Enterprise
                </Link>
                <a
                  href={repo.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  GitHub
                </a>
                <a
                  href={`${repo.repoUrl}/blob/${repo.branch}/CONTRIBUTING.md`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Contribute
                </a>
                <AuthButton />
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <p className="text-sm text-gray-500 text-center">
              SkillStore — Enterprise skill catalog for Claude Code.{" "}
              <a
                href={repo.repoUrl}
                className="underline hover:text-gray-700"
              >
                Open source on GitHub
              </a>
            </p>
          </div>
        </footer>
        </Providers>
      </body>
    </html>
  );
}
