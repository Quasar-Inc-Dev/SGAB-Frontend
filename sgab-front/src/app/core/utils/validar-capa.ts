// Checagem rápida no navegador para dar feedback antes do envio.
// Quem garante de verdade é o back, que confere o conteúdo real do arquivo.
export const TIPOS_CAPA = ['image/jpeg', 'image/png', 'image/webp'];
export const TAMANHO_MAXIMO_CAPA = 5 * 1024 * 1024;

export function validarCapa(arquivo: File): string | null {
    if (!TIPOS_CAPA.includes(arquivo.type)) return 'A capa precisa ser uma imagem JPG, PNG ou WEBP.';
    if (arquivo.size > TAMANHO_MAXIMO_CAPA) return 'A imagem precisa ter no máximo 5 MB.';
    return null;
}
