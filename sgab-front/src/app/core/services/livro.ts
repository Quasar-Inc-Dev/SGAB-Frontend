import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Livro, LivroIsbnConsulta } from "../models/livro";



@Injectable({providedIn: 'root'})
export class LivroService {
    private http = inject(HttpClient)
    private readonly apiUrl = 'http://localhost:8080/';

    getAll() {
        return this.http.get<Livro[]>(this.apiUrl + "api/livros")
    }

    atualizar(id: number, dados: Partial<Livro>) {
        return this.http.put<Livro>(`${this.apiUrl}api/livros/${id}`, dados);
    }

    atualizarCapa(id: number, arquivo: File) {
        const corpo = new FormData();
        corpo.append('arquivo', arquivo);
        return this.http.put<Livro>(`${this.apiUrl}api/livros/${id}/capa`, corpo);
    }

    desativarLivro(id: number) {
        return this.http.patch(`${this.apiUrl}api/livros/desativar/${id}`, null);
    }

    cadastrar(dados: Partial<Livro>) {
        return this.http.post<Livro>(`${this.apiUrl}api/livros`, dados);
    }

    buscarPorIsbn(isbn: string) {
        return this.http.get<LivroIsbnConsulta>(`${this.apiUrl}api/livros/isbn/${isbn}`);
    }
}
