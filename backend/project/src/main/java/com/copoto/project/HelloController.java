package com.copoto.project;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {
    @GetMapping("/api/comm-demo")
    public String getCommDemoMessage() {
        return "hello world!!~";
    }    
}
