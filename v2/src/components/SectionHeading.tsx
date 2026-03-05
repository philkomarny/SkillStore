interface SectionHeadingProps {
  children: React.ReactNode;
  as?: "h1" | "h2" | "h3";
  className?: string;
}

export default function SectionHeading({
  children,
  as: Tag = "h2",
  className = "",
}: SectionHeadingProps) {
  return (
    <Tag className={`font-mono text-lg font-bold text-[#1a1a1a] ${className}`}>
      <span className="text-accent mr-1">#</span>
      {children}
    </Tag>
  );
}
