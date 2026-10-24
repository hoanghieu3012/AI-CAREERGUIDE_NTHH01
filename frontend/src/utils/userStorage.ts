/**
 * User Scoped Storage Utility
 * Strictly isolates student assessment, transcript, recommendations, and roadmap data
 * per account (using user.id) to prevent cross-account data leakage.
 */

export function getCurrentUserId(): string | null {
  try {
    const userStr = localStorage.getItem('careerguide_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.id) return String(user.id);
      if (user?.email) return String(user.email);
    }
  } catch {
    // ignore parse error
  }
  return null;
}

export function getScopedKey(baseKey: string, explicitUserId?: string | null): string {
  const userId = explicitUserId !== undefined ? explicitUserId : getCurrentUserId();
  if (userId) {
    return `cg_${userId}_${baseKey}`;
  }
  return `cg_guest_${baseKey}`;
}

export function getScopedItem(baseKey: string, explicitUserId?: string | null): string | null {
  return localStorage.getItem(getScopedKey(baseKey, explicitUserId));
}

export function setScopedItem(baseKey: string, value: string, explicitUserId?: string | null): void {
  localStorage.setItem(getScopedKey(baseKey, explicitUserId), value);
}

export function removeScopedItem(baseKey: string, explicitUserId?: string | null): void {
  localStorage.removeItem(getScopedKey(baseKey, explicitUserId));
}

/**
 * Remove obsolete legacy un-scoped keys so stale demo data cannot leak
 * into newly created accounts or unauthenticated guest states.
 */
export function purgeLegacyStorage(): void {
  const legacyKeys = [
    'careerguide_assessment_draft',
    'careerguide_calculated_vector',
    'careerguide_dominant_traits',
    'careerguide_assessment_completed',
    'careerguide_student_grades',
    'careerguide_recommendation_history',
    'careerguide_saved_roadmaps',
  ];
  legacyKeys.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  });
}
