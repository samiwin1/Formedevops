import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Partner, Deal, Pack, AccessCode } from '../models/business.models';

// ✅ Interface pour les stats d'un partenaire
export interface PartnerStats {
  totalDeals: number;
  usedCodes: number;
}

// ✅ Interface combinée : partenaire + ses stats
export interface PartnerWithStats extends Partner {
  stats?: PartnerStats;
  loadingStats?: boolean;
}

@Injectable({ providedIn: 'root' })
export class BusinessService {

  private base = 'http://localhost:8082/api';

  constructor(private http: HttpClient) {}

  // ── Partners ────────────────────────────────────────────────────────────
  getPartners(): Observable<Partner[]> {
    return this.http.get<Partner[]>(`${this.base}/partners`);
  }
  getPartner(id: number): Observable<Partner> {
    return this.http.get<Partner>(`${this.base}/partners/${id}`);
  }
  createPartner(p: Partner): Observable<Partner> {
    return this.http.post<Partner>(`${this.base}/partners`, p);
  }
  updatePartner(id: number, p: Partner): Observable<Partner> {
    return this.http.put<Partner>(`${this.base}/partners/${id}`, p);
  }
  deletePartner(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/partners/${id}`);
  }

  // ✅ Stats d'un partenaire
  getPartnerStats(id: number): Observable<PartnerStats> {
    return this.http.get<PartnerStats>(`${this.base}/partners/${id}/stats`);
  }

  // ── Deals ───────────────────────────────────────────────────────────────
  getDeals(): Observable<Deal[]> {
    return this.http.get<Deal[]>(`${this.base}/deals`);
  }
  getDeal(id: number): Observable<Deal> {
    return this.http.get<Deal>(`${this.base}/deals/${id}`);
  }
  createDeal(d: Deal): Observable<Deal> {
    return this.http.post<Deal>(`${this.base}/deals`, d);
  }
  updateDeal(id: number, d: Deal): Observable<Deal> {
    return this.http.put<Deal>(`${this.base}/deals/${id}`, d);
  }
  deleteDeal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/deals/${id}`);
  }

  // ── Packs ───────────────────────────────────────────────────────────────
  getPacks(): Observable<Pack[]> {
    return this.http.get<Pack[]>(`${this.base}/packs`);
  }
  getPack(id: number): Observable<Pack> {
    return this.http.get<Pack>(`${this.base}/packs/${id}`);
  }
  createPack(p: Pack): Observable<Pack> {
    return this.http.post<Pack>(`${this.base}/packs`, p);
  }
  updatePack(id: number, p: Pack): Observable<Pack> {
    return this.http.put<Pack>(`${this.base}/packs/${id}`, p);
  }
  deletePack(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/packs/${id}`);
  }

  // ── Access Codes ─────────────────────────────────────────────────────────
  getAccessCodes(): Observable<AccessCode[]> {
    return this.http.get<AccessCode[]>(`${this.base}/access-codes`);
  }
  getAccessCode(id: number): Observable<AccessCode> {
    return this.http.get<AccessCode>(`${this.base}/access-codes/${id}`);
  }
  createAccessCode(a: AccessCode): Observable<AccessCode> {
    return this.http.post<AccessCode>(`${this.base}/access-codes`, a);
  }
  updateAccessCode(id: number, a: AccessCode): Observable<AccessCode> {
    return this.http.put<AccessCode>(`${this.base}/access-codes/${id}`, a);
  }
  deleteAccessCode(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/access-codes/${id}`);
  }
}