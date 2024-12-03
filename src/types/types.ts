export interface Buyin {
  id: string;
  amount: number;
  timestamp: number;
  isPayBox: boolean;
}

export interface Player {
  id: string;
  name: string;
  buyins: Buyin[];
  cashout: number | null;
}

export interface Transaction {
  from: string;
  to: string;
  amount: number;
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

export interface SessionData {
  players: {
    [key: string]: {
      addedAt: number;
    };
  };
  buyins: {
    [key: string]: {
      playerId: string;
      time: number;
      amount: number;
      isPaybox: boolean;
    };
  };
  cashouts: {
    [key: string]: {
      playerId: string;
      stackValue: number;
      cashout: number;
      time: number;
    };
  };
  transactions: {
    [key: string]: {
      from: string;
      to: string;
      amount: number;
      status: 'waiting' | 'done';
    };
  };
} 