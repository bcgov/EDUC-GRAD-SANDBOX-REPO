package ca.bc.gov.gradsandbox;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GradSandboxApiApplication {

	private static Logger logger = LoggerFactory.getLogger(GradSandboxApiApplication.class);

	public static void main(String[] args) {
		logger.debug("*** Starting Application ***");
		SpringApplication.run(GradSandboxApiApplication.class, args);
		logger.debug("*** Application Started ***");
	}

}
