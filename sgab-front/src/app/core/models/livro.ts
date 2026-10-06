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
    livroStatus: boolean,
    idioma: string,
    area: string,
    paginas: number,
    ano: number,
    genero: string,
    tags: string
    imgUrl: string
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