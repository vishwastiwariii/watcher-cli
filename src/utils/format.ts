export function formatMemory(kb: number): string {

  if (kb >= 1024 * 1024) {
    return `${(kb / (1024 * 1024)).toFixed(2)} GB`;
  }

  return `${(kb / 1024).toFixed(2)} MB`;
}