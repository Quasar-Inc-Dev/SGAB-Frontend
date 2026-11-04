import { Pipe, PipeTransform } from '@angular/core';

const API_URL = 'http://localhost:8080';

// S = miniatura (listas), M = média (grade do acervo), L = grande (detalhes do livro)
export type TamanhoCapa = 'S' | 'M' | 'L';

// Capas enviadas ficam no back como caminho relativo (/upload/capas/...);
// capas do Google Books, previews locais (blob:) e data URLs já são absolutas.
export function urlCapa(imgUrl: string | null | undefined, tamanho: TamanhoCapa = 'L'): string | null {
  if (!imgUrl) return null;
  if (/^(https?:|blob:|data:)/.test(imgUrl)) return ajustarTamanho(imgUrl, tamanho);
  return API_URL + (imgUrl.startsWith('/') ? '' : '/') + imgUrl;
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
