# ==========================================
# Stage 1: Build & Extract Layers
# ==========================================
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /build

# Copy pom.xml to fetch dependencies and cache this layer
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline -B

# Copy source and build package
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn clean package -DskipTests

# Extract JAR using layertools
WORKDIR /build/extracted
RUN java -Djarmode=layertools -jar /build/target/*.jar extract

# ==========================================
# Stage 2: Production JRE Runner
# ==========================================
FROM eclipse-temurin:17-jre
WORKDIR /app

# Least-privilege security: Non-root user
RUN groupadd -r spring && useradd -r -g spring spring
RUN mkdir -p /app/uploads && chown -R spring:spring /app/uploads
USER spring:spring

# Copy extracted layers
COPY --from=builder /build/extracted/dependencies/ ./
COPY --from=builder /build/extracted/spring-boot-loader/ ./
COPY --from=builder /build/extracted/snapshot-dependencies/ ./
COPY --from=builder /build/extracted/application/ ./

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
