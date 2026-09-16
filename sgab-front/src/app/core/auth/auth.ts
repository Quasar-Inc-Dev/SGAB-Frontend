import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { tap } from "rxjs";



interface LoginResponse { token: string}

@Injectable({providedIn: 'root'})
export class auth {
    private http = inject(HttpClient);
    private readonly apiUrl = 'http://localhost:8080/login';
    private readonly tokenKey = 'jwt_token'

    login(email: string, senha: string) {
        return this.http.post<LoginResponse>(this.apiUrl, {email, senha}).pipe(
            tap(res => localStorage.setItem(this.tokenKey, res.token))
        );
    }

    getToken(): string | null {
        return localStorage.getItem(this.tokenKey);
    }

    logout(): void {
        localStorage.removeItem(this.tokenKey);
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
}