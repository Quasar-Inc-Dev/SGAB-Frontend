import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Emprestimo, EmprestimoRequest } from "../models/emprestimo";



@Injectable({providedIn: 'root'})
export class EmprestimoService {
    private http = inject(HttpClient)
    private readonly apiUrl = 'http://localhost:8080/';

    listar() {
        return this.http.get<Emprestimo[]>(this.apiUrl + "api/emprestimos");
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

    devolver(id: number) {
        return this.http.patch<Emprestimo>(`${this.apiUrl}api/emprestimos/${id}/devolver`, null);
    }
}
