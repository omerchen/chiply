import { getCurrentUser } from './auth';
import { readData } from './database';

export interface Club {
  id: string;
  name: string;
  description?: string;
  role: 'admin' | 'member';
}

export const getUserClubs = async (): Promise<Club[]> => {
  const user = await getCurrentUser();
  if (!user || !user.clubs) return [];

  try {
    const clubsData = await readData('clubs');
    if (!clubsData) return [];
    
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
  } catch (error) {
    console.error('Error fetching clubs:', error);
    return [];
  }
};

export const getClubDetails = async (clubId: string): Promise<Club | null> => {
  try {
    const clubData = await readData(`clubs/${clubId}`);
    if (!clubData) {
      return null;
    }

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
  } catch (error) {
    console.error('Error fetching club details:', error);
    return null;
  }
}; 