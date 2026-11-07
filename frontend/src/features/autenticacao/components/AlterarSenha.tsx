import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useToasts } from '../../../shared/ui/Toasts';
import { autenticacao } from '../api/autenticacaoApi';
import { esquemaAlterarSenha, type DadosDeAlterarSenha } from '../types/schemas';

export function AlterarSenha({ aoFechar }: { aoFechar: () => void }) {
  const { avisar } = useToasts();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DadosDeAlterarSenha>({
    resolver: zodResolver(esquemaAlterarSenha),
    defaultValues: { senhaAtual: '', novaSenha: '' },
  });

  const alterar = useMutation({
    mutationFn: (d: DadosDeAlterarSenha) => autenticacao.alterarSenha(d.senhaAtual, d.novaSenha),
    onSuccess: () => {
      reset();
      avisar('Senha alterada.');
      aoFechar();
    },
  });

  return (
    <div
      className="cp-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <form className="cp-card" onSubmit={handleSubmit((d) => alterar.mutate(d))} aria-label="Alterar senha" noValidate>
        <h3>Alterar senha</h3>
        <p>A nova senha precisa ter ao menos 10 caracteres, com letras e números.</p>
        <div className="auth-field">
          <label htmlFor="senha-atual">Senha atual</label>
          <input
            id="senha-atual"
            type="password"
            autoComplete="current-password"
            aria-invalid={!!errors.senhaAtual}
            {...register('senhaAtual')}
          />
          {errors.senhaAtual && <div className="campo-erro">{errors.senhaAtual.message}</div>}
        </div>
        <div className="auth-field">
          <label htmlFor="senha-nova">Nova senha</label>
          <input
            id="senha-nova"
            type="password"
            autoComplete="new-password"
            aria-invalid={!!errors.novaSenha}
            {...register('novaSenha')}
          />
          {errors.novaSenha && <div className="campo-erro">{errors.novaSenha.message}</div>}
        </div>
        {alterar.isError && (
          <div className="auth-error" role="alert">
            {alterar.error.message}
          </div>
        )}
        <button type="submit" className="auth-submit" disabled={alterar.isPending}>
          {alterar.isPending ? 'Salvando…' : 'Salvar nova senha'}
        </button>
        <button type="button" className="cp-close" onClick={aoFechar}>
          Fechar
        </button>
      </form>
    </div>
  );
}
