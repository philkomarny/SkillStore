import Link from "next/link";

export const metadata = {
  title: "Architecture — SkillStore",
  description: "How SkillStore connects GitHub, Vercel, and Claude interfaces.",
};

export default function ArchitecturePage() {
  return (
    <div>
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700">
          Catalog
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Architecture</span>
      </nav>

      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          How SkillStore Works
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto">
          A layered system connecting GitHub as the source of truth, Vercel as
          the discovery layer, and Claude as the execution layer.
        </p>
      </div>

      {/* === DIAGRAM === */}
      <div className="max-w-4xl mx-auto">

        {/* --- LAYER 1: Claude Interfaces --- */}
        <div className="relative mb-2">
          <div className="absolute -left-4 top-0 bottom-0 flex items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest -rotate-90 whitespace-nowrap origin-center">
              Execution
            </span>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6 ml-8">
            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-4">
              Layer 1 — Where Skills Run
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-orange-200 p-4 text-center shadow-sm">
                <div className="text-3xl mb-2">
                  <svg className="h-8 w-8 mx-auto text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-900">Claude Desktop</p>
                <p className="text-[11px] text-gray-500 mt-1">macOS / Windows app</p>
                <div className="mt-2 bg-orange-50 rounded-lg px-2 py-1">
                  <p className="text-[10px] text-orange-700">Project → Custom Instructions</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-orange-200 p-4 text-center shadow-sm">
                <div className="text-3xl mb-2">
                  <svg className="h-8 w-8 mx-auto text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-900">claude.ai</p>
                <p className="text-[11px] text-gray-500 mt-1">Web interface</p>
                <div className="mt-2 bg-orange-50 rounded-lg px-2 py-1">
                  <p className="text-[10px] text-orange-700">Project → Custom Instructions</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-orange-200 p-4 text-center shadow-sm">
                <div className="text-3xl mb-2">
                  <svg className="h-8 w-8 mx-auto text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-900">Claude Code</p>
                <p className="text-[11px] text-gray-500 mt-1">CLI / Terminal</p>
                <div className="mt-2 bg-orange-50 rounded-lg px-2 py-1">
                  <p className="text-[10px] text-orange-700">plugin install / slash commands</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Arrow down */}
        <div className="flex justify-center my-1 ml-8">
          <div className="flex flex-col items-center">
            <svg className="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5 5 5-5" />
            </svg>
            <span className="text-[10px] text-gray-400 font-medium -mt-1">users paste or install skills</span>
          </div>
        </div>

        {/* --- LAYER 2: Discovery --- */}
        <div className="relative mb-2">
          <div className="absolute -left-4 top-0 bottom-0 flex items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest -rotate-90 whitespace-nowrap origin-center">
              Discovery
            </span>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 ml-8">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-4">
              Layer 2 — How Users Find Skills
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" viewBox="0 0 76 65" fill="currentColor">
                      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Vercel</p>
                    <p className="text-[11px] text-gray-500">Web Catalog</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Feature text="Browse by department" />
                  <Feature text="Search skills by name, tag, description" />
                  <Feature text="Read full skill documentation" />
                  <Feature text="Copy install instructions" />
                </div>
                <div className="mt-3 bg-blue-50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-blue-600 font-mono">skillstore-eta.vercel.app</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">CLI Plugin System</p>
                    <p className="text-[11px] text-gray-500">Claude Code Native</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Feature text="marketplace.json catalog index" />
                  <Feature text="plugin marketplace add" />
                  <Feature text="plugin install <skill>" />
                  <Feature text="Slash commands via .claude/commands/" />
                </div>
                <div className="mt-3 bg-gray-100 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-gray-600 font-mono">plugin marketplace add philkomarny/SkillStore</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Arrow down */}
        <div className="flex justify-center my-1 ml-8">
          <div className="flex flex-col items-center">
            <svg className="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5 5 5-5" />
            </svg>
            <span className="text-[10px] text-gray-400 font-medium -mt-1">reads via GitHub raw API</span>
          </div>
        </div>

        {/* --- LAYER 3: Data --- */}
        <div className="relative mb-2">
          <div className="absolute -left-4 top-0 bottom-0 flex items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest -rotate-90 whitespace-nowrap origin-center">
              Data
            </span>
          </div>
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-2xl p-6 ml-8">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">
              Layer 3 — Source of Truth
            </p>
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center">
                  <svg className="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold text-gray-900">GitHub Repository</p>
                  <p className="text-xs text-gray-500">philkomarny/SkillStore</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Catalog Index</p>
                  <div className="bg-gray-900 rounded px-2 py-1.5">
                    <p className="text-[10px] font-mono text-green-400">.claude-plugin/</p>
                    <p className="text-[10px] font-mono text-gray-300 ml-2">marketplace.json</p>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">
                    Names, paths, versions, tags for all skills
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Skill Files</p>
                  <div className="bg-gray-900 rounded px-2 py-1.5">
                    <p className="text-[10px] font-mono text-green-400">skills/</p>
                    <p className="text-[10px] font-mono text-gray-300 ml-2">enrollment/</p>
                    <p className="text-[10px] font-mono text-gray-300 ml-2">marketing/</p>
                    <p className="text-[10px] font-mono text-gray-300 ml-2">academic/</p>
                    <p className="text-[10px] font-mono text-gray-300 ml-2">...</p>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">
                    SKILL.md files with instructions + templates
                  </p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Web App</p>
                  <div className="bg-gray-900 rounded px-2 py-1.5">
                    <p className="text-[10px] font-mono text-green-400">web/</p>
                    <p className="text-[10px] font-mono text-gray-300 ml-2">src/app/</p>
                    <p className="text-[10px] font-mono text-gray-300 ml-2">src/components/</p>
                    <p className="text-[10px] font-mono text-gray-300 ml-2">src/lib/</p>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-2">
                    Next.js 14 catalog UI deployed to Vercel
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Arrow down */}
        <div className="flex justify-center my-1 ml-8">
          <div className="flex flex-col items-center">
            <svg className="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5 5 5-5" />
            </svg>
            <span className="text-[10px] text-gray-400 font-medium -mt-1">contributors submit via Pull Request</span>
          </div>
        </div>

        {/* --- LAYER 4: Contributors --- */}
        <div className="relative">
          <div className="absolute -left-4 top-0 bottom-0 flex items-center">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest -rotate-90 whitespace-nowrap origin-center">
              Authors
            </span>
          </div>
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-2xl p-6 ml-8">
            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-4">
              Layer 4 — How Skills Get Added
            </p>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-xl border border-emerald-200 p-4 text-center shadow-sm">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-gray-900">Write SKILL.md</p>
                <p className="text-[10px] text-gray-500 mt-1">
                  Follow the format standard in CONTRIBUTING.md
                </p>
              </div>

              <div className="bg-white rounded-xl border border-emerald-200 p-4 text-center shadow-sm">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-gray-900">Open Pull Request</p>
                <p className="text-[10px] text-gray-500 mt-1">
                  Add skill file + update marketplace.json
                </p>
              </div>

              <div className="bg-white rounded-xl border border-emerald-200 p-4 text-center shadow-sm">
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-gray-900">Merge → Live</p>
                <p className="text-[10px] text-gray-500 mt-1">
                  Skill appears in catalog within 60 seconds
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* === FLOW SUMMARY === */}
        <div className="mt-12 ml-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Data Flow</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-[10px] font-bold">A</span>
                User installs a skill
              </h3>
              <ol className="text-xs text-gray-600 space-y-2">
                <FlowStep n={1} text="User finds skill on web catalog or browses marketplace.json" />
                <FlowStep n={2} text="Copies skill content or runs CLI install command" />
                <FlowStep n={3} text="Pastes into Claude Project or installs via CLI" />
                <FlowStep n={4} text="Skill is active — Claude follows the instructions" />
              </ol>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-[10px] font-bold">B</span>
                Contributor adds a skill
              </h3>
              <ol className="text-xs text-gray-600 space-y-2">
                <FlowStep n={1} text="Writes a SKILL.md following the format standard" />
                <FlowStep n={2} text="Opens a PR to the SkillStore GitHub repo" />
                <FlowStep n={3} text="PR reviewed and merged to main" />
                <FlowStep n={4} text="Skill is live in the catalog within 60 seconds" />
              </ol>
            </div>
          </div>
        </div>

        {/* Key Design Decisions */}
        <div className="mt-8 ml-8 bg-gray-900 rounded-2xl p-6 text-white">
          <h2 className="text-sm font-semibold mb-4">Key Design Decisions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-semibold text-green-400 mb-1">No database</p>
              <p className="text-[11px] text-gray-400">
                GitHub IS the database. marketplace.json is the index.
                SKILL.md files are the content. No Postgres, no Supabase.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-blue-400 mb-1">No build step for content</p>
              <p className="text-[11px] text-gray-400">
                Push a new SKILL.md to main and it&apos;s live. The web app
                reads from GitHub raw API with 60s ISR caching.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-orange-400 mb-1">Works everywhere</p>
              <p className="text-[11px] text-gray-400">
                Same skill content works in Claude Desktop, claude.ai, and
                Claude Code. Copy-paste or CLI install — user&apos;s choice.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <svg className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      <span className="text-[11px] text-gray-600">{text}</span>
    </div>
  );
}

function FlowStep({ n, text }: { n: number; text: string }) {
  return (
    <li className="flex gap-2">
      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[9px] font-bold mt-0.5">
        {n}
      </span>
      <span>{text}</span>
    </li>
  );
}
