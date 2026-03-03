import Link from "next/link";
import { notFound } from "next/navigation";
import { getSkillDetail } from "@/lib/skills";
import { DEPARTMENTS } from "@/lib/types";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import CopyButton from "@/components/CopyButton";

interface PageProps {
  params: { dept: string; skill: string };
}

export default async function SkillDetailPage({ params }: PageProps) {
  const dept = DEPARTMENTS[params.dept];
  if (!dept) notFound();

  const skill = await getSkillDetail(params.dept, params.skill);
  if (!skill) notFound();

  const installCommand = `plugin install ${skill.name}@skillstore`;

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700">
          Catalog
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/skills/${params.dept}`} className="hover:text-gray-700">
          {dept.label}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{skill.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <MarkdownRenderer content={skill.content} />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 space-y-4">
            {/* Metadata Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Skill Info
              </h2>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-gray-500">Version</dt>
                  <dd className="font-mono">{skill.version}</dd>
                </div>
                <div>
                  <dt className="text-gray-500">Department</dt>
                  <dd>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: dept.lightColor,
                        color: dept.color,
                      }}
                    >
                      {dept.label}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-500 mb-1">Tags</dt>
                  <dd className="flex flex-wrap gap-1">
                    {skill.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Install Card */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">
                Install
              </h2>
              <div className="bg-gray-900 rounded-lg p-3 mb-2">
                <code className="text-xs font-mono text-green-400 break-all">
                  {installCommand}
                </code>
              </div>
              <CopyButton text={installCommand} label="Copy command" />
            </div>

            {/* GitHub Link */}
            <a
              href={`https://github.com/philkomarny/SkillStore/blob/main/${skill.source}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-xl border border-gray-200 bg-white p-5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View on GitHub
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
