import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Reserva, ReservaRequest } from "../models/reserva";
import { Pagina, ParametrosPagina } from "../models/pagina";
import { buscarTodasPaginas, TAMANHO_MAXIMO_PAGINA } from "../utils/paginacao";



@Injectable({providedIn: 'root'})
export class ReservaService {
    private http = inject(HttpClient)
    private readonly apiUrl = 'http://localhost:8080/';

    // Uma página (mais recentes primeiro)
    listarPagina(params: ParametrosPagina = {}) {
        return this.http.get<Pagina<Reserva>>(this.apiUrl + "api/reservas", { params: { ...params } });
    }

    // Todas as reservas, juntando as páginas
    listar() {
        return buscarTodasPaginas(page => this.listarPagina({ page, size: TAMANHO_MAXIMO_PAGINA }));
    }

    buscarPorId(id: number) {
        return this.http.get<Reserva>(`${this.apiUrl}api/reservas/${id}`);
    }

    reservar(dados: ReservaRequest) {
        return this.http.post<Reserva>(`${this.apiUrl}api/reservas`, null, { params: { ...dados } });
    }

    // Estende o prazo de retirada (dataLimiteRetirada) e soma 1 em renovacoes. Só funcionário/administrador
    renovar(id: number) {
        return this.http.patch<Reserva>(`${this.apiUrl}api/reservas/${id}/renovar`, null);
    }

    cancelar(id: number) {
        return this.http.patch<Reserva>(`${this.apiUrl}api/reservas/${id}/cancelar`, null);
    }
}
