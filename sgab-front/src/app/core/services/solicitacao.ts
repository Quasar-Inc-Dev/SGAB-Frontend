import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { MonoTypeOperatorFunction, tap } from "rxjs";
import { Solicitacao, SolicitacaoFiltro } from "../models/solicitacao";
import { LivroService } from "./livro";
import { Pagina } from "../models/pagina";
import { buscarTodasPaginas, TAMANHO_MAXIMO_PAGINA } from "../utils/paginacao";



@Injectable({providedIn: 'root'})
export class SolicitacaoService {
    private http = inject(HttpClient)
    private livroService = inject(LivroService);
    private readonly apiUrl = 'http://localhost:8080/';

    // Aprovar, confirmar retirada e cancelar mudam quantos exemplares estão disponíveis
    private atualizaDisponibilidade<T>(): MonoTypeOperatorFunction<T> {
        return tap(() => this.livroService.limparCache());
    }

    // Leitor

    solicitarEmprestimo(livroId: number) {
        return this.http.post<Solicitacao>(`${this.apiUrl}api/solicitacoes/emprestimo`, null, { params: { livroId } });
    }

    solicitarReserva(exemplarId: number) {
        return this.http.post<Solicitacao>(`${this.apiUrl}api/solicitacoes/reserva`, null, { params: { exemplarId } });
    }

    // Ordem fixa no back (mais recentes primeiro): aqui só page e size valem
    minhasPagina(page = 0, size = 20) {
        return this.http.get<Pagina<Solicitacao>>(`${this.apiUrl}api/solicitacoes/minhas`, { params: { page, size } });
    }

    minhas() {
        return buscarTodasPaginas(page => this.minhasPagina(page, TAMANHO_MAXIMO_PAGINA));
    }

    cancelar(id: number) {
        return this.http.patch<Solicitacao>(`${this.apiUrl}api/solicitacoes/${id}/cancelar`, null).pipe(this.atualizaDisponibilidade());
    }

    // Funcionário / administrador

    // Ordem fixa no back (mais antigas primeiro): aqui só page, size e os filtros valem
    listarPagina(filtro: SolicitacaoFiltro = {}, page = 0, size = 20) {
        return this.http.get<Pagina<Solicitacao>>(`${this.apiUrl}api/solicitacoes`, { params: { ...filtro, page, size } });
    }

    listar(filtro: SolicitacaoFiltro = {}) {
        return buscarTodasPaginas(page => this.listarPagina(filtro, page, TAMANHO_MAXIMO_PAGINA));
    }

    aprovar(id: number) {
        return this.http.patch<Solicitacao>(`${this.apiUrl}api/solicitacoes/${id}/aprovar`, null).pipe(this.atualizaDisponibilidade());
    }

    confirmarRetirada(id: number) {
        return this.http.patch<Solicitacao>(`${this.apiUrl}api/solicitacoes/${id}/confirmar-retirada`, null).pipe(this.atualizaDisponibilidade());
    }

    recusar(id: number, motivo?: string) {
        return this.http.patch<Solicitacao>(`${this.apiUrl}api/solicitacoes/${id}/recusar`, motivo ? { motivo } : null);
    }
}
