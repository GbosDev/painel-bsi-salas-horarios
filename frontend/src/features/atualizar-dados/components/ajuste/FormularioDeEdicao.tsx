import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { Turma } from '../../../../shared/api/tipos';
import { hhmm } from '../../../../shared/lib/horarios';
import { nomePrincipal } from '../../../../shared/lib/rotulos';
import { usePainelDoCurso } from '../../../cursos/hooks/PainelDoCurso';
import { useAjustes } from '../../hooks/useAjustes';
import { esquemaEdicao, type DadosDeEdicao } from '../../types/schemas';
import { CampoMotivo } from './CampoMotivo';
import { SeletorDeHorarios } from './SeletorDeHorarios';

interface Props {
  turma: Turma;
  aoConcluir: (avisos: string[]) => void;
  aoCancelar: () => void;
}

export function FormularioDeEdicao({ turma, aoConcluir, aoCancelar }: Props) {
  const { painel } = usePainelDoCurso();
  const { editar } = useAjustes(painel.curso.codigo);
  const n = nomePrincipal(turma);
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DadosDeEdicao>({
    resolver: zodResolver(esquemaEdicao),
    defaultValues: {
      professor: turma.professor ?? '',
      sala: turma.sala ?? '',
      vagas: turma.vagas,
      horarios: turma.horarios.map((h) => ({ diaSemana: h.diaSemana, inicio: hhmm(h.inicio), fim: hhmm(h.fim) })),
      motivo: '',
    },
  });

  const enviar = handleSubmit((d) =>
    editar.mutate(
      {
        id: turma.id,
        dados: {
          professor: d.professor,
          sala: d.sala || null,
          vagas: d.vagas,
          horarios: d.horarios,
          versao: turma.versao,
          motivo: d.motivo,
        },
      },
      { onSuccess: (r) => aoConcluir(r.avisos) },
    ),
  );

  return (
    <form className="xf" onSubmit={enviar} noValidate aria-label={`Editar turma ${n.sigla}`}>
      <div className="xf-title">
        <span className="xf-kicker">Editando turma</span>
        <b>
          {n.sigla || '—'} — {n.nome}
        </b>
      </div>
      {turma.aviso && <div className="xf-note">Aviso da coordenação: {turma.aviso}</div>}
      <div className="xf-grid">
        <div className="xf-field xf-wide">
          <label htmlFor="aj-prof">Professor(a)</label>
          <input id="aj-prof" type="text" aria-invalid={!!errors.professor} {...register('professor')} />
          {errors.professor && <div className="campo-erro">{errors.professor.message}</div>}
        </div>
        <div className="xf-field">
          <label htmlFor="aj-sala">Sala</label>
          <select id="aj-sala" {...register('sala')}>
            <option value="">sem sala fixa</option>
            {painel.salas.map((s) => (
              <option key={s.id} value={s.nome}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="xf-field">
          <label htmlFor="aj-vagas">Vagas</label>
          <input
            id="aj-vagas"
            type="number"
            inputMode="numeric"
            min={0}
            max={1000}
            aria-invalid={!!errors.vagas}
            {...register('vagas', { valueAsNumber: true })}
          />
          {errors.vagas && <div className="campo-erro">{errors.vagas.message}</div>}
        </div>
        <SeletorDeHorarios
          control={control}
          register={register}
          watch={watch}
          setValue={setValue}
          duracao={painel.curso.duracaoAulaHoras}
          mensagemDeErro={errors.horarios?.root?.message ?? errors.horarios?.find?.((e) => e?.fim)?.fim?.message}
        />
        <CampoMotivo registro={register('motivo')} erro={errors.motivo?.message} />
        {editar.isError && (
          <div className="auth-error xf-wide" role="alert">
            {editar.error.message}
          </div>
        )}
      </div>
      <div className="xf-actions">
        <button type="submit" className="edit-save-btn" disabled={editar.isPending}>
          {editar.isPending ? 'Salvando…' : 'Salvar ajuste'}
        </button>
        <button type="button" className="edit-cancel-btn" onClick={aoCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
