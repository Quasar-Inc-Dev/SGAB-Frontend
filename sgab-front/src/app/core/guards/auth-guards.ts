import { inject, PLATFORM_ID } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import { CanActivateFn, Router } from "@angular/router";
import { auth } from "../auth/auth";


export const authGuard: CanActivateFn = () => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

    const authGuard = inject(auth);
    return authGuard.isAuthenticated() ? true : inject(Router).parseUrl('/')
}

export const funcionarioGuard: CanActivateFn = () => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

    const authService = inject(auth);
    return authService.isFuncionario() ? true : inject(Router).parseUrl('/home')
}

export const leitorGuard: CanActivateFn = () => {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;

    const authService = inject(auth);
    return authService.isLeitor() ? true : inject(Router).parseUrl('/home')
}