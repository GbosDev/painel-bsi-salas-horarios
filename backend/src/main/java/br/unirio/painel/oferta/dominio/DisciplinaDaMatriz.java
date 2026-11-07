package br.unirio.painel.oferta.dominio;

import br.unirio.painel.compartilhado.ErroDeNegocio;
import br.unirio.painel.compartilhado.Textos;

/** Disciplina como aparece em uma matriz curricular (2008 = antiga, 2023 = atual). */
public record DisciplinaDaMatriz(int matriz, String sigla, String codigo, String nome, String periodo, boolean posGraduacao) {

    public DisciplinaDaMatriz {
        if (matriz != 2008 && matriz != 2023) {
            throw ErroDeNegocio.invalido("matriz_invalida", "Matriz curricular inválida: " + matriz);
        }
        sigla = Textos.limpar(sigla);
        nome = Textos.limpar(nome);
        codigo = Textos.vazio(codigo) ? null : Textos.limpar(codigo);
        periodo = Textos.vazio(periodo) ? "1" : Textos.limpar(periodo);
        if (sigla.isEmpty() || nome.isEmpty()) {
            throw ErroDeNegocio.invalido("disciplina_incompleta", "Sigla e disciplina devem ser informadas juntas.");
        }
        if (sigla.length() > 60) throw ErroDeNegocio.invalido("sigla_longa", "Sigla com mais de 60 caracteres.");
        if (nome.length() > 250) throw ErroDeNegocio.invalido("nome_longo", "Nome da disciplina com mais de 250 caracteres.");
        if (codigo != null && codigo.length() > 30) throw ErroDeNegocio.invalido("codigo_longo", "Código com mais de 30 caracteres.");
        if (periodo.length() > 5) throw ErroDeNegocio.invalido("periodo_longo", "Período com mais de 5 caracteres.");
    }
}
