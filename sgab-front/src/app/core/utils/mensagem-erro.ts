import { HttpErrorResponse } from "@angular/common/http";

// O back responde erros em três formatos:
// { erro: "..." } (regra de negócio / 404), { mensagem: "..." } (usuário/login)
// e { campo: "mensagem" } (validação 400).
export function mensagemErro(err: HttpErrorResponse, padrao: string): string {
    const corpo = err.error;
    if (!corpo || typeof corpo !== 'object') return padrao;

    if (typeof corpo.erro === 'string') return corpo.erro;
    if (typeof corpo.mensagem === 'string') return corpo.mensagem;

    if (err.status === 400) {
        const mensagens = Object.entries(corpo)
            .filter(([, msg]) => typeof msg === 'string')
            .map(([campo, msg]) => `${campo}: ${msg}`);
        if (mensagens.length) return mensagens.join(' • ');
    }

    return padrao;
}
