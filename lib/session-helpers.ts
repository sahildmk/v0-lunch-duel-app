/**
 * Session phase management utilities
 * Centralized logic for phase validation and routing
 */

// Session phase type from schema
type SessionPhase = "vibe" | "vote" | "result" | "inactive";

/**
 * Get the correct route for the current session phase
 */
export function getCorrectPhaseRoute(
  session: { phase: SessionPhase } | null | undefined,
  teamCode: string
): string {
  if (!session) {
    // No session exists - should be on vibe page to create one
    return `/team/${teamCode}/vibe`;
  }

  switch (session.phase) {
    case "vibe":
      return `/team/${teamCode}/vibe`;
    case "vote":
      return `/team/${teamCode}/vote`;
    case "result":
      return `/team/${teamCode}/result`;
    case "inactive":
      // Inactive sessions should go back to vibe to start new session
      return `/team/${teamCode}/vibe`;
    default:
      return `/team/${teamCode}/vibe`;
  }
}

/**
 * Determine if the user should be redirected based on current path and session state
 * Returns the redirect path if redirect is needed, null otherwise
 */
export function shouldRedirect(
  currentPath: string,
  session: { phase: SessionPhase } | null | undefined,
  teamCode: string
): string | null {
  const correctRoute = getCorrectPhaseRoute(session, teamCode);

  // Normalize paths for comparison (remove trailing slashes)
  const normalizedCurrent = currentPath.replace(/\/$/, "");
  const normalizedCorrect = correctRoute.replace(/\/$/, "");

  if (normalizedCurrent !== normalizedCorrect) {
    return correctRoute;
  }

  return null;
}

/**
 * Check if the current session phase matches the expected phase
 */
export function isCorrectPhase(
  session: { phase: SessionPhase } | null | undefined,
  expectedPhase: SessionPhase
): boolean {
  if (!session) {
    // No session - only correct for vibe phase (to create session)
    return expectedPhase === "vibe";
  }

  return session.phase === expectedPhase;
}

/**
 * Get valid next phases for a given phase
 */
export function getValidNextPhases(currentPhase: SessionPhase): SessionPhase[] {
  switch (currentPhase) {
    case "vibe":
      return ["vote"];
    case "vote":
      return ["result"];
    case "result":
      return ["inactive"];
    case "inactive":
      return ["vibe"]; // New session
    default:
      return [];
  }
}

/**
 * Validate if a phase transition is allowed
 */
export function isValidPhaseTransition(
  from: SessionPhase,
  to: SessionPhase
): boolean {
  const validNext = getValidNextPhases(from);
  return validNext.includes(to);
}
