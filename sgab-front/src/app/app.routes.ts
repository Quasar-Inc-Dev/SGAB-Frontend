import { Routes } from '@angular/router';
import { LoginPage } from './features/auth/pages/login-page/login-page';
import { authGuard, funcionarioGuard, leitorGuard } from './core/guards/auth-guards';

// O login é a primeira tela, então fica no pacote inicial.
// As demais são carregadas sob demanda (loadComponent): cada uma vira um arquivo separado,
// baixado só quando a rota é aberta (ou em segundo plano, pelo preload do app.config).
// O caminho do import() precisa ser um texto fixo para o build conseguir separar os arquivos.
export const routes: Routes = [
    {path: '', component: LoginPage},
    {path: 'cadastro', loadComponent: () => import('./features/auth/pages/cadastro-usuario/cadastro-usuario').then(m => m.CadastroUsuario)},
    {path: 'esqueci-senha', loadComponent: () => import('./features/auth/pages/esqueci-senha/esqueci-senha').then(m => m.EsqueciSenha)},
    {path: 'redefinir-senha', loadComponent: () => import('./features/auth/pages/redefinir-senha/redefinir-senha').then(m => m.RedefinirSenha)},
    {path: 'home', canActivate: [authGuard], loadComponent: () => import('./features/auth/pages/tela-home/tela-home').then(m => m.TelaHome)},
    {path: 'mostrar-livros', canActivate: [authGuard], loadComponent: () => import('./features/auth/pages/mostrar-livros/mostrar-livros').then(m => m.MostrarLivros)},
    {path: 'cadastrar-livro', canActivate: [authGuard], loadComponent: () => import('./features/auth/pages/cadastrar-livro/cadastrar-livro').then(m => m.CadastrarLivro)},
    {path: 'livro/:id', canActivate: [authGuard], loadComponent: () => import('./features/auth/pages/visualizar-livro/visualizar-livro').then(m => m.VisualizarLivro)},
    {path: 'meus-dados', canActivate: [authGuard], loadComponent: () => import('./features/auth/pages/meus-dados/meus-dados').then(m => m.MeusDados)},
    {path: 'usuarios', canActivate: [authGuard, funcionarioGuard], loadComponent: () => import('./features/auth/pages/listar-usuarios/listar-usuarios').then(m => m.ListarUsuarios)},
    {path: 'usuarios/cadastro', canActivate: [authGuard], loadComponent: () => import('./features/auth/pages/cadastrar-usuario/cadastrar-usuario').then(m => m.CadastrarUsuario)},
    {path: 'solicitacoes', canActivate: [authGuard, funcionarioGuard], loadComponent: () => import('./features/auth/pages/solicitacoes/solicitacoes').then(m => m.Solicitacoes)},
    {path: 'minhas-solicitacoes', canActivate: [authGuard, leitorGuard], loadComponent: () => import('./features/auth/pages/minhas-solicitacoes/minhas-solicitacoes').then(m => m.MinhasSolicitacoes)},
];
