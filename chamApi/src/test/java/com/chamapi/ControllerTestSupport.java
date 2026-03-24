package com.chamapi;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.json.JsonMapper;

@SpringBootTest
@AutoConfigureMockMvc
public abstract class ControllerTestSupport {
    
    @Autowired
    protected MockMvc mockMvc;
    
    @Autowired
    protected JsonMapper jsonMapper;
    
}
