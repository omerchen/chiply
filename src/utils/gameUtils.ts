/**
 * Calculates the approximate number of hands played in a poker session based on duration and player count.
 * Formula: FLOOR({Duration in Hours}*30*10/{Players Count})
 * 
 * @param playersCount - The number of players in the session
 * @param durationMinutes - The duration of the session in minutes
 * @returns The estimated number of hands played
 */
export const getApproximateHands = (playersCount: number, durationMinutes: number): number => {
  // Convert minutes to hours
  const durationHours = durationMinutes / 60;
  
  // Calculate hands using the formula: FLOOR({Duration in Hours}*30*10/{Players Count})
  const hands = Math.floor((durationHours * 30 * 10) / playersCount);
  
  return hands;
};

/**
 * Formats the number of hands to be more readable
 * Examples: 
 * - "~150 hands"
 * - "~1.5K hands"
 * - "~2.1K hands"
 * 
 * @param hands - The number of hands to format
 * @returns A formatted string representing the number of hands
 */
export const formatHands = (hands: number | null): string => {
  if (hands === null) return "-";
  
  if (hands < 1000) {
    return `~${hands} hands`;
  }
  
  // For 1000 or more, format as K
  const handsInK = (hands / 1000).toFixed(1);
  // Remove .0 if it's a whole number
  const formattedK = handsInK.endsWith('.0') ? handsInK.slice(0, -2) : handsInK;
  return `~${formattedK}K hands`;
}; 