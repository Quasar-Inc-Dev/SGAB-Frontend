export type SolicitacaoTipo = 'EMPRESTIMO' | 'RESERVA';
export type SolicitacaoStatus = 'PENDENTE' | 'AGUARDANDO_RETIRADA' | 'APROVADA' | 'RECUSADA' | 'CANCELADA' | 'EXPIRADA';

export interface Solicitacao {
    solicitacaoId: number,
    tipo: SolicitacaoTipo,
    status: SolicitacaoStatus,
    leitorId: number,
    nomeLeitor: string,
    tipoLeitor: string,
    livroId: number,
    titulo: string,
    exemplarId: number | null,
    tombo: string | null,
    dataSolicitacao: string,
    dataAnalise: string | null,
    nomeAnalista: string | null,
    motivoRecusa: string | null,
    dataLimiteRetirada: string | null,
    dataRetirada: string | null,
    nomeResponsavelRetirada: string | null,
    emprestimoId: number | null,
    reservaId: number | null
}

export interface SolicitacaoFiltro {
    tipo?: SolicitacaoTipo,
    status?: SolicitacaoStatus
}
