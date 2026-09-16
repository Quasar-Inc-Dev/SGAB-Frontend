import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { auth } from "../auth/auth";


export const authGuard: CanActivateFn = () => {
    const authGuard = inject(auth);
    return authGuard.isAuthenticated() ? true : inject(Router).parseUrl('/login')
}