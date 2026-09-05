package com.odoo.hr;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.odoo.hr.timeoff.model.TimeOffType;
import com.odoo.hr.timeoff.repository.TimeOffTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@ActiveProfiles("test")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class HrPipelineIntegrationTest {

    private static final String JWT_SUB = "auth0|usr_pipeline_test_456";

    @Autowired
    private WebApplicationContext webApplicationContext;

    @Autowired
    private TimeOffTypeRepository timeOffTypeRepository;

    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

    private static UUID createdEmployeeId;
    private static UUID createdContractId;
    private static UUID createdTimeOffTypeId;

    @BeforeEach
    void setUp() {
        if (mockMvc == null) {
            mockMvc = MockMvcBuilders.webAppContextSetup(webApplicationContext)
                    .apply(springSecurity())
                    .build();
        }
    }

    @Test
    @Order(1)
    void step1_shouldRegisterAndResolveEmployeeFromJwtSub() throws Exception {
        // Pipeline Step 1 & 2: JWT sub -> auth_provider_user_id -> Employee Table -> Employee.id
        String payload = """
            {
                "employeeCode": "EMP-001",
                "email": "sarah.connor@odoo.com",
                "firstName": "Sarah",
                "lastName": "Connor",
                "phone": "+1-555-0199",
                "joiningDate": "2026-01-15",
                "employeeType": "FULL_TIME"
            }
            """;

        MvcResult result = mockMvc.perform(post("/api/v1/employees/me")
                        .with(jwt().jwt(builder -> builder.subject(JWT_SUB)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.authProviderUserId", is(JWT_SUB)))
                .andExpect(jsonPath("$.employeeCode", is("EMP-001")))
                .andExpect(jsonPath("$.email", is("sarah.connor@odoo.com")))
                .andExpect(jsonPath("$.fullName", is("Sarah Connor")))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        createdEmployeeId = UUID.fromString(root.get("id").asText());

        // Verify GET /me resolves the exact same Employee via JWT sub
        mockMvc.perform(get("/api/v1/employees/me")
                        .with(jwt().jwt(builder -> builder.subject(JWT_SUB))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(createdEmployeeId.toString())))
                .andExpect(jsonPath("$.authProviderUserId", is(JWT_SUB)));
    }

    @Test
    @Order(2)
    void step2_shouldCreateAndRetrieveContractScopedByEmployeeId() throws Exception {
        // Pipeline Step 3: Employee.id -> Contracts
        String payload = String.format("""
            {
                "employeeId": "%s",
                "contractType": "PERMANENT",
                "startDate": "2026-01-15",
                "salary": 9500.00,
                "status": "RUNNING"
            }
            """, createdEmployeeId);

        MvcResult result = mockMvc.perform(post("/api/v1/contracts")
                        .with(jwt().jwt(builder -> builder.subject(JWT_SUB)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.employeeId", is(createdEmployeeId.toString())))
                .andExpect(jsonPath("$.salary", is(9500.00)))
                .andExpect(jsonPath("$.status", is("RUNNING")))
                .andReturn();

        JsonNode root = objectMapper.readTree(result.getResponse().getContentAsString());
        createdContractId = UUID.fromString(root.get("id").asText());

        // Verify self-service retrieval via GET /my
        mockMvc.perform(get("/api/v1/contracts/my")
                        .with(jwt().jwt(builder -> builder.subject(JWT_SUB))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].salary", is(9500.00)));
    }

    @Test
    @Order(3)
    void step3_shouldRecordAttendanceScopedByEmployeeId() throws Exception {
        // Pipeline Step 4: Employee.id -> Attendance
        mockMvc.perform(post("/api/v1/attendance/check-in")
                        .with(jwt().jwt(builder -> builder.subject(JWT_SUB)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.employeeId", is(createdEmployeeId.toString())))
                .andExpect(jsonPath("$.attendanceDate", is(LocalDate.now().toString())))
                .andExpect(jsonPath("$.status", is("PRESENT")));

        mockMvc.perform(post("/api/v1/attendance/check-out")
                        .with(jwt().jwt(builder -> builder.subject(JWT_SUB)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkOut").isNotEmpty());

        mockMvc.perform(get("/api/v1/attendance/my")
                        .with(jwt().jwt(builder -> builder.subject(JWT_SUB))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThanOrEqualTo(1))))
                .andExpect(jsonPath("$[0].employeeId", is(createdEmployeeId.toString())));
    }

    @Test
    @Order(4)
    void step4_shouldSubmitAndRetrieveTimeOffRequestScopedByEmployeeId() throws Exception {
        // Pipeline Step 5: Employee.id -> TimeOff
        TimeOffType timeOffType = timeOffTypeRepository.findByName("ANNUAL")
                .orElseGet(() -> timeOffTypeRepository.save(TimeOffType.builder()
                        .name("ANNUAL")
                        .description("Annual Paid Leave")
                        .paid(true)
                        .requiresApproval(true)
                        .build()));
        createdTimeOffTypeId = timeOffType.getId();

        LocalDate tomorrow = LocalDate.now().plusDays(1);
        LocalDate dayAfter = LocalDate.now().plusDays(3);

        String payload = String.format("""
            {
                "timeOffTypeId": "%s",
                "startDate": "%s",
                "endDate": "%s",
                "duration": 3.0,
                "reason": "Family vacation"
            }
            """, createdTimeOffTypeId, tomorrow, dayAfter);

        mockMvc.perform(post("/api/v1/time-off/requests")
                        .with(jwt().jwt(builder -> builder.subject(JWT_SUB)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.employeeId", is(createdEmployeeId.toString())))
                .andExpect(jsonPath("$.duration", is(3.0)))
                .andExpect(jsonPath("$.status", is("PENDING")));

        mockMvc.perform(get("/api/v1/time-off/requests/my")
                        .with(jwt().jwt(builder -> builder.subject(JWT_SUB))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].employeeId", is(createdEmployeeId.toString())))
                .andExpect(jsonPath("$[0].reason", is("Family vacation")));
    }

    @Test
    @Order(5)
    void step5_shouldGeneratePayrunAndPayslipsScopedByEmployeeId() throws Exception {
        // Pipeline Step 6 & 7: Employee.id & Contract.id -> Payruns & Payslips
        String payload = """
            {
                "periodStart": "2026-09-01",
                "periodEnd": "2026-09-30"
            }
            """;

        mockMvc.perform(post("/api/v1/payroll/payruns")
                        .with(jwt().jwt(builder -> builder.subject(JWT_SUB)))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty())
                .andExpect(jsonPath("$.totalNet", is(9500.00)))
                .andExpect(jsonPath("$.payslipCount", greaterThanOrEqualTo(1)));

        // Retrieve payslips for the authenticated employee via JWT sub -> Employee.id
        mockMvc.perform(get("/api/v1/payroll/payslips/my")
                        .with(jwt().jwt(builder -> builder.subject(JWT_SUB))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].employeeId", is(createdEmployeeId.toString())))
                .andExpect(jsonPath("$[0].contractId", is(createdContractId.toString())))
                .andExpect(jsonPath("$[0].grossSalary", is(9500.00)))
                .andExpect(jsonPath("$[0].netSalary", is(9500.00)))
                .andExpect(jsonPath("$[0].lines", hasSize(greaterThanOrEqualTo(1))));
    }
}
