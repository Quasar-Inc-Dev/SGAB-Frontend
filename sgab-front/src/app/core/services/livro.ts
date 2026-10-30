import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Exemplar, Livro, LivroIsbnConsulta, LivroRequest } from "../models/livro";



@Injectable({providedIn: 'root'})
export class LivroService {
    private http = inject(HttpClient)
    private readonly apiUrl = 'http://localhost:8080/';

    getAll() {
        return this.http.get<Livro[]>(this.apiUrl + "api/livros")
    }

    atualizar(id: number, dados: LivroRequest) {
        return this.http.put<Livro>(`${this.apiUrl}api/livros/${id}`, dados);
    }

    enviarCapa(id: number, imagem: File) {
        const corpo = new FormData();
        corpo.append('imagem', imagem);
        return this.http.post<Livro>(`${this.apiUrl}api/livros/${id}/capa`, corpo);
    }

    removerCapa(id: number) {
        return this.http.delete<Livro>(`${this.apiUrl}api/livros/${id}/capa`);
    }

    desativarLivro(id: number) {
        return this.http.patch(`${this.apiUrl}api/livros/${id}/desativar`, null);
    }

    excluir(id: number) {
        return this.http.delete<void>(`${this.apiUrl}api/livros/${id}`);
    }

    buscarPorId(id: number) {
        return this.http.get<Livro>(`${this.apiUrl}api/livros/${id}`);
    }

    cadastrar(dados: LivroRequest) {
        return this.http.post<Livro>(`${this.apiUrl}api/livros`, dados);
    }

    buscarPorIsbn(isbn: string) {
        return this.http.get<LivroIsbnConsulta>(`${this.apiUrl}api/livros/isbn/${isbn}`);
    }

    listarExemplares(id: number) {
        return this.http.get<Exemplar[]>(`${this.apiUrl}api/livros/${id}/exemplares`);
    }

    adicionarExemplares(id: number, quantidade: number) {
        return this.http.post<Exemplar[]>(`${this.apiUrl}api/livros/${id}/exemplares`, null, { params: { quantidade } });
    }
}
