import Link from "next/link";

export const metadata = {
  title: "Pricing — eduSkillsMP",
  description: "Choose your plan for the Edu Skills Marketplace and The Refinery.",
};

const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Browse, install, and use community skills",
    features: [
      "Browse all skills in the marketplace",
      "Install community (🌐) skills",
      "3 install methods (Desktop, Code, Project)",
      "No account required",
    ],
    cta: "Get Started",
    ctaHref: "/skills",
    highlighted: false,
  },
  {
    name: "Refinery — Personal",
    price: "$2.50",
    period: "per refined skill / mo.",
    description: "Personalize skills for your institution with AI",
    features: [
      "Everything in Free",
      "AI-powered skill refinement",
      "Upload docs for context generation",
      "Personal skill storefront",
      "Version history on refined skills",
    ],
    cta: "Start Refining",
    ctaHref: "/api/checkout?plan=personal",
    highlighted: true,
  },
  {
    name: "Refinery — Institution",
    price: "$2.50",
    period: "per refined skill / mo.",
    description: "Collaborative refinement for teams",
    features: [
      "Everything in Personal",
      "Multiple contributors per store",
      "Shared context profiles",
      "Unified institutional storefront",
      "Team management dashboard",
    ],
    cta: "Get Started",
    ctaHref: "/api/checkout?plan=institution",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold font-mono text-[#1a1a1a] mb-3">
          <span className="text-accent">#</span> Simple, transparent pricing
        </h1>
        <p className="text-muted max-w-lg mx-auto">
          Community skills are always free. The Refinery lets you personalize
          skills for your institution — pay only for what you refine.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
        {TIERS.map((tier) => (
          <div key={tier.name} className="flex flex-col items-center">
            {tier.highlighted ? (
              <span className="inline-block rounded-full bg-accent/10 text-accent text-[10px] font-bold px-2.5 py-0.5 mb-2 uppercase tracking-wide font-mono">
                Most Popular
              </span>
            ) : (
              <div className="h-[22px] mb-2" />
            )}
            <div
              className={`rounded-xl border p-6 flex flex-col w-full ${
                tier.highlighted
                  ? "border-accent bg-accent/5 ring-1 ring-accent/20"
                  : "border-terminal-border bg-white"
              }`}
            >
              <h2 className="text-lg font-bold font-mono text-[#1a1a1a]">{tier.name}</h2>
              <div className="mt-2 mb-1">
                <span className="text-3xl font-bold text-[#1a1a1a]">{tier.price}</span>
                <span className="text-sm text-muted ml-1">{tier.period}</span>
              </div>
              <p className="text-sm text-muted mb-6">{tier.description}</p>

              <ul className="space-y-2.5 mb-8 flex-1">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-[#1a1a1a]">
                    <svg
                      className="h-4 w-4 text-success mt-0.5 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href={tier.ctaHref}
                className={`block text-center rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                  tier.highlighted
                    ? "btn-claude justify-center"
                    : "bg-terminal-surface text-[#1a1a1a] hover:bg-terminal-border"
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Skills */}
      <div className="mt-12 rounded-xl border border-terminal-border bg-terminal-surface p-8 text-center">
        <h3 className="text-lg font-bold font-mono text-[#1a1a1a] mb-2">Custom Skills</h3>
        <p className="text-sm text-muted mb-4 max-w-md mx-auto">
          Need bespoke AI-powered skills built for your institution? Our team
          creates custom skills through human + AI collaboration.
        </p>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 rounded-lg border border-terminal-border bg-white px-5 py-2.5 text-sm font-medium text-[#1a1a1a] hover:bg-terminal-surface transition-colors"
        >
          Contact Us
        </Link>
      </div>
    </div>
  );
}
