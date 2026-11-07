# ADR 0004 — Flyway como única fonte do esquema e `ddl-auto=validate`

- Status: aceita
- Data: 2026-11-07

## Contexto
O esquema precisa ser versionado e reprodutível; o Hibernate nunca deve alterá-lo.

## Decisão
Migrações em `banco-de-dados/migracoes` (`V<n>__descricao.sql`, imutáveis depois de aplicadas; correções em nova versão — `V3` adicionou `turma.aviso`). O `pom.xml` copia-as para `db/migration` no classpath. `spring.jpa.hibernate.ddl-auto=validate`, `utf8mb4`, chaves e índices explícitos. O agregado `Turma` usa JDBC explícito; os demais módulos usam JPA.

## Consequências
Divergência entre entidade e esquema derruba a subida (desejado). Colunas `SMALLINT`/`CHAR(64)` exigem `columnDefinition`. **Pendência:** a validação real do Hibernate e o Flyway sob MySQL 8.4 não foram executados; o SQL foi validado em MariaDB 10.11.
