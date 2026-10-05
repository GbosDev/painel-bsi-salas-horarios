### Stage 1 — build with Maven (cached layer for dependencies)
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

### Stage 2 — slim runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S bussola && adduser -S bussola -G bussola
COPY --from=build /app/target/bussola-backend.jar app.jar
USER bussola
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-jar", "app.jar"]
