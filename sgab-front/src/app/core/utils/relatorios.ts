// Funções puras usadas pela tela de relatórios: períodos, contagens e exportação.

export interface ItemContagem {
    rotulo: string,
    total: number
}

export type Periodo = 'semestre' | 'ano' | 'tudo';

export interface IntervaloPeriodo {
    inicio: Date | null,   // null = sem limite
    fim: Date | null,
    rotulo: string
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function nomeMes(indice: number): string {
    return MESES[indice];
}

// Semestre letivo: janeiro–junho ou julho–dezembro
export function intervaloPeriodo(periodo: Periodo, hoje = new Date()): IntervaloPeriodo {
    const ano = hoje.getFullYear();
    if (periodo === 'semestre') {
        const primeiroMes = hoje.getMonth() < 6 ? 0 : 6;
        return {
            inicio: new Date(ano, primeiroMes, 1),
            fim: new Date(ano, primeiroMes + 6, 1),
            rotulo: `${primeiroMes === 0 ? '1º' : '2º'} semestre de ${ano}`,
        };
    }
    if (periodo === 'ano') {
        return { inicio: new Date(ano, 0, 1), fim: new Date(ano + 1, 0, 1), rotulo: `Ano de ${ano}` };
    }
    return { inicio: null, fim: null, rotulo: 'Todo o período' };
}

export function dentroDoIntervalo(data: string | null | undefined, intervalo: IntervaloPeriodo): boolean {
    if (!data) return false;
    const d = new Date(data);
    if (intervalo.inicio && d < intervalo.inicio) return false;
    if (intervalo.fim && d >= intervalo.fim) return false;
    return true;
}

// Conta ocorrências por chave. A chave pode devolver vários valores (ex.: tags de um livro).
// Ignora valores vazios e agrupa sem diferenciar maiúsculas/minúsculas.
export function contarPor<T>(itens: T[], chave: (item: T) => string | string[] | null | undefined): ItemContagem[] {
    const mapa = new Map<string, ItemContagem>();
    for (const item of itens) {
        const valores = chave(item);
        const lista = Array.isArray(valores) ? valores : [valores];
        for (const bruto of lista) {
            const valor = (bruto ?? '').trim();
            if (!valor) continue;
            const id = valor.toLocaleLowerCase('pt-BR');
            const atual = mapa.get(id) ?? { rotulo: valor, total: 0 };
            atual.total++;
            mapa.set(id, atual);
        }
    }
    return [...mapa.values()].sort((a, b) => b.total - a.total || a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
}

// "programação, boas práticas" -> ["programação", "boas práticas"]
export function separarTags(tags: string | null | undefined): string[] {
    return (tags ?? '').split(',').map(t => t.trim()).filter(Boolean);
}

export function faixaEtaria(dataNascimento: string | null | undefined, hoje = new Date()): string {
    if (!dataNascimento) return 'Não informada';
    const nascimento = new Date(dataNascimento);
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const fezAniversario = hoje.getMonth() > nascimento.getMonth()
        || (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() >= nascimento.getDate());
    if (!fezAniversario) idade--;

    if (idade < 18) return 'Até 17 anos';
    if (idade < 25) return '18 a 24 anos';
    if (idade < 35) return '25 a 34 anos';
    if (idade < 50) return '35 a 49 anos';
    return '50 anos ou mais';
}

export const ORDEM_FAIXAS = ['Até 17 anos', '18 a 24 anos', '25 a 34 anos', '35 a 49 anos', '50 anos ou mais', 'Não informada'];

export function rotuloEnum(valor: string | null | undefined): string {
    if (!valor) return '-';
    const texto = valor.replace(/_/g, ' ').toLowerCase();
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function formatarData(data: string | null | undefined): string {
    if (!data) return '';
    const d = new Date(data);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

// CSV no formato do Excel em português: separador ";", UTF-8 com BOM (acentos certos)
export function baixarCsv(nomeArquivo: string, cabecalho: string[], linhas: (string | number | null | undefined)[][]): void {
    const escapar = (valor: string | number | null | undefined) => {
        const texto = valor === null || valor === undefined ? '' : String(valor);
        return /[";\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
    };
    const conteudo = [cabecalho, ...linhas].map(linha => linha.map(escapar).join(';')).join('\r\n');
    const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nomeArquivo;
    link.click();
    URL.revokeObjectURL(url);
}
