export interface StageLike {
  name: string;
}

/**
 * Extracts a numeric stage counter if present.
 * Examples:
 * - "1. MAINSTAGE" -> 1
 * - "AREA 1 MAINSTAGE" -> 1
 * - "2. HARDCORE/UPTEMPO" -> 2
 * - "10. PUSSY LOUNGE" -> 10
 */
export function extractStageCounter(name: string): number | null {
  if (!name) return null;
  const match = name.match(/^(?:AREA\s+)?(\d+)\b/i) || name.match(/^(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Checks if a stage name represents a mainstage.
 */
export function isMainstage(name: string): boolean {
  if (!name) return false;
  const lower = name.toLowerCase();
  return (
    lower.includes("mainstage") ||
    lower === "red stage" ||
    lower.startsWith("main") ||
    lower.includes("main stage")
  );
}

/**
 * Sorts stages:
 * 1. Counter ascending if counters exist (1, 2, 3...)
 * 2. Mainstage first if no counters exist
 * 3. Alphabetical (A-Z) fallback
 */
export function sortStages<T extends StageLike>(stages: T[]): T[] {
  return [...stages].sort((a, b) => {
    const countA = extractStageCounter(a.name);
    const countB = extractStageCounter(b.name);

    if (countA !== null && countB !== null) {
      if (countA !== countB) return countA - countB;
      return a.name.localeCompare(b.name);
    }

    if (countA !== null) return -1;
    if (countB !== null) return 1;

    const mainA = isMainstage(a.name);
    const mainB = isMainstage(b.name);

    if (mainA && !mainB) return -1;
    if (!mainA && mainB) return 1;

    return a.name.localeCompare(b.name);
  });
}
