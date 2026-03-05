import Link from "next/link";

export const metadata = {
  title: "How It Works — eduSkillsMP",
  description:
    "Browse verified skills, install with confidence, refine for your campus, and share back with the community.",
};

export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold font-mono text-[#1a1a1a] mb-3 text-center">
        <span className="text-accent">#</span> How It Works
      </h1>
      <p className="text-muted text-center mb-12 max-w-xl mx-auto">
        Browse verified skills. Install with confidence. Refine for your campus.
        Share back with the community.
      </p>

      {/* The Refinery Concept */}
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-6 mb-14">
        <h2 className="text-lg font-semibold font-mono text-[#1a1a1a] mb-4">
          The Refinery:{" "}
          <span className="text-accent">
            Community Skill &rarr; Your Expert
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-sm items-stretch">
          <div className="sm:col-span-2 bg-white rounded-lg p-4 border border-terminal-border flex flex-col">
            <div className="font-semibold text-[#1a1a1a] mb-1">
              Community Skill
            </div>
            <p className="text-muted text-[13px]">
              A proven set of AI instructions from the marketplace &mdash; like
              &ldquo;Grant Writer&rdquo; or &ldquo;Enrollment Strategist&rdquo;
            </p>
          </div>
          <div className="flex items-center justify-center text-xl text-accent font-semibold font-mono">
            &rarr;
          </div>
          <div className="sm:col-span-2 bg-white rounded-lg p-4 border border-terminal-border flex flex-col">
            <div className="font-semibold text-[#1a1a1a] mb-1">
              Your Refinery
            </div>
            <p className="text-muted text-[13px]">
              Upload your documents. Our AI rewrites the skill with your
              language, data, and processes baked in.
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <div className="text-xl text-accent font-semibold font-mono">&darr;</div>
        </div>
        <div className="mt-3 bg-white rounded-lg p-4 border border-accent/30 shadow-sm">
          <div className="font-semibold text-[#1a1a1a] mb-1">
            Your Custom Skill
          </div>
          <p className="text-muted text-[13px]">
            Saved to your account, distributed from your storefront. Not a skill with
            an appendix &mdash;{" "}
            <em className="text-[#1a1a1a]">a skill rewritten to be yours.</em>
          </p>
        </div>
      </div>

      {/* 5-Step Process */}
      <div className="space-y-10">
        <Step
          number="1"
          command="$ browse --catalog"
          title="Browse skills built for your world"
          description="Skills are organized by the categories you already think in — Admissions, Financial Aid, Student Affairs, Academic Operations, IT, Compliance, K-12 Administration, and more. Each listing tells you exactly what the skill does, who verified it, and what data it touches."
        >
          <div className="flex flex-wrap gap-1.5 mt-3">
            {[
              "Enrollment & Admissions",
              "Marketing & Comms",
              "Academic Programs",
              "Student Success",
              "Grants & Finance",
              "Research & Data",
              "Compliance",
              "IT & Operations",
            ].map((cat) => (
              <span
                key={cat}
                className="inline-block rounded-full bg-terminal-surface border border-terminal-border px-2.5 py-0.5 text-[11px] text-muted font-medium"
              >
                {cat}
              </span>
            ))}
          </div>
        </Step>

        <Step
          number="2"
          command="$ install --confidence"
          title="Install with confidence"
          description="Every skill in the catalog has passed community verification. You'll see who reviewed it, when it was last tested, and any known limitations — before you install. One click adds it to your Claude environment."
        />

        {/* Step 3 — emphasized as the differentiator */}
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 -mx-2">
          <Step
            number="3"
            command="$ refine --campus"
            title="Refine it for your campus"
            description="No two campuses work the same way. Add your institutional context — your terminology, your policies, your systems — and generate a version of that skill that fits your exact workflow. No code. No configuration files. Just context in, skill out."
          >
            <p className="text-sm text-muted mt-2">
              Review the output. Edit it further if you want. It&apos;s yours now.
            </p>
            {/* Before/After mini-example */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-white border border-terminal-border p-3">
                <div className="text-[10px] font-semibold text-tertiary uppercase tracking-wide mb-1.5">
                  Before &mdash; Generic
                </div>
                <p className="text-xs text-muted font-mono leading-relaxed">
                  &ldquo;Draft a grant proposal that highlights the
                  institution&apos;s research strengths and aligns with the
                  funder&apos;s priorities...&rdquo;
                </p>
              </div>
              <div className="rounded-lg bg-white border border-accent/30 p-3 shadow-sm">
                <div className="text-[10px] font-semibold text-accent uppercase tracking-wide mb-1.5">
                  After &mdash; Refined
                </div>
                <p className="text-xs text-[#1a1a1a] font-mono leading-relaxed">
                  &ldquo;Draft an NSF proposal highlighting Riverside
                  University&apos;s STEM+ initiative and the Nguyen Lab&apos;s
                  published results in...&rdquo;
                </p>
              </div>
            </div>
          </Step>
        </div>

        <Step
          number="4"
          command="$ test && share"
          title="Test it. Trust it. Share it."
          description="Run your refined skill in your own environment. When it works the way you need it to, publish it back to the marketplace as a vouched expert skill — tagged with your role, your institution type, and the specific problem it solves."
        >
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MiniCard
              title="Private"
              desc="Password-protected for internal use at your organization"
            />
            <MiniCard
              title="Public"
              desc="Open for anyone to discover and install"
            />
            <MiniCard
              title="Install Anywhere"
              desc="Claude Desktop, Web, Claude Code, or project files"
            />
          </div>
        </Step>

        <Step
          number="5"
          command="$ catalog --grow"
          title="The catalog grows. The community gets stronger."
          description="Every skill that gets refined and shared makes the next person's job easier. Every review makes the catalog more trustworthy. Every campus that participates makes the whole network smarter. This isn't a product with a roadmap. It's a community with momentum."
        />
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-16">
        <Link
          href="/api/auth/signin"
          className="btn-claude gap-1.5"
        >
          <span className="font-mono text-xs opacity-70">$</span> get-started
        </Link>
        <Link
          href="/skills"
          className="inline-flex items-center gap-2 rounded-lg border border-terminal-border bg-white px-6 py-3 text-sm font-medium text-[#1a1a1a] hover:bg-terminal-surface transition-colors"
        >
          <span className="font-mono text-xs text-accent">$</span> browse --skills
        </Link>
      </div>
    </div>
  );
}

/* ---------- Helper Components ---------- */

function Step({
  number,
  command,
  title,
  description,
  children,
}: {
  number: string;
  command: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-accent text-white text-sm font-bold font-mono flex items-center justify-center mt-0.5">
        {number}
      </div>
      <div className="flex-1">
        <code className="text-xs font-mono text-accent mb-1 block">{command}</code>
        <h3 className="text-lg font-semibold font-mono text-[#1a1a1a] mb-1">
          {title}
        </h3>
        <p className="text-sm text-muted leading-relaxed">{description}</p>
        {children}
      </div>
    </div>
  );
}

function MiniCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg bg-terminal-surface border border-terminal-border p-3">
      <div className="text-xs font-semibold text-[#1a1a1a] mb-0.5">
        {title}
      </div>
      <p className="text-[11px] text-muted leading-snug">{desc}</p>
    </div>
  );
}
