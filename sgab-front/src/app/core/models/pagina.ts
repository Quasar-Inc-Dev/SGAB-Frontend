// Formato das listagens paginadas do back (Spring Data)
export interface Pagina<T> {
    content: T[],
    page: {
        size: number,
        number: number,
        totalElements: number,
        totalPages: number
    }
}

export interface ParametrosPagina {
    page?: number,
    size?: number,
    sort?: string
}
