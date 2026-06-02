export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  children?: CategoryNode[];
  [key: string]: unknown;
}

/**
 * Flatten a category tree into a depth-annotated list.
 * Handles undefined children gracefully.
 */
export function flatCategories<T extends { children?: T[] }>(
  cats: T[],
  depth = 0,
): (T & { depth: number })[] {
  return cats.flatMap((c) => [
    { ...c, depth },
    ...flatCategories(c.children || [], depth + 1),
  ]);
}
