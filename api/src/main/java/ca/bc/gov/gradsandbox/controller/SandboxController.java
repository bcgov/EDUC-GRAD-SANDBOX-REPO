package ca.bc.gov.gradsandbox.controller;

import ca.bc.gov.gradsandbox.service.SandboxService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/get-data")
public class SandboxController {

    @Autowired
    SandboxService sandboxService;

    @GetMapping
    public String getStudentCourses() {
        return sandboxService.getData();
    }
}
