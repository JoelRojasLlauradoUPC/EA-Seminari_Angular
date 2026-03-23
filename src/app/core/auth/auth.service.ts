import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Usuario } from '../../models/usuario.model';

interface LoginResponse {
  accessToken: string;
  usuario?: Usuario;
  user?: Usuario;
}

interface RefreshResponse {
  accessToken: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly baseUrl = environment.apiUrl;
  private readonly accessTokenKey = 'accessToken';
  private readonly currentUserKey = 'currentUser';

  private accessToken: string | null = this.readStoredToken();
  private readonly currentUserState = signal<Usuario | null>(this.readStoredUser());

  login(email: string, password: string): Observable<void> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/login`, { email, password }, { withCredentials: true })
      .pipe(
        tap((response) => {
          const currentUser = response.usuario ?? response.user ?? null;
          this.setSession(response.accessToken, currentUser);
        }),
        map(() => void 0)
      );
  }

  refreshAccessToken(): Observable<string> {
    return this.http
      .post<RefreshResponse>(`${this.baseUrl}/auth/refresh`, {}, { withCredentials: true })
      .pipe(
        map((response) => response.accessToken),
        tap((token) => this.setAccessToken(token))
      );
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(
        catchError(() => of(void 0)),
        tap(() => this.clearSessionAndRedirect())
      );
  }

  fetchCurrentUser(): Observable<Usuario> {
    return this.http.get<Usuario>(`${this.baseUrl}/auth/me`).pipe(
      tap((user) => {
        this.currentUserState.set(user);
        this.persistCurrentUser(user);
      })
    );
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  getCurrentUser(): Usuario | null {
    return this.currentUserState();
  }

  hasRole(role: string): boolean {
    const currentUser = this.getCurrentUser();
    const roles = currentUser?.roles ?? [];
    return roles.includes(role);
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  clearSessionAndRedirect(): void {
    this.clearSession();
    this.router.navigate(['/login']);
  }

  private setSession(token: string, user: Usuario | null): void {
    this.setAccessToken(token);
    this.currentUserState.set(user);

    if (user) {
      this.persistCurrentUser(user);
      return;
    }

    this.removeStoredUser();
  }

  private setAccessToken(token: string): void {
    this.accessToken = token;
    this.storage?.setItem(this.accessTokenKey, token);
  }

  private clearSession(): void {
    this.accessToken = null;
    this.currentUserState.set(null);
    this.storage?.removeItem(this.accessTokenKey);
    this.removeStoredUser();
  }

  private persistCurrentUser(user: Usuario): void {
    this.storage?.setItem(this.currentUserKey, JSON.stringify(user));
  }

  private removeStoredUser(): void {
    this.storage?.removeItem(this.currentUserKey);
  }

  private readStoredToken(): string | null {
    return this.storage?.getItem(this.accessTokenKey) ?? null;
  }

  private readStoredUser(): Usuario | null {
    const rawUser = this.storage?.getItem(this.currentUserKey);

    if (!rawUser) {
      return null;
    }

    try {
      return JSON.parse(rawUser) as Usuario;
    } catch {
      return null;
    }
  }

  private get storage(): Storage | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return window.localStorage;
  }
}
