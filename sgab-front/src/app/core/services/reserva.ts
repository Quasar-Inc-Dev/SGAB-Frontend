import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Reserva, ReservaRequest } from "../models/reserva";



@Injectable({providedIn: 'root'})
export class ReservaService {
    private http = inject(HttpClient)
    private readonly apiUrl = 'http://localhost:8080/';

    listar() {
        return this.http.get<Reserva[]>(this.apiUrl + "api/reservas");
    }

    buscarPorId(id: number) {
        return this.http.get<Reserva>(`${this.apiUrl}api/reservas/${id}`);
    }

    reservar(dados: ReservaRequest) {
        return this.http.post<Reserva>(`${this.apiUrl}api/reservas`, null, { params: { ...dados } });
    }

    cancelar(id: number) {
        return this.http.patch<Reserva>(`${this.apiUrl}api/reservas/${id}/cancelar`, null);
    }
}
