FROM docker-remote.artifacts.developer.gov.bc.ca/maven:3-jdk-11 as build
WORKDIR /workspace/app

COPY api/pom.xml .
COPY api/src src
RUN mvn package -DskipTests
RUN mkdir -p target/dependency && (cd target/dependency; jar -xf ../*.jar)

FROM docker-remote.artifacts.developer.gov.bc.ca/openjdk:11-jdk
RUN useradd -ms /bin/bash spring && mkdir -p /logs && chown -R spring:spring /logs && chmod 755 /logs

ENV BCMAIL_SFTP_USER=edgrad_sftp
ENV BCMAIL_SSH_PRIVATE_KEY=private-key-goes-here
ENV  BCMAIL_SSH_PUBLIC_KEY=public-key-goes-here
RUN useradd -rm -d /home/${BCMAIL_SFTP_USER} -s /bin/bash -G sudo ${BCMAIL_SFTP_USER}
USER ${BCMAIL_SFTP_USER}
RUN ssh-keygen -t rsa -m pem -N "" -f ~/.ssh/id_rsa
RUN echo ${BCMAIL_SSH_PRIVATE_KEY} > ~/.ssh/id_rsa
RUN echo ${BCMAIL_SSH_PUBLIC_KEY} > ~/.ssh/id_rsa.pub
#RUN ssh-keyscan -H ${BCMAIL_SFTP_HOST} > ~/.ssh/known_hosts
#CMD ["/usr/sbin/sshd", "-D"]
EXPOSE 22

USER spring
VOLUME /tmp
ARG DEPENDENCY=/workspace/app/target/dependency
COPY --from=build ${DEPENDENCY}/BOOT-INF/lib /app/lib
COPY --from=build ${DEPENDENCY}/META-INF /app/META-INF
COPY --from=build ${DEPENDENCY}/BOOT-INF/classes /app
ENTRYPOINT ["java","-Duser.name=GRAD_SANDBOX_API","-Xms512m","-Xmx512m","-noverify","-XX:TieredStopAtLevel=1","-XX:+UseParallelGC","-XX:MinHeapFreeRatio=20","-XX:MaxHeapFreeRatio=40","-XX:GCTimeRatio=4","-XX:AdaptiveSizePolicyWeight=90","-XX:MaxMetaspaceSize=100m","-XX:ParallelGCThreads=1","-Djava.util.concurrent.ForkJoinPool.common.parallelism=1","-XX:CICompilerCount=2","-XX:+ExitOnOutOfMemoryError","-Djava.security.egd=file:/dev/./urandom","-Dspring.backgroundpreinitializer.ignore=true","-cp","app:app/lib/*","ca.bc.gov.gradsandbox.GradSandboxApplication"]
