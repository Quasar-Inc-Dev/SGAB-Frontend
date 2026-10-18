import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { CadastroLeitorRequest, UsuarioResponse } from "../models/usuario";



@Injectable({providedIn: 'root'})
export class UsuarioService {
    private http = inject(HttpClient)
    private readonly apiUrl = 'http://localhost:8080/';

    buscarMeusDados() {
        return this.http.get<UsuarioResponse>(this.apiUrl + "api/usuario/usuarios/me");
    }

    cadastrarLeitor(dados: CadastroLeitorRequest) {
        return this.http.post<UsuarioResponse>(this.apiUrl + "api/usuario/usuarios/cadastro/leitor", dados);
    }
}
