import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { getUserProfile } from "@/lib/users";
import { getClient } from "@/lib/supabase";
import MarkdownRenderer from "@/components/MarkdownRenderer";
import InstallPanel from "@/components/InstallPanel";

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) return {};

  const profile = await getUserProfile(session.user.id);
  if (!profile) return {};

  const supabase = getClient();
  const { data: skill } = (await supabase
    .from("user_skills")
    .select("name")
    .eq("id", params.id)
    .eq("user_id", profile.id)
    .single()) as { data: any };

  return {
    title: skill ? `${skill.name} — Your Skills Refinery` : "Skill — Your Skills Refinery",
  };
}

export default async function SkillViewPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const profile = await getUserProfile(session.user.id);
  if (!profile) {
    redirect("/api/auth/signin");
  }

  const supabase = getClient();

  // Fetch the user skill (verify ownership)
  const { data: userSkill, error } = (await supabase
    .from("user_skills")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", profile.id)
    .single()) as { data: any; error: any };

  if (error || !userSkill) {
    notFound();
  }

  // Fetch the actual skill content from storage
  let content = "";
  if (userSkill.storage_path) {
    const { data: fileData } = await supabase.storage
      .from("refined-skills")
      .download(userSkill.storage_path);

    if (fileData) {
      content = await fileData.text();
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard" className="hover:text-blue-600">
          Your Skills Refinery
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{userSkill.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {userSkill.name}
              </h1>
              {userSkill.description && (
                <p className="text-gray-500">{userSkill.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-xs font-mono text-gray-400">
                v{userSkill.version}
              </span>
              {userSkill.status === "refined" && (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  Refined
                </span>
              )}
            </div>
          </div>

          {/* Skill content — rendered markdown */}
          <div className="prose-skill border-t border-gray-100 pt-6">
            {content ? (
              <MarkdownRenderer content={content} />
            ) : (
              <p className="text-sm text-gray-400">No content available.</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Back to Refinery */}
          <Link
            href="/dashboard"
            className="btn-claude block w-full text-center"
          >
            &larr; Back to Your Skills Refinery
          </Link>

          {/* Meta info */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-gray-500">Author</span>
              <span className="text-sm font-medium text-gray-900">
                {session.user.name || session.user.email}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-gray-500">Version</span>
              <span className="text-sm font-mono font-medium text-gray-900">
                {userSkill.version}
              </span>
            </div>
            <div className="flex items-center justify-between px-5 py-4">
              <span className="text-sm text-gray-500">Status</span>
              <span className="text-sm font-medium text-gray-900 capitalize">
                {userSkill.status || "draft"}
              </span>
            </div>
            {userSkill.updated_at && (
              <div className="flex items-center justify-between px-5 py-4">
                <span className="text-sm text-gray-500">Updated</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(userSkill.updated_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          {/* Install panel — same as marketplace */}
          <InstallPanel
            skillName={userSkill.skill_slug || userSkill.name}
            skillSlug={userSkill.skill_slug || userSkill.name}
            rawContent={content}
            source=""
          />
        </div>
      </div>
    </div>
  );
}
