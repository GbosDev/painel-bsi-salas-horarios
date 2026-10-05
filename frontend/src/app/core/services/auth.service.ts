import {HttpClient} from '@angular/common/http';
import {Injectable, computed, signal} from '@angular/core';
import {Observable, map} from 'rxjs';
import {environment} from '../../../environments/environment';
import {LoginRequest, Session} from '../models/auth.model';

const STORAGE_KEY = 'bussola_session_v2';

/**
 * Replaces the legacy auth.js: credentials are verified by the backend,
 * a signed JWT is stored (not a trusted-by-default session object), and
 * every subsequent request carries it via the auth interceptor.
 */
@Injectable({providedIn: 'root'})
export class AuthService {
    private readonly sessionSignal = signal<Session | null>(this.readFromStorage());

    readonly session = computed(() => this.sessionSignal());
    readonly isAuthenticated = computed(() => this.sessionSignal() !== null);
    readonly isProfessor = computed(() => this.sessionSignal()?.role === 'PROFESSOR');
    readonly isAluno = computed(() => this.sessionSignal()?.role === 'ALUNO');

    constructor(private readonly http: HttpClient) {
    }

    login(request: LoginRequest): Observable<Session> {
        return this.http.post<Omit<Session, 'issuedAt'>>(`${environment.apiBaseUrl}/auth/login`, request).pipe(
            map((response) => {
                const session

                    : Session = {...response, issuedAt: Date.now()};
                this.sessionSignal.set(session);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
                return session;
            })
        );
    }

    logout(): void {
        this.sessionSignal.set(null);
        localStorage.removeItem(STORAGE_KEY);
    }

    currentToken(): string | null {
        return this.sessionSignal()?.token ?? null;
    }

    private readFromStorage(): Session | null {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return null;
            const parsed = JSON.parse(raw) as Session;
            const expiresAt = parsed.issuedAt + parsed.expiresInSeconds * 1000;
            if (Date.now() >= expiresAt) {
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }
            return parsed;
        } catch {
            return null;
        }
    }
}