import { forkJoin, map, Observable, of, switchMap } from "rxjs";
import { Pagina } from "../models/pagina";

// Maior página que o back aceita
export const TAMANHO_MAXIMO_PAGINA = 100;

// Busca a primeira página e, se houver mais, pede as restantes em paralelo,
// devolvendo todos os itens numa lista só, na ordem do back.
// Usado pelas telas que filtram e buscam no navegador e precisam da lista completa.
export function buscarTodasPaginas<T>(buscarPagina: (page: number) => Observable<Pagina<T>>): Observable<T[]> {
    return buscarPagina(0).pipe(
        switchMap(primeira => {
            const totalPaginas = primeira.page?.totalPages ?? 1;
            if (totalPaginas <= 1) return of(primeira.content);

            const restantes = Array.from({ length: totalPaginas - 1 }, (_, i) => buscarPagina(i + 1));
            return forkJoin(restantes).pipe(
                map(paginas => [primeira, ...paginas].flatMap(p => p.content))
            );
        })
    );
}
