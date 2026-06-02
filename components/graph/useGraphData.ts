"use client";

import { useState, useEffect } from "react";
import type { GraphData } from "./types";

export function useGraphData(params?: { categoryId?: string; tagId?: string }) {
  const [data, setData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const sp = new URLSearchParams();
    if (params?.categoryId) sp.set("categoryId", params.categoryId);
    if (params?.tagId) sp.set("tagId", params.tagId);
    const qs = sp.toString();
    fetch(`/api/graph${qs ? `?${qs}` : ""}`)
      .then(r => { if (!r.ok) throw new Error("Failed to fetch"); return r.json(); })
      .then(d => setData(d))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [params?.categoryId, params?.tagId]);

  return { data, loading, error };
}
