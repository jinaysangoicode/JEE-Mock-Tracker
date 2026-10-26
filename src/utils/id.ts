/**
 * Generates a collision-resistant unique ID for mock test entries
 */
export function generateUniqueTestId(prefix: string = 'test'): string {
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 10);
  const counter = Math.floor(Math.random() * 100000);
  return `${prefix}-${timestamp}-${randomPart}-${counter}`;
}

/**
 * Deduplicates an array of items ensuring every item has a unique id
 */
export function deduplicateTestIds<T extends { id: string }>(items: T[]): T[] {
  const seenIds = new Set<string>();
  return items.map((item, index) => {
    if (!item.id || seenIds.has(item.id)) {
      const newId = generateUniqueTestId(`test-${index}`);
      seenIds.add(newId);
      return { ...item, id: newId };
    }
    seenIds.add(item.id);
    return item;
  });
}
