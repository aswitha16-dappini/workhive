/**
 * Title formatting and validation helper for WorkHive Escrow Milestones
 */

/**
 * Safely generates a concise, readable milestone title strictly within the 120-character limit.
 *
 * @param {string} prefix - Milestone identifier (e.g. "Milestone 1")
 * @param {string} projectTitle - Raw title of the associated project
 * @param {number} maxLen - Maximum character limit enforced by schema (120)
 * @returns {string} Safe milestone title guaranteed to be <= maxLen characters
 */
export const generateMilestoneTitle = (prefix = 'Milestone 1', projectTitle = '', maxLen = 120) => {
  if (!projectTitle || !projectTitle.trim()) {
    return `${prefix}: Primary Deliverable`;
  }

  // Clean demo indicators for concise readability while preserving project subject
  const cleanTitle = projectTitle
    .replace(/^\[DEMO(?:\s+Opportunity)?\]\s*/i, '')
    .trim();

  const formattedPrefix = `${prefix}: `;
  const allowedTitleLen = maxLen - formattedPrefix.length;

  if (cleanTitle.length <= allowedTitleLen) {
    return `${formattedPrefix}${cleanTitle}`;
  }

  // Gracefully truncate to fit exactly within maxLen including ellipsis
  const truncated = cleanTitle.slice(0, allowedTitleLen - 3).trim();
  return `${formattedPrefix}${truncated}...`;
};

/**
 * Validates a user-entered milestone title.
 * Does NOT silently truncate user input; provides actionable feedback.
 *
 * @param {string} title
 * @param {number} maxLen
 * @returns {{ valid: boolean, error?: string }}
 */
export const validateMilestoneTitle = (title, maxLen = 120) => {
  if (!title || !title.trim()) {
    return { valid: false, error: 'Milestone title is required' };
  }
  const trimmed = title.trim();
  if (trimmed.length > maxLen) {
    return {
      valid: false,
      error: `Milestone title cannot exceed ${maxLen} characters (currently ${trimmed.length} characters). Please enter a concise title.`,
    };
  }
  return { valid: true };
};

