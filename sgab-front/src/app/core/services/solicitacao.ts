import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { MonoTypeOperatorFunction, tap } from "rxjs";
import { Solicitacao, SolicitacaoFiltro } from "../models/solicitacao";
import { LivroService } from "./livro";



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

    minhas() {
        return this.http.get<Solicitacao[]>(`${this.apiUrl}api/solicitacoes/minhas`);
    }

    cancelar(id: number) {
        return this.http.patch<Solicitacao>(`${this.apiUrl}api/solicitacoes/${id}/cancelar`, null).pipe(this.atualizaDisponibilidade());
    }

    // Funcionário / administrador

    listar(filtro: SolicitacaoFiltro = {}) {
        return this.http.get<Solicitacao[]>(`${this.apiUrl}api/solicitacoes`, { params: { ...filtro } });
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
