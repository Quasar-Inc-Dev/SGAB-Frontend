import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Leitor, LeitorUpdateRequest } from "../models/usuario";
import { Pagina, ParametrosPagina } from "../models/pagina";
import { buscarTodasPaginas, TAMANHO_MAXIMO_PAGINA } from "../utils/paginacao";



@Injectable({providedIn: 'root'})
export class LeitorService {
    private http = inject(HttpClient)
    private readonly apiUrl = 'http://localhost:8080/';

    // Uma página (nome A→Z)
    listarPagina(params: ParametrosPagina = {}) {
        return this.http.get<Pagina<Leitor>>(this.apiUrl + "api/leitor/leitor/buscar", { params: { ...params } });
    }

    // Todos os leitores, juntando as páginas
    listar() {
        return buscarTodasPaginas(page => this.listarPagina({ page, size: TAMANHO_MAXIMO_PAGINA }));
    }

    editar(id: number, dados: LeitorUpdateRequest) {
        return this.http.put<Leitor>(`${this.apiUrl}api/leitor/leitor/editar/${id}`, dados);
    }

    desativar(id: number) {
        return this.http.delete<void>(`${this.apiUrl}api/leitor/leitor/desativar/${id}`);
    }
}
