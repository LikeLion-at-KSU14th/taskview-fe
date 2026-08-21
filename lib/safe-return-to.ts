const localOrigin = "https://taskview.local";
const maximumReturnToLength = 2048;

export function safeReturnTo(value: unknown, fallback?: string): string | undefined {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > maximumReturnToLength ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    return fallback;
  }

  try {
    const parsed = new URL(value, localOrigin);
    if (parsed.origin !== localOrigin) return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function withReturnTo(path: string, returnTo?: string): string {
  const safePath = safeReturnTo(path, "/dashboard") ?? "/dashboard";
  const safeDestination = safeReturnTo(returnTo);
  if (!safeDestination) return safePath;

  const parsed = new URL(safePath, localOrigin);
  parsed.searchParams.set("returnTo", safeDestination);
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}

export function resolvePostAuthPath(
  backendNextPath: unknown,
  returnTo?: string,
): string {
  const safeBackendPath = safeReturnTo(backendNextPath);
  const safeDestination = safeReturnTo(returnTo);
  const backendPathname = safeBackendPath
    ? new URL(safeBackendPath, localOrigin).pathname
    : null;
  const backendRequiresFlow =
    backendPathname === "/onboarding/workspace" ||
    backendPathname === "/onboarding/invite";

  if (safeBackendPath && backendRequiresFlow) {
    return withReturnTo(safeBackendPath, safeDestination);
  }
  return safeDestination ?? safeBackendPath ?? "/dashboard";
}
