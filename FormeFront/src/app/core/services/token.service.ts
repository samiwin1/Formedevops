import { Injectable } from '@angular/core';

const KEY = 'access_token';

@Injectable({ providedIn: 'root' })
export class TokenService {
  set(token: string) { localStorage.setItem(KEY, token); }
  get(): string | null { return localStorage.getItem(KEY); }
  clear() { localStorage.removeItem(KEY); }
  isLoggedIn(): boolean { return !!this.get(); }
}
