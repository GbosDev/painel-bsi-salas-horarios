package br.unirio.painel.catalogo.dominio;

public record Curso(
        String codigo,
        String sigla,
        String nome,
        String centroSigla,
        String centroNome,
        String centroDescricao,
        String situacao,
        String descricao,
        String tema,
        boolean alternaMatrizes,
        int duracaoAulaHoras) { }
