import { HttpInterceptorFn } from "@angular/common/http";
import { auth } from "../auth/auth";
import { inject } from "@angular/core";



export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = inject(auth).getToken();
    if (!token) return next(req);

    return next(req.clone({setHeaders: {Authorization: `Bearer ${token}`}}));
}