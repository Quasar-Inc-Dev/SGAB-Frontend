import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { forkJoin } from 'rxjs';
import { Header } from '../../../../shared/header/header';
import { Footer } from '../../../../shared/footer/footer';
import { EmprestimoService } from '../../../../core/services/emprestimo';
import { ReservaService } from '../../../../core/services/reserva';
import { LivroService } from '../../../../core/services/livro';
import { LeitorService } from '../../../../core/services/leitor';
import { Emprestimo } from '../../../../core/models/emprestimo';
import { Reserva } from '../../../../core/models/reserva';
import { Livro } from '../../../../core/models/livro';
import { Leitor } from '../../../../core/models/usuario';
import {
  baixarCsv, contarPor, dentroDoIntervalo, faixaEtaria, formatarData, intervaloPeriodo,
  nomeMes, ORDEM_FAIXAS, Periodo, rotuloEnum, separarTags,
} from '../../../../core/utils/relatorios';
import { ListaBarras } from './lista-barras/lista-barras';

type Aba = 'movimento' | 'livros' | 'perfil';
type SituacaoEmprestimo = 'Em andamento' | 'Atrasado' | 'Devolvido' | 'Devolvido com atraso';
type OrdenacaoLivros = 'total' | 'emprestimos' | 'reservas';

// Cada empréstimo ou reserva conta como um sinal de interesse do leitor por aquele livro
interface Interacao {
  leitorId: number;
  livro: Livro | undefined;
  tipo: 'emprestimo' | 'reserva';
  data: string;
}

interface ResumoGrupo {
  grupo: string;
  cadastrados: number;
  ativos: number;
  interacoes: number;
  media: string;
  generoFavorito: string;
  areaFavorita: string;
}

interface PerfilLeitor {
  leitorId: number;
  nome: string;
  tipo: string;
  faixa: string;
  emprestimos: number;
  reservas: number;
  generoFavorito: string;
  areaFavorita: string;
  assuntos: string[];
  atrasos: number;
  ultimaAtividade: string | null;
}

@Component({
  selector: 'app-relatorios',
  imports: [Header, Footer, DatePipe, ListaBarras],
  templateUrl: './relatorios.html',
  styleUrl: './relatorios.scss',
})
export class Relatorios implements OnInit {
  private emprestimoService = inject(EmprestimoService);
  private reservaService = inject(ReservaService);
  private livroService = inject(LivroService);
  private leitorService = inject(LeitorService);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly hoje = new Date();

  aba = signal<Aba>('movimento');
  carregando = signal(true);
  erro = signal(false);

  emprestimos = signal<Emprestimo[]>([]);
  reservas = signal<Reserva[]>([]);
  livros = signal<Livro[]>([]);
  leitores = signal<Leitor[]>([]);

  private livrosPorId = computed(() => new Map(this.livros().map(l => [l.livroId, l])));
  private leitoresPorId = computed(() => new Map(this.leitores().map(l => [l.id, l])));

  ngOnInit(): void {
    if (!this.isBrowser) return;

    forkJoin({
      emprestimos: this.emprestimoService.listar(),
      reservas: this.reservaService.listar(),
      livros: this.livroService.getAll(),
      leitores: this.leitorService.listar(),
    }).subscribe({
      next: (dados) => {
        this.emprestimos.set(dados.emprestimos);
        this.reservas.set(dados.reservas);
        this.livros.set(dados.livros);
        this.leitores.set(dados.leitores);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }

  imprimir(): void {
    window.print();
  }

  rotulo = rotuloEnum;

  // ================= Relatório 1: movimento do semestre =================

  readonly semestre = intervaloPeriodo('semestre', this.hoje);

  emprestimosSemestre = computed(() =>
    this.emprestimos()
      .filter(e => dentroDoIntervalo(e.dataEmprestimo, this.semestre))
      .sort((a, b) => new Date(b.dataEmprestimo).getTime() - new Date(a.dataEmprestimo).getTime())
  );

  reservasSemestre = computed(() =>
    this.reservas()
      .filter(r => dentroDoIntervalo(r.dataReserva, this.semestre))
      .sort((a, b) => new Date(b.dataReserva).getTime() - new Date(a.dataReserva).getTime())
  );

  situacao(e: Emprestimo): SituacaoEmprestimo {
    const prevista = new Date(e.dataDevolucaoPrevista);
    if (e.statusDevolucao || e.dataDevolucao) {
      return e.dataDevolucao && new Date(e.dataDevolucao) > prevista ? 'Devolvido com atraso' : 'Devolvido';
    }
    return prevista < this.hoje ? 'Atrasado' : 'Em andamento';
  }

  resumoSemestre = computed(() => {
    const emp = this.emprestimosSemestre();
    const situacoes = emp.map(e => this.situacao(e));
    const contar = (s: SituacaoEmprestimo) => situacoes.filter(x => x === s).length;
    const devolvidosComAtraso = contar('Devolvido com atraso');
    const atrasados = contar('Atrasado');
    const leitoresAtivos = new Set([...emp.map(e => e.leitorId), ...this.reservasSemestre().map(r => r.leitorId)]).size;

    return {
      emprestimos: emp.length,
      reservas: this.reservasSemestre().length,
      devolvidos: contar('Devolvido') + devolvidosComAtraso,
      emAndamento: contar('Em andamento'),
      atrasados,
      devolvidosComAtraso,
      leitoresAtivos,
      // Empréstimos que atrasaram (devolvidos tarde ou ainda atrasados) sobre o total
      taxaAtraso: emp.length ? Math.round(((atrasados + devolvidosComAtraso) / emp.length) * 100) : 0,
    };
  });

  movimentoPorMes = computed(() => {
    const primeiroMes = this.semestre.inicio!.getMonth();
    const ano = this.semestre.inicio!.getFullYear();
    const linhas = Array.from({ length: 6 }, (_, i) => ({
      mes: `${nomeMes(primeiroMes + i)}/${ano}`,
      emprestimos: 0,
      reservas: 0,
      devolucoes: 0,
    }));
    const indice = (data: string) => new Date(data).getMonth() - primeiroMes;

    for (const e of this.emprestimosSemestre()) linhas[indice(e.dataEmprestimo)].emprestimos++;
    for (const r of this.reservasSemestre()) linhas[indice(r.dataReserva)].reservas++;
    for (const e of this.emprestimos()) {
      if (e.dataDevolucao && dentroDoIntervalo(e.dataDevolucao, this.semestre)) linhas[indice(e.dataDevolucao)].devolucoes++;
    }
    return linhas;
  });

  maiorDoMes = computed(() => Math.max(1, ...this.movimentoPorMes().flatMap(m => [m.emprestimos, m.reservas, m.devolucoes])));

  reservasPorStatus = computed(() => contarPor(this.reservasSemestre(), r => rotuloEnum(r.status)));

  exportarEmprestimosSemestre(): void {
    baixarCsv(
      `emprestimos-${this.nomeArquivoSemestre()}.csv`,
      ['Nº', 'Livro', 'Exemplar', 'Leitor', 'Emprestado em', 'Devolução prevista', 'Devolvido em', 'Situação'],
      this.emprestimosSemestre().map(e => [
        e.emprestimoId, e.titulo, e.tombo, e.nomeLeitor, formatarData(e.dataEmprestimo),
        formatarData(e.dataDevolucaoPrevista), formatarData(e.dataDevolucao), this.situacao(e),
      ])
    );
  }

  exportarReservasSemestre(): void {
    baixarCsv(
      `reservas-${this.nomeArquivoSemestre()}.csv`,
      ['Nº', 'Livro', 'Exemplar', 'Leitor', 'Reservado em', 'Retirar até', 'Situação'],
      this.reservasSemestre().map(r => [
        r.reservaId, r.titulo, r.tombo, r.nomeLeitor, formatarData(r.dataReserva),
        formatarData(r.dataLimiteRetirada), rotuloEnum(r.status),
      ])
    );
  }

  private nomeArquivoSemestre(): string {
    const inicio = this.semestre.inicio!;
    return `${inicio.getFullYear()}-${inicio.getMonth() < 6 ? 1 : 2}`;
  }

  // ================= Relatório 2: livros mais emprestados e reservados =================

  periodoLivros = signal<Periodo>('semestre');
  ordenacaoLivros = signal<OrdenacaoLivros>('total');
  limiteLivros = signal(20);

  intervaloLivros = computed(() => intervaloPeriodo(this.periodoLivros(), this.hoje));

  private rankingLivros = computed(() => {
    const intervalo = this.intervaloLivros();
    const mapa = new Map<number, { livroId: number; titulo: string; autor: string; genero: string; area: string; emprestimos: number; reservas: number }>();
    const linha = (livroId: number, titulo: string) => {
      if (!mapa.has(livroId)) {
        const livro = this.livrosPorId().get(livroId);
        mapa.set(livroId, {
          livroId, titulo: livro?.titulo ?? titulo, autor: livro?.autor ?? '-',
          genero: livro?.genero || '-', area: livro?.area || '-', emprestimos: 0, reservas: 0,
        });
      }
      return mapa.get(livroId)!;
    };

    for (const e of this.emprestimos()) if (dentroDoIntervalo(e.dataEmprestimo, intervalo)) linha(e.livroId, e.titulo).emprestimos++;
    for (const r of this.reservas()) if (dentroDoIntervalo(r.dataReserva, intervalo)) linha(r.livroId, r.titulo).reservas++;

    return [...mapa.values()].map(l => ({ ...l, total: l.emprestimos + l.reservas }));
  });

  livrosOrdenados = computed(() => {
    const campo = this.ordenacaoLivros();
    return [...this.rankingLivros()]
      .sort((a, b) => b[campo] - a[campo] || b.total - a.total || a.titulo.localeCompare(b.titulo, 'pt-BR'))
      .slice(0, this.limiteLivros());
  });

  maiorLivro = computed(() => Math.max(1, ...this.livrosOrdenados().map(l => l[this.ordenacaoLivros()])));

  // Livros ativos que não saíram nenhuma vez no período (ajuda a ver o que não circula)
  livrosSemMovimento = computed(() => {
    const comMovimento = new Set(this.rankingLivros().map(l => l.livroId));
    return this.livros().filter(l => l.livroStatus === 'ATIVO' && !comMovimento.has(l.livroId)).length;
  });

  exportarLivros(): void {
    baixarCsv(
      `livros-mais-procurados-${this.periodoLivros()}.csv`,
      ['Posição', 'Livro', 'Autor', 'Gênero', 'Área', 'Empréstimos', 'Reservas', 'Total'],
      this.livrosOrdenados().map((l, i) => [i + 1, l.titulo, l.autor, l.genero, l.area, l.emprestimos, l.reservas, l.total])
    );
  }

  // ================= Relatório 3: perfil e comportamento dos leitores =================

  periodoPerfil = signal<Periodo>('semestre');
  buscaPerfil = signal('');
  paginaPerfil = signal(1);
  readonly perfisPorPagina = 10;

  intervaloPerfil = computed(() => intervaloPeriodo(this.periodoPerfil(), this.hoje));

  private interacoes = computed<Interacao[]>(() => {
    const intervalo = this.intervaloPerfil();
    const livros = this.livrosPorId();
    return [
      ...this.emprestimos()
        .filter(e => dentroDoIntervalo(e.dataEmprestimo, intervalo))
        .map(e => ({ leitorId: e.leitorId, livro: livros.get(e.livroId), tipo: 'emprestimo' as const, data: e.dataEmprestimo })),
      ...this.reservas()
        .filter(r => dentroDoIntervalo(r.dataReserva, intervalo))
        .map(r => ({ leitorId: r.leitorId, livro: livros.get(r.livroId), tipo: 'reserva' as const, data: r.dataReserva })),
    ];
  });

  generos = computed(() => contarPor(this.interacoes(), i => i.livro?.genero));
  areas = computed(() => contarPor(this.interacoes(), i => i.livro?.area));
  assuntos = computed(() => contarPor(this.interacoes(), i => separarTags(i.livro?.tags)));
  autores = computed(() => contarPor(this.interacoes(), i => i.livro?.autor));
  idiomas = computed(() => contarPor(this.interacoes(), i => i.livro?.idioma));

  totalInteracoes = computed(() => this.interacoes().length);
  leitoresComInteracao = computed(() => new Set(this.interacoes().map(i => i.leitorId)).size);

  private resumirGrupos(grupoDoLeitor: (l: Leitor) => string, ordem?: string[]): ResumoGrupo[] {
    const leitores = this.leitoresPorId();
    const grupos = new Map<string, { cadastrados: number; ativos: Set<number>; interacoes: Interacao[] }>();
    const grupo = (nome: string) => {
      if (!grupos.has(nome)) grupos.set(nome, { cadastrados: 0, ativos: new Set(), interacoes: [] });
      return grupos.get(nome)!;
    };

    for (const l of this.leitores()) grupo(grupoDoLeitor(l)).cadastrados++;
    for (const i of this.interacoes()) {
      const leitor = leitores.get(i.leitorId);
      const g = grupo(leitor ? grupoDoLeitor(leitor) : 'Não identificado');
      g.ativos.add(i.leitorId);
      g.interacoes.push(i);
    }

    const linhas = [...grupos.entries()].map(([nome, g]) => ({
      grupo: nome,
      cadastrados: g.cadastrados,
      ativos: g.ativos.size,
      interacoes: g.interacoes.length,
      media: g.ativos.size ? (g.interacoes.length / g.ativos.size).toLocaleString('pt-BR', { maximumFractionDigits: 1 }) : '0',
      generoFavorito: contarPor(g.interacoes, i => i.livro?.genero)[0]?.rotulo ?? '-',
      areaFavorita: contarPor(g.interacoes, i => i.livro?.area)[0]?.rotulo ?? '-',
    }));

    return ordem
      ? linhas.sort((a, b) => ordem.indexOf(a.grupo) - ordem.indexOf(b.grupo))
      : linhas.sort((a, b) => b.interacoes - a.interacoes || a.grupo.localeCompare(b.grupo, 'pt-BR'));
  }

  porTipoLeitor = computed(() => this.resumirGrupos(l => rotuloEnum(l.tipoLeitor)));
  porFaixaEtaria = computed(() => this.resumirGrupos(l => faixaEtaria(l.dataNascimento, this.hoje), ORDEM_FAIXAS));
  porGeneroLeitor = computed(() => this.resumirGrupos(l => l.genero ? rotuloEnum(l.genero) : 'Não informado'));

  perfis = computed<PerfilLeitor[]>(() => {
    const intervalo = this.intervaloPerfil();
    const porLeitor = new Map<number, Interacao[]>();
    for (const i of this.interacoes()) {
      if (!porLeitor.has(i.leitorId)) porLeitor.set(i.leitorId, []);
      porLeitor.get(i.leitorId)!.push(i);
    }

    // Atrasos: devolvidos depois do prazo ou ainda atrasados, entre os empréstimos do período
    const atrasos = new Map<number, number>();
    for (const e of this.emprestimos()) {
      if (!dentroDoIntervalo(e.dataEmprestimo, intervalo)) continue;
      const s = this.situacao(e);
      if (s === 'Atrasado' || s === 'Devolvido com atraso') atrasos.set(e.leitorId, (atrasos.get(e.leitorId) ?? 0) + 1);
    }

    return [...porLeitor.entries()]
      .map(([leitorId, lista]) => {
        const leitor = this.leitoresPorId().get(leitorId);
        const nomeNaMovimentacao = this.emprestimos().find(e => e.leitorId === leitorId)?.nomeLeitor
          ?? this.reservas().find(r => r.leitorId === leitorId)?.nomeLeitor;
        return {
          leitorId,
          nome: leitor?.nome ?? nomeNaMovimentacao ?? `Leitor ${leitorId}`,
          tipo: rotuloEnum(leitor?.tipoLeitor),
          faixa: faixaEtaria(leitor?.dataNascimento, this.hoje),
          emprestimos: lista.filter(i => i.tipo === 'emprestimo').length,
          reservas: lista.filter(i => i.tipo === 'reserva').length,
          generoFavorito: contarPor(lista, i => i.livro?.genero)[0]?.rotulo ?? '-',
          areaFavorita: contarPor(lista, i => i.livro?.area)[0]?.rotulo ?? '-',
          assuntos: contarPor(lista, i => separarTags(i.livro?.tags)).slice(0, 3).map(a => a.rotulo),
          atrasos: atrasos.get(leitorId) ?? 0,
          ultimaAtividade: lista.map(i => i.data).sort().at(-1) ?? null,
        };
      })
      .sort((a, b) => (b.emprestimos + b.reservas) - (a.emprestimos + a.reservas) || a.nome.localeCompare(b.nome, 'pt-BR'));
  });

  perfisFiltrados = computed(() => {
    const termo = this.buscaPerfil().trim().toLowerCase();
    return termo ? this.perfis().filter(p => p.nome.toLowerCase().includes(termo)) : this.perfis();
  });

  totalPaginasPerfil = computed(() => Math.max(1, Math.ceil(this.perfisFiltrados().length / this.perfisPorPagina)));

  perfisPaginados = computed(() => {
    const inicio = (this.paginaPerfil() - 1) * this.perfisPorPagina;
    return this.perfisFiltrados().slice(inicio, inicio + this.perfisPorPagina);
  });

  onBuscaPerfil(event: Event): void {
    this.buscaPerfil.set((event.target as HTMLInputElement).value);
    this.paginaPerfil.set(1);
  }

  mudarPeriodoPerfil(event: Event): void {
    this.periodoPerfil.set((event.target as HTMLSelectElement).value as Periodo);
    this.paginaPerfil.set(1);
  }

  mudarPeriodoLivros(event: Event): void {
    this.periodoLivros.set((event.target as HTMLSelectElement).value as Periodo);
  }

  mudarOrdenacaoLivros(event: Event): void {
    this.ordenacaoLivros.set((event.target as HTMLSelectElement).value as OrdenacaoLivros);
  }

  mudarLimiteLivros(event: Event): void {
    this.limiteLivros.set(Number((event.target as HTMLSelectElement).value));
  }

  irParaPaginaPerfil(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginasPerfil()) return;
    this.paginaPerfil.set(pagina);
  }

  exportarPerfis(): void {
    baixarCsv(
      `perfil-leitores-${this.periodoPerfil()}.csv`,
      ['Leitor', 'Tipo', 'Faixa etária', 'Empréstimos', 'Reservas', 'Gênero preferido', 'Área preferida', 'Assuntos', 'Atrasos', 'Última atividade'],
      this.perfisFiltrados().map(p => [
        p.nome, p.tipo, p.faixa, p.emprestimos, p.reservas, p.generoFavorito, p.areaFavorita,
        p.assuntos.join(', '), p.atrasos, formatarData(p.ultimaAtividade),
      ])
    );
  }

  exportarPreferencias(): void {
    const linhas: (string | number)[][] = [];
    const adicionar = (categoria: string, itens: { rotulo: string; total: number }[]) =>
      itens.forEach((item, i) => linhas.push([categoria, i + 1, item.rotulo, item.total]));
    adicionar('Gênero', this.generos());
    adicionar('Área', this.areas());
    adicionar('Assunto', this.assuntos());
    adicionar('Autor', this.autores());
    adicionar('Idioma', this.idiomas());
    baixarCsv(`preferencias-leitores-${this.periodoPerfil()}.csv`, ['Categoria', 'Posição', 'Item', 'Empréstimos + reservas'], linhas);
  }
}
