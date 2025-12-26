import path from 'path';

export function assertInWorkspace(workspaceRoot: string, targetPath: string): void {
  const resolvedRoot = path.resolve(workspaceRoot);
  const resolvedTarget = path.resolve(workspaceRoot, targetPath);

  // Check if target starts with root
  if (!resolvedTarget.startsWith(resolvedRoot)) {
    throw new Error(`Security Violation: Path '${targetPath}' resolves to '${resolvedTarget}', which is outside workspace '${resolvedRoot}'`);
  }

  // Double check relative path does not start with ..
  const relative = path.relative(resolvedRoot, resolvedTarget);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
     // logic redundancy but safe
     throw new Error(`Security Violation: Path traversal detected.`);
  }
}

export function safeJoin(workspaceRoot: string, ...paths: string[]): string {
  const target = path.join(...paths);
  assertInWorkspace(workspaceRoot, target);
  return path.resolve(workspaceRoot, target);
}
