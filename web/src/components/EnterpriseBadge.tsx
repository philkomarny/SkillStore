"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function EnterpriseBadge() {
  const { data: session } = useSession();
  const [enterprise, setEnterprise] = useState<{
    owner: string;
    repo: string;
  } | null>(null);

  useEffect(() => {
    if (!session) {
      setEnterprise(null);
      return;
    }

    fetch("/api/enterprise")
      .then((r) => r.json())
      .then((data) => {
        if (data.configured) {
          setEnterprise({ owner: data.owner, repo: data.repo });
        } else {
          setEnterprise(null);
        }
      })
      .catch(() => setEnterprise(null));
  }, [session]);

  if (!enterprise) return null;

  return (
    <Link
      href="/enterprise"
      className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium hover:bg-green-200 transition-colors"
      title={`Connected to ${enterprise.owner}/${enterprise.repo}`}
    >
      {enterprise.owner}
    </Link>
  );
}
