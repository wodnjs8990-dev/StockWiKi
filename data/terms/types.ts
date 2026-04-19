export type Term = {
  id: string;
  name: string;
  fullName: string;
  en: string;
  category: string;
  group?: string;
  related: string[];
  description: string;
  detailed?: string;
  relations?: Record<string, string>;
  marketImpact?: string;
  formula: string;
  example: string;
  easy?: string;
};

export type HueFamily = 'fundamental' | 'market' | 'macro' | 'risk' | 'derivatives' | 'trading' | 'industry' | 'digital' | 'tax';

export type FamilyToken = {
  base: string;
  bg: string;
  text: string;
  tones: [string, string, string, string];
};
