import Link from "next/link";

export const metadata = {
  title: "How It Works — eduSkillsMP",
  description:
    "Import community skills, refine them with your context, and distribute from your own storefront.",
};

export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-3 text-center">
        How eduSkillsMP Works
      </h1>
      <p className="text-gray-500 text-center mb-12 max-w-xl mx-auto">
        Import community skills. Refine them with your context. Distribute from
        your own storefront.
      </p>

      {/* The Refinery Concept */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 mb-14">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          The Refinery:{" "}
          <span className="text-blue-600">
            Community Skill &rarr; Your Expert
          </span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-sm items-stretch">
          <div className="sm:col-span-2 bg-white rounded-lg p-4 border border-blue-100 flex flex-col">
            <div className="font-semibold text-gray-900 mb-1">
              Community Skill
            </div>
            <p className="text-gray-500 text-[13px]">
              A proven set of AI instructions from the marketplace &mdash; like
              &ldquo;Grant Writer&rdquo; or &ldquo;Enrollment Strategist&rdquo;
            </p>
          </div>
          <div className="flex items-center justify-center text-xl text-blue-400 font-semibold">
            &rarr;
          </div>
          <div className="sm:col-span-2 bg-white rounded-lg p-4 border border-blue-100 flex flex-col">
            <div className="font-semibold text-gray-900 mb-1">
              Your Refinery
            </div>
            <p className="text-gray-500 text-[13px]">
              Upload your documents. Our AI rewrites the skill with your
              language, data, and processes baked in.
            </p>
          </div>
        </div>
        <div className="mt-4 flex justify-center">
          <div className="text-xl text-blue-400 font-semibold">&darr;</div>
        </div>
        <div className="mt-3 bg-white rounded-lg p-4 border border-blue-200 shadow-sm">
          <div className="font-semibold text-gray-900 mb-1">
            Your Custom Skill
          </div>
          <p className="text-gray-500 text-[13px]">
            Saved to your account, distributed from your storefront. Not a skill with
            an appendix &mdash;{" "}
            <em className="text-gray-700">a skill rewritten to be yours.</em>
          </p>
        </div>
      </div>

      {/* 5-Step Process */}
      <div className="space-y-10">
        <Step
          number="1"
          title="Create Your Account"
          description="Sign up with Google to get your own Refinery and personal storefront on eduSkillsMP. It takes seconds."
          icon="👤"
        />

        <Step
          number="2"
          title="Browse & Import"
          description="Explore 80+ community skills across 8 education-focused categories. Found one you need? Import it into your Refinery with one click."
          icon="📥"
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
                className="inline-block rounded-full bg-gray-100 border border-gray-200 px-2.5 py-0.5 text-[11px] text-gray-600 font-medium"
              >
                {cat}
              </span>
            ))}
          </div>
        </Step>

        {/* Step 3 — emphasized as the differentiator */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5 -mx-2">
          <Step
            number="3"
            title="Refine with Your Context"
            description="Upload PDFs, docs, plans, guidelines — anything that defines your work. The Refinery reads your documents and edits the skill file with your terminology, processes, and voice."
            icon="⚙️"
          >
            <p className="text-sm text-gray-600 mt-2">
              Review the output. Edit it further if you want. It&apos;s yours now.
            </p>
            {/* Before/After mini-example */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="rounded-lg bg-white border border-gray-200 p-3">
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Before &mdash; Generic
                </div>
                <p className="text-xs text-gray-500 font-mono leading-relaxed">
                  &ldquo;Draft a grant proposal that highlights the
                  institution&apos;s research strengths and aligns with the
                  funder&apos;s priorities...&rdquo;
                </p>
              </div>
              <div className="rounded-lg bg-white border border-blue-200 p-3 shadow-sm">
                <div className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide mb-1.5">
                  After &mdash; Refined
                </div>
                <p className="text-xs text-gray-700 font-mono leading-relaxed">
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
          title="Save & Distribute"
          description="Save your refined skill — versioned and always yours. Your personal storefront on eduSkillsMP makes it easy to share."
          icon="🏪"
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
          title="Share & Vouch"
          description="Publish refined skills back to the marketplace for others to discover. Vouch for skills that work — vouches surface the best content and build your reputation."
          icon="🚀"
        />
      </div>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-16">
        <Link
          href="/api/auth/signin"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Get Started
        </Link>
        <Link
          href="/skills"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Browse Skills
        </Link>
      </div>
    </div>
  );
}

/* ---------- Helper Components ---------- */

function Step({
  number,
  title,
  description,
  icon,
  children,
}: {
  number: string;
  title: string;
  description: string;
  icon: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center mt-0.5">
        {number}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          <span className="mr-1.5">{icon}</span>
          {title}
        </h3>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
        {children}
      </div>
    </div>
  );
}

function MiniCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
      <div className="text-xs font-semibold text-gray-900 mb-0.5">
        {title}
      </div>
      <p className="text-[11px] text-gray-500 leading-snug">{desc}</p>
    </div>
  );
}
