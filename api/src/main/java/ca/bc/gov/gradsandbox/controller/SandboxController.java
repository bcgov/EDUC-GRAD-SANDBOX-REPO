package ca.bc.gov.gradsandbox.controller;

import ca.bc.gov.gradsandbox.service.SandboxService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
@RequestMapping("/api/v1")
public class SandboxController {

    @Autowired
    SandboxService sandboxService;

    @GetMapping("/get-data")
    public String getStudentCourses() {
        return sandboxService.getData();
    }

    @GetMapping("/read-template")
    public String readFileResource() {
        try {
            return sandboxService.readFileResource();
        } catch (IOException e) {
            e.printStackTrace();
            return "Error reading file: " + e.getMessage();
        }
    }
}
