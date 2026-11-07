package br.unirio.painel.oferta.api;

import br.unirio.painel.catalogo.dominio.Curso;
import br.unirio.painel.catalogo.dominio.SalaDoCatalogo;
import br.unirio.painel.oferta.dominio.DisciplinaDaMatriz;
import br.unirio.painel.oferta.dominio.HorarioDeAula;
import br.unirio.painel.oferta.dominio.Turma;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;
import java.util.List;

/** Formatos JSON da API de oferta (turmas, salas, cursos). */
public final class Dtos {

    private Dtos() { }

    public record CentroDto(String sigla, String nome, String descricao) { }

    public record CursoDto(String codigo, String sigla, String nome, CentroDto centro, String situacao, String descricao,
                           String tema, boolean alternaMatrizes, int duracaoAulaHoras) {
        public static CursoDto de(Curso c) {
            return new CursoDto(c.codigo(), c.sigla(), c.nome(), new CentroDto(c.centroSigla(), c.centroNome(), c.centroDescricao()),
                    c.situacao(), c.descricao(), c.tema(), c.alternaMatrizes(), c.duracaoAulaHoras());
        }
    }

    public record SalaDto(long id, String nome, long turmasEmUso) {
        public static SalaDto de(SalaDoCatalogo s) { return new SalaDto(s.id(), s.nome(), s.turmasEmUso()); }
    }

    public record DisciplinaDto(String sigla, String codigo, String nome, String periodo, boolean posGraduacao) {
        static DisciplinaDto de(DisciplinaDaMatriz d) {
            return d == null ? null : new DisciplinaDto(d.sigla(), d.codigo(), d.nome(), d.periodo(), d.posGraduacao());
        }
    }

    public record HorarioDto(int diaSemana, String inicio, String fim) {
        static HorarioDto de(HorarioDeAula h) { return new HorarioDto(h.diaSemana(), h.inicio().toString(), h.fim().toString()); }
    }

    public record TurmaDto(long id, DisciplinaDto curr2008, DisciplinaDto curr2023, String professor, String sala, int vagas,
                           String secao, String ementaUrl, String aviso, String origem, int versao, boolean editada, List<HorarioDto> horarios) {
        public static TurmaDto de(Turma t) {
            return new TurmaDto(t.id(), DisciplinaDto.de(t.disciplina2008()), DisciplinaDto.de(t.disciplina2023()), t.professor(),
                    t.sala(), t.vagas(), t.secao().codigo(), t.ementaUrl(), t.aviso(), t.origem().codigo(), t.versao(), t.versao() > 0,
                    t.horarios().stream().map(HorarioDto::de).toList());
        }
    }

    public record HorarioRequisicao(@Min(1) @Max(6) int diaSemana, @NotNull LocalTime inicio, @NotNull LocalTime fim) {
        public HorarioDeAula paraDominio() { return new HorarioDeAula(diaSemana, inicio, fim); }
    }

    public static List<HorarioDeAula> horarios(List<HorarioRequisicao> lista) {
        return lista == null ? List.of() : lista.stream().map(HorarioRequisicao::paraDominio).toList();
    }
}
