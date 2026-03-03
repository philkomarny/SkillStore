import Link from "next/link";
import EnterpriseSetup from "@/components/EnterpriseSetup";

export const metadata = {
  title: "Enterprise — SkillStore",
  description:
    "Connect your institution's context to enhance SkillStore skills with your data, voice, and programs.",
};

export default function EnterprisePage() {
  return (
    <div>
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700">
          Catalog
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">Enterprise</span>
      </nav>

      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Your Institution, Your Context
        </h1>
        <p className="text-gray-500 max-w-2xl mx-auto">
          The public catalog provides expert-crafted skills. Your enterprise
          context repo adds your school&apos;s data, voice, and programs — so
          every skill produces output tailored to you.
        </p>
      </div>

      <div className="max-w-5xl mx-auto">
        {/* How it works */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <StepCard
            number={1}
            title="Sign in with GitHub"
            description="Your GitHub OAuth token provides secure access to your private repos — no personal access tokens needed."
            color="blue"
          />
          <StepCard
            number={2}
            title="Connect your context repo"
            description="Enter your org and repo name. We verify access using your GitHub account and save your config."
            color="green"
          />
          <StepCard
            number={3}
            title="Add context from any skill"
            description="Browse skills, click 'Add to context repo', edit the pre-filled template, and push directly to GitHub."
            color="purple"
          />
        </div>

        {/* Setup form + Guide side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div>
            <EnterpriseSetup />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              What happens when you connect
            </h3>
            <div className="space-y-3">
              <Outcome
                icon="search"
                text="View any skill in the catalog — the page checks your repo for a matching context.md"
              />
              <Outcome
                icon="merge"
                text='If context exists, it appears in the sidebar with a "Copy skill + context" button'
              />
              <Outcome
                icon="lock"
                text="Your config is stored in our database. Your GitHub OAuth token is never stored — it lives only in your session."
              />
              <Outcome
                icon="code"
                text="Add context directly from any skill page — edit in the browser, push to your repo with one click."
              />
            </div>
          </div>
        </div>

        {/* Context repo structure */}
        <div className="mb-16">
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
            Setting up your context repo
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8 max-w-xl mx-auto">
            Create a private GitHub repo that mirrors the skill directory
            structure. Only include context.md files for the skills you want to
            customize.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Repo structure */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Repository structure
              </h3>
              <div className="bg-gray-900 rounded-lg p-4">
                <pre className="text-xs font-mono text-gray-400 leading-relaxed">
{`your-org/skillstore-context/
├── enrollment/
│   ├── prospect-outreach/
│   │   └── `}<span className="text-blue-400">context.md</span>{`
│   └── application-reviewer/
│       └── `}<span className="text-blue-400">context.md</span>{`
├── marketing/
│   └── enrollment-campaign/
│       └── `}<span className="text-blue-400">context.md</span>{`
└── academic/
    └── curriculum-designer/
        └── `}<span className="text-blue-400">context.md</span></pre>
              </div>
              <p className="text-xs text-gray-500 mt-3">
                The path matches the skill path in the public repo, minus the{" "}
                <code className="bg-gray-100 px-1 rounded">skills/</code>{" "}
                prefix. Only create context for skills you actually use.
              </p>
            </div>

            {/* Quick start commands */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">
                Quick start
              </h3>
              <div className="bg-gray-900 rounded-lg p-4 mb-3">
                <pre className="text-xs font-mono text-green-400 leading-relaxed whitespace-pre-wrap">
{`# Create the repo
gh repo create my-org/skillstore-context --private

# Clone it
gh repo clone my-org/skillstore-context
cd skillstore-context

# Add context for a skill
mkdir -p enrollment/prospect-outreach
cat > enrollment/prospect-outreach/context.md << 'EOF'
# Our University — Prospect Outreach Context

## Institution
- Name: Our University
- Type: Private, 4-year
- Location: Burlington, VT

## Key Programs
- BSN Nursing — 96% NCLEX pass rate
- MBA — hybrid, 18-month accelerated
EOF

# Push
git add . && git commit -m "Add prospect outreach context"
git push`}</pre>
              </div>
              <p className="text-xs text-gray-500">
                After pushing, connect your repo using the form on the left. The
                catalog will immediately show your context.
              </p>
            </div>
          </div>
        </div>

        {/* Building good context */}
        <div className="mb-16">
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
            Building good context
          </h2>
          <p className="text-sm text-gray-500 text-center mb-8 max-w-lg mx-auto">
            Context files contain anything that makes your institution unique.
            Here&apos;s what to include for each department.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <ContextGuide
              dept="Enrollment"
              color="blue"
              items={[
                "Institution name, type, and location",
                "Key programs with stats and differentiators",
                "Application deadlines by type",
                "Competitor schools students consider",
                "Financial aid highlights",
                "Brand voice and tone guidelines",
              ]}
            />
            <ContextGuide
              dept="Marketing"
              color="purple"
              items={[
                "Brand guidelines and visual identity",
                "Target personas and segments",
                "Approved messaging and taglines",
                "Channel preferences (email, social, etc.)",
                "Campaign calendar and key dates",
                "Compliance requirements (FERPA, etc.)",
              ]}
            />
            <ContextGuide
              dept="Academic"
              color="green"
              items={[
                "Accreditation body and standards",
                "Institutional learning outcomes",
                "Curriculum review cycle and process",
                "Assessment frameworks in use",
                "Faculty governance structure",
                "Gen-ed requirements and credit hours",
              ]}
            />
            <ContextGuide
              dept="Student Success"
              color="amber"
              items={[
                "Early alert system and triggers",
                "Advising model (proactive, intrusive, etc.)",
                "Key retention metrics and goals",
                "Support services available",
                "Intervention protocols",
                "Student population demographics",
              ]}
            />
            <ContextGuide
              dept="Finance"
              color="red"
              items={[
                "Institutional budget structure",
                "Common grant funders (NSF, DOE, etc.)",
                "Indirect cost rate",
                "Fiscal year calendar",
                "Compliance frameworks",
                "Key financial metrics",
              ]}
            />
            <ContextGuide
              dept="All Departments"
              color="gray"
              items={[
                "School name, tagline, mission",
                "Recent wins and rankings",
                "Strategic plan priorities",
                "Words to use and avoid",
                "Key statistics (enrollment, retention, etc.)",
                "Links to public data sources",
              ]}
            />
          </div>
        </div>

        {/* Example context.md */}
        <div className="mb-16">
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
            Example context.md
          </h2>
          <p className="text-sm text-gray-500 text-center mb-6 max-w-lg mx-auto">
            Here&apos;s a real example for the prospect-outreach skill.
          </p>

          <div className="max-w-3xl mx-auto bg-gray-900 rounded-2xl p-6 overflow-x-auto">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-xs font-mono text-gray-500 ml-2">
                enrollment/prospect-outreach/context.md
              </span>
            </div>
            <pre className="font-mono text-[11px] leading-relaxed text-gray-300 whitespace-pre-wrap">{`# Greenfield University — Prospect Outreach Context

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

        {/* FAQ */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-2 text-center">
            FAQ
          </h2>
          <div className="max-w-3xl mx-auto space-y-4 mt-8">
            <FaqItem
              question="Do I need to deploy anything?"
              answer="No. You use the same SkillStore catalog URL. Just create a private GitHub repo with your context files and connect it here."
            />
            <FaqItem
              question="Is my context data safe?"
              answer="Your enterprise config (org and repo name) is stored in our database. Your GitHub access token lives only in your session and is never stored permanently. Context is fetched server-side from your private repo using your OAuth token."
            />
            <FaqItem
              question="What if I don't have context for a skill?"
              answer="That's fine. Skills without a matching context.md in your repo work exactly as they do in the public catalog — no context panel, no changes."
            />
            <FaqItem
              question="Can multiple team members use this?"
              answer="Yes. Each person signs in with their GitHub account (which needs access to the context repo). The context repo is shared — each person's session uses their own OAuth token."
            />
            <FaqItem
              question="Do I need to add context for every skill?"
              answer="No. Start with the 1-2 skills your team uses most. Add more context files over time as you adopt more skills."
            />
            <FaqItem
              question="Can I also self-host a private catalog?"
              answer="Yes. Fork the entire SkillStore repo, add context.md files directly alongside skills, set SKILLSTORE_REPO_OWNER to your org, and deploy. See the README for details."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StepCard({
  number,
  title,
  description,
  color,
}: {
  number: number;
  title: string;
  description: string;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    purple: "bg-purple-600",
  };
  const lightBgMap: Record<string, string> = {
    blue: "bg-blue-50 border-blue-200",
    green: "bg-green-50 border-green-200",
    purple: "bg-purple-50 border-purple-200",
  };

  return (
    <div className={`rounded-2xl border p-6 ${lightBgMap[color]}`}>
      <div
        className={`w-8 h-8 ${bgMap[color]} text-white rounded-lg flex items-center justify-center text-sm font-bold mb-3`}
      >
        {number}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

function Outcome({ icon, text }: { icon: string; text: string }) {
  const icons: Record<string, React.ReactNode> = {
    search: (
      <svg
        className="h-4 w-4 text-blue-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
    merge: (
      <svg
        className="h-4 w-4 text-green-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
        />
      </svg>
    ),
    lock: (
      <svg
        className="h-4 w-4 text-purple-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
        />
      </svg>
    ),
    code: (
      <svg
        className="h-4 w-4 text-gray-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
        />
      </svg>
    ),
  };

  return (
    <div className="flex items-start gap-3">
      <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
        {icons[icon]}
      </div>
      <p className="text-sm text-gray-600 pt-1">{text}</p>
    </div>
  );
}

function ContextGuide({
  dept,
  color,
  items,
}: {
  dept: string;
  color: string;
  items: string[];
}) {
  const borderMap: Record<string, string> = {
    blue: "border-blue-200",
    purple: "border-purple-200",
    green: "border-green-200",
    amber: "border-amber-200",
    red: "border-red-200",
    gray: "border-gray-200",
  };
  const badgeBgMap: Record<string, string> = {
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-700",
  };

  return (
    <div className={`rounded-xl border ${borderMap[color]} bg-white p-4`}>
      <span
        className={`inline-block text-[10px] font-semibold ${badgeBgMap[color]} px-2 py-0.5 rounded-full mb-3`}
      >
        {dept}
      </span>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-xs text-gray-600">
            <span className="text-gray-300 mt-0.5">-</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FaqItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">{question}</h3>
      <p className="text-sm text-gray-600">{answer}</p>
    </div>
  );
}
