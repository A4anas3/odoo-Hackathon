package com.odoo.hr.user.config;

import com.odoo.hr.attendance.model.Attendance;
import com.odoo.hr.attendance.repository.AttendanceRepository;
import com.odoo.hr.contract.model.Contract;
import com.odoo.hr.contract.repository.ContractRepository;
import com.odoo.hr.employee.model.Employee;
import com.odoo.hr.employee.repository.EmployeeRepository;
import com.odoo.hr.organization.model.Department;
import com.odoo.hr.organization.model.JobPosition;
import com.odoo.hr.organization.repository.DepartmentRepository;
import com.odoo.hr.organization.repository.JobPositionRepository;
import com.odoo.hr.salary.model.SalaryStructure;
import com.odoo.hr.salary.repository.SalaryStructureRepository;
import com.odoo.hr.schedule.model.WorkingSchedule;
import com.odoo.hr.schedule.repository.WorkingScheduleRepository;
import com.odoo.hr.user.model.Role;
import com.odoo.hr.user.model.User;
import com.odoo.hr.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.*;

@Slf4j
@Component
@Order(30) // Executes after DataInitializer (10) and AdminUserInitializer (20)
@RequiredArgsConstructor
public class IndianUsersDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final ContractRepository contractRepository;
    private final AttendanceRepository attendanceRepository;
    private final DepartmentRepository departmentRepository;
    private final JobPositionRepository jobPositionRepository;
    private final SalaryStructureRepository salaryStructureRepository;
    private final WorkingScheduleRepository workingScheduleRepository;
    private final PasswordEncoder passwordEncoder;

    private static final List<String> HINDU_FIRST = List.of(
        "Aarav", "Aditya", "Arjun", "Rohan", "Rahul", "Suresh", "Amit", "Rajesh", "Siddharth", "Nikhil",
        "Sanjay", "Vivek", "Gaurav", "Manoj", "Alok", "Akash", "Deepak", "Varun", "Aniket", "Mayank",
        "Harsh", "Kunal", "Pranav", "Yash", "Abhinav", "Kartik", "Dev", "Ishaan", "Chetan", "Sachin",
        "Tushar", "Saurabh", "Manish", "Ashish", "Rakesh", "Vishal", "Rohit", "Naveen", "Sunil", "Rajat",
        "Ananya", "Priya", "Sneha", "Pooja", "Neha", "Deepa", "Kavita", "Meera", "Ritu", "Sunita",
        "Swati", "Divya", "Preeti", "Shweta", "Tanvi", "Payal", "Rashmi", "Anjali", "Ishita", "Shruti",
        "Pallavi", "Riya", "Shreya", "Kriti", "Aditi", "Simran", "Bhavna", "Komal", "Aarti", "Sangeeta",
        "Vandana", "Shilpa", "Jyoti", "Rekha", "Anita", "Poonam", "Nisha", "Sonali", "Geeta", "Nidhi",
        "Tarun", "Vijay", "Anil", "Umesh", "Dinesh", "Kiran", "Madhav", "Mohit", "Girish", "Hemant",
        "Lata", "Urmila", "Seema", "Alka", "Manju", "Sarita", "Sushma", "Mamta", "Asha", "Kamla"
    );

    private static final List<String> HINDU_LAST = List.of(
        "Sharma", "Verma", "Gupta", "Mehta", "Patel", "Joshi", "Reddy", "Iyer", "Nair", "Kumar",
        "Singh", "Rao", "Desai", "Bhatt", "Mishra", "Kulkarni", "Chatterjee", "Banerjee", "Mukherjee", "Choudhury",
        "Agarwal", "Trivedi", "Saxena", "Pandey", "Shukla", "Tiwari", "Dubey", "Bhatia", "Kapoor", "Malhotra",
        "Khanna", "Grover", "Sethi", "Singhal", "Chauhan", "Yadav", "Rajput", "Goswami", "Thakur", "Nambiar",
        "Pillai", "Hegde", "Shetty", "Pai", "Shenoy", "Bhardwaj", "Kaushik", "Vyas", "Shroff", "Somani"
    );

    private static final List<String> MUSLIM_FIRST = List.of(
        "Mohammed", "Zaid", "Farhan", "Tariq", "Imran", "Aamir", "Bilal", "Salman", "Rehan", "Faisal",
        "Arshad", "Sameer", "Danish", "Asif", "Rizwan", "Kabir", "Shahrukh", "Saif", "Sohail", "Irfan",
        "Nadeem", "Wasim", "Waseem", "Junaid", "Hamza", "Rayyan", "Zubair", "Nasir", "Usman", "Shaan",
        "Adil", "Shoaib", "Shakil", "Naveed", "Azhar", "Rashid", "Mustaq", "Altaf", "Parvez", "Mansoor",
        "Fatima", "Aisha", "Zoya", "Sana", "Yasmin", "Ayesha", "Parveen", "Shazia", "Nazia", "Afreen",
        "Farzana", "Sadia", "Zeenat", "Nargis", "Shabnam", "Rubina", "Samina", "Heena", "Reshma", "Naseem",
        "Shamim", "Tasneem", "Bushra", "Alfiya", "Saira", "Tabassum", "Noor", "Mehreen", "Sumaiya", "Razia",
        "Muskaan", "Zarina", "Salma", "Firdaus", "Rukhsar", "Gulafsha", "Mehzabeen", "Rehana", "Shabana", "Shaheen",
        "Fahad", "Haroon", "Shabbir", "Owais", "Shahid", "Iqbal", "Sikandar", "Javed", "Tanveer", "Naeem",
        "Lubna", "Fouzia", "Rizwana", "Tasleem", "Shagufta", "Farah", "Anjum", "Kausar", "Ghazala", "Munira"
    );

    private static final List<String> MUSLIM_LAST = List.of(
        "Khan", "Ahmed", "Ali", "Siddiqui", "Shaikh", "Ansari", "Qureshi", "Mirza", "Malik", "Sayed",
        "Hussain", "Shah", "Farooqui", "Usmani", "Hashmi", "Warsi", "Pathan", "Chishti", "Kazmi", "Baig",
        "Merchant", "Inamdar", "Kazi", "Quadri", "Maniar", "Mansuri", "Bukhari", "Gilani", "Alvi", "Naqvi",
        "Razvi", "Jaffery", "Abbasi", "Nomani", "Thanvi", "Madani", "Shirazi", "Rehmani", "Saifi", "Nizami",
        "Sultani", "Faruqi", "Pashah", "Memon", "Attar", "Daud", "Nawab", "Khatri", "Saeed", "Gori"
    );

    private static final List<String> CITIES = List.of(
        "Bandra West, Mumbai, Maharashtra",
        "Indiranagar, Bengaluru, Karnataka",
        "Connaught Place, New Delhi, Delhi",
        "Banjara Hills, Hyderabad, Telangana",
        "Koregaon Park, Pune, Maharashtra",
        "T. Nagar, Chennai, Tamil Nadu",
        "Park Street, Kolkata, West Bengal",
        "Navrangpura, Ahmedabad, Gujarat",
        "Hazratganj, Lucknow, Uttar Pradesh",
        "C-Scheme, Jaipur, Rajasthan",
        "Sector 17, Chandigarh",
        "MG Road, Kochi, Kerala",
        "Vijay Nagar, Indore, Madhya Pradesh",
        "Arera Colony, Bhopal, Madhya Pradesh",
        "Civil Lines, Nagpur, Maharashtra"
    );

    private static final List<String> BANKS = List.of(
        "HDFC Bank", "State Bank of India", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank"
    );

    private static final List<String> IFSCS = List.of(
        "HDFC0001234", "SBIN0005678", "ICIC0009101", "UTIB0002345", "KKBK0003456"
    );

    private record PersonSeed(String firstName, String lastName, boolean isMuslim) {}

    @Override
    @Transactional
    public void run(String... args) {
        if (employeeRepository.existsByEmployeeCode("EMP-1001")) {
            Employee firstEmp = employeeRepository.findByEmployeeCode("EMP-1001").orElse(null);
            if (firstEmp != null && !contractRepository.findByEmployeeId(firstEmp.getId()).isEmpty()) {
                long attCount = attendanceRepository.count();
                if (attCount > 1000) {
                    log.info("Indian users with wages/contracts and attendance already seeded (EMP-1001 exists, attCount={}). Skipping.", attCount);
                    return;
                }
                log.info("EMP-1001 exists but attendance count is {} (low). Generating attendance for all employees...", attCount);
                seedMissingAttendanceForAllEmployees();
                return;
            }
        }

        log.info("Starting Indian users & salary contracts bulk seeder: 250 users (10 Admin, 10 HR, 230 Employees - 125 Hindu & 125 Muslim)...");
        seed250IndianUsersWithContracts();
    }

    private void seed250IndianUsersWithContracts() {
        // Pre-fetch departments and positions
        List<Department> departments = departmentRepository.findAll();
        Department defaultDept = !departments.isEmpty() ? departments.get(0) : null;
        Department hrDept = departments.stream()
            .filter(d -> d.getName() != null && d.getName().toLowerCase().contains("human"))
            .findFirst().orElse(defaultDept);
        Department engDept = departments.stream()
            .filter(d -> d.getName() != null && d.getName().toLowerCase().contains("eng"))
            .findFirst().orElse(defaultDept);

        List<JobPosition> jobPositions = jobPositionRepository.findAll();
        JobPosition defaultJob = !jobPositions.isEmpty() ? jobPositions.get(0) : null;
        JobPosition hrJob = jobPositions.stream()
            .filter(j -> j.getTitle() != null && j.getTitle().toLowerCase().contains("hr"))
            .findFirst().orElse(defaultJob);
        JobPosition adminJob = jobPositions.stream()
            .filter(j -> j.getTitle() != null && (j.getTitle().toLowerCase().contains("fullstack") || j.getTitle().toLowerCase().contains("devops")))
            .findFirst().orElse(defaultJob);

        SalaryStructure structRegular = salaryStructureRepository.findByName("Regular Salary")
            .orElseGet(() -> salaryStructureRepository.findAll().stream().findFirst().orElse(null));
        SalaryStructure structAdmin = salaryStructureRepository.findByName("Admin Salary")
            .orElse(structRegular);
        SalaryStructure structContractor = salaryStructureRepository.findByName("Contractor")
            .orElse(structRegular);

        WorkingSchedule defaultSchedule = workingScheduleRepository.findAll().stream()
            .filter(s -> "ACTIVE".equalsIgnoreCase(s.getStatus()))
            .findFirst()
            .orElse(null);

        // Build 125 Hindu and 125 Muslim name pairs
        List<PersonSeed> hinduList = new ArrayList<>();
        for (int i = 0; i < 125; i++) {
            String f = HINDU_FIRST.get(i % HINDU_FIRST.size());
            String l = HINDU_LAST.get(((i / HINDU_FIRST.size()) + i * 3) % HINDU_LAST.size());
            hinduList.add(new PersonSeed(f, l, false));
        }

        List<PersonSeed> muslimList = new ArrayList<>();
        for (int i = 0; i < 125; i++) {
            String f = MUSLIM_FIRST.get(i % MUSLIM_FIRST.size());
            String l = MUSLIM_LAST.get(((i / MUSLIM_FIRST.size()) + i * 3) % MUSLIM_LAST.size());
            muslimList.add(new PersonSeed(f, l, true));
        }

        // Interleave Hindu and Muslim:
        // Index 0..9: 10 ADMINS (5 Hindu, 5 Muslim)
        // Index 10..19: 10 HR MANAGERS (5 Hindu, 5 Muslim)
        // Index 20..249: 230 EMPLOYEES (115 Hindu, 115 Muslim)
        List<PersonSeed> orderedList = new ArrayList<>(250);
        int hIdx = 0;
        int mIdx = 0;

        for (int i = 0; i < 250; i++) {
            if (i % 2 == 0) {
                orderedList.add(hinduList.get(hIdx++));
            } else {
                orderedList.add(muslimList.get(mIdx++));
            }
        }

        String encodedPassword = passwordEncoder.encode("Passw0rd123");
        Set<String> usedEmails = new HashSet<>();
        List<Employee> employeesToSave = new ArrayList<>(250);
        List<User> usersToSave = new ArrayList<>(250);
        List<Contract> contractsToSave = new ArrayList<>(250);

        int adminCount = 0;
        int hrCount = 0;
        int employeeCount = 0;

        for (int i = 0; i < 250; i++) {
            PersonSeed person = orderedList.get(i);
            int codeNumber = 1001 + i;
            String empCode = String.format("EMP-%04d", codeNumber);

            // Generate clean unique email
            String baseEmail = (person.firstName() + "." + person.lastName())
                .toLowerCase()
                .replaceAll("[^a-z]", "");
            String email = baseEmail + "@company.com";
            int counter = 2;
            while (usedEmails.contains(email) || userRepository.existsByEmailIgnoreCase(email)) {
                email = baseEmail + counter + "@company.com";
                counter++;
            }
            usedEmails.add(email);

            // Determine Role and Department/Job
            Role role;
            Department dept;
            JobPosition job;
            BigDecimal monthlyWage;
            SalaryStructure contractStructure;

            if (i < 10) {
                role = Role.ADMIN;
                dept = engDept != null ? engDept : defaultDept;
                job = adminJob != null ? adminJob : defaultJob;
                monthlyWage = new BigDecimal(120000 + (i * 6000)); // ₹120,000 to ₹174,000 / month
                contractStructure = structAdmin != null ? structAdmin : structRegular;
                adminCount++;
            } else if (i < 20) {
                role = Role.HR_MANAGER;
                dept = hrDept != null ? hrDept : defaultDept;
                job = hrJob != null ? hrJob : defaultJob;
                monthlyWage = new BigDecimal(75000 + ((i - 10) * 3500)); // ₹75,000 to ₹106,500 / month
                contractStructure = structAdmin != null ? structAdmin : structRegular;
                hrCount++;
            } else {
                role = Role.EMPLOYEE;
                dept = !departments.isEmpty() ? departments.get(i % departments.size()) : defaultDept;
                job = !jobPositions.isEmpty() ? jobPositions.get(i % jobPositions.size()) : defaultJob;
                monthlyWage = new BigDecimal(42000 + ((i * 1850) % 53000)); // ₹42,000 to ₹94,000 / month
                contractStructure = structRegular;
                employeeCount++;
            }

            String city = CITIES.get(i % CITIES.size());
            int bankIdx = i % BANKS.size();
            String bank = BANKS.get(bankIdx);
            String ifsc = IFSCS.get(bankIdx);
            String phone = String.format("+91 98%03d %05d", (100 + (i * 7) % 900), (10000 + (i * 37) % 90000));
            LocalDate joiningDate = LocalDate.of(2022 + (i % 3), 1 + (i % 12), 1 + (i % 28));

            Employee emp = Employee.builder()
                .authProviderUserId(email)
                .employeeCode(empCode)
                .firstName(person.firstName())
                .lastName(person.lastName())
                .email(email)
                .phone(phone)
                .dateOfBirth(LocalDate.of(1985 + (i % 15), 1 + (i % 12), 1 + (i % 28)))
                .address(city)
                .department(dept)
                .jobPosition(job)
                .workingSchedule(defaultSchedule)
                .joiningDate(joiningDate)
                .employeeType("FULL_TIME")
                .status("ACTIVE")
                .bankName(bank)
                .bankAccountNo(String.format("%014d", 50100000000000L + (long) i * 192837L))
                .ifscCode(ifsc)
                .emergencyContactName(person.lastName() + " Family")
                .emergencyContactPhone(phone)
                .build();

            employeesToSave.add(emp);

            // Create User linked to this Employee
            User user = User.builder()
                .email(email)
                .passwordHash(encodedPassword)
                .employee(emp)
                .roles(new HashSet<>(Set.of(role)))
                .status("ACTIVE")
                .build();

            usersToSave.add(user);

            boolean isHourly = (i % 8 == 7);
            String wageType = isHourly ? "HOURLY" : "MONTHLY";
            String contractType = isHourly ? "HOURLY" : "PERMANENT";
            BigDecimal salaryAmount = isHourly
                ? new BigDecimal(300 + ((i % 5) * 50))
                : monthlyWage;
            SalaryStructure structureToUse = isHourly ? structContractor : contractStructure;

            // Create Running Contract with Wages / Salary
            Contract contract = Contract.builder()
                .employee(emp)
                .wageType(wageType)
                .contractType(contractType)
                .startDate(joiningDate)
                .salary(salaryAmount)
                .salaryStructure(structureToUse)
                .workingSchedule(defaultSchedule)
                .status("RUNNING")
                .build();

            contractsToSave.add(contract);
        }

        // Batch save to PostgreSQL database
        employeeRepository.saveAll(employeesToSave);
        userRepository.saveAll(usersToSave);
        contractRepository.saveAll(contractsToSave);

        // Generate complete, realistic attendance records for ALL 250 employees across September, February, and January
        seedAttendanceRecordsForEmployees(employeesToSave);

        log.info("Successfully seeded 250 Indian users with running salary contracts and attendance records into HRMS database: Admin={}, HR={}, Employee={}, Total={}",
            adminCount, hrCount, employeeCount, usersToSave.size());
    }

    @Transactional
    public void resetAndSeedIndianUsersContractsAndAttendance(SalaryStructure structRegular, SalaryStructure structAdmin, SalaryStructure structContractor, WorkingSchedule defaultSchedule) {
        List<Employee> indianEmployees = employeeRepository.findAll().stream()
            .filter(e -> e.getEmployeeCode() != null && e.getEmployeeCode().startsWith("EMP-1"))
            .sorted(Comparator.comparing(Employee::getEmployeeCode))
            .toList();

        if (indianEmployees.isEmpty()) {
            log.info("No EMP-1xxx Indian employees found to reseed contracts for.");
            return;
        }

        log.info("Reseeding contracts and attendance for {} Indian employees with the wages system...", indianEmployees.size());
        List<Contract> contracts = new ArrayList<>();
        int i = 0;
        for (Employee emp : indianEmployees) {
            boolean isHourly = (i % 8 == 7);
            boolean isAdminOrHr = (i < 20);
            String wageType = isHourly ? "HOURLY" : "MONTHLY";
            String contractType = isHourly ? "HOURLY" : "PERMANENT";
            SalaryStructure struct = isHourly ? structContractor : (isAdminOrHr ? structAdmin : structRegular);
            BigDecimal salary = isHourly
                ? new BigDecimal(300 + ((i % 5) * 50))
                : (isAdminOrHr ? new BigDecimal(75000 + (i * 3000)) : new BigDecimal(42000 + ((i * 1850) % 53000)));

            contracts.add(Contract.builder()
                .employee(emp)
                .wageType(wageType)
                .contractType(contractType)
                .startDate(emp.getJoiningDate() != null ? emp.getJoiningDate() : LocalDate.of(2023, 1, 1))
                .salary(salary)
                .salaryStructure(struct)
                .workingSchedule(defaultSchedule)
                .status("RUNNING")
                .build());
            i++;
        }
        contractRepository.saveAll(contracts);

        // Seed attendance
        seedAttendanceRecordsForEmployees(indianEmployees);
        log.info("Successfully re-seeded {} contracts and attendance records for Indian users.", contracts.size());
    }

    private void seedAttendanceRecordsForEmployees(List<Employee> employees) {
        List<Attendance> attendancesToSave = new ArrayList<>();
        Set<LocalDate> sampleDates = new LinkedHashSet<>(List.of(
            LocalDate.now(),
            LocalDate.now().minusDays(1),
            LocalDate.of(2026, 9, 1),
            LocalDate.of(2026, 9, 2),
            LocalDate.of(2026, 9, 3),
            LocalDate.of(2026, 9, 4),
            LocalDate.of(2026, 2, 2),
            LocalDate.of(2026, 2, 9),
            LocalDate.of(2026, 2, 16),
            LocalDate.of(2026, 2, 17),
            LocalDate.of(2026, 2, 23),
            LocalDate.of(2026, 1, 12),
            LocalDate.of(2026, 1, 15),
            LocalDate.of(2026, 1, 16),
            LocalDate.of(2026, 1, 22)
        ));

        Set<String> seenEmpDate = new HashSet<>();
        for (Employee emp : employees) {
            for (LocalDate date : sampleDates) {
                String key = emp.getId() + "_" + date;
                if (!seenEmpDate.add(key)) {
                    continue;
                }
                int hash = Math.abs((emp.getEmployeeCode().hashCode() * 31 + date.hashCode()) % 100);

                String status;
                OffsetDateTime inTime = null;
                OffsetDateTime outTime = null;
                BigDecimal worked;
                BigDecimal ot;
                int late = 0;
                String notes;

                if (hash < 92) {
                    status = "PRESENT";
                    int inMin = (hash % 20);
                    int outMin = ((hash * 3) % 40);
                    inTime = OffsetDateTime.of(date.getYear(), date.getMonthValue(), date.getDayOfMonth(), 9, inMin, 0, 0, ZoneOffset.ofHoursMinutes(5, 30));
                    outTime = OffsetDateTime.of(date.getYear(), date.getMonthValue(), date.getDayOfMonth(), 18, outMin, 0, 0, ZoneOffset.ofHoursMinutes(5, 30));
                    double hours = 8.5 + ((hash % 10) * 0.1);
                    worked = BigDecimal.valueOf(hours).setScale(2, RoundingMode.HALF_UP);
                    ot = BigDecimal.valueOf(Math.max(0, hours - 8.0)).setScale(2, RoundingMode.HALF_UP);
                    late = inMin > 10 ? inMin - 10 : 0;
                    notes = late > 0 ? "Shift completed (late arrival " + late + "m)" : "Regular daily shift completed";
                } else if (hash < 97) {
                    status = "ON_LEAVE";
                    worked = BigDecimal.ZERO;
                    ot = BigDecimal.ZERO;
                    notes = "Approved paid time off";
                } else {
                    status = "ABSENT";
                    worked = BigDecimal.ZERO;
                    ot = BigDecimal.ZERO;
                    notes = "Unplanned absence - notified HR";
                }

                attendancesToSave.add(Attendance.builder()
                    .employee(emp)
                    .attendanceDate(date)
                    .checkIn(inTime != null ? inTime : OffsetDateTime.of(date.getYear(), date.getMonthValue(), date.getDayOfMonth(), 9, 0, 0, 0, ZoneOffset.ofHoursMinutes(5, 30)))
                    .checkOut(outTime)
                    .scheduledHours(new BigDecimal("8.00"))
                    .workedHours(worked)
                    .overtimeHours(ot)
                    .lateMinutes(late)
                    .status(status)
                    .notes(notes)
                    .build());
            }
        }

        attendanceRepository.saveAll(attendancesToSave);
    }

    public void seedMissingAttendanceForAllEmployees() {
        List<Employee> allEmployees = employeeRepository.findAll();
        Set<LocalDate> sampleDates = new LinkedHashSet<>(List.of(
            LocalDate.now(),
            LocalDate.now().minusDays(1),
            LocalDate.of(2026, 9, 1),
            LocalDate.of(2026, 9, 2),
            LocalDate.of(2026, 9, 3),
            LocalDate.of(2026, 9, 4),
            LocalDate.of(2026, 2, 2),
            LocalDate.of(2026, 2, 9),
            LocalDate.of(2026, 2, 16),
            LocalDate.of(2026, 2, 17),
            LocalDate.of(2026, 2, 23),
            LocalDate.of(2026, 1, 12),
            LocalDate.of(2026, 1, 15),
            LocalDate.of(2026, 1, 16),
            LocalDate.of(2026, 1, 22)
        ));

        List<Attendance> attendancesToSave = new ArrayList<>();
        Set<String> seenEmpDate = new HashSet<>();
        for (Employee emp : allEmployees) {
            for (LocalDate date : sampleDates) {
                String key = emp.getId() + "_" + date;
                if (!seenEmpDate.add(key)) {
                    continue;
                }
                if (attendanceRepository.findByEmployeeIdAndAttendanceDate(emp.getId(), date).isPresent()) {
                    continue;
                }

                int hash = Math.abs((emp.getEmployeeCode().hashCode() * 31 + date.hashCode()) % 100);
                String status;
                OffsetDateTime inTime = null;
                OffsetDateTime outTime = null;
                BigDecimal worked;
                BigDecimal ot;
                int late = 0;
                String notes;

                if (hash < 92) {
                    status = "PRESENT";
                    int inMin = (hash % 20);
                    int outMin = ((hash * 3) % 40);
                    inTime = OffsetDateTime.of(date.getYear(), date.getMonthValue(), date.getDayOfMonth(), 9, inMin, 0, 0, ZoneOffset.ofHoursMinutes(5, 30));
                    outTime = OffsetDateTime.of(date.getYear(), date.getMonthValue(), date.getDayOfMonth(), 18, outMin, 0, 0, ZoneOffset.ofHoursMinutes(5, 30));
                    double hours = 8.5 + ((hash % 10) * 0.1);
                    worked = BigDecimal.valueOf(hours).setScale(2, RoundingMode.HALF_UP);
                    ot = BigDecimal.valueOf(Math.max(0, hours - 8.0)).setScale(2, RoundingMode.HALF_UP);
                    late = inMin > 10 ? inMin - 10 : 0;
                    notes = late > 0 ? "Shift completed (late arrival " + late + "m)" : "Regular daily shift completed";
                } else if (hash < 97) {
                    status = "ON_LEAVE";
                    worked = BigDecimal.ZERO;
                    ot = BigDecimal.ZERO;
                    notes = "Approved paid time off";
                } else {
                    status = "ABSENT";
                    worked = BigDecimal.ZERO;
                    ot = BigDecimal.ZERO;
                    notes = "Unplanned absence - notified HR";
                }

                attendancesToSave.add(Attendance.builder()
                    .employee(emp)
                    .attendanceDate(date)
                    .checkIn(inTime != null ? inTime : OffsetDateTime.of(date.getYear(), date.getMonthValue(), date.getDayOfMonth(), 9, 0, 0, 0, ZoneOffset.ofHoursMinutes(5, 30)))
                    .checkOut(outTime)
                    .scheduledHours(new BigDecimal("8.00"))
                    .workedHours(worked)
                    .overtimeHours(ot)
                    .lateMinutes(late)
                    .status(status)
                    .notes(notes)
                    .build());
            }
        }

        if (!attendancesToSave.isEmpty()) {
            attendanceRepository.saveAll(attendancesToSave);
            log.info("Saved {} missing attendance records across {} employees.", attendancesToSave.size(), allEmployees.size());
        }
    }
}
