import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { deMinutos } from '../../../../shared/lib/horarios';
import { usePainelDoCurso } from '../../../cursos/hooks/PainelDoCurso';
import { useAjustes } from '../../hooks/useAjustes';
import { esquemaNovaTurma, type DadosDeNovaTurma } from '../../types/schemas';
import { CampoMotivo } from './CampoMotivo';
import { SeletorDeHorarios } from './SeletorDeHorarios';

interface Props {
  aoConcluir: (avisos: string[]) => void;
  aoCancelar: () => void;
}

export function FormularioNovaTurma({ aoConcluir, aoCancelar }: Props) {
  const { painel } = usePainelDoCurso();
  const duracao = painel.curso.duracaoAulaHoras;
  const { criar } = useAjustes(painel.curso.codigo);
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DadosDeNovaTurma>({
    resolver: zodResolver(esquemaNovaTurma),
    defaultValues: {
      sigla: '',
      disciplina: '',
      codigo: '',
      periodo: '',
      professor: '',
      sala: '',
      vagas: 0,
      motivo: '',
      horarios: [{ diaSemana: 1, inicio: '14:00', fim: deMinutos((14 + duracao) * 60) }],
    },
  });

  const enviar = handleSubmit((d) =>
    criar.mutate(
      {
        sigla: d.sigla,
        disciplina: d.disciplina,
        codigo: d.codigo,
        periodo: d.periodo || '1',
        professor: d.professor,
        sala: d.sala || null,
        vagas: d.vagas,
        horarios: d.horarios,
        motivo: d.motivo,
      },
      { onSuccess: (r) => aoConcluir(r.avisos) },
    ),
  );

  const texto = (
    id: string,
    rotulo: string,
    campo: 'sigla' | 'disciplina' | 'codigo' | 'periodo' | 'professor',
    max: number,
    larga = false,
  ) => (
    <div className={`xf-field${larga ? ' xf-wide' : ''}`}>
      <label htmlFor={id}>{rotulo}</label>
      <input id={id} maxLength={max} autoComplete="off" aria-invalid={!!errors[campo]} {...register(campo)} />
      {errors[campo] && <div className="campo-erro">{errors[campo]?.message}</div>}
    </div>
  );

  return (
    <form className="xf" onSubmit={enviar} noValidate aria-label="Nova turma">
      <div className="xf-title">
        <span className="xf-kicker">Caso excepcional</span>
        <b>Nova turma</b>
      </div>
      <div className="xf-grid">
        {texto('nt-sigla', 'Sigla', 'sigla', 60)}
        {texto('nt-disc', 'Disciplina', 'disciplina', 250)}
        {texto('nt-cod', 'Código', 'codigo', 30)}
        {texto('nt-per', 'Período', 'periodo', 5)}
        {texto('nt-prof', 'Professor(a)', 'professor', 200, true)}
        <div className="xf-field">
          <label htmlFor="nt-sala">Sala</label>
          <select id="nt-sala" {...register('sala')}>
            <option value="">Sem sala fixa</option>
            {painel.salas.map((s) => (
              <option key={s.id} value={s.nome}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
        <div className="xf-field">
          <label htmlFor="nt-vagas">Vagas</label>
          <input
            id="nt-vagas"
            type="number"
            inputMode="numeric"
            min={0}
            max={1000}
            aria-invalid={!!errors.vagas}
            {...register('vagas', { valueAsNumber: true })}
          />
          {errors.vagas && <div className="campo-erro">{errors.vagas.message}</div>}
        </div>
        <SeletorDeHorarios control={control} register={register} watch={watch} setValue={setValue} duracao={duracao} />
        <CampoMotivo registro={register('motivo')} erro={errors.motivo?.message} />
        {criar.isError && (
          <div className="auth-error xf-wide" role="alert">
            {criar.error.message}
          </div>
        )}
      </div>
      <div className="xf-actions">
        <button type="submit" className="edit-save-btn" disabled={criar.isPending}>
          {criar.isPending ? 'Criando…' : 'Criar turma (excepcional)'}
        </button>
        <button type="button" className="edit-cancel-btn" onClick={aoCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
