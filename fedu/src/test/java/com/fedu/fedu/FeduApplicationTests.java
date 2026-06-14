package com.fedu.fedu;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fedu.fedu.dto.req.AddStudentRequest;
import com.fedu.fedu.dto.req.AssignTeacherRequest;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest
class FeduApplicationTests {

	@Test
	void contextLoads() {
	}

	@Test
	void testAddStudentRequestDeserialization() throws Exception {
		ObjectMapper mapper = new ObjectMapper();
		String json = "{\"email\":\"student@fedu.edu.vn\"}";
		AddStudentRequest request = mapper.readValue(json, AddStudentRequest.class);
		assertNotNull(request);
		assertEquals("student@fedu.edu.vn", request.getEmail());
	}

	@Test
	void testAssignTeacherRequestDeserialization() throws Exception {
		ObjectMapper mapper = new ObjectMapper();
		String json = "{\"teacherId\":123}";
		AssignTeacherRequest request = mapper.readValue(json, AssignTeacherRequest.class);
		assertNotNull(request);
		assertEquals(123L, request.getTeacherId());
	}
}
