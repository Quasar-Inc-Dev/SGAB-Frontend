import { Component, computed, inject, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { DatePipe, isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Header } from '../../../../shared/header/header';
import { Footer } from '../../../../shared/footer/footer';
import { LeitorService } from '../../../../core/services/leitor';
import { Leitor } from '../../../../core/models/usuario';
import { mensagemErro } from '../../../../core/utils/mensagem-erro';

type FiltroStatus = '' | 'ATIVO' | 'INATIVO';

@Component({
  selector: 'app-listar-usuarios',
  imports: [Header, Footer, DatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './listar-usuarios.html',
  styleUrl: './listar-usuarios.scss',
  host: { '(document:keydown.escape)': 'fecharModais()' },
})
export class ListarUsuarios implements OnInit {
  private leitorService = inject(LeitorService);
  private fb = inject(FormBuilder);
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly itensPorPagina = 10;

  leitores = signal<Leitor[]>([]);
  carregando = signal(true);
  erro = signal(false);

  busca = signal('');
  filtroTipo = signal('');
  filtroStatus = signal<FiltroStatus>('ATIVO');
  paginaAtual = signal(1);

  leitorEditando = signal<Leitor | null>(null);
  salvando = signal(false);
  erroEdicao = signal('');

  leitorParaDesativar = signal<Leitor | null>(null);
  desativando = signal(false);
  erroDesativacao = signal('');

  readonly generos = [
    { valor: 'MASCULINO', label: 'Masculino' },
    { valor: 'FEMININO', label: 'Feminino' },
  ];

  // Mesmos valores do cadastro; tipos vindos do back que não estiverem aqui também aparecem
  private readonly tiposBase = [
    { valor: 'LEITOR', label: 'Leitor' },
    { valor: 'PROFESSOR', label: 'Professor' },
  ];

  tiposLeitor = computed(() => {
    const extras = [...new Set(this.leitores().map(l => l.tipoLeitor).filter(Boolean))]
      .filter(t => !this.tiposBase.some(b => b.valor === t))
      .map(t => ({ valor: t, label: this.rotulo(t) }));
    return [...this.tiposBase, ...extras];
  });

  form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    genero: ['', Validators.required],
    dataNascimento: ['', Validators.required],
    tipoLeitor: ['', Validators.required],
  });

  opcoesStatus = computed((): { valor: FiltroStatus; label: string; total: number }[] => {
    const lista = this.leitores();
    return [
      { valor: 'ATIVO', label: 'Ativos', total: lista.filter(l => l.statusLeitor).length },
      { valor: 'INATIVO', label: 'Inativos', total: lista.filter(l => !l.statusLeitor).length },
      { valor: '', label: 'Todos', total: lista.length },
    ];
  });

  leitoresFiltrados = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    const termoCpf = termo.replace(/\D/g, '');
    const tipo = this.filtroTipo();
    const status = this.filtroStatus();

    return this.leitores()
      .filter(l => !tipo || l.tipoLeitor === tipo)
      .filter(l => !status || (status === 'ATIVO' ? l.statusLeitor : !l.statusLeitor))
      .filter(l => !termo
        || l.nome.toLowerCase().includes(termo)
        || l.email.toLowerCase().includes(termo)
        || (!!termoCpf && l.cpf.includes(termoCpf)));
  });

  totalPaginas = computed(() => Math.max(1, Math.ceil(this.leitoresFiltrados().length / this.itensPorPagina)));

  leitoresPaginados = computed(() => {
    const inicio = (this.paginaAtual() - 1) * this.itensPorPagina;
    return this.leitoresFiltrados().slice(inicio, inicio + this.itensPorPagina);
  });

  ngOnInit(): void {
    if (!this.isBrowser) return;

    this.leitorService.listar().subscribe({
      next: (lista) => {
        this.leitores.set([...lista].sort((a, b) => a.nome.localeCompare(b.nome)));
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set(true);
        this.carregando.set(false);
      },
    });
  }

  onBuscaChange(event: Event) {
    this.busca.set((event.target as HTMLInputElement).value);
    this.paginaAtual.set(1);
  }

  onTipoChange(event: Event) {
    this.filtroTipo.set((event.target as HTMLSelectElement).value);
    this.paginaAtual.set(1);
  }

  mudarStatus(status: FiltroStatus) {
    this.filtroStatus.set(status);
    this.paginaAtual.set(1);
  }

  irParaPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas()) return;
    this.paginaAtual.set(pagina);
  }

  formatarCpf(cpf: string): string {
    const d = (cpf ?? '').replace(/\D/g, '');
    return d.length === 11 ? `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}` : cpf;
  }

  rotulo(valor: string): string {
    if (!valor) return '-';
    return valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
  }

  // Edição

  abrirEdicao(leitor: Leitor) {
    this.erroEdicao.set('');
    this.form.reset({
      nome: leitor.nome ?? '',
      genero: leitor.genero ?? '',
      dataNascimento: leitor.dataNascimento ?? '',
      tipoLeitor: leitor.tipoLeitor ?? '',
    });
    this.leitorEditando.set(leitor);
  }

  fecharEdicao() {
    if (this.salvando()) return;
    this.leitorEditando.set(null);
  }

  salvarEdicao() {
    const leitor = this.leitorEditando();
    if (!leitor) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.salvando.set(true);
    this.erroEdicao.set('');

    this.leitorService.editar(leitor.id, this.form.getRawValue()).subscribe({
      next: (atualizado) => {
        this.leitores.update(lista => lista.map(l => (l.id === atualizado.id ? atualizado : l)));
        this.salvando.set(false);
        this.leitorEditando.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.salvando.set(false);
        this.erroEdicao.set(mensagemErro(err, 'Não foi possível salvar as alterações.'));
      },
    });
  }

  // Desativação

  pedirDesativacao(leitor: Leitor) {
    this.erroDesativacao.set('');
    this.leitorParaDesativar.set(leitor);
  }

  cancelarDesativacao() {
    if (this.desativando()) return;
    this.leitorParaDesativar.set(null);
  }

  confirmarDesativacao() {
    const leitor = this.leitorParaDesativar();
    if (!leitor) return;

    this.desativando.set(true);
    this.erroDesativacao.set('');

    this.leitorService.desativar(leitor.id).subscribe({
      next: () => {
        this.leitores.update(lista => lista.map(l => (l.id === leitor.id ? { ...l, statusLeitor: false } : l)));
        this.desativando.set(false);
        this.leitorParaDesativar.set(null);
      },
      error: (err: HttpErrorResponse) => {
        this.desativando.set(false);
        this.erroDesativacao.set(mensagemErro(err, 'Não foi possível desativar o usuário. Tente novamente.'));
      },
    });
  }

  fecharModais() {
    this.fecharEdicao();
    this.cancelarDesativacao();
  }
}
