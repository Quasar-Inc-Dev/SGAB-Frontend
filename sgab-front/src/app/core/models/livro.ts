export type LivroStatus = 'ATIVO' | 'INATIVO';

export interface Livro {
    livroId: number,
    pha: string,
    dewey: string,
    isbn: string,
    titulo: string,
    subtitulo: string,
    descricao: string,
    autor: string,
    editora: string,
    livroStatus: LivroStatus,
    idioma: string,
    area: string,
    paginas: number,
    ano: number,
    genero: string,
    tags: string
    imgUrl: string,
    totalExemplares: number,
    exemplaresDisponiveis: number
}

export type LivroRequest = Partial<Omit<Livro, 'livroId' | 'totalExemplares' | 'exemplaresDisponiveis'>> & {
    quantidadeExemplares?: number
}

export interface LivroIsbnConsulta {
    isbn: string,
    titulo: string,
    subtitulo: string,
    descricao: string,
    autor: string,
    editora: string,
    idioma: string,
    paginas: number,
    ano: number,
    genero: string
}

export type ExemplarStatus = 'DISPONIVEL' | 'EMPRESTADO' | 'RESERVADO' | 'MANUTENCAO' | 'EXTRAVIADO';

export interface Exemplar {
    exemplarId: number,
    livroId: number,
    tombo: string,
    localizacao: string | null,
    status: ExemplarStatus,
    dataAquisicao: string
}
