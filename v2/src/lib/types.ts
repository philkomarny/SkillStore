import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    googleId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    googleId?: string;
  }
}

// --- Categories ---

export interface Category {
  id: string;
  label: string;
  description: string;
  color: string;
  lightColor: string;
  icon: string;
}

export const CATEGORIES: Record<string, Category> = {
  "enrollment-admissions": {
    id: "enrollment-admissions",
    label: "Enrollment & Admissions",
    description: "Prospect outreach, application review, yield management",
    color: "#2563eb",
    lightColor: "#dbeafe",
    icon: "GraduationCap",
  },
  "marketing-communications": {
    id: "marketing-communications",
    label: "Marketing & Communications",
    description: "Campaign strategy, content creation, brand voice",
    color: "#7c3aed",
    lightColor: "#ede9fe",
    icon: "Megaphone",
  },
  "academic-programs": {
    id: "academic-programs",
    label: "Academic Programs",
    description: "Curriculum design, accreditation, program review",
    color: "#059669",
    lightColor: "#d1fae5",
    icon: "BookOpen",
  },
  "student-success": {
    id: "student-success",
    label: "Student Success",
    description: "Advising, early alerts, retention, career services",
    color: "#d97706",
    lightColor: "#fef3c7",
    icon: "Star",
  },
  "grants-finance": {
    id: "grants-finance",
    label: "Grants & Finance",
    description: "Grant writing, budget analysis, financial reporting",
    color: "#dc2626",
    lightColor: "#fee2e2",
    icon: "DollarSign",
  },
  "research-data": {
    id: "research-data",
    label: "Research & Data",
    description: "Data analysis, IRB support, research methodology",
    color: "#0891b2",
    lightColor: "#cffafe",
    icon: "BarChart3",
  },
  "compliance-accreditation": {
    id: "compliance-accreditation",
    label: "Compliance & Accreditation",
    description: "Policy writing, regulatory compliance, audit prep",
    color: "#7c3aed",
    lightColor: "#f5f3ff",
    icon: "ClipboardCheck",
  },
  "it-operations": {
    id: "it-operations",
    label: "IT & Operations",
    description: "Technical documentation, process automation, helpdesk",
    color: "#4b5563",
    lightColor: "#f3f4f6",
    icon: "Monitor",
  },
};

// --- Skills ---

export interface SkillEntry {
  slug: string;
  name: string;
  source: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
  verificationLevel?: number;
  downloadCount?: number;
  clapCount?: number;
  submittedBy?: string;
  isFeatured?: boolean;
}

export interface Marketplace {
  name: string;
  description: string;
  version: string;
  author: string;
  repository: string;
  skills: SkillEntry[];
}

export interface SkillDetail extends SkillEntry {
  content: string;
  rawContent: string;
  contextContent: string | null;
  frontmatter: {
    name: string;
    description: string;
    version: string;
    category: string;
    tags: string[];
  };
}

// --- Verification ---

export interface VerificationBadge {
  level: number;
  label: string;
  icon: string;
  description: string;
}

export const VERIFICATION_BADGES: Record<number, VerificationBadge> = {
  0: {
    level: 0,
    label: "Community",
    icon: "Globe",
    description: "Community-submitted, not yet verified",
  },
  1: {
    level: 1,
    label: "Bot Verified",
    icon: "Bot",
    description: "Passed automated security assessment",
  },
  2: {
    level: 2,
    label: "Expert Verified",
    icon: "UserCheck",
    description: "Reviewed and approved by a human expert",
  },
};

// --- User Skills (Refinery) ---

export type UserSkillStatus = "draft" | "refining" | "refined" | "shared";

export interface UserSkill {
  id: string;
  userId: string;
  baseSkillSlug: string;
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  version: number;
  status: UserSkillStatus;
  storagePath?: string;
  contextSummary?: string;
  isShareable: boolean;
  clapCount: number;
  createdAt: string;
  updatedAt: string;
}

// --- Context Profiles ---

export type ContextProfileStatus = "draft" | "building" | "ready";

export interface ContextProfile {
  id: string;
  userId: string;
  name: string;
  contextMarkdown: string | null;
  version: number;
  status: ContextProfileStatus;
  createdAt: string;
  updatedAt: string;
}

// --- Users ---

export interface UserProfile {
  id: string;
  googleId: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
  stripeCustomerId?: string;
  subscriptionTier: "free" | "level1" | "level2" | "level3";
  subscriptionStatus: "active" | "trialing" | "past_due" | "canceled" | "none";
  trialStartedAt?: string;
  createdAt: string;
}
