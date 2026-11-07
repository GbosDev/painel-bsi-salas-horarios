import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router-dom';
import { ErroDeApi } from '../../../shared/api/cliente';
import { useSessao } from '../hooks/Sessao';
import { esquemaLogin, type DadosDeLogin } from '../types/schemas';

export function Login() {
  const { usuario, carregando, entrar } = useSessao();
  const [erro, setErro] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    resetField,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<DadosDeLogin>({ resolver: zodResolver(esquemaLogin), defaultValues: { login: '', senha: '' } });

  useEffect(() => {
    document.body.classList.add('auth-body');
    document.title = 'Entrar — Painel de Salas UNIRIO';
    return () => document.body.classList.remove('auth-body');
  }, []);

  if (!carregando && usuario) return <Navigate to="/" replace />;

  const enviar = handleSubmit(async (dados) => {
    setErro(null);
    try {
      await entrar(dados.login, dados.senha);
    } catch (e) {
      setErro(e instanceof ErroDeApi ? e.message : 'Não foi possível entrar. Tente novamente.');
      resetField('senha');
      setFocus('senha');
    }
  });

  return (
    <div className="auth-split">
      <aside className="auth-side">
        <div className="auth-rings">
          <i />
          <i />
          <i />
        </div>
        <div className="auth-side-copy">
          <img className="auth-logo" src="/marca/unirio.png" alt="UNIRIO" width={121} height={40} />
          <h2>Painel de Salas</h2>
          <p>Salas, horários e planejamento acadêmico dos cursos em um só lugar.</p>
        </div>
      </aside>
      <div className="auth-wrap">
        <div className="auth-card">
          <h1>Bem-vindo(a)</h1>
          <p className="auth-lead">Entre com seu usuário para acessar o painel.</p>
          <form onSubmit={enviar} autoComplete="off" noValidate>
            <div className="auth-field">
              <label htmlFor="login">Matrícula ou usuário</label>
              <input
                id="login"
                type="text"
                placeholder="estudante: sua matrícula"
                autoComplete="username"
                aria-invalid={!!errors.login}
                aria-describedby={errors.login ? 'login-erro' : undefined}
                {...register('login')}
              />
              {errors.login && (
                <div id="login-erro" className="campo-erro">
                  {errors.login.message}
                </div>
              )}
            </div>
            <div className="auth-field">
              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                type="password"
                placeholder="sua senha"
                autoComplete="current-password"
                aria-invalid={!!errors.senha}
                aria-describedby={errors.senha ? 'senha-erro' : undefined}
                {...register('senha')}
              />
              {errors.senha && (
                <div id="senha-erro" className="campo-erro">
                  {errors.senha.message}
                </div>
              )}
            </div>
            {erro && (
              <div className="auth-error" role="alert">
                {erro}
              </div>
            )}
            <button type="submit" className="auth-submit" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
