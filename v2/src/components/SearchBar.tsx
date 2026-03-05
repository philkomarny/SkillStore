"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useState } from "react";

interface SearchBarProps {
  placeholder?: string;
}

export default function SearchBar({ placeholder = "Search skills..." }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      const qs = params.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleSearch(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-terminal-border bg-white px-4 py-3 pl-10 text-sm font-mono placeholder-tertiary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <span className="absolute left-3.5 top-3 text-sm font-mono font-bold text-accent">
        $
      </span>
    </div>
  );
}
