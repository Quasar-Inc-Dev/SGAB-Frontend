import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Emprestimo, EmprestimoRequest } from "../models/emprestimo";
import { Pagina, ParametrosPagina } from "../models/pagina";
import { buscarTodasPaginas, TAMANHO_MAXIMO_PAGINA } from "../utils/paginacao";
import { tap } from "rxjs";
import { LivroService } from "./livro";



@Injectable({providedIn: 'root'})
export class EmprestimoService {
    private http = inject(HttpClient)
    private livroService = inject(LivroService);
    private readonly apiUrl = 'http://localhost:8080/';

    // Uma página (mais recentes primeiro)
    listarPagina(params: ParametrosPagina = {}) {
        return this.http.get<Pagina<Emprestimo>>(this.apiUrl + "api/emprestimos", { params: { ...params } });
    }

    // Todos os empréstimos, juntando as páginas
    listar() {
        return buscarTodasPaginas(page => this.listarPagina({ page, size: TAMANHO_MAXIMO_PAGINA }));
    }

    buscarPorId(id: number) {
        return this.http.get<Emprestimo>(`${this.apiUrl}api/emprestimos/${id}`);
    }

    solicitar(dados: EmprestimoRequest) {
        return this.http.post<Emprestimo>(`${this.apiUrl}api/emprestimos`, null, { params: { ...dados } });
    }

    renovar(id: number) {
        return this.http.patch<Emprestimo>(`${this.apiUrl}api/emprestimos/${id}/renovar`, null);
    }

    // Libera o exemplar: muda o "disponíveis" dos livros, então limpa o cache da listagem
    devolver(id: number) {
        return this.http.patch<Emprestimo>(`${this.apiUrl}api/emprestimos/${id}/devolver`, null)
            .pipe(tap(() => this.livroService.limparCache()));
    }
}
