import { Component, computed, input } from '@angular/core';
import { ItemContagem } from '../../../../../core/utils/relatorios';

// Ranking em barras horizontais (uma série só: o título já diz o que é medido, sem legenda)
@Component({
  selector: 'app-lista-barras',
  template: `
    <section class="rounded-xl border border-gray-100 p-4">
      <h3 class="text-sm font-semibold text-gray-900">{{ titulo() }}</h3>
      @if (subtitulo()) {
        <p class="text-xs text-gray-500">{{ subtitulo() }}</p>
      }

      <ol class="mt-3 flex flex-col gap-2.5">
        @for (item of visiveis(); track item.rotulo) {
          <li [attr.aria-label]="item.rotulo + ': ' + item.total">
            <div class="flex items-baseline justify-between gap-3 text-xs">
              <span class="truncate text-gray-700" [title]="item.rotulo">{{ item.rotulo }}</span>
              <span class="shrink-0 font-semibold tabular-nums text-gray-900">
                {{ item.total }}
                @if (total() > 0) {
                  <span class="font-normal text-gray-500">({{ percentual(item.total) }}%)</span>
                }
              </span>
            </div>
            <div class="trilho mt-1 h-2 w-full rounded-full">
              <div class="barra h-2 rounded-full" [style.width.%]="(item.total / maior()) * 100"></div>
            </div>
          </li>
        } @empty {
          <li class="py-4 text-center text-xs text-gray-500">{{ vazio() }}</li>
        }
      </ol>
    </section>
  `,
  styles: `
    .trilho { background-color: #cde2fb; }
    .barra { background-color: #2a78d6; }
  `,
})
export class ListaBarras {
  titulo = input.required<string>();
  subtitulo = input('');
  itens = input.required<ItemContagem[]>();
  limite = input(8);
  vazio = input('Sem dados no período.');

  visiveis = computed(() => this.itens().slice(0, this.limite()));
  maior = computed(() => Math.max(1, ...this.visiveis().map(i => i.total)));
  // Percentual sobre o total de todos os itens (não só dos visíveis)
  total = computed(() => this.itens().reduce((soma, i) => soma + i.total, 0));

  percentual(valor: number): string {
    return ((valor / this.total()) * 100).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  }
}
