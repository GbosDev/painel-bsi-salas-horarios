# Contexto de build = raiz do repositório (as migrações vêm de banco-de-dados/migracoes).
#   docker build -f backend/Dockerfile -t painel-api .
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /src
COPY backend/pom.xml backend/pom.xml
COPY banco-de-dados/migracoes banco-de-dados/migracoes
COPY backend/src backend/src
RUN --mount=type=cache,target=/root/.m2 mvn -f backend/pom.xml -B -q -DskipTests package

FROM eclipse-temurin:21-jre
RUN useradd --system --uid 10001 --no-create-home painel
WORKDIR /app
COPY --from=build /src/backend/target/painel-api-1.0.0.jar /app/painel-api.jar
USER 10001
EXPOSE 8080
# Memória da JVM em % da RAM disponível; sobrescreva com JAVA_TOOL_OPTIONS no compose/PaaS.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
ENTRYPOINT ["java", "-jar", "/app/painel-api.jar"]
