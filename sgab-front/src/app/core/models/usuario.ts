export interface UsuarioResponse {
    id: number,
    cpf: string,
    nome: string,
    email: string,
    tipoUsuario: string,
    statusUsuario: boolean
}

export interface CadastroLeitorRequest {
    cpf: string,
    nome: string,
    email: string,
    senha: string,
    genero: string,
    dataNascimento: string,
    tipoLeitor: string
}
