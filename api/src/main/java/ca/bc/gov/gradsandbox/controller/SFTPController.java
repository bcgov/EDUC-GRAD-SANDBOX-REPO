package ca.bc.gov.gradsandbox.controller;

import ca.bc.gov.gradsandbox.utils.SFTPUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class SFTPController {
    @Autowired
    SFTPUtils sftpUtils;

    @GetMapping("/upload")
    public String upload() {
        if (sftpUtils.sftpUpload())
            return "Upload Complete";
        else
            return "Upload Failed";
    }
}
