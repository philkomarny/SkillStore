export interface SkillEntry {
  name: string;
  source: string;
  description: string;
  version: string;
  category: string;
  tags: string[];
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
  frontmatter: {
    name: string;
    description: string;
    version: string;
    category: string;
    tags: string[];
  };
}

export interface Department {
  id: string;
  label: string;
  description: string;
  color: string;
  lightColor: string;
  icon: string;
}

export const DEPARTMENTS: Record<string, Department> = {
  enrollment: {
    id: "enrollment",
    label: "Enrollment",
    description: "Admissions, recruitment, yield, and applications",
    color: "#2563eb",
    lightColor: "#dbeafe",
    icon: "🎓",
  },
  marketing: {
    id: "marketing",
    label: "Marketing",
    description: "Enrollment marketing, content, and campaigns",
    color: "#7c3aed",
    lightColor: "#ede9fe",
    icon: "📣",
  },
  academic: {
    id: "academic",
    label: "Academic",
    description: "Curriculum, accreditation, assessment, and faculty",
    color: "#059669",
    lightColor: "#d1fae5",
    icon: "📚",
  },
  "student-success": {
    id: "student-success",
    label: "Student Success",
    description: "Advising, retention, early alert, and support services",
    color: "#d97706",
    lightColor: "#fef3c7",
    icon: "⭐",
  },
  finance: {
    id: "finance",
    label: "Finance",
    description: "Grants, budgets, expenses, and financial aid",
    color: "#dc2626",
    lightColor: "#fee2e2",
    icon: "💰",
  },
  hr: {
    id: "hr",
    label: "HR",
    description: "Faculty hiring, staff recruitment, and compliance",
    color: "#0891b2",
    lightColor: "#cffafe",
    icon: "👥",
  },
  it: {
    id: "it",
    label: "IT",
    description: "Systems, security, infrastructure, and ed-tech",
    color: "#4b5563",
    lightColor: "#f3f4f6",
    icon: "🖥️",
  },
};
