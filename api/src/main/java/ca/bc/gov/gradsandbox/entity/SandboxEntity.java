package ca.bc.gov.gradsandbox.entity;

import lombok.Data;

//import javax.persistence.Column;
//import javax.persistence.Entity;
//import javax.persistence.Id;
//import javax.persistence.Table;

//@Entity
@Data
//@Table(name = "TAB_CRSE")
public class SandboxEntity {

    //@Id
    //@Column(name = "CRSE_CODE")
    private String courseCode;

    //@Column(name = "CRSE_LEVEL")
    private String courseLevel;

    //@Column(name = "CRSE_NAME")
    private String courseName;

    //@Column(name = "CRSE_REG_ID")
    private String courseRegId;
}
