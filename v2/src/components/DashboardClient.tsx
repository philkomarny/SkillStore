"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import MySkillsList from "@/components/MySkillsList";
import RefineryWorkspace from "@/components/RefineryWorkspace";

interface DashboardClientProps {
  skills: any[];
  contextProfiles: any[];
  initialSkillId?: string | null;
}

export default function DashboardClient({
  skills,
  contextProfiles,
  initialSkillId,
}: DashboardClientProps) {
  const router = useRouter();
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(
    initialSkillId || null
  );
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null);

  const handleSelectSkill = useCallback((id: string) => {
    setSelectedSkillId((prev) => (prev === id ? null : id));
  }, []);

  const handleSelectContext = useCallback((id: string) => {
    setSelectedContextId((prev) => (prev === id ? null : id));
  }, []);

  const handleProfilesChanged = useCallback(() => {
    // Refresh server component data
    router.refresh();
  }, [router]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left column: My Skills */}
      <div className="lg:col-span-5">
        <MySkillsList
          skills={skills}
          selectedSkillId={selectedSkillId}
          onSelectSkill={handleSelectSkill}
        />
      </div>

      {/* Right column: The Refinery */}
      <div className="lg:col-span-7">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
            R
          </div>
          <h2 className="text-sm font-semibold text-gray-900">The Refinery</h2>
        </div>
        <RefineryWorkspace
          skills={skills}
          contextProfiles={contextProfiles}
          selectedSkillId={selectedSkillId}
          selectedContextId={selectedContextId}
          onSelectContext={handleSelectContext}
          onProfilesChanged={handleProfilesChanged}
        />
      </div>
    </div>
  );
}
