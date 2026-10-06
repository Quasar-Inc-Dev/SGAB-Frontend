import { inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { CanActivateFn, Router } from "@angular/router";
import { auth } from "../auth/auth";


export const authGuard: CanActivateFn = () => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

    const authGuard = inject(auth);
    return authGuard.isAuthenticated() ? true : inject(Router).parseUrl('/')
}