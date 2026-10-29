import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Solicitacao, SolicitacaoFiltro } from "../models/solicitacao";



@Injectable({providedIn: 'root'})
export class SolicitacaoService {
    private http = inject(HttpClient)
    private readonly apiUrl = 'http://localhost:8080/';

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
        return this.http.patch<Solicitacao>(`${this.apiUrl}api/solicitacoes/${id}/cancelar`, null);
    }

    // Funcionário / administrador

    listar(filtro: SolicitacaoFiltro = {}) {
        return this.http.get<Solicitacao[]>(`${this.apiUrl}api/solicitacoes`, { params: { ...filtro } });
    }

    aprovar(id: number) {
        return this.http.patch<Solicitacao>(`${this.apiUrl}api/solicitacoes/${id}/aprovar`, null);
    }

    confirmarRetirada(id: number) {
        return this.http.patch<Solicitacao>(`${this.apiUrl}api/solicitacoes/${id}/confirmar-retirada`, null);
    }

    recusar(id: number, motivo?: string) {
        return this.http.patch<Solicitacao>(`${this.apiUrl}api/solicitacoes/${id}/recusar`, motivo ? { motivo } : null);
    }
}
