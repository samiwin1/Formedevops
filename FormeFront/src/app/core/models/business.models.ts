export interface Partner {
  id?: number;
  name: string;
  contactEmail: string;
  contactPhone: string;
}

export interface Deal {
  id?: number;
  title: string;
  description: string;
  partnerId: number;
  startDate: string;
  endDate: string;
}

export interface Pack {
  id?: number;
  name: string;
  description: string;
  validityMonths: number;
  active: boolean;
}

export interface AccessCode {
  id?: number;
  code: string;
  partnerId: number;
  dealId: number;
  expirationDate: string;
  used: boolean;
}
