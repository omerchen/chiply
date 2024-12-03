import { getCurrentUser } from "./auth";
import { readData } from "./database";

export interface Club {
  id: string;
  name: string;
  description?: string;
  role: "admin" | "member";
}

export const getUserClubs = async (): Promise<Club[]> => {
  const user = await getCurrentUser();
  if (!user || !user.clubs) return [];

  try {
    const clubsData = await readData("clubs");
    if (!clubsData) return [];

    return Object.values(user.clubs)
      .filter(
        (clubData): clubData is { id: string; role: string } =>
          typeof clubData === "object" &&
          clubData !== null &&
          "id" in clubData &&
          "role" in clubData
      )
      .map(
        (clubData) =>
          ({
            id: clubData.id,
            name: clubsData[clubData.id]?.name || "Unknown Club",
            description: clubsData[clubData.id]?.description,
            role: clubData.role === "member" ? "member" : "admin",
          } as Club)
      )
      .filter((club) => club.name !== "Unknown Club");
  } catch (error) {
    console.error("Error fetching clubs:", error);
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
      (club) => typeof club === "object" && club !== null && club.id === clubId
    );

    if (!userClubData || typeof userClubData !== "object") {
      return null;
    }

    return {
      id: clubId,
      name: clubData.name,
      description: clubData.description,
      role:
        (userClubData as { role: string }).role === "member"
          ? "member"
          : "admin",
    };
  } catch (error) {
    console.error("Error fetching club details:", error);
    return null;
  }
};
