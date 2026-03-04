interface DownloadBadgeProps {
  count: number;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export default function DownloadBadge({ count }: DownloadBadgeProps) {
  return (
    <span className="inline-flex items-stretch rounded overflow-hidden text-xs font-medium leading-none border border-gray-300">
      <span className="bg-gray-600 text-white px-2 py-1">downloads</span>
      <span className="bg-blue-600 text-white px-2 py-1">{formatCount(count)}</span>
    </span>
  );
}
