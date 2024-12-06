import { SessionDetails, PlayerSessionData } from '../types/session';
import { getApproximateHands } from './gameUtils';

/**
 * Processes a session and returns player-specific session data
 * @param session The session details
 * @param playerId The ID of the player to process data for
 * @returns PlayerSessionData object or null if player not found, has no buyins, or hasn't cashed out
 */
export function processPlayerSessionData(session: SessionDetails, playerId: string): PlayerSessionData | null {
  const { data } = session;
  
  // Get all buyins for this player
  const playerBuyins = Object.values(data.buyins || {})
    .filter(buyin => buyin.playerId === playerId);

  // If player has no buyins, return null
  if (playerBuyins.length === 0) {
    return null;
  }

  // Find player's cashout
  const playerCashout = Object.values(data.cashouts || {})
    .find(cashout => cashout.playerId === playerId);

  // If player hasn't cashed out yet, return null
  if (!playerCashout) {
    return null;
  }

  // Calculate first buyin time
  const time = Math.min(...playerBuyins.map(buyin => buyin.time));

  // Calculate end time (cashout time)
  const endTime = playerCashout.time;

  // Calculate buyins total
  const buyinsTotal = playerBuyins.reduce((sum, buyin) => sum + buyin.amount, 0);

  // Get stack value from cashout
  const stackValue = playerCashout.stackValue;

  // Calculate duration in minutes
  const durationMinutes = Math.floor((endTime - time) / (1000 * 60));

  // Calculate approximate hands
  const playerCount = Object.keys(data.players || {}).length;
  const approximateHands = playerCount > 0 ? getApproximateHands(playerCount, durationMinutes) : null;

  return {
    time,
    endTime,
    buyinsCount: playerBuyins.length,
    buyinsTotal,
    stackValue,
    profit: stackValue - buyinsTotal,
    durationMinutes,
    approximateHands
  };
} 