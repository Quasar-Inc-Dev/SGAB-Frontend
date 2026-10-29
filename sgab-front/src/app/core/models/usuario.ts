export interface UsuarioResponse {
    id: number,
    cpf: string,
    nome: string,
    email: string,
    tipoUsuario: string,
    statusUsuario: boolean
}

export interface Leitor {
    id: number,
    cpf: string,
    nome: string,
    email: string,
    genero: string,
    dataNascimento: string,
    tipoLeitor: string,
    statusLeitor: boolean
}

export interface LeitorUpdateRequest {
    nome: string,
    genero: string,
    dataNascimento: string,
    tipoLeitor: string
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
