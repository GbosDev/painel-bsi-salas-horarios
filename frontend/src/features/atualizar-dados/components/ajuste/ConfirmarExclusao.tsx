import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { Turma } from '../../../../shared/api/tipos';
import { nomePrincipal } from '../../../../shared/lib/rotulos';
import { usePainelDoCurso } from '../../../cursos/hooks/PainelDoCurso';
import { useAjustes } from '../../hooks/useAjustes';
import { esquemaExclusao, type DadosDeExclusao } from '../../types/schemas';
import { CampoMotivo } from './CampoMotivo';

interface Props {
  turma: Turma;
  aoConcluir: () => void;
  aoCancelar: () => void;
}

export function ConfirmarExclusao({ turma, aoConcluir, aoCancelar }: Props) {
  const { painel } = usePainelDoCurso();
  const { excluir } = useAjustes(painel.curso.codigo);
  const n = nomePrincipal(turma);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DadosDeExclusao>({ resolver: zodResolver(esquemaExclusao), defaultValues: { motivo: '' } });

  const enviar = handleSubmit((d) => excluir.mutate({ id: turma.id, motivo: d.motivo }, { onSuccess: aoConcluir }));

  return (
    <form className="xf" onSubmit={enviar} noValidate aria-label={`Excluir turma ${n.sigla}`}>
      <div className="xf-title danger">
        <span className="xf-kicker">Excluir turma</span>
        <b>
          {n.sigla || '—'} — {n.nome}
        </b>
      </div>
      <div className="xf-grid">
        <div className="xf-wide xf-note">
          A turma será removida da grade deste curso. A ação fica registrada no histórico.
        </div>
        <CampoMotivo registro={register('motivo')} erro={errors.motivo?.message} />
        {excluir.isError && (
          <div className="auth-error xf-wide" role="alert">
            {excluir.error.message}
          </div>
        )}
      </div>
      <div className="xf-actions">
        <button type="submit" className="edit-save-btn is-danger" disabled={excluir.isPending}>
          {excluir.isPending ? 'Excluindo…' : 'Confirmar exclusão'}
        </button>
        <button type="button" className="edit-cancel-btn" onClick={aoCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
