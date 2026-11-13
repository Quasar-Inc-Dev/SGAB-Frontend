import { Pipe, PipeTransform } from '@angular/core';

// Exibe o CPF com máscara e oculta os 3 primeiros e os 2 últimos dígitos (padrão LGPD):
// 12345678901 -> ***.456.789-**
export function cpfCensurado(cpf: string | null | undefined): string {
  const d = (cpf ?? '').replace(/\D/g, '');
  if (d.length !== 11) return cpf || '-';
  return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
}

@Pipe({ name: 'cpf' })
export class CpfPipe implements PipeTransform {
  transform(cpf: string | null | undefined): string {
    return cpfCensurado(cpf);
  }
}
