import { Injectable } from '@angular/core';
import { BehaviorSubject, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../enviroments/environment';

export interface AuthResponse { token: string; }

type JwtPayload = {
  roles?: string[];
  profession?: string;
  uid?: number;
  sub?: string;
  exp?: number;
};

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'forme_token';
  private loggedInSubject = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this.loggedInSubject.asObservable();

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ✅ captchaToken added to payload
  register(payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    profession?: string;
    partnerID?: number | null;
    partnerCode?: string | null;
    captchaToken: string;
  }) {
    return this.http.post<void>(`${this.apiUrl}/auth/register`, payload);
  }

  login(payload: { email: string; password: string }) {
    console.log('Attempting login for:', payload.email);
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, payload).pipe(
      tap(res => {
        console.log('Login response received:', res);
        if (res && res.token) {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          this.loggedInSubject.next(true);
          console.log('Token saved, session active.');
        } else {
          console.error('Login successful but no token found in response:', res);
          throw new Error('NO_JWT_IN_RESPONSE');
        }
      })
    );
  }

  logout() {
    localStorage.removeItem(this.TOKEN_KEY);
    this.loggedInSubject.next(false);
  }

  getToken(): string | null {
    const token = localStorage.getItem(this.TOKEN_KEY);
    if (!token) {
      return null;
    }
    if (this.isTokenExpired(token)) {
      localStorage.removeItem(this.TOKEN_KEY);
      this.loggedInSubject.next(false);
      return null;
    }
    return token;
  }

  isAdmin(): boolean {
    const roles = this.getRoles();
    return roles.includes('ROLE_ADMIN') || roles.includes('ROLE_SUPER_ADMIN');
  }

  isSuperAdmin(): boolean {
    return this.getRoles().includes('ROLE_SUPER_ADMIN');
  }

  isUser(): boolean {
    return this.getRoles().includes('ROLE_USER');
  }

  getProfession(): string | null {
    return this.decodeToken()?.profession ?? null;
  }

  isEvaluator(): boolean {
    return this.isUser() && this.getProfession() === 'EVALUATOR';
  }

  isLearner(): boolean {
    const profession = this.getProfession();
    return this.isUser() && profession !== 'EVALUATOR';
  }

  getPayload(): JwtPayload | null {
    return this.decodeToken();
  }

  getEmail(): string | null {
    return this.decodeToken()?.sub ?? null;
  }

  getUserId(): number | null {
    return this.decodeToken()?.uid ?? null;
  }

  getRoles(): string[] {
    return this.decodeToken()?.roles ?? [];
  }

  private decodeToken(): JwtPayload | null {
    const token = this.getToken();
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length !== 3) return null;

    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  private hasToken(): boolean {
    const token = localStorage.getItem(this.TOKEN_KEY);
    return !!token && !this.isTokenExpired(token);
  }

  private isTokenExpired(token: string): boolean {
    const payload = this.decodeTokenFromRaw(token);
    if (!payload?.exp) {
      return false;
    }
    const nowSec = Math.floor(Date.now() / 1000);
    return payload.exp <= nowSec;
  }

  private decodeTokenFromRaw(token: string): JwtPayload | null {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    try {
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  }
}
