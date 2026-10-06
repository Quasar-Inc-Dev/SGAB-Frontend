import { HttpClient } from "@angular/common/http";
import { inject, Injectable, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { tap } from "rxjs";



interface LoginResponse { token: string}

@Injectable({providedIn: 'root'})
export class auth {
    private http = inject(HttpClient);
    private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    private readonly apiUrl = 'http://localhost:8080/login';
    private readonly tokenKey = 'jwt_token'

    login(email: string, senha: string) {
        return this.http.post<LoginResponse>(this.apiUrl, {email, senha}).pipe(
            tap(res => {
                if (this.isBrowser) localStorage.setItem(this.tokenKey, res.token);
            })
        );
    }

    getToken(): string | null {
        if (!this.isBrowser) return null;
        return localStorage.getItem(this.tokenKey);
    }

    logout(): void {
        if (this.isBrowser) localStorage.removeItem(this.tokenKey);
    }

    isAuthenticated(): boolean {
        const token = this.getToken();
        if (!token) return false;
        return !this.isExpired(token);
    }

    private isExpired(token: string) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.exp * 1000 < Date.now();
    }

    getRole(): string | null {
        if (!this.isBrowser) return null;
        const token = this.getToken();

        if (!token) return null;
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.tipoUsuario ?? null;
    }

    isFuncionario(): boolean {
        const role = this.getRole();
        return role === 'ADMINISTRADOR' || role === 'FUNCIONARIO';
    }
}