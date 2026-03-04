import Link from "next/link";

export const metadata = {
  title: "Pricing — SkillStore",
  description: "Choose your plan for verified Claude skills.",
};

const TIERS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Browse and install community skills",
    features: [
      "Browse all skills",
      "Install community (🌐) skills",
      "3 install methods (Desktop, Code, Project)",
      "No account required",
    ],
    cta: "Get Started",
    ctaHref: "/skills",
    highlighted: false,
  },
  {
    name: "Level 1",
    price: "$0.99",
    period: "per skill",
    description: "Bot-verified skills with context uploads",
    features: [
      "Everything in Free",
      "30-day free trial of verified skills",
      "Bot-verified (🤖) security scanning",
      "Upload docs for AI context generation",
      "Pay per skill after trial",
    ],
    cta: "Start Free Trial",
    ctaHref: "/api/checkout?plan=level1",
    highlighted: true,
  },
  {
    name: "Level 2",
    price: "$50",
    period: "/month",
    description: "Unlimited expert-verified skills",
    features: [
      "Everything in Level 1",
      "Unlimited expert-verified (👤) skills",
      "Human-reviewed for quality",
      "Priority context processing",
      "Early access to new skills",
    ],
    cta: "Subscribe",
    ctaHref: "/api/checkout?plan=level2",
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Simple, transparent pricing
        </h1>
        <p className="text-gray-500 max-w-lg mx-auto">
          Community skills are always free. Verified skills offer security scanning
          and expert review.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-xl border p-6 flex flex-col ${
              tier.highlighted
                ? "border-blue-300 bg-blue-50/30 ring-1 ring-blue-200"
                : "border-gray-200 bg-white"
            }`}
          >
            {tier.highlighted && (
              <span className="inline-block self-start rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 mb-3 uppercase tracking-wide">
                Most Popular
              </span>
            )}
            <h2 className="text-lg font-bold text-gray-900">{tier.name}</h2>
            <div className="mt-2 mb-1">
              <span className="text-3xl font-bold text-gray-900">{tier.price}</span>
              <span className="text-sm text-gray-500 ml-1">{tier.period}</span>
            </div>
            <p className="text-sm text-gray-500 mb-6">{tier.description}</p>

            <ul className="space-y-2.5 mb-8 flex-1">
              {tier.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                  <svg
                    className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0"
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
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {tier.cta}
            </Link>
          </div>
        ))}
      </div>

      {/* Level 3 */}
      <div className="mt-12 rounded-xl border border-gray-200 bg-gray-50 p-8 text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Level 3 — Custom</h3>
        <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">
          Need custom AI-powered skills built for your institution? Our team creates
          bespoke skills with human + AI collaboration.
        </p>
        <Link
          href="/submit"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Contact Us
        </Link>
      </div>
    </div>
  );
}
