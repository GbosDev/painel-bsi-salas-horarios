package br.unirio.painel.catalogo.dominio;

/** Sala do catálogo de um curso, com a quantidade de turmas que a usam hoje. */
public record SalaDoCatalogo(long id, String nome, long turmasEmUso) { }
