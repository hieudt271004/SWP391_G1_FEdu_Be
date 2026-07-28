package com.fedu.fedu.service.Impl;

import com.fedu.fedu.dto.req.StudentImportRow;
import com.fedu.fedu.dto.res.ImportRowError;
import com.fedu.fedu.dto.res.ImportStudentsResult;
import com.fedu.fedu.entity.ClassroomSubject;
import com.fedu.fedu.exception.InvalidDataException;
import com.fedu.fedu.exception.ResourceNotFoundException;
import com.fedu.fedu.repository.ClassroomSubjectRepository;
import com.fedu.fedu.service.ClassroomEnrollmentService;
import com.fedu.fedu.service.MailService;
import com.fedu.fedu.service.StudentImportService;
import com.fedu.fedu.utils.enums.Gender;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentImportServiceImpl implements StudentImportService {

    private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[0-9]{10,11}$");

    private final ClassroomSubjectRepository classroomSubjectRepository;
    private final ClassroomEnrollmentService enrollmentService;
    private final MailService mailService;

    @Override
    public ImportStudentsResult importStudents(Long classroomSubjectId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new InvalidDataException("File rỗng. Vui lòng chọn file Excel (.xlsx).");
        }
        String name = file.getOriginalFilename();
        if (name == null || !name.toLowerCase().endsWith(".xlsx")) {
            throw new InvalidDataException("Chỉ chấp nhận file Excel định dạng .xlsx");
        }

        ClassroomSubject cs = classroomSubjectRepository.findById(classroomSubjectId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Classroom-subject not found with id: " + classroomSubjectId));
        com.fedu.fedu.utils.ClassroomGuards.assertOpen(cs);
        String classLabel = buildClassLabel(cs);

        ImportStudentsResult result = ImportStudentsResult.builder().build();
        DataFormatter fmt = new DataFormatter();

        // ── Phase 1: Parse & validate ALL rows first ──
        List<StudentImportRow> validatedRows = new ArrayList<>();
        List<Integer> rowNumbers = new ArrayList<>();

        try (Workbook wb = new XSSFWorkbook(file.getInputStream())) {
            Sheet sheet = wb.getSheetAt(0);
            int lastRow = sheet.getLastRowNum();
            for (int i = 1; i <= lastRow; i++) {
                Row r = sheet.getRow(i);
                if (r == null) continue;

                String email = str(r, 0, fmt);
                String lastName = str(r, 1, fmt);
                String firstName = str(r, 2, fmt);

                // skip completely blank rows
                if (isBlank(email) && isBlank(lastName) && isBlank(firstName)) continue;

                int rowNo = i + 1;
                result.setTotalRows(result.getTotalRows() + 1);

                // ── Validate required fields ──
                if (isBlank(email) || !EMAIL.matcher(email).matches()) {
                    addError(result, rowNo, email, "Email trống hoặc sai định dạng");
                    continue;
                }
                if (isBlank(lastName) || isBlank(firstName)) {
                    addError(result, rowNo, email, "Thiếu Họ hoặc Tên");
                    continue;
                }

                // ── Validate optional fields ──
                Gender gender;
                try {
                    gender = parseGender(str(r, 3, fmt));
                } catch (IllegalArgumentException e) {
                    addError(result, rowNo, email, e.getMessage());
                    continue;
                }

                LocalDate dob;
                try {
                    dob = parseDob(r, 4, fmt);
                } catch (IllegalArgumentException e) {
                    addError(result, rowNo, email, e.getMessage());
                    continue;
                }

                String phone = str(r, 5, fmt);
                if (phone != null) {
                    String cleanPhone = phone.replaceAll("[\\s\\-\\.]", "");
                    if (!cleanPhone.isEmpty() && !PHONE_PATTERN.matcher(cleanPhone).matches()) {
                        addError(result, rowNo, email, "Số điện thoại không hợp lệ (yêu cầu 10-11 chữ số)");
                        continue;
                    }
                    phone = cleanPhone;
                }

                StudentImportRow row = StudentImportRow.builder()
                        .email(email.toLowerCase())
                        .lastName(lastName)
                        .firstName(firstName)
                        .gender(gender)
                        .dob(dob)
                        .phone(phone)
                        .build();

                validatedRows.add(row);
                rowNumbers.add(rowNo);
            }
        } catch (InvalidDataException e) {
            throw e;
        } catch (Exception e) {
            throw new InvalidDataException("Không đọc được file Excel: " + e.getMessage());
        }

        // ── If ANY validation errors exist, stop here — do NOT import anything ──
        if (result.getFailed() > 0) {
            return result;
        }

        // ── Phase 2: All rows valid → actually enroll ──
        for (int idx = 0; idx < validatedRows.size(); idx++) {
            StudentImportRow row = validatedRows.get(idx);
            int rowNo = rowNumbers.get(idx);
            try {
                ClassroomEnrollmentService.ImportRowResult outcome =
                        enrollmentService.enrollByImport(classroomSubjectId, row);

                if (outcome.alreadyEnrolled()) {
                    result.setSkipped(result.getSkipped() + 1);
                } else {
                    result.setEnrolled(result.getEnrolled() + 1);
                    if (outcome.newAccount()) {
                        result.setCreated(result.getCreated() + 1);
                    }
                    String fullName = (row.getLastName() + " " + row.getFirstName()).trim();
                    mailService.sendClassEnrollmentEmailAsync(
                            row.getEmail(), fullName, classLabel,
                            outcome.newAccount(), ClassroomEnrollmentService.DEFAULT_STUDENT_PASSWORD);
                }
            } catch (Exception e) {
                addError(result, rowNo, row.getEmail(), rootMessage(e));
            }
        }

        return result;
    }

    @Override
    public byte[] buildTemplate() {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet("Sinh viên");
            CellStyle bold = wb.createCellStyle();
            Font font = wb.createFont();
            font.setBold(true);
            bold.setFont(font);

            String[] cols = {"email", "Họ", "Tên", "Giới tính (MALE/FEMALE/OTHER)", "Ngày sinh (yyyy-MM-dd)", "SĐT"};
            Row header = sheet.createRow(0);
            for (int i = 0; i < cols.length; i++) {
                Cell c = header.createCell(i);
                c.setCellValue(cols[i]);
                c.setCellStyle(bold);
                sheet.setColumnWidth(i, 7000);
            }

            String[] sample = {"sv001@example.com", "Nguyễn", "An", "MALE", "2005-09-20", "0901234567"};
            Row ex = sheet.createRow(1);
            for (int i = 0; i < sample.length; i++) ex.createCell(i).setCellValue(sample[i]);

            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new InvalidDataException("Không tạo được file mẫu: " + e.getMessage());
        }
    }

    

    private String buildClassLabel(ClassroomSubject cs) {
        try {
            return cs.getSubject().getSubjectCode() + " - " + cs.getClassroom().getClassName();
        } catch (Exception e) {
            return "lớp-môn #" + cs.getId();
        }
    }

    private String str(Row r, int c, DataFormatter fmt) {
        Cell cell = r.getCell(c, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        String v = fmt.formatCellValue(cell);
        return v == null ? null : v.trim();
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private Gender parseGender(String s) {
        if (s == null || s.isBlank()) return null;
        String v = s.trim().toLowerCase();
        if (v.equals("male") || v.equals("nam") || v.equals("m")) return Gender.MALE;
        if (v.equals("female") || v.equals("nữ") || v.equals("nu") || v.equals("f")) return Gender.FEMALE;
        if (v.equals("other") || v.equals("khác") || v.equals("khac")) return Gender.OTHER;
        throw new IllegalArgumentException("Giới tính không hợp lệ (hỗ trợ: Nam, Nữ, Khác)");
    }

    private LocalDate parseDob(Row r, int c, DataFormatter fmt) {
        Cell cell = r.getCell(c, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (cell == null) return null;
        try {
            if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
                return cell.getLocalDateTimeCellValue().toLocalDate();
            }
            String s = fmt.formatCellValue(cell).trim();
            if (s.isEmpty()) return null;
            try {
                return LocalDate.parse(s);
            } catch (Exception ex) {
                try {
                    return LocalDate.parse(s, java.time.format.DateTimeFormatter.ofPattern("dd/MM/yyyy"));
                } catch (Exception ex2) {
                    return LocalDate.parse(s, java.time.format.DateTimeFormatter.ofPattern("dd-MM-yyyy"));
                }
            }
        } catch (Exception e) {
            throw new IllegalArgumentException("Ngày sinh không hợp lệ (hỗ trợ yyyy-MM-dd hoặc dd/MM/yyyy)");
        }
    }

    private void addError(ImportStudentsResult result, int rowNo, String email, String reason) {
        result.setFailed(result.getFailed() + 1);
        result.getErrors().add(ImportRowError.builder()
                .rowNumber(rowNo).email(email).reason(reason).build());
    }

    private String rootMessage(Throwable e) {
        Throwable cur = e;
        while (cur.getCause() != null && cur.getCause() != cur) cur = cur.getCause();
        return cur.getMessage() != null ? cur.getMessage() : cur.getClass().getSimpleName();
    }
}
