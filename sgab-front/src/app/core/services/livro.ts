import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { catchError, MonoTypeOperatorFunction, Observable, shareReplay, tap, throwError } from "rxjs";
import { Exemplar, Livro, LivroIsbnConsulta, LivroRequest } from "../models/livro";
import { Pagina, ParametrosPagina } from "../models/pagina";
import { buscarTodasPaginas, TAMANHO_MAXIMO_PAGINA } from "../utils/paginacao";



@Injectable({providedIn: 'root'})
export class LivroService {
    private http = inject(HttpClient)
    private readonly apiUrl = 'http://localhost:8080/';

    // Cache da listagem: home e acervo usam a mesma lista, então voltar para essas telas
    // não baixa tudo de novo. Expira sozinho (a disponibilidade muda com empréstimos)
    // e é limpo em qualquer alteração de livro feita pelo próprio sistema.
    private readonly validadeCacheMs = 60_000;
    private cacheLivros$: Observable<Livro[]> | null = null;
    private cacheExpiraEm = 0;

    // Uma página (título A→Z). sort aceita, por exemplo, "titulo,asc" ou "ano,desc"
    listarPagina(params: ParametrosPagina = {}) {
        return this.http.get<Pagina<Livro>>(this.apiUrl + "api/livros", { params: { ...params } });
    }

    // Todos os livros, juntando as páginas (home e acervo filtram no navegador)
    getAll() {
        if (!this.cacheLivros$ || Date.now() > this.cacheExpiraEm) {
            this.cacheExpiraEm = Date.now() + this.validadeCacheMs;
            this.cacheLivros$ = buscarTodasPaginas(page => this.listarPagina({ page, size: TAMANHO_MAXIMO_PAGINA })).pipe(
                // Se a requisição falhar, não guarda o erro: a próxima chamada tenta de novo
                catchError(err => {
                    this.limparCache();
                    return throwError(() => err);
                }),
                shareReplay(1)
            );
        }
        return this.cacheLivros$;
    }

    limparCache() {
        this.cacheLivros$ = null;
    }

    atualizar(id: number, dados: LivroRequest) {
        return this.http.put<Livro>(`${this.apiUrl}api/livros/${id}`, dados).pipe(this.invalidaCache());
    }

    enviarCapa(id: number, imagem: File) {
        const corpo = new FormData();
        corpo.append('imagem', imagem);
        return this.http.post<Livro>(`${this.apiUrl}api/livros/${id}/capa`, corpo).pipe(this.invalidaCache());
    }

    removerCapa(id: number) {
        return this.http.delete<Livro>(`${this.apiUrl}api/livros/${id}/capa`).pipe(this.invalidaCache());
    }

    desativarLivro(id: number) {
        return this.http.patch(`${this.apiUrl}api/livros/${id}/desativar`, null).pipe(this.invalidaCache());
    }

    excluir(id: number) {
        return this.http.delete<void>(`${this.apiUrl}api/livros/${id}`).pipe(this.invalidaCache());
    }

    buscarPorId(id: number) {
        return this.http.get<Livro>(`${this.apiUrl}api/livros/${id}`);
    }

    cadastrar(dados: LivroRequest) {
        return this.http.post<Livro>(`${this.apiUrl}api/livros`, dados).pipe(this.invalidaCache());
    }

    buscarPorIsbn(isbn: string) {
        return this.http.get<LivroIsbnConsulta>(`${this.apiUrl}api/livros/isbn/${isbn}`);
    }

    listarExemplares(id: number) {
        return this.http.get<Exemplar[]>(`${this.apiUrl}api/livros/${id}/exemplares`);
    }

    adicionarExemplares(id: number, quantidade: number) {
        return this.http.post<Exemplar[]>(`${this.apiUrl}api/livros/${id}/exemplares`, null, { params: { quantidade } })
            .pipe(this.invalidaCache());
    }

    private invalidaCache<T>(): MonoTypeOperatorFunction<T> {
        return tap(() => this.limparCache());
    }
}
