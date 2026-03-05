import TrafficLights from "./TrafficLights";

interface TerminalWindowProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md";
}

export default function TerminalWindow({
  title,
  children,
  className = "",
  size = "md",
}: TerminalWindowProps) {
  const dotSize = size === "sm" ? 8 : 12;

  return (
    <div className={`terminal-window ${className}`}>
      <div className="terminal-titlebar">
        <TrafficLights size={dotSize} />
        {title && (
          <span className="ml-3 font-mono text-xs text-tertiary">{title}</span>
        )}
      </div>
      {children}
    </div>
  );
}
