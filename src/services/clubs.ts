import { getCurrentUser } from "./auth";
import { readData } from "./database";

export interface Club {
  id: string;
  name: string;
  description?: string;
  role: "admin" | "member";
  disabledAt?: number | null;
}

export const getUserClubs = async (): Promise<Club[]> => {
  const user = await getCurrentUser();
  if (!user || !user.clubs) return [];

  try {
    const clubsData = await readData("clubs");
    if (!clubsData) return [];

    const clubs = Object.entries(user.clubs)
      .map(([clubId, clubData]) => {
        const club = clubsData[clubId];
        if (!club || club.disabledAt) return null;

        return {
          id: clubId,
          name: club.name || "Unknown Club",
          description: club.description,
          role: clubData.role,
          disabledAt: club.disabledAt
        };
      })
      .filter((club): club is NonNullable<typeof club> => club !== null);

    return clubs;
  } catch (error) {
    console.error("Error fetching clubs:", error);
    return [];
  }
};

export const getClubDetails = async (clubId: string): Promise<Club | null> => {
  try {
    const [clubData, user] = await Promise.all([
      readData(`clubs/${clubId}`),
      getCurrentUser(),
    ]);

    if (
      !clubData ||
      !user ||
      (user.systemRole != "admin" && (!user.clubs || !user.clubs[clubId])) ||
      clubData.disabledAt
    ) {
      return null;
    }

    return {
      id: clubId,
      name: clubData.name,
      description: clubData.description,
      role: user.systemRole === "admin" ? "admin" : user.clubs[clubId].role,
      disabledAt: clubData.disabledAt
    };
  } catch (error) {
    console.error("Error fetching club details:", error);
    return null;
  }
};
