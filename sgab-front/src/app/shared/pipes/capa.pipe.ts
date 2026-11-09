import { Pipe, PipeTransform } from '@angular/core';

// S = miniatura (listas), M = média (grade do acervo), L = grande (detalhes do livro)
export type TamanhoCapa = 'S' | 'M' | 'L';

// O back já devolve a URL completa: Supabase Storage para as capas enviadas,
// ou a URL externa (Google Books / Open Library). Previews locais são blob:.
// Caminhos relativos antigos (/upload/...) não existem mais e são ignorados.
export function urlCapa(imgUrl: string | null | undefined, tamanho: TamanhoCapa = 'L'): string | null {
  if (!imgUrl || !/^(https?:|blob:|data:)/.test(imgUrl)) return null;
  return ajustarTamanho(imgUrl, tamanho);
}

// Open Library oferece a mesma capa em 3 tamanhos (-S, -M, -L); a grande pode passar de 100 KB.
// Nas listas, pedir a versão menor reduz bastante o volume baixado.
function ajustarTamanho(url: string, tamanho: TamanhoCapa): string {
  if (url.includes('covers.openlibrary.org')) {
    return url.replace(/-[SML]\.jpg(\?.*)?$/, `-${tamanho}.jpg$1`);
  }
  return url;
}

@Pipe({ name: 'capa' })
export class CapaPipe implements PipeTransform {
  transform(imgUrl: string | null | undefined, tamanho: TamanhoCapa = 'L'): string | null {
    return urlCapa(imgUrl, tamanho);
  }
}
