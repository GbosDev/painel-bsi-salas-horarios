import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { usePainelDoCurso } from '../../../cursos/hooks/PainelDoCurso';
import { useAjustes } from '../../hooks/useAjustes';
import { esquemaNovaSala, type DadosDeNovaSala } from '../../types/schemas';

/** Catálogo de salas do curso. Sala em uso por alguma turma não pode ser removida. */
export function CatalogoDeSalas() {
  const { painel } = usePainelDoCurso();
  const { adicionarSala, removerSala } = useAjustes(painel.curso.codigo);
  const [tremendo, setTremendo] = useState<number | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DadosDeNovaSala>({ resolver: zodResolver(esquemaNovaSala), defaultValues: { nome: '' } });

  const adicionar = handleSubmit((d) => adicionarSala.mutate(d.nome, { onSuccess: () => reset() }));

  function remover(id: number, emUso: number) {
    if (emUso > 0) {
      setTremendo(id);
      window.setTimeout(() => setTremendo(null), 400);
      return;
    }
    removerSala.mutate(id);
  }

  const erro = adicionarSala.isError
    ? adicionarSala.error.message
    : removerSala.isError
      ? removerSala.error.message
      : null;

  return (
    <div className="xs">
      <form className="xs-add" onSubmit={adicionar} noValidate>
        <input
          type="text"
          aria-label="Nome da nova sala"
          placeholder="Nova sala (ex.: Sala 301)"
          maxLength={60}
          autoComplete="off"
          aria-invalid={!!errors.nome}
          {...register('nome')}
        />
        <button type="submit" className="edit-save-btn" disabled={adicionarSala.isPending}>
          Adicionar sala
        </button>
      </form>
      {errors.nome && <div className="campo-erro">{errors.nome.message}</div>}
      <p className="xf-note">Salas em uso (com o número de turmas ao lado) não podem ser removidas.</p>
      {erro && (
        <div className="auth-error" role="alert">
          {erro}
        </div>
      )}
      <div className="ad-rooms">
        {painel.salas.length === 0 && <div className="xf-empty">Nenhuma sala cadastrada para este curso.</div>}
        {painel.salas.map((s) => (
          <span key={s.id} className={`ad-chip${s.turmasEmUso ? ' used' : ''}${tremendo === s.id ? ' shake' : ''}`}>
            {s.nome}
            {s.turmasEmUso ? ` · ${s.turmasEmUso}` : ''}
            <button
              type="button"
              aria-label={`Remover ${s.nome}`}
              title={s.turmasEmUso ? `Em uso por ${s.turmasEmUso} turma(s)` : 'Remover'}
              onClick={() => remover(s.id, s.turmasEmUso)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
