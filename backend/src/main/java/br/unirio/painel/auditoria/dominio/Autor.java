package br.unirio.painel.auditoria.dominio;

/** Quem executou a ação, conforme a sessão autenticada no servidor. */
public record Autor(Long usuarioId, String nome, String perfil) { }
