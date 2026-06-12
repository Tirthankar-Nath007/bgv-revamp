package com.tvscs.bgv.service.impl;

import com.tvscs.bgv.domain.dto.response.AccessLogResponse;
import com.tvscs.bgv.domain.dto.response.DashboardStatsResponse;
import com.tvscs.bgv.domain.dto.response.VerifierProfileResponse;
import com.tvscs.bgv.domain.entity.AccessLog;
import com.tvscs.bgv.domain.entity.Employee;
import com.tvscs.bgv.domain.entity.VerificationAttempt;
import com.tvscs.bgv.domain.entity.VerificationRecord;
import com.tvscs.bgv.domain.entity.Verifier;
import com.tvscs.bgv.exception.ResourceNotFoundException;
import com.tvscs.bgv.repository.AccessLogRepository;
import com.tvscs.bgv.repository.AppealRepository;
import com.tvscs.bgv.repository.EmployeeRepository;
import com.tvscs.bgv.repository.VerificationAttemptRepository;
import com.tvscs.bgv.repository.VerificationRecordRepository;
import com.tvscs.bgv.repository.VerifierRepository;
import com.tvscs.bgv.service.AccessLogService;
import com.tvscs.bgv.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminServiceImpl implements AdminService {

    private final VerifierRepository verifierRepository;
    private final EmployeeRepository employeeRepository;
    private final VerificationRecordRepository verificationRecordRepository;
    private final AppealRepository appealRepository;
    private final VerificationAttemptRepository verificationAttemptRepository;
    private final AccessLogService accessLogService;
    private final AccessLogRepository accessLogRepository;

    @Override
    public DashboardStatsResponse getDashboard() {
        long totalVerifications = verificationRecordRepository.count();
        long pendingAppeals = appealRepository.countByStatus("pending");
        long completedAppeals = appealRepository.countByStatus("completed");
        long activeVerifiers = verifierRepository.count();
        long totalEmployees = employeeRepository.count();
        long matched = verificationRecordRepository.countByOverallStatus("matched");
        long partial = verificationRecordRepository.countByOverallStatus("partial_match");
        long mismatch = verificationRecordRepository.countByOverallStatus("mismatch");

        List<VerificationRecord> recentVerifs = verificationRecordRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(0, 10)).getContent();
        List<com.tvscs.bgv.domain.entity.Appeal> recentAppeals = appealRepository
                .findAllByOrderByCreatedAtDesc(PageRequest.of(0, 10)).getContent();

        DateTimeFormatter fmt = DateTimeFormatter.ISO_DATE_TIME;

        List<DashboardStatsResponse.RecentActivity> recentVerifActivities = recentVerifs.stream()
                .map(v -> DashboardStatsResponse.RecentActivity.builder()
                        .id(v.getVerificationId())
                        .type("verification")
                        .employeeId(v.getEmployeeId())
                        .status(v.getOverallStatus())
                        .timestamp(v.getCreatedAt() != null ? v.getCreatedAt().format(fmt) : null)
                        .build())
                .collect(Collectors.toList());

        List<DashboardStatsResponse.RecentActivity> recentAppealActivities = recentAppeals.stream()
                .map(a -> DashboardStatsResponse.RecentActivity.builder()
                        .id(a.getAppealId())
                        .type("appeal")
                        .employeeId(a.getEmployeeId())
                        .status(a.getStatus())
                        .timestamp(a.getCreatedAt() != null ? a.getCreatedAt().format(fmt) : null)
                        .build())
                .collect(Collectors.toList());

        return DashboardStatsResponse.builder()
                .totalVerifications(totalVerifications)
                .pendingAppeals(pendingAppeals)
                .completedAppeals(completedAppeals)
                .activeVerifiers(activeVerifiers)
                .totalEmployees(totalEmployees)
                .matchedVerifications(matched)
                .partialMatches(partial)
                .mismatches(mismatch)
                .recentVerifications(recentVerifActivities)
                .recentAppeals(recentAppealActivities)
                .build();
    }

    @Override
    public List<VerifierProfileResponse> getAllVerifiers() {
        return verifierRepository.findAll().stream()
                .map(this::toVerifierProfile)
                .collect(Collectors.toList());
    }

    @Override
    public VerifierProfileResponse toggleVerifier(Long verifierId) {
        Verifier verifier = verifierRepository.findById(verifierId)
                .orElseThrow(() -> new ResourceNotFoundException("Verifier not found"));
        verifier.setActive(!verifier.isActive());
        return toVerifierProfile(verifierRepository.save(verifier));
    }

    @Override
    public void unblockAttempt(Long attemptId) {
        VerificationAttempt attempt = verificationAttemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt record not found: " + attemptId));
        attempt.setBlocked(false);
        attempt.setAttemptCount(0);
        attempt.setBlockedAt(null);
        verificationAttemptRepository.save(attempt);
    }

    @Override
    public List<Map<String, Object>> getBlockedVerifiers() {
        List<VerificationAttempt> blocked = verificationAttemptRepository.findAllBlocked();
        return blocked.stream().map(va -> {
            Verifier verifier = verifierRepository.findById(va.getVerifierId()).orElse(null);
            Employee employee = employeeRepository.findByEmployeeIdIgnoreCase(va.getEmployeeId()).orElse(null);
            Map<String, Object> map = new HashMap<>();
            map.put("id", va.getId());
            map.put("verifierId", va.getVerifierId());
            map.put("verifierCompanyName", verifier != null ? verifier.getCompanyName() : "N/A");
            map.put("verifierEmail", verifier != null ? verifier.getEmail() : "N/A");
            map.put("employeeId", va.getEmployeeId());
            map.put("employeeName", employee != null ? employee.getFullName() : "N/A");
            map.put("attemptCount", va.getAttemptCount());
            map.put("isBlocked", va.isBlocked());
            map.put("blockedAt", va.getBlockedAt());
            map.put("lastAttemptAt", va.getLastAttemptAt());
            return map;
        }).collect(Collectors.toList());
    }

    @Override
    public Page<AccessLogResponse> getAccessLogs(String status, String role, String email, Pageable pageable) {
        return accessLogService.getLogs(status, role, email, pageable).map(this::toLogResponse);
    }

    @Override
    public byte[] exportVerificationsAsExcel() {
        List<VerificationRecord> records = verificationRecordRepository.findAll();
        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Verifications");

            // Header row
            String[] headers = {"S.No", "Employee ID", "Employee Name", "Product", "Department",
                    "Designation", "Date of Joining", "Last Working Day", "Verified on", "Verified by", "Verified for"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(headers[i]);
            }

            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            int rowNum = 1;
            for (VerificationRecord record : records) {
                Employee emp = employeeRepository.findByEmployeeIdIgnoreCase(record.getEmployeeId()).orElse(null);
                Verifier verifier = verifierRepository.findById(record.getVerifierId()).orElse(null);

                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(rowNum - 1);
                row.createCell(1).setCellValue(record.getEmployeeId());
                row.createCell(2).setCellValue(emp != null ? emp.getFullName() : "N/A");
                row.createCell(3).setCellValue(""); // product not in BGV_EMPLOYEES
                row.createCell(4).setCellValue(emp != null ? nullSafe(emp.getDepartment()) : "");
                row.createCell(5).setCellValue(emp != null ? nullSafe(emp.getDesignation()) : "");
                row.createCell(6).setCellValue(emp != null && emp.getDateOfJoining() != null ? emp.getDateOfJoining().format(fmt) : "");
                row.createCell(7).setCellValue(emp != null && emp.getDateOfLeaving() != null ? emp.getDateOfLeaving().format(fmt) : "");
                row.createCell(8).setCellValue(record.getCreatedAt() != null ? record.getCreatedAt().toLocalDate().format(fmt) : "");
                row.createCell(9).setCellValue(verifier != null ? verifier.getCompanyName() : "N/A");
                row.createCell(10).setCellValue(verifier != null ? verifier.getEmail() : "N/A");
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate Excel export", e);
        }
    }

    @Override
    public byte[] exportAppealsAsExcel(String status) {
        List<com.tvscs.bgv.domain.entity.Appeal> appeals = (status != null && !status.isBlank() && !"all".equalsIgnoreCase(status))
                ? appealRepository.findByStatus(status)
                : appealRepository.findAll();

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Appeals");

            String[] headers = {"S.No", "Appeal ID", "Employee ID", "Employee Name", "Verifier Company",
                    "Verifier Email", "Status", "Submitted Date", "HR Response", "Reviewed At"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) headerRow.createCell(i).setCellValue(headers[i]);

            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            int rowNum = 1;
            for (com.tvscs.bgv.domain.entity.Appeal a : appeals) {
                Employee emp = employeeRepository.findByEmployeeIdIgnoreCase(a.getEmployeeId()).orElse(null);
                Verifier verifier = verifierRepository.findById(a.getVerifierId()).orElse(null);

                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(rowNum - 1);
                row.createCell(1).setCellValue(nullSafe(a.getAppealId()));
                row.createCell(2).setCellValue(nullSafe(a.getEmployeeId()));
                row.createCell(3).setCellValue(emp != null ? nullSafe(emp.getFullName()) : "N/A");
                row.createCell(4).setCellValue(verifier != null ? nullSafe(verifier.getCompanyName()) : "N/A");
                row.createCell(5).setCellValue(verifier != null ? nullSafe(verifier.getEmail()) : "N/A");
                row.createCell(6).setCellValue(nullSafe(a.getStatus()));
                row.createCell(7).setCellValue(a.getCreatedAt() != null ? a.getCreatedAt().format(fmt) : "");
                row.createCell(8).setCellValue(nullSafe(a.getHrComments()));
                row.createCell(9).setCellValue(a.getReviewedAt() != null ? a.getReviewedAt().format(fmt) : "");
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate appeals Excel export", e);
        }
    }

    @Override
    public byte[] exportVerifiersAsExcel() {
        List<Verifier> verifiers = verifierRepository.findAll();

        try (XSSFWorkbook workbook = new XSSFWorkbook()) {
            Sheet sheet = workbook.createSheet("Verifiers");

            String[] headers = {"S.No", "Company Name", "Email", "Type", "Status", "Email Verified", "Last Login", "Registered On"};
            Row headerRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) headerRow.createCell(i).setCellValue(headers[i]);

            DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
            int rowNum = 1;
            for (Verifier v : verifiers) {
                Row row = sheet.createRow(rowNum++);
                row.createCell(0).setCellValue(rowNum - 1);
                row.createCell(1).setCellValue(nullSafe(v.getCompanyName()));
                row.createCell(2).setCellValue(nullSafe(v.getEmail()));
                row.createCell(3).setCellValue(v.isBgvAgency() ? "BGV Agency" : "Direct");
                row.createCell(4).setCellValue(v.isActive() ? "Active" : "Inactive");
                row.createCell(5).setCellValue(v.isEmailVerified() ? "Yes" : "No");
                row.createCell(6).setCellValue(v.getLastLoginAt() != null ? v.getLastLoginAt().format(fmt) : "Never");
                row.createCell(7).setCellValue(v.getCreatedAt() != null ? v.getCreatedAt().format(fmt) : "");
            }

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            workbook.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate verifiers Excel export", e);
        }
    }

    private VerifierProfileResponse toVerifierProfile(Verifier v) {
        return VerifierProfileResponse.builder()
                .id(v.getId())
                .email(v.getEmail())
                .companyName(v.getCompanyName())
                .isEmailVerified(v.isEmailVerified())
                .isActive(v.isActive())
                .isBgvAgency(v.isBgvAgency())
                .lastLoginAt(v.getLastLoginAt())
                .createdAt(v.getCreatedAt())
                .build();
    }

    private AccessLogResponse toLogResponse(AccessLog log) {
        return AccessLogResponse.builder()
                .id(log.getId())
                .email(log.getEmail())
                .role(log.getRole())
                .action(log.getAction())
                .status(log.getStatus())
                .ipAddress(log.getIpAddress())
                .userAgent(log.getUserAgent())
                .failureReason(log.getFailureReason())
                .metadata(log.getMetadata())
                .timestamp(log.getTimestamp())
                .build();
    }

    private String nullSafe(String s) {
        return s != null ? s : "";
    }
}
