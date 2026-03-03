import type { Metadata } from "next";
import Link from "next/link";
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
  return (
    <html lang="en">
      <body>
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-2xl font-bold text-gray-900">
                  SkillStore
                </span>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                  Higher Ed
                </span>
              </Link>
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
                <a
                  href="https://github.com/philkomarny/SkillStore"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  GitHub
                </a>
                <a
                  href="https://github.com/philkomarny/SkillStore/blob/main/CONTRIBUTING.md"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Contribute
                </a>
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
                href="https://github.com/philkomarny/SkillStore"
                className="underline hover:text-gray-700"
              >
                Open source on GitHub
              </a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
