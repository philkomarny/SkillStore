import Link from "next/link";

export const metadata = {
  title: "How It Works — eduSkillsMP",
  description: "Learn how to browse, install, and personalize Claude skills.",
};

export default function HowItWorksPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
      <h1 className="text-3xl font-bold text-gray-900 mb-3 text-center">
        How eduSkillsMP Works
      </h1>
      <p className="text-gray-500 text-center mb-12 max-w-lg mx-auto">
        A skill is a markdown instruction file that gives Claude specialized expertise.
        Add your own context to make it yours.
      </p>

      {/* Concept: Skill + Context */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-6 mb-12">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          The formula: <span className="text-blue-600">Skill + Context = Your Expert</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="font-semibold text-gray-900 mb-1">Skill</div>
            <p className="text-gray-500">
              A set of expert instructions — like &quot;Marketing Strategist&quot; or &quot;Grant Writer&quot;
            </p>
          </div>
          <div className="flex items-center justify-center text-2xl text-blue-400">+</div>
          <div className="bg-white rounded-lg p-4 border border-blue-100">
            <div className="font-semibold text-gray-900 mb-1">Your Context</div>
            <p className="text-gray-500">
              Your brand guidelines, docs, data — uploaded and processed by AI
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-4">
          The result: a marketing strategist who knows <em>your</em> brand voice, or a grant writer
          who understands <em>your</em> institution&apos;s mission.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-10">
        <Step
          number="1"
          title="Browse & Find"
          description="Explore skills across education-focused categories. Each skill is verified for quality — from community-submitted to expert-reviewed."
        >
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge emoji="🌐" label="Community" color="gray" />
            <Badge emoji="🤖" label="Bot Verified" color="blue" />
            <Badge emoji="👤" label="Expert Verified" color="green" />
          </div>
        </Step>

        <Step
          number="2"
          title="Install in Seconds"
          description="Three ways to add any skill to Claude — pick whichever fits your workflow."
        >
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MiniCard title="Desktop & Web" desc="Paste into Claude Desktop or claude.ai project settings" />
            <MiniCard title="Claude Code" desc="One terminal command to add as a slash command" />
            <MiniCard title="Project File" desc="Save as a .md file in your project's .claude/commands/" />
          </div>
        </Step>

        <Step
          number="3"
          title="Add Your Context"
          description="Upload PDFs, docs, or text files. Our AI reads them and generates a personalized context file that makes the skill uniquely yours."
        />

        <Step
          number="4"
          title="Vouch & Share"
          description="Found a skill that works great? Vouch for it to help others discover quality skills. Vouches are trust signals that surface the best content."
        />
      </div>

      {/* CTA */}
      <div className="text-center mt-16">
        <Link
          href="/skills"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          Start Browsing
        </Link>
      </div>
    </div>
  );
}

function Step({
  number,
  title,
  description,
  children,
}: {
  number: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center mt-0.5">
        {number}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
        {children}
      </div>
    </div>
  );
}

function Badge({ emoji, label, color }: { emoji: string; label: string; color: string }) {
  const colors: Record<string, string> = {
    gray: "bg-gray-50 text-gray-600 border-gray-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    green: "bg-green-50 text-green-700 border-green-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${colors[color]}`}>
      <span>{emoji}</span> {label}
    </span>
  );
}

function MiniCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <div className="text-xs font-semibold text-gray-900 mb-0.5">{title}</div>
      <p className="text-[11px] text-gray-500">{desc}</p>
    </div>
  );
}
