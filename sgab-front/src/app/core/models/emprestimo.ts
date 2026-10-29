export interface Emprestimo {
    emprestimoId: number,
    exemplarId: number,
    tombo: string,
    livroId: number,
    titulo: string,
    leitorId: number,
    nomeLeitor: string,
    dataEmprestimo: string,
    dataDevolucaoPrevista: string,
    dataDevolucao: string | null,
    statusDevolucao: boolean
}

export interface EmprestimoRequest {
    livroId: number,
    leitorId: number
}
