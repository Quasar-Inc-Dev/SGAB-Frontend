export type ReservaStatus = 'ATIVA' | 'AGUARDANDO_RETIRADA' | 'ATENDIDA' | 'CANCELADA';

export interface Reserva {
    reservaId: number,
    livroId: number,
    titulo: string,
    leitorId: number,
    nomeLeitor: string,
    dataReserva: string,
    status: ReservaStatus,
    exemplarId: number | null,
    tombo: string | null,
    dataLimiteRetirada: string | null
}

export interface ReservaRequest {
    livroId: number,
    leitorId: number
}
