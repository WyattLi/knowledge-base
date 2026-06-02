"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteNoteButton({ slug }: { slug: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/notes/${slug}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/notes");
      router.refresh();
    } else {
      setDeleting(false);
      setConfirming(false);
      alert("删除失败");
    }
  };

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="text-sm px-3 py-1.5 rounded-lg text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors"
      >
        删除
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <span className="text-xs text-text-muted">确定？</span>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="text-sm px-2 py-1 rounded-md bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
      >
        {deleting ? "删除中..." : "确认"}
      </button>
      <button
        onClick={() => setConfirming(false)}
        disabled={deleting}
        className="text-sm px-2 py-1 rounded-md text-text-muted hover:text-text-primary transition-colors disabled:opacity-50"
      >
        取消
      </button>
    </span>
  );
}
