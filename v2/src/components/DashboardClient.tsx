"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import MySkillsList from "@/components/MySkillsList";
import MyContextsList from "@/components/MyContextsList";
import RefineryWorkspace from "@/components/RefineryWorkspace";
import ContextBuilder from "@/components/ContextBuilder";

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

  // Selection state for refinement
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(
    initialSkillId || null
  );
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null);

  // Context builder visibility
  const [showContextBuilder, setShowContextBuilder] = useState(false);

  const handleSelectSkill = useCallback((id: string) => {
    setSelectedSkillId((prev) => (prev === id ? null : id));
  }, []);

  const handleSelectContext = useCallback((id: string) => {
    setSelectedContextId((prev) => (prev === id ? null : id));
  }, []);

  const handleDeleteSkill = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/user-skills/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedSkillId === id) setSelectedSkillId(null);
        router.refresh();
      }
    },
    [selectedSkillId, router]
  );

  const handleDeleteContext = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/context/profiles/${id}`, { method: "DELETE" });
      if (res.ok) {
        if (selectedContextId === id) setSelectedContextId(null);
        router.refresh();
      }
    },
    [selectedContextId, router]
  );

  const handleProfilesChanged = useCallback(() => {
    router.refresh();
  }, [router]);

  const handleContextCreated = useCallback(
    (profile: any) => {
      setShowContextBuilder(false);
      setSelectedContextId(profile.id);
      router.refresh();
    },
    [router]
  );

  return (
    <div className="space-y-6">
      {/* Row 1: My Skills + My Contexts — equal columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: My Skills */}
        <div>
          <MySkillsList
            skills={skills}
            selectedSkillId={selectedSkillId}
            onSelectSkill={handleSelectSkill}
            onDeleteSkill={handleDeleteSkill}
          />
        </div>

        {/* Right: My Contexts + optional ContextBuilder */}
        <div className="space-y-4">
          <MyContextsList
            contextProfiles={contextProfiles}
            selectedContextId={selectedContextId}
            onSelectContext={handleSelectContext}
            onNewContext={() => setShowContextBuilder(true)}
            onDeleteContext={handleDeleteContext}
          />

          {showContextBuilder && (
            <ContextBuilder
              onCreated={handleContextCreated}
              onCancel={() => setShowContextBuilder(false)}
            />
          )}
        </div>
      </div>

      {/* Row 2: Refine — full width */}
      <RefineryWorkspace
        skills={skills}
        contextProfiles={contextProfiles}
        selectedSkillId={selectedSkillId}
        selectedContextId={selectedContextId}
        onProfilesChanged={handleProfilesChanged}
      />
    </div>
  );
}
