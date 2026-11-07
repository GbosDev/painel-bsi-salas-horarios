package br.unirio.painel.oferta.dominio;

import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.compartilhado.Textos;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Turma ofertada em um curso no período letivo vigente. Atende uma disciplina da matriz 2023,
 * da matriz 2008 ou das duas (equivalência), com professor, sala, vagas e horários.
 */
public record Turma(
        Long id,
        String cursoCodigo,
        DisciplinaDaMatriz disciplina2023,
        DisciplinaDaMatriz disciplina2008,
        String professor,
        String sala,
        int vagas,
        Secao secao,
        String ementaUrl,
        String aviso,
        Origem origem,
        int versao,
        List<HorarioDeAula> horarios) {

    public static final int VAGAS_MAXIMAS = 1000;
    public static final int AVISO_MAXIMO = 500;

    /** Construtor sem aviso (turmas criadas por CSV ou por ajuste excepcional). */
    public Turma(Long id, String cursoCodigo, DisciplinaDaMatriz disciplina2023, DisciplinaDaMatriz disciplina2008,
                 String professor, String sala, int vagas, Secao secao, String ementaUrl, Origem origem, int versao,
                 List<HorarioDeAula> horarios) {
        this(id, cursoCodigo, disciplina2023, disciplina2008, professor, sala, vagas, secao, ementaUrl, null, origem, versao, horarios);
    }

    public Turma {
        Objects.requireNonNull(cursoCodigo, "cursoCodigo");
        if (disciplina2023 == null && disciplina2008 == null) {
            throw ErroDeNegocio.invalido("turma_sem_disciplina", "Informe sigla e disciplina de pelo menos uma das grades.");
        }
        professor = Textos.vazio(professor) ? null : Textos.limpar(professor);
        if (professor != null && professor.length() > 200) {
            throw ErroDeNegocio.invalido("professor_longo", "Nome do professor com mais de 200 caracteres.");
        }
        sala = Textos.vazio(sala) ? null : Textos.limpar(sala);
        if (sala != null && sala.length() > 60) {
            throw ErroDeNegocio.invalido("sala_longa", "Nome da sala com mais de 60 caracteres.");
        }
        if (vagas < 0 || vagas > VAGAS_MAXIMAS) {
            throw ErroDeNegocio.invalido("vagas_invalidas", "Vagas deve estar entre 0 e " + VAGAS_MAXIMAS + ".");
        }
        secao = secao == null ? Secao.REGULAR : secao;
        aviso = Textos.vazio(aviso) ? null : Textos.limpar(aviso);
        if (aviso != null && aviso.length() > AVISO_MAXIMO) {
            throw ErroDeNegocio.invalido("aviso_longo", "Aviso com mais de " + AVISO_MAXIMO + " caracteres.");
        }
        origem = origem == null ? Origem.CSV : origem;
        horarios = normalizarHorarios(horarios);
    }

    /** Remove duplicatas exatas e rejeita horários diferentes que se cruzam dentro da mesma turma. */
    private static List<HorarioDeAula> normalizarHorarios(List<HorarioDeAula> entrada) {
        List<HorarioDeAula> saida = new ArrayList<>();
        if (entrada != null) {
            for (HorarioDeAula h : entrada) {
                if (!saida.contains(h)) saida.add(h);
            }
        }
        for (int i = 0; i < saida.size(); i++) {
            for (int j = i + 1; j < saida.size(); j++) {
                if (saida.get(i).sobrepoe(saida.get(j))) {
                    throw ErroDeNegocio.invalido("horarios_sobrepostos",
                            "A turma tem horários que se cruzam: " + saida.get(i).rotulo() + " e " + saida.get(j).rotulo() + ".");
                }
            }
        }
        saida.sort((a, b) -> a.diaSemana() != b.diaSemana()
                ? Integer.compare(a.diaSemana(), b.diaSemana()) : a.inicio().compareTo(b.inicio()));
        return List.copyOf(saida);
    }

    /** Disciplina de exibição: prefere a matriz 2023, cai para 2008. */
    public DisciplinaDaMatriz disciplinaPrincipal() {
        return disciplina2023 != null ? disciplina2023 : disciplina2008;
    }

    public String rotulo() {
        DisciplinaDaMatriz d = disciplinaPrincipal();
        return d.sigla() + " — " + d.nome();
    }

    public Turma comAjuste(String novoProfessor, String novaSala, int novasVagas, List<HorarioDeAula> novosHorarios) {
        return new Turma(id, cursoCodigo, disciplina2023, disciplina2008, novoProfessor, novaSala, novasVagas, secao,
                ementaUrl, aviso, origem, versao, novosHorarios);
    }

    public Turma comDisciplinas(DisciplinaDaMatriz nova2023, DisciplinaDaMatriz nova2008) {
        return new Turma(id, cursoCodigo, nova2023, nova2008, professor, sala, vagas, secao, ementaUrl, aviso, origem, versao, horarios);
    }

    public Turma comSecao(Secao novaSecao) {
        return new Turma(id, cursoCodigo, disciplina2023, disciplina2008, professor, sala, vagas, novaSecao, ementaUrl, aviso, origem, versao, horarios);
    }
}
