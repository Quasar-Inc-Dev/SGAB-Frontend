import { Pipe, PipeTransform } from '@angular/core';

const API_URL = 'http://localhost:8080';

// Capas enviadas ficam no back como caminho relativo (/upload/capas/...);
// capas do Google Books, previews locais (blob:) e data URLs já são absolutas.
export function urlCapa(imgUrl: string | null | undefined): string | null {
  if (!imgUrl) return null;
  if (/^(https?:|blob:|data:)/.test(imgUrl)) return imgUrl;
  return API_URL + (imgUrl.startsWith('/') ? '' : '/') + imgUrl;
}

@Pipe({ name: 'capa' })
export class CapaPipe implements PipeTransform {
  transform(imgUrl: string | null | undefined): string | null {
    return urlCapa(imgUrl);
  }
}
