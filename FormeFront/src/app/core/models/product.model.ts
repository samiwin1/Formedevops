import { Formation } from '../../features/formation/models/formation.models';

export interface Product {
  idProduct?: number;
  formation?: Formation;
  price: number;
  currency: string;
  isAvailable?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
