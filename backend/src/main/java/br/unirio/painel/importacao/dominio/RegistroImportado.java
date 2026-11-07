package br.unirio.painel.importacao.dominio;

import br.unirio.painel.oferta.dominio.DisciplinaDaMatriz;
import br.unirio.painel.oferta.dominio.HorarioDeAula;
import java.util.List;

/**
 * Linha válida da planilha, já interpretada. Campos nulos/vazios = "não informado" (não apagam dados existentes).
 * {@code casarSigla}/{@code casarMatriz} dizem como localizar a turma existente (além do {@code idTurma}).
 */
public record RegistroImportado(
        String casarSigla,
        int casarMatriz,
        DisciplinaDaMatriz disciplina2008,
        DisciplinaDaMatriz disciplina2023,
        String professor,
        String sala,
        Integer vagas,
        String secao,
        List<HorarioDeAula> horarios,
        Long idTurma) { }
