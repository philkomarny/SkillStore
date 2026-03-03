import Link from "next/link";
import { notFound } from "next/navigation";
import { getSkillsByDepartment } from "@/lib/skills";
import { getRepoConfig } from "@/lib/github";
import { DEPARTMENTS } from "@/lib/types";
import SkillCard from "@/components/SkillCard";

interface PageProps {
  params: { dept: string };
}

export default async function DepartmentPage({ params }: PageProps) {
  const dept = DEPARTMENTS[params.dept];
  if (!dept) notFound();

  const repo = getRepoConfig();
  const skills = await getSkillsByDepartment(params.dept);

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-700">
          Catalog
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{dept.label}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">{dept.icon}</span>
          <h1 className="text-3xl font-bold text-gray-900">{dept.label}</h1>
        </div>
        <p className="text-gray-600">{dept.description}</p>
        <p className="text-sm text-gray-400 mt-1">
          {skills.length} {skills.length === 1 ? "skill" : "skills"} available
        </p>
      </div>

      {/* Skills */}
      {skills.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            No skills in this department yet.{" "}
            <a
              href={`${repo.repoUrl}/blob/${repo.branch}/CONTRIBUTING.md`}
              className="text-blue-600 hover:underline"
            >
              Contribute one
            </a>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {skills.map((skill) => (
            <SkillCard key={skill.name} skill={skill} />
          ))}
        </div>
      )}
    </div>
  );
}
