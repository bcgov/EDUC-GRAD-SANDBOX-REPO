package ca.bc.gov.gradsandbox.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;

@Service
public class SandboxService {

    @Value("classpath:templates/student_achievement_report_template.docx")
    Resource reportTemplateResource;

    private static Logger logger = LoggerFactory.getLogger(SandboxService.class);

    public String getData() {
        return "Data from Sandbox Service";
    }

    public String readFileResource() throws IOException {
        logger.debug("Reading File");
        File templateFile = reportTemplateResource.getFile();
        logger.debug("File Path: " + templateFile.getPath());
        return "File Read Successful! Location: " + templateFile.getPath() ;
    }
}
