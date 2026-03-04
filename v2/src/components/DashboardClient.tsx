"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import MySkillsList from "@/components/MySkillsList";
import MyContextsList from "@/components/MyContextsList";
import RefineryWorkspace from "@/components/RefineryWorkspace";
import ContextBuilder from "@/components/ContextBuilder";
import SkillViewer from "@/components/SkillViewer";

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

  // Skill viewer state
  const [viewingSkillId, setViewingSkillId] = useState<string | null>(null);
  const [viewingSkillName, setViewingSkillName] = useState<string>("");

  const handleSelectSkill = useCallback((id: string) => {
    setSelectedSkillId((prev) => (prev === id ? null : id));
  }, []);

  const handleSelectContext = useCallback((id: string) => {
    setSelectedContextId((prev) => (prev === id ? null : id));
  }, []);

  const handleViewSkill = useCallback((id: string, name: string) => {
    setViewingSkillId((prev) => (prev === id ? null : id));
    setViewingSkillName(name);
  }, []);

  const handleCloseViewer = useCallback(() => {
    setViewingSkillId(null);
    setViewingSkillName("");
  }, []);

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
            onViewSkill={handleViewSkill}
          />
        </div>

        {/* Right: My Contexts + optional ContextBuilder */}
        <div className="space-y-4">
          <MyContextsList
            contextProfiles={contextProfiles}
            selectedContextId={selectedContextId}
            onSelectContext={handleSelectContext}
            onNewContext={() => setShowContextBuilder(true)}
          />

          {showContextBuilder && (
            <ContextBuilder
              onCreated={handleContextCreated}
              onCancel={() => setShowContextBuilder(false)}
            />
          )}
        </div>
      </div>

      {/* Row 2: The Refinery — full width */}
      <RefineryWorkspace
        skills={skills}
        contextProfiles={contextProfiles}
        selectedSkillId={selectedSkillId}
        selectedContextId={selectedContextId}
        onProfilesChanged={handleProfilesChanged}
      />

      {/* Row 3: Skill Viewer — conditionally shown, full width */}
      {viewingSkillId && (
        <SkillViewer
          skillId={viewingSkillId}
          skillName={viewingSkillName}
          onClose={handleCloseViewer}
        />
      )}
    </div>
  );
}
