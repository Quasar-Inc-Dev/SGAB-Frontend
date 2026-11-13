import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmprestimoService } from '../../../../../core/services/emprestimo';
import { ReservaService } from '../../../../../core/services/reserva';
import { LeitorService } from '../../../../../core/services/leitor';
import { Emprestimo } from '../../../../../core/models/emprestimo';
import { Reserva } from '../../../../../core/models/reserva';
import { Leitor } from '../../../../../core/models/usuario';

interface MesSemestre {
  rotulo: string;      // "Mar"
  rotuloLongo: string; // "Março de 2026"
  emprestimos: number;
  reservas: number;
  atual: boolean;
}

interface ItemPlacar {
  livroId: number;
  titulo: string;
  total: number;
}

type Placar = 'emprestimos' | 'reservas';

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DIA_MS = 86_400_000;

@Component({
  selector: 'app-painel-funcionario',
  imports: [DatePipe, RouterLink],
  templateUrl: './painel-funcionario.html',
  styleUrl: './painel-funcionario.scss',
})
export class PainelFuncionario implements OnInit {
  private emprestimoService = inject(EmprestimoService);
  private reservaService = inject(ReservaService);
  private leitorService = inject(LeitorService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly hoje = new Date();

  emprestimos = signal<Emprestimo[]>([]);
  reservas = signal<Reserva[]>([]);
  leitores = signal<Leitor[]>([]);

  carregandoMovimento = signal(true);
  erroMovimento = signal(false);
  carregandoLeitores = signal(true);
  erroLeitores = signal(false);

  placarAtivo = signal<Placar>('emprestimos');
  mesEmFoco = signal<number | null>(null);

  // Semestre letivo: janeiro–junho ou julho–dezembro do ano atual
  readonly semestre = (() => {
    const ano = this.hoje.getFullYear();
    const primeiroMes = this.hoje.getMonth() < 6 ? 0 : 6;
    return {
      ano,
      primeiroMes,
      inicio: new Date(ano, primeiroMes, 1),
      fim: new Date(ano, primeiroMes + 6, 1),
      rotulo: `${primeiroMes === 0 ? '1º' : '2º'} semestre de ${ano}`,
    };
  })();

  // Semana atual: segunda 00:00 até a segunda seguinte (exclusivo)
  readonly semana = (() => {
    const inicio = new Date(this.hoje.getFullYear(), this.hoje.getMonth(), this.hoje.getDate());
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
    const fim = new Date(inicio.getTime() + 7 * DIA_MS);
    return { inicio, fim, ultimoDia: new Date(fim.getTime() - DIA_MS) };
  })();

  private emprestimosSemestre = computed(() =>
    this.emprestimos().filter(e => this.noSemestre(e.dataEmprestimo))
  );

  private reservasSemestre = computed(() =>
    this.reservas().filter(r => this.noSemestre(r.dataReserva))
  );

  // ---------- Gráfico: empréstimos e reservas por mês ----------

  meses = computed<MesSemestre[]>(() => {
    const { ano, primeiroMes } = this.semestre;
    const lista = Array.from({ length: 6 }, (_, i) => {
      const mes = primeiroMes + i;
      return {
        rotulo: MESES[mes].slice(0, 3),
        rotuloLongo: `${MESES[mes]} de ${ano}`,
        emprestimos: 0,
        reservas: 0,
        atual: mes === this.hoje.getMonth(),
      };
    });

    for (const e of this.emprestimosSemestre()) lista[new Date(e.dataEmprestimo).getMonth() - primeiroMes].emprestimos++;
    for (const r of this.reservasSemestre()) lista[new Date(r.dataReserva).getMonth() - primeiroMes].reservas++;
    return lista;
  });

  totalEmprestimos = computed(() => this.emprestimosSemestre().length);
  totalReservas = computed(() => this.reservasSemestre().length);

  // Eixo com valores redondos: passo 1, 2 ou 5 × 10^n, 4 divisões
  eixo = computed(() => {
    const maior = Math.max(1, ...this.meses().flatMap(m => [m.emprestimos, m.reservas]));
    const bruto = maior / 4;
    const potencia = 10 ** Math.floor(Math.log10(bruto));
    const passo = Math.max(1, [1, 2, 5, 10].map(f => f * potencia).find(p => p >= bruto) ?? potencia * 10);
    const topo = Math.ceil(maior / passo) * passo;
    const marcas: number[] = [];
    for (let v = 0; v <= topo; v += passo) marcas.push(v);
    return { topo, marcas };
  });

  altura(valor: number): number {
    return (valor / this.eixo().topo) * 100;
  }

  // ---------- Placar: livros mais emprestados / reservados no semestre ----------

  private montarPlacar(itens: { livroId: number; titulo: string }[]): ItemPlacar[] {
    const contagem = new Map<number, ItemPlacar>();
    for (const item of itens) {
      const atual = contagem.get(item.livroId) ?? { livroId: item.livroId, titulo: item.titulo, total: 0 };
      atual.total++;
      contagem.set(item.livroId, atual);
    }
    return [...contagem.values()]
      .sort((a, b) => b.total - a.total || a.titulo.localeCompare(b.titulo))
      .slice(0, 5);
  }

  maisEmprestados = computed(() => this.montarPlacar(this.emprestimosSemestre()));
  maisReservados = computed(() => this.montarPlacar(this.reservasSemestre()));

  placar = computed(() => this.placarAtivo() === 'emprestimos' ? this.maisEmprestados() : this.maisReservados());
  maiorDoPlacar = computed(() => Math.max(1, ...this.placar().map(i => i.total)));

  // ---------- Prazos de devolução que vencem nesta semana ----------

  vencendoNaSemana = computed(() =>
    this.emprestimos()
      .filter(e => !this.devolvido(e))
      .filter(e => {
        const prazo = new Date(e.dataDevolucaoPrevista);
        return prazo >= this.semana.inicio && prazo < this.semana.fim;
      })
      .sort((a, b) => new Date(a.dataDevolucaoPrevista).getTime() - new Date(b.dataDevolucaoPrevista).getTime())
  );

  // Atrasados de semanas anteriores: não entram na lista, mas são avisados no card
  atrasadosAnteriores = computed(() =>
    this.emprestimos().filter(e => !this.devolvido(e) && new Date(e.dataDevolucaoPrevista) < this.semana.inicio).length
  );

  situacaoPrazo(e: Emprestimo): 'atrasado' | 'hoje' | 'semana' {
    const prazo = new Date(e.dataDevolucaoPrevista);
    if (prazo < this.hoje) return 'atrasado';
    return prazo.toDateString() === this.hoje.toDateString() ? 'hoje' : 'semana';
  }

  // ---------- Usuários cadastrados recentemente ----------

  // O back ainda não envia a data de cadastro; o id é sequencial, então id maior = cadastro mais recente
  leitoresRecentes = computed(() => [...this.leitores()].sort((a, b) => b.id - a.id).slice(0, 6));

  ngOnInit(): void {
    if (!this.isBrowser) return;

    let pendentes = 2;
    const concluir = () => { if (--pendentes === 0) this.carregandoMovimento.set(false); };
    const falhar = () => { this.erroMovimento.set(true); concluir(); };

    this.emprestimoService.listar().subscribe({
      next: (lista) => { this.emprestimos.set(lista); concluir(); },
      error: falhar,
    });
    this.reservaService.listar().subscribe({
      next: (lista) => { this.reservas.set(lista); concluir(); },
      error: falhar,
    });

    this.leitorService.listar().subscribe({
      next: (lista) => {
        this.leitores.set(lista);
        this.carregandoLeitores.set(false);
      },
      error: () => {
        this.erroLeitores.set(true);
        this.carregandoLeitores.set(false);
      },
    });
  }

  diaSemana(data: string): string {
    return DIAS_SEMANA[new Date(data).getDay()];
  }

  rotulo(valor: string): string {
    if (!valor) return '-';
    return valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
  }

  private noSemestre(data: string | null | undefined): boolean {
    if (!data) return false;
    const d = new Date(data);
    return d >= this.semestre.inicio && d < this.semestre.fim;
  }

  private devolvido(e: Emprestimo): boolean {
    return e.statusDevolucao || !!e.dataDevolucao;
  }
}
