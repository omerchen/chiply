import { ref, get } from 'firebase/database';
import { db } from '../config/firebase';
import { getCurrentUser } from './auth';

export interface Club {
  id: string;
  name: string;
  description?: string;
  role: 'admin' | 'member';
}

export const getUserClubs = async (): Promise<Club[]> => {
  const user = await getCurrentUser();
  if (!user || !user.clubs) return [];

  const clubsRef = ref(db, 'clubs');
  const snapshot = await get(clubsRef);
  
  if (!snapshot.exists()) return [];

  const clubsData = snapshot.val();
  
  const userClubs = Object.values(user.clubs).map(clubData => {
    if (typeof clubData === 'object' && clubData !== null) {
      const { id, role } = clubData as { id: string; role: string };
      return {
        id,
        name: clubsData[id]?.name || 'Unknown Club',
        description: clubsData[id]?.description,
        role: role === 'member' ? 'member' : 'admin'
      };
    }
    return null;
  });
  
  return userClubs
    .filter((club): club is Club => club !== null)
    .filter(club => club.name !== 'Unknown Club');
};

export const getClubDetails = async (clubId: string): Promise<Club | null> => {
  const clubRef = ref(db, `clubs/${clubId}`);
  const snapshot = await get(clubRef);

  if (!snapshot.exists()) {
    return null;
  }

  const clubData = snapshot.val();
  const user = await getCurrentUser();
  
  if (!user || !user.clubs) {
    return null;
  }

  const userClubData = Object.values(user.clubs).find(
    club => typeof club === 'object' && club !== null && club.id === clubId
  );

  if (!userClubData || typeof userClubData !== 'object') {
    return null;
  }

  return {
    id: clubId,
    name: clubData.name,
    description: clubData.description,
    role: (userClubData as { role: string }).role === 'member' ? 'member' : 'admin'
  };
}; 