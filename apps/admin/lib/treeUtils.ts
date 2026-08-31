// apps/admin/lib/treeUtils.ts
//
// Pure, client-safe helpers for updating a FamilyNode tree immutably.
// Each function only clones the nodes on the path down to the target —
// everything else keeps its original object reference, so React doesn't
// re-render branches that didn't change.

import { VIRTUAL_ROOT_ID, type FamilyNode } from "./constants";

/** Appends `newChild` to the children of the node whose id === parentId. */
export function addChildToTree(node: FamilyNode, parentId: number, newChild: FamilyNode): FamilyNode {
  if (node.id === parentId) {
    return { ...node, children: [...(node.children ?? []), newChild] };
  }
  return mapChildren(node, (child) => addChildToTree(child, parentId, newChild));
}

/** Returns a new tree with the node matching `id` updated via `updates` (name/dates). */
export function updateNodeInTree(
  node: FamilyNode,
  id: number,
  updates: Partial<Pick<FamilyNode, "name" | "birth_date" | "death_date">>
): FamilyNode {
  if (node.id === id) {
    return { ...node, ...updates };
  }
  return mapChildren(node, (child) => updateNodeInTree(child, id, updates));
}

/** Returns a new tree with the node matching `id` (and its whole subtree) removed. */
export function removeNodeFromTree(node: FamilyNode, id: number): FamilyNode {
  if (!node.children?.length) return node;

  const filteredChildren = node.children.filter((child) => child.id !== id);
  const childrenChangedByRemoval = filteredChildren.length !== node.children.length;

  const nextChildren = filteredChildren.map((child) => removeNodeFromTree(child, id));
  const childrenChangedByRecursion = nextChildren.some((child, i) => child !== filteredChildren[i]);

  if (!childrenChangedByRemoval && !childrenChangedByRecursion) return node;

  return { ...node, children: nextChildren.length ? nextChildren : undefined };
}

/** Finds a node by id anywhere in the tree, or null if not present. */
export function findNodeById(node: FamilyNode, id: number): FamilyNode | null {
  if (node.id === id) return node;
  for (const child of node.children ?? []) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

/**
 * Returns the chain of nodes from `root` down to the node matching `id`
 * (inclusive of both ends), or null if `id` isn't found. Used by the lineage
 * certificate — since every node has exactly one parent, this chain is the
 * unique ancestor path, same as the legacy app's `currentPath`.
 */
export function getPathToRoot(root: FamilyNode, id: number): FamilyNode[] | null {
  if (root.id === id) return [root];
  for (const child of root.children ?? []) {
    const path = getPathToRoot(child, id);
    if (path) return [root, ...path];
  }
  return null;
}

/** Counts every real person in the tree (excludes the synthetic 941 virtual root itself). */
export function countAllPeople(node: FamilyNode): number {
  const ownCount = node.id === VIRTUAL_ROOT_ID ? 0 : 1;
  const childCount = (node.children ?? []).reduce((sum, child) => sum + countAllPeople(child), 0);
  return ownCount + childCount;
}

/** Internal: maps over a node's children with `fn`, only cloning if something actually changed. */
function mapChildren(node: FamilyNode, fn: (child: FamilyNode) => FamilyNode): FamilyNode {
  if (!node.children?.length) return node;

  let changed = false;
  const nextChildren = node.children.map((child) => {
    const updated = fn(child);
    if (updated !== child) changed = true;
    return updated;
  });

  return changed ? { ...node, children: nextChildren } : node;
}