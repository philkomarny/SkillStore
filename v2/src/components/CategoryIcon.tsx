import {
  GraduationCap,
  Megaphone,
  BookOpen,
  Star,
  DollarSign,
  BarChart3,
  ClipboardCheck,
  Monitor,
  Globe,
  Bot,
  UserCheck,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  GraduationCap,
  Megaphone,
  BookOpen,
  Star,
  DollarSign,
  BarChart3,
  ClipboardCheck,
  Monitor,
  Globe,
  Bot,
  UserCheck,
};

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
  color?: string;
}

export default function CategoryIcon({
  name,
  className = "w-5 h-5",
  size,
  color,
}: CategoryIconProps) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  return <Icon className={className} size={size} style={color ? { color } : undefined} />;
}
