
export enum LotteryType {
  LOTTO_645 = 'Lotto 6/45',
  LOTTO_649 = 'Lotto 6/49',
  POWERBALL = 'Powerball',
  MEGA_MILLIONS = 'Mega Millions',
  CUSTOM = 'Custom'
}

export interface LotteryResult {
  numbers: number[];
  specialNumber?: number;
  timestamp: number;
  id: string;
  analysis: string;
  type: LotteryType;
}

export interface PredictionStats {
  hotNumbers: number[];
  coldNumbers: number[];
  evenOddRatio: string;
  sumTotal: number;
}
