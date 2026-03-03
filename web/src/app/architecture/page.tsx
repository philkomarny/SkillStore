import Link from "next/link";
import { getRepoConfig } from "@/lib/github";

export const metadata = {
  title: "How It Works — SkillStore",
  description:
    "Use skills out of the box or add your institution's context. Individual or enterprise-wide.",
};

export default function ArchitecturePage() {
  const repo = getRepoConfig();

  return (
    <div>
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700">
          Catalog
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">How It Works</span>
      </nav>

      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Pick a skill. Use it immediately.<br />
          <span className="text-blue-600">Add context to make it yours.</span>
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Every skill works out of the box for any higher ed institution.
          Individuals can add their own context. Enterprises can standardize
          skills and context across their entire organization.
        </p>
      </div>

      <div className="max-w-5xl mx-auto">

        {/* ============================================ */}
        {/* TWO PATHS                                    */}
        {/* ============================================ */}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-16">
          <div className="rounded-2xl border-2 border-gray-200 bg-white overflow-hidden">
            <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                For Individuals
              </p>
            </div>
            <div className="p-6">
              <ol className="space-y-4">
                <PathStep n={1} title="Browse the catalog">
                  Find a skill by department or search. Each skill page shows
                  what it does, how to use it, and example outputs.
                </PathStep>
                <PathStep n={2} title="Install in 30 seconds">
                  Copy the skill into Claude Desktop, claude.ai, or Claude
                  Code — whichever you use. One click, no build step.
                </PathStep>
                <PathStep n={3} title="Use it">
                  The skill works immediately with good, structured output.
                  Claude follows the expert methodology baked into the skill.
                </PathStep>
                <PathStep n={4} title="Add your context (optional)">
                  Paste your school&apos;s name, programs, deadlines, and voice
                  alongside the skill. Output becomes specific to your
                  institution.
                </PathStep>
              </ol>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-blue-300 bg-white overflow-hidden ring-2 ring-blue-100">
            <div className="bg-blue-600 px-6 py-3">
              <p className="text-xs font-bold text-white uppercase tracking-wider">
                For Enterprise
              </p>
            </div>
            <div className="p-6">
              <ol className="space-y-4">
                <PathStep n={1} title="Choose skills for your org">
                  Select which skills your teams should use — enrollment,
                  marketing, academic, finance. The catalog is your menu.
                </PathStep>
                <PathStep n={2} title="Build institutional context">
                  Create a private GitHub repo with context.md files — your
                  programs, voice, data, deadlines. One file per skill.
                </PathStep>
                <PathStep n={3} title="Connect to SkillStore">
                  On the{" "}
                  <Link href="/enterprise" className="text-blue-600 underline">
                    Enterprise page
                  </Link>
                  , enter your repo details. The catalog instantly shows your
                  context alongside each skill.
                </PathStep>
                <PathStep n={4} title="Roll out to your team">
                  Every team member connects the same context repo. Everyone
                  gets the same skills + the same institutional context —
                  standardized AI across your org.
                </PathStep>
              </ol>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* INDIVIDUAL: INSTALL METHODS                  */}
        {/* ============================================ */}

        <div className="mb-16">
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
            Three ways to install a skill
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8 max-w-lg mx-auto">
            Same skill, any interface. Pick the one you use.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Desktop / Web */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="h-4 w-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-900">Claude Desktop & claude.ai</p>
              </div>
              <ol className="text-xs text-gray-600 space-y-2">
                <HowStep n={1} text="Create a Project" />
                <HowStep n={2} text='Click "Copy skill" on any skill page' />
                <HowStep n={3} text="Paste into Custom Instructions" />
                <HowStep n={4} text="Every chat in that Project uses the skill" />
              </ol>
              <div className="mt-4 bg-orange-50 rounded-lg p-3">
                <p className="text-[10px] text-orange-700">
                  Works in both the desktop app (macOS/Windows) and claude.ai in the browser.
                </p>
              </div>
            </div>

            {/* Claude Code CLI */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                  <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-900">Claude Code CLI</p>
              </div>
              <ol className="text-xs text-gray-600 space-y-2">
                <HowStep n={1}>
                  <code className="font-mono bg-gray-100 px-1 rounded">plugin install skill@skillstore</code>
                </HowStep>
                <HowStep n={2} text="Skill is installed globally" />
                <HowStep n={3} text="Available in all CLI sessions" />
              </ol>
              <div className="mt-4 bg-gray-900 rounded-lg p-3">
                <p className="text-[10px] font-mono text-green-400">
                  plugin marketplace add {repo.owner}/{repo.name}
                </p>
              </div>
            </div>

            {/* Project file */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-gray-900">Project Slash Command</p>
              </div>
              <ol className="text-xs text-gray-600 space-y-2">
                <HowStep n={1} text="Download or copy the skill file" />
                <HowStep n={2}>
                  Save to <code className="font-mono bg-gray-100 px-1 rounded">.claude/commands/</code>
                </HowStep>
                <HowStep n={3}>
                  Invoke with <code className="font-mono bg-gray-100 px-1 rounded">/skill-name</code>
                </HowStep>
              </ol>
              <div className="mt-4 bg-blue-50 rounded-lg p-3">
                <p className="text-[10px] text-blue-700">
                  Scoped to one project. Great for team repos where everyone gets the skill via git.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* THE CORE CONCEPT: SKILL + CONTEXT            */}
        {/* ============================================ */}

        <div className="mb-16">
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
            The difference context makes
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8 max-w-lg mx-auto">
            Skills produce good output on their own. Context makes the output yours.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Without Context */}
            <div className="rounded-2xl border-2 border-gray-200 bg-white overflow-hidden">
              <div className="bg-gray-100 px-6 py-3 border-b border-gray-200">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Skill Only
                </p>
              </div>
              <div className="p-6">
                <div className="bg-gray-900 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-[10px] font-mono text-gray-500 ml-2">prospect-outreach / SKILL.md</span>
                  </div>
                  <div className="font-mono text-[11px] leading-relaxed">
                    <p className="text-gray-500">---</p>
                    <p><span className="text-blue-400">name:</span> <span className="text-green-400">prospect-outreach</span></p>
                    <p><span className="text-blue-400">description:</span> <span className="text-green-400">Generate personalized</span></p>
                    <p><span className="text-green-400">  outreach to prospective students</span></p>
                    <p className="text-gray-500">---</p>
                    <p className="text-gray-400 mt-2"># Prospect Outreach</p>
                    <p className="text-gray-400">You are an enrollment</p>
                    <p className="text-gray-400">communications specialist...</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">&#8595;</span>
                  <span className="text-xs text-gray-400">produces</span>
                </div>

                <div className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                  <p className="text-xs font-semibold text-gray-700 mb-2">Generic output</p>
                  <p className="text-[11px] text-gray-500 italic leading-relaxed">
                    &ldquo;Hi [First Name], I noticed [your interest area] and
                    wanted to share what makes [program] unique for students
                    like you...&rdquo;
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
                    <span className="text-[10px] text-yellow-700">Good structure, but generic — works for any school</span>
                  </div>
                </div>
              </div>
            </div>

            {/* With Context */}
            <div className="rounded-2xl border-2 border-blue-300 bg-white overflow-hidden ring-2 ring-blue-100">
              <div className="bg-blue-600 px-6 py-3">
                <p className="text-xs font-bold text-white uppercase tracking-wider">
                  Skill + Your Context
                </p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-gray-900 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-[9px] font-mono text-gray-500 ml-1">SKILL.md</span>
                    </div>
                    <div className="font-mono text-[10px] leading-relaxed">
                      <p className="text-gray-400">Prospect Outreach</p>
                      <p className="text-gray-500">Email structure,</p>
                      <p className="text-gray-500">funnel stages,</p>
                      <p className="text-gray-500">templates...</p>
                    </div>
                  </div>

                  <div className="bg-blue-950 rounded-xl p-3 border border-blue-400">
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-[9px] font-mono text-blue-300 ml-1">context.md</span>
                    </div>
                    <div className="font-mono text-[10px] leading-relaxed">
                      <p className="text-blue-300">School: Greenfield U</p>
                      <p className="text-blue-300">Programs: BSN, MBA</p>
                      <p className="text-blue-300">Voice: warm, personal</p>
                      <p className="text-blue-300">Deadlines: Mar 15...</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">&#8595;</span>
                  <span className="text-xs text-gray-400">produces</span>
                </div>

                <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                  <p className="text-xs font-semibold text-blue-800 mb-2">Contextual output</p>
                  <p className="text-[11px] text-blue-700 italic leading-relaxed">
                    &ldquo;Hi Maria, I saw you visited our BSN program page at
                    Greenfield — our nursing students have a 96% NCLEX pass
                    rate and start clinicals in semester two. The March 15
                    priority deadline is coming up...&rdquo;
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-[10px] text-green-700">Specific, personalized, on-brand</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* ENTERPRISE ROLLOUT                           */}
        {/* ============================================ */}

        <div className="mb-16">
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
            Enterprise: standardized AI across your institution
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8 max-w-xl mx-auto">
            Create institutional context once. Every team member gets the same
            skills with the same data, voice, and standards.
          </p>

          <div className="rounded-2xl border-2 border-purple-200 bg-gradient-to-b from-purple-50 to-white p-8">
            {/* The two-repo visual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Public skills repo */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Public Skill Repo</p>
                    <p className="text-[10px] text-gray-400">philkomarny/SkillStore</p>
                  </div>
                </div>
                <div className="bg-gray-900 rounded-lg p-3">
                  <p className="text-[10px] font-mono text-green-400">skills/enrollment/SKILL.md</p>
                  <p className="text-[10px] font-mono text-green-400">skills/marketing/SKILL.md</p>
                  <p className="text-[10px] font-mono text-green-400">skills/academic/SKILL.md</p>
                  <p className="text-[10px] font-mono text-gray-600">...</p>
                </div>
                <p className="text-[10px] text-gray-500 mt-2">
                  Expert-crafted skills. Open source. Shared by all.
                </p>
              </div>

              {/* Plus sign */}
              <div className="flex items-center justify-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-600">+</span>
                </div>
              </div>

              {/* Private context repo */}
              <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Your Context Repo</p>
                    <p className="text-[10px] text-gray-400">your-org/skillstore-context</p>
                  </div>
                </div>
                <div className="bg-blue-950 rounded-lg p-3 border border-blue-400">
                  <p className="text-[10px] font-mono text-blue-300">enrollment/prospect-outreach/context.md</p>
                  <p className="text-[10px] font-mono text-blue-300">marketing/enrollment-campaign/context.md</p>
                  <p className="text-[10px] font-mono text-blue-300">academic/curriculum-designer/context.md</p>
                </div>
                <p className="text-[10px] text-gray-500 mt-2">
                  Your programs, voice, data, deadlines. Private to your org.
                </p>
              </div>
            </div>

            {/* Result */}
            <div className="flex justify-center mb-6">
              <svg className="h-8 w-8 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5 5 5-5" />
              </svg>
            </div>

            <div className="max-w-2xl mx-auto bg-white rounded-xl border border-purple-200 p-6 shadow-sm text-center">
              <p className="text-sm font-semibold text-gray-900 mb-2">
                SkillStore merges them at render time
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Your team sees skills enhanced with institutional context. Same
                catalog URL. No deployment needed.
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-gray-700 mb-1">Enrollment team</p>
                  <p className="text-[10px] text-gray-500">
                    Prospect outreach with your programs and deadlines
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-gray-700 mb-1">Marketing team</p>
                  <p className="text-[10px] text-gray-500">
                    Campaign briefs with your brand voice and data
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] font-semibold text-gray-700 mb-1">Academic team</p>
                  <p className="text-[10px] text-gray-500">
                    Curriculum design with your accreditation standards
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/enterprise"
                className="inline-flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Set up enterprise context
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* WHAT GOES IN CONTEXT.MD                      */}
        {/* ============================================ */}

        <div className="mb-16">
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
            What goes in context.md?
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8 max-w-xl mx-auto">
            Anything that makes your institution unique. Paste it in, upload a doc,
            or write it from scratch. Claude uses this alongside the skill instructions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ContextCard
              icon="paste"
              title="Paste existing content"
              description="Copy from your website, brand guide, or internal docs. Enrollment stats, program descriptions, voice guidelines — whatever you already have."
              examples={["About page text", "Brand voice guide", "Enrollment data sheet"]}
              color="purple"
            />
            <ContextCard
              icon="write"
              title="Write key facts"
              description="List the specifics Claude needs: school name, programs, deadlines, differentiators, competitor schools, tuition. Bullet points work great."
              examples={["Program names + details", "Application deadlines", "Key statistics"]}
              color="blue"
            />
            <ContextCard
              icon="upload"
              title="Add documents"
              description="In Claude Desktop or claude.ai, you can upload PDFs and docs directly to the Project. Claude will reference them when using the skill."
              examples={["Accreditation self-study", "Curriculum maps", "Grant RFPs"]}
              color="green"
            />
          </div>
        </div>

        {/* ============================================ */}
        {/* EXAMPLE CONTEXT.MD                           */}
        {/* ============================================ */}

        <div className="mb-16">
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
            Example context.md
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6 max-w-lg mx-auto">
            Here&apos;s what a context file looks like for an enrollment team.
          </p>

          <div className="max-w-3xl mx-auto bg-gray-900 rounded-2xl p-6 overflow-x-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs font-mono text-gray-500 ml-2">enrollment/prospect-outreach/context.md</span>
            </div>
            <pre className="font-mono text-[11px] leading-relaxed text-gray-300 whitespace-pre-wrap">{`# Greenfield University — Enrollment Context

## Institution
- **Name:** Greenfield University
- **Type:** Private, 4-year, regional
- **Location:** Burlington, VT
- **Enrollment:** 3,200 undergrad, 800 graduate
- **Tagline:** "Where curiosity meets purpose"

## Key Programs
- **BSN Nursing** — 96% NCLEX pass rate, clinicals start semester 2
- **MBA** — hybrid format, 18-month accelerated option
- **MS Data Science** — fully online, no GRE required
- **BA Education** — embedded student teaching, 98% placement rate

## Brand Voice
- Warm, personal, never corporate
- Use "you" and "your" — student is the hero
- First-name basis with counselors
- Avoid: "prestigious," "world-class," "cutting-edge"

## Enrollment Deadlines (Fall 2026)
- Early Action: November 15
- Priority: March 15 (scholarship consideration)
- Regular: May 1
- Transfer: June 15

## Competitors
Students also consider: UVM, Champlain College, Saint Michael's

## Financial Aid
- 98% of students receive aid
- Average merit scholarship: $18,500/year
- Highlight: "No-loan guarantee for families under $65K"

## Recent Wins
- Ranked #12 Regional Universities North (US News 2026)
- New $40M science center opening Fall 2026
- Nursing program reaccredited through 2032`}</pre>
          </div>
        </div>

        {/* ============================================ */}
        {/* SYSTEM ARCHITECTURE (layers)                 */}
        {/* ============================================ */}

        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
            System Architecture
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8 max-w-lg mx-auto">
            The layers that make it work.
          </p>
        </div>

        {/* --- LAYER 1: Execution --- */}
        <div className="relative mb-2">
          <LayerLabel text="Execution" />
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-6 ml-8">
            <p className="text-[10px] font-bold text-orange-400 uppercase tracking-wider mb-4">
              Where Skills Run
            </p>
            <div className="grid grid-cols-3 gap-4">
              <InterfaceCard
                icon="desktop"
                name="Claude Desktop"
                sub="macOS / Windows"
                method="Project + Custom Instructions"
                color="orange"
              />
              <InterfaceCard
                icon="globe"
                name="claude.ai"
                sub="Web interface"
                method="Project + Custom Instructions"
                color="orange"
              />
              <InterfaceCard
                icon="terminal"
                name="Claude Code"
                sub="CLI / Terminal"
                method=".claude/commands/ + context"
                color="orange"
              />
            </div>
          </div>
        </div>

        <Arrow label="users install skills + add their context" />

        {/* --- LAYER 2: Discovery --- */}
        <div className="relative mb-2">
          <LayerLabel text="Discovery" />
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 ml-8">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-4">
              How Users Find Skills
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Web Catalog</p>
                    <p className="text-[11px] text-gray-500">skillstore-eta.vercel.app</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Feature text="Browse by department" />
                  <Feature text="Search skills" />
                  <Feature text="Copy install instructions" />
                  <Feature text="Enterprise context overlay" />
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
                  <Feature text="marketplace.json catalog" />
                  <Feature text="plugin marketplace add" />
                  <Feature text="plugin install" />
                  <Feature text="Slash commands" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <Arrow label="reads from" />

        {/* --- LAYER 3: Source --- */}
        <div className="relative mb-2">
          <LayerLabel text="Source" />
          <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-2xl p-6 ml-8">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-4">
              Source of Truth
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Public Skills</p>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">
                  {repo.owner}/{repo.name}
                </p>
                <div className="bg-gray-900 rounded px-2 py-1.5 mb-1">
                  <p className="text-[10px] font-mono text-green-400">skills/&lt;dept&gt;/&lt;skill&gt;/SKILL.md</p>
                </div>
                <div className="bg-gray-900 rounded px-2 py-1.5">
                  <p className="text-[10px] font-mono text-green-400">.claude-plugin/marketplace.json</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-900">Enterprise Context</p>
                </div>
                <p className="text-[11px] text-gray-500 mb-2">
                  your-org/skillstore-context (private)
                </p>
                <div className="bg-blue-950 rounded px-2 py-1.5 border border-blue-400">
                  <p className="text-[10px] font-mono text-blue-300">&lt;dept&gt;/&lt;skill&gt;/context.md</p>
                </div>
                <p className="text-[10px] text-gray-500 mt-2">
                  Your data, your voice, your programs. Connected via{" "}
                  <Link href="/enterprise" className="text-blue-600 underline">/enterprise</Link>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================ */}
        {/* KEY DESIGN DECISIONS                         */}
        {/* ============================================ */}

        <div className="mt-12 ml-8 bg-gray-900 rounded-2xl p-6 text-white">
          <h2 className="text-sm font-semibold mb-4">Key Design Decisions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-semibold text-blue-400 mb-1">Skills are portable</p>
              <p className="text-[11px] text-gray-400">
                Same SKILL.md works in Claude Desktop, claude.ai, and Claude Code.
                No lock-in to any interface.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-green-400 mb-1">Context is yours</p>
              <p className="text-[11px] text-gray-400">
                Your context.md stays in your private repo. The catalog provides
                methodology; you provide the specifics.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-orange-400 mb-1">No build step</p>
              <p className="text-[11px] text-gray-400">
                Push a SKILL.md and it&apos;s live. Push a context.md and your
                team sees it immediately.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-purple-400 mb-1">Enterprise-ready</p>
              <p className="text-[11px] text-gray-400">
                Same catalog URL for everyone. Connect your private context repo
                for standardized AI across your institution.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PathStep({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold mt-0.5">
        {n}
      </span>
      <div>
        <p className="text-sm font-semibold text-gray-900 mb-0.5">{title}</p>
        <p className="text-xs text-gray-500">{children}</p>
      </div>
    </li>
  );
}

function LayerLabel({ text }: { text: string }) {
  return (
    <div className="absolute -left-4 top-0 bottom-0 flex items-center">
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest -rotate-90 whitespace-nowrap origin-center">
        {text}
      </span>
    </div>
  );
}

function Arrow({ label }: { label: string }) {
  return (
    <div className="flex justify-center my-1 ml-8">
      <div className="flex flex-col items-center">
        <svg className="h-8 w-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5 5 5-5" />
        </svg>
        <span className="text-[10px] text-gray-400 font-medium -mt-1">{label}</span>
      </div>
    </div>
  );
}

function InterfaceCard({
  icon,
  name,
  sub,
  method,
  color,
}: {
  icon: string;
  name: string;
  sub: string;
  method: string;
  color: string;
}) {
  const iconMap: Record<string, React.ReactNode> = {
    desktop: (
      <svg className="h-8 w-8 mx-auto text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    globe: (
      <svg className="h-8 w-8 mx-auto text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    terminal: (
      <svg className="h-8 w-8 mx-auto text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  };

  return (
    <div className={`bg-white rounded-xl border border-${color}-200 p-4 text-center shadow-sm`}>
      <div className="mb-2">{iconMap[icon]}</div>
      <p className="text-sm font-semibold text-gray-900">{name}</p>
      <p className="text-[11px] text-gray-500 mt-1">{sub}</p>
      <div className={`mt-2 bg-${color}-50 rounded-lg px-2 py-1`}>
        <p className={`text-[10px] text-${color}-700`}>{method}</p>
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

function ContextCard({
  icon,
  title,
  description,
  examples,
  color,
}: {
  icon: string;
  title: string;
  description: string;
  examples: string[];
  color: string;
}) {
  const bgColor = color === "purple" ? "bg-purple-100" : color === "blue" ? "bg-blue-100" : "bg-green-100";
  const textColor = color === "purple" ? "text-purple-600" : color === "blue" ? "text-blue-600" : "text-green-600";
  const tagBg = color === "purple" ? "bg-purple-50" : color === "blue" ? "bg-blue-50" : "bg-green-50";
  const tagText = color === "purple" ? "text-purple-700" : color === "blue" ? "text-blue-700" : "text-green-700";

  const iconMap: Record<string, React.ReactNode> = {
    paste: (
      <svg className={`h-5 w-5 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    write: (
      <svg className={`h-5 w-5 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    upload: (
      <svg className={`h-5 w-5 ${textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <div className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center mb-3`}>
        {iconMap[icon]}
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-xs text-gray-500 mb-3">{description}</p>
      <div className="flex flex-wrap gap-1.5">
        {examples.map((ex) => (
          <span key={ex} className={`${tagBg} ${tagText} text-[10px] px-2 py-0.5 rounded-full`}>
            {ex}
          </span>
        ))}
      </div>
    </div>
  );
}

function HowStep({ n, text, children }: { n: number; text?: string; children?: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-[10px] font-bold mt-0.5">
        {n}
      </span>
      <span>{text || children}</span>
    </li>
  );
}
