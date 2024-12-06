export interface PlayerSessionData {
  time: number;  // first buyin time
  endTime: number;  // cashout time
  buyinsCount: number;  // total buyins count
  buyinsTotal: number;  // sum of buyins
  stackValue: number;  // final stack value
  profit: number;  // stackValue - buyinsTotal
  profitBB: number;  // profit converted to big blinds
  durationMinutes: number;  // duration in minutes
  approximateHands: number | null;  // approximate hands count
  bb: number;  // big blind value for this session
}

export interface SessionData {
  buyins: {
    [key: string]: {
      playerId: string;
      time: number;
      amount: number;
      isPaybox?: boolean;
    };
  };
  cashouts: {
    [key: string]: {
      playerId: string;
      time: number;
      cashout: number;
      stackValue: number;
    };
  };
  players: {
    [key: string]: boolean;
  };
}

export interface SessionDetails {
  id: string;
  clubId: string;
  details: {
    type: string;
    startTime: number;
    stakes: {
      bigBlind: number;
      smallBlind: number;
      ante?: number;
    };
  };
  status: "open" | "close";
  data: SessionData;
} 