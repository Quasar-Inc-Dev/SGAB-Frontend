import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Leitor, LeitorUpdateRequest } from "../models/usuario";



@Injectable({providedIn: 'root'})
export class LeitorService {
    private http = inject(HttpClient)
    private readonly apiUrl = 'http://localhost:8080/';

    listar() {
        return this.http.get<Leitor[]>(this.apiUrl + "api/leitor/leitor/buscar");
    }

    editar(id: number, dados: LeitorUpdateRequest) {
        return this.http.put<Leitor>(`${this.apiUrl}api/leitor/leitor/editar/${id}`, dados);
    }

    desativar(id: number) {
        return this.http.delete<void>(`${this.apiUrl}api/leitor/leitor/desativar/${id}`);
    }
}
