export interface Player {
  id: string;
  name: string;
  buyins: Buyin[];
  cashout: number | null;
}

export interface Buyin {
  id: string;
  amount: number;
  timestamp: number;
  isPayBox: boolean;
}

export interface Transaction {
  from: string;
  to: string;
  amount: number;
}
