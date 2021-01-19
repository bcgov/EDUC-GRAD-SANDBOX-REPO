package ca.bc.gov.gradsandbox.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

//import org.springframework.core.io.Resource;
//import org.springframework.core.io.ResourceLoader;

import java.io.*;
import java.util.stream.Collectors;

@Service
public class SandboxService {

    //@Autowired
    //ResourceLoader resourceLoader;

    private static Logger logger = LoggerFactory.getLogger(SandboxService.class);

    public String getData() {
        return "Data from Sandbox Service";
    }

    public String readFileResource() throws IOException {
        logger.debug("Reading File");
        String fileContent = "";

        //Resource reportTemplateResource=resourceLoader.getResource("classpath:templates/student_achievement_report_template.docx");
        //File templateFile = reportTemplateResource.getFile();

        //*************************************
        try (InputStream inputStream = getClass().getResourceAsStream("/templates/student_achievement_report_template.docx");
             BufferedReader reader = new BufferedReader(new InputStreamReader(inputStream))) {
            fileContent = reader.lines()
                    .collect(Collectors.joining(System.lineSeparator()));
        }

        logger.debug("File Content: \n" + fileContent);
        return "File Read Successful! : \n" + fileContent ;
    }
}
