FROM maven:3.9.9-eclipse-temurin-17 AS build
WORKDIR /workspace

COPY user-service/pom.xml .
COPY user-service/src ./src

RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

COPY --from=build /workspace/target/*.jar app.jar

EXPOSE 8081
ENTRYPOINT ["java","-jar","app.jar"]
