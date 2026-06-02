"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminTabs() {
  const pathname = usePathname();
  const tabs = [
    { href: "/admin/categories", label: "分类" },
    { href: "/admin/tags", label: "标签" },
  ];

  return (
    <div className="flex gap-1 border-b border-white/5 px-6">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
            pathname === tab.href
              ? "text-text-primary border-nebula-purple"
              : "text-text-muted border-transparent hover:text-text-primary"
          }`}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
