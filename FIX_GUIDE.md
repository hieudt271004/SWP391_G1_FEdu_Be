# FEdu Backend — Fix Guide (lỗi hiện có trên `long` sau khi merge `main`)

> **Phạm vi:** chỉ fix **lỗi/bug/bất nhất đang tồn tại** trong code hiện tại. **KHÔNG** đụng nghiệp vụ mới (cấu trúc nhánh chính/phụ, đánh số node, import Excel, email tự động, clone copy toàn bộ content) — phần đó để guide nghiệp vụ riêng, xem memory `learning-path-business-spec`.
> **Nhánh:** làm trên `long` (đã merge main, hiện ở `7c53938`). Mỗi Phase = 1 commit. Sau mỗi phase:
> ```powershell
> cd fedu
> .\mvnw.cmd clean package
> ```
>
> **Đã có sẵn trên main (KHÔNG cần làm lại):** chuẩn hóa error-handling Phase 1 cũ (đa số `@ResponseStatus`, bỏ try/catch, `RuntimeException`→exception nghiệp vụ ở LearningPath/Classroom/Subject service, forgot/reset-password dùng DTO/header). Guide này chỉ vá phần **còn sót + lỗi mới phát sinh**.
>
> **Cố ý hoãn (thuộc nghiệp vụ mới, KHÔNG làm ở đây):** phân quyền sở hữu đầy đủ cho teacher (cross-class), siết setup về admin, clone copy material/test/question, Excel import, email.

---

## Phase 0 — Unbreak the build (LÀM ĐẦU TIÊN, đang fail compile)

Hai file dở dang từ lần bắt đầu Phase 2 đang làm **vỡ build + vỡ khởi động**:

**0.1. `service/AuthzService.java`** — `isAdmin` rỗng, thiếu `return` → **compile error**.

**0.2. `repository/ClassroomSubjectStudentRepository.java`** — thêm
`boolean existsByClassroomClassroomIdAndLecturerUserId(Long, Long)` nhưng entity `ClassroomSubjectStudent` **không có** property `classroom`/`lecturer` → Spring Data **fail khi khởi động** (không parse được derived query). Method này lẽ ra thuộc `ClassroomSubjectRepository`.

→ Vì việc phân quyền sở hữu **đã hoãn** (thuộc nghiệp vụ mới), cách sạch nhất là **revert 2 thứ này** để build xanh, làm lại đúng chỗ khi vào phase nghiệp vụ:

```powershell
# Xóa AuthzService dở dang
git rm -f fedu/src/main/java/com/fedu/fedu/service/AuthzService.java
# Trả ClassroomSubjectStudentRepository về bản gốc (bỏ method derived query sai)
git checkout -- fedu/src/main/java/com/fedu/fedu/repository/ClassroomSubjectStudentRepository.java
```

> Nếu muốn **giữ** `AuthzService` cho phase sau: cũng được, nhưng phải sửa cho compile (cho `isAdmin` `return` đúng) và **chuyển** method `existsBy...LecturerUserId` sang `ClassroomSubjectRepository`. Khuyến nghị revert cho gọn vì còn lâu mới dùng.

**Verify:** `mvnw clean package` phải xanh trước khi sang Phase 1.

**Commit:** `chore: remove half-applied ownership prep to fix broken build`

---

## Phase 1 — 🔴 Lỗ hổng bảo mật nghiêm trọng

### 1.1. Gỡ backdoor `/auth/reset-all-passwords`
Hiện endpoint này nằm trong `WHITE_LIST` (permitAll) và **không** auth → **bất kỳ ai** gọi `POST /auth/reset-all-passwords` là reset **toàn bộ** mật khẩu về `123456`.

Xóa hẳn (đây là hack tiện tay lúc dev, không nên tồn tại):
- [AppConfig.java](fedu/src/main/java/com/fedu/fedu/config/AppConfig.java): bỏ dòng `"/auth/reset-all-passwords"` khỏi `WHITE_LIST`.
- [AuthenticationController.java:97](fedu/src/main/java/com/fedu/fedu/controller/auth/AuthenticationController.java:97): xóa method `resetAllPasswords()`.
- [UserAccountServiceImpl.java:286](fedu/src/main/java/com/fedu/fedu/service/Impl/UserAccountServiceImpl.java:286): xóa `resetAllPasswordsTo123456()` + khai báo trong interface `UserAccountService`.

> Nếu thực sự cần seed mật khẩu lúc dev: làm bằng SQL script chạy tay, **không** để endpoint public.

### 1.2. IDOR: student xem được lớp của student khác
[ClassroomController.getClassroomsByStudent](fedu/src/main/java/com/fedu/fedu/controller/ClassroomController.java) đang `hasAnyRole('TEACHER','ADMIN','STUDENT')` và **không ép** `studentId` về chính mình → SV đổi id xem lớp người khác.

```java
@GetMapping("/student/{studentId}")
public ResponseData<List<ClassroomResponse>> getClassroomsByStudent(
        @PathVariable long studentId,
        @AuthenticationPrincipal UserAccount currentUser) {
    boolean isStudentOnly = currentUser.getAuthorities().stream()
            .anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"))
        && currentUser.getAuthorities().stream()
            .noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || a.getAuthority().equals("ROLE_TEACHER"));
    if (isStudentOnly && studentId != currentUser.getUserId()) {
        throw new org.springframework.security.access.AccessDeniedException("Bạn chỉ được xem lớp của chính mình");
    }
    return new ResponseData<>(HttpStatus.OK.value(), "Retrieved classroom list successfully",
            classroomService.getClassroomsByStudent(studentId));
}
```
(Thêm import `UserAccount` + `@AuthenticationPrincipal` nếu chưa có. `AccessDeniedException` đã được `GlobalExceptionHandler` map ra 403.)

> Phân quyền sở hữu cho teacher (sửa/xóa lớp, roster của lớp khác) **hoãn** sang phase nghiệp vụ vì gắn với quyết định "ai quản lớp".

**Commit:** `fix(security): remove reset-all-passwords backdoor and student IDOR`

---

## Phase 2 — Sửa luồng auth (logic sai)

### 2.1. `TokenService.save` ghi `null` đè access/refresh khi forgot-password
[TokenService.java:34-39](fedu/src/main/java/com/fedu/fedu/service/TokenService.java:34): khi token đã tồn tại, luôn `setAccessToken/​setRefreshToken` từ token đầu vào — mà `forgotPassword` truyền vào token chỉ có `resetToken` → access/refresh bị set `null`.

Thay `save(Token)` bằng 2 method rõ nghĩa:
```java
public void saveLoginTokens(UserAccount user, String accessToken, String refreshToken) {
    Token t = tokenRepository.findByUserAccount_Email(user.getEmail())
            .orElseGet(() -> Token.builder().userAccount(user).build());
    t.setAccessToken(accessToken);
    t.setRefreshToken(refreshToken);   // KHÔNG đụng resetToken
    tokenRepository.save(t);
}
public void saveResetToken(UserAccount user, String resetToken) {
    Token t = tokenRepository.findByUserAccount_Email(user.getEmail())
            .orElseGet(() -> Token.builder().userAccount(user).build());
    t.setResetToken(resetToken);       // KHÔNG đụng access/refresh
    tokenRepository.save(t);
}
```
Sửa call site trong [AuthenticationService.java](fedu/src/main/java/com/fedu/fedu/service/AuthenticationService.java): `accessToken`/`googleLogin`/`refreshToken` → `saveLoginTokens(...)`; `forgotPassword` → `saveResetToken(...)`.

### 2.2. Logout chưa thực sự vô hiệu hóa token
[PreFilter.java:49](fedu/src/main/java/com/fedu/fedu/config/PreFilter.java:49) chỉ kiểm tra chữ ký + hạn, không đối chiếu DB → sau `log-out`, access token cũ **vẫn dùng được tới khi hết hạn**.

Thêm vào `TokenService`:
```java
public boolean isAccessTokenActive(String email, String accessToken) {
    return tokenRepository.findByUserAccount_Email(email)
            .map(t -> accessToken.equals(t.getAccessToken()))
            .orElse(false);
}
```
Sửa `PreFilter` (inject thêm `TokenService`):
```java
if (jwtService.isValid(token, TokenType.ACCESS_TOKEN, userDetails)
        && tokenService.isAccessTokenActive(userName, token)) {
    // ... set SecurityContext như cũ
}
```
> **Trade-off:** +1 query/request có token; và do mô hình 1 row token/user → **single-session** (login máy 2 đá máy 1). Chấp nhận được cho đồ án. Nếu nhóm cần multi-device thì để sau.

### 2.3. `resetPassword` là no-op (lừa dối)
[AuthenticationService.java:139](fedu/src/main/java/com/fedu/fedu/service/AuthenticationService.java:139) trả `"Password reset successful"` nhưng **không làm gì**. Đổi cho đúng ngữ nghĩa = **validate reset token**:
```java
public String resetPassword(String secretKey) {
    UserAccount user = validateToken(secretKey);
    Token tokenEntity = tokenService.getByEmail(user.getEmail());
    if (tokenEntity.getResetToken() == null || !tokenEntity.getResetToken().equals(secretKey)) {
        throw new InvalidDataException("Reset token không hợp lệ hoặc đã được sử dụng");
    }
    return "Reset token hợp lệ";
}
```
(Tùy chọn) Endpoint `GET /auth/reset-password` hiện **chưa có** `@Operation` — nếu muốn doc cho rõ thì thêm `@Operation(summary = "Validate reset password token")` phía trên `@GetMapping("/reset-password")`; không thêm cũng không sao. Phần bắt buộc của mục này chỉ là sửa logic method `resetPassword` ở service. (Việc đổi mật khẩu thật vẫn ở `changePassword` — đã đúng.)

### 2.4. Login: authenticate trước, chống dò email
[AuthenticationService.java:55-65](fedu/src/main/java/com/fedu/fedu/service/AuthenticationService.java:55): hiện `getByEmail` (ném `UsernameNotFoundException` → 401) + check `isEnabled` **trước khi** check mật khẩu → lộ email tồn tại/bị khóa. Ngoài ra còn gọi `updateLastLogin` (stub rỗng) và build authorities thủ công (vô nghĩa, provider tự load).

```java
public TokenResponse accessToken(SignInRequest req) {
    authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
    UserAccount user = userService.getByEmail(req.getEmail());
    String accessToken = jwtService.generateToken(user);
    String refreshToken = jwtService.generateRefreshToken(user);
    tokenService.saveLoginTokens(user, accessToken, refreshToken);
    return TokenResponse.builder()
            .accessToken(accessToken).refreshToken(refreshToken).userId(user.getUserId()).build();
}
```

### 2.5. `RuntimeException` còn sót
- [AuthenticationService.java:268](fedu/src/main/java/com/fedu/fedu/service/AuthenticationService.java:268) `new RuntimeException("Default role STUDENT not found")` → `IllegalStateException` (cho khớp `UserAccountServiceImpl` đã đổi).

**Commit:** `fix(auth): real logout, honest reset, token-save split, login hardening`

---

## Phase 3 — Error-handling còn sót (Phase 1 cũ chưa quét hết)

### 3.1. `UserManagementController.updateUser` còn try/catch trả 200 kèm lỗi
[UserManagementController.java:71-77](fedu/src/main/java/com/fedu/fedu/controller/admin/UserManagementController.java:71): bỏ try/catch, để exception bubble lên `GlobalExceptionHandler`:
```java
@PutMapping("/users/{userId}")
public ResponseData<Void> updateUser(@PathVariable long userId, @Valid @RequestBody UserUpdateRequest request) {
    userAccountService.updateUser(userId, request);
    return new ResponseData<>(HttpStatus.OK.value(), "User updated successfully");
}
```
(Bỏ import `ResponseError` nếu không còn dùng.)

### 3.2. `NodeContentServiceImpl` ném `RuntimeException` + nguy cơ NPE
[NodeContentServiceImpl.java:142](fedu/src/main/java/com/fedu/fedu/service/Impl/NodeContentServiceImpl.java:142): `throw new RuntimeException("Could not store file...")` → đổi `InvalidDataException` (hoặc tạo `FileStorageException`) cho ra lỗi có nghĩa thay vì 500 chung.
[NodeContentServiceImpl.java:122](fedu/src/main/java/com/fedu/fedu/service/Impl/NodeContentServiceImpl.java:122): `file.getOriginalFilename().replaceAll(...)` → NPE nếu `getOriginalFilename()` null. Guard:
```java
String original = file.getOriginalFilename() != null ? file.getOriginalFilename() : "file";
String cleanFileName = System.currentTimeMillis() + "_" + original.replaceAll("[^a-zA-Z0-9._-]", "_");
```

**Commit:** `refactor(error-handling): clean remaining try/catch and RuntimeException`

---

## Phase 4 — Persistence correctness

### 4.1. `@Builder.Default` cho field boolean có default
Toàn bộ field kiểu `Boolean isDeleted = false` / `isRevoked = false` / `isRequired = true` / `required = true` trong `entity/` **đang thiếu** `@Builder.Default` → Lombok bỏ qua initializer, build ra `null` nếu không set tường minh. Chỗ đau nhất: **`Token.isRevoked`** (không nơi nào set trong builder → mọi row `is_revoked = null`).

Thêm `@Builder.Default` cho các field này ở: `Token`(isRevoked), `UserAccount`, `LearningPath`, `LearningNode`(isDeleted+isRequired), `Subject`, `Classroom`, `NodeMaterial`(isDeleted+required), `Test`, `Submission`, `NodeReview`, `NodeQuestion`, `FileEntity`, `Video`, `SupportTicket` (và các entity legacy nếu giữ).
```java
@Builder.Default
@Column(name = "is_deleted")
private Boolean isDeleted = false;
```

### 4.2. `@Transactional` cho thao tác ghi nhiều bước
[UserAccountServiceImpl.createUser():78](fedu/src/main/java/com/fedu/fedu/service/Impl/UserAccountServiceImpl.java:78) và [save(RegisterRequest):128](fedu/src/main/java/com/fedu/fedu/service/Impl/UserAccountServiceImpl.java:128) lưu user rồi lưu role ở 2 bước **không atomic** → lỗi giữa chừng để lại user không có role (login NPE ở `getAuthorities`). Thêm `@Transactional` (đã import sẵn). Tương tự cân nhắc `AuthenticationService.googleLogin` (annotate method public, không phải `createGoogleUser` private).

### 4.3. (Thấp) `findAllRoleByUserId` chiếu enum vào `List<String>`
[UserAccountRepository.java:20](fedu/src/main/java/com/fedu/fedu/repository/UserAccountRepository.java:20): `select ur.role.roleName` (kiểu enum `UserRole`) trả `List<String>` — dựa vào ép kiểu ngầm, dễ vỡ. An toàn hơn: trả `List<UserRole>` rồi `.map(Enum::name)` ở service, hoặc `select cast(... as string)`. Hiện chạy được nên để ưu tiên thấp.

**Commit:** `fix(persistence): @Builder.Default + transactions for multi-step writes`

---

## Phase 5 — Dọn nhất quán (ưu tiên thấp, tách commit nhỏ)

### 5.1. `SubjectController` trả entity thô
[SubjectController.java](fedu/src/main/java/com/fedu/fedu/controller/SubjectController.java) trả `ResponseData<Subject>` / `List<Subject>` (entity JPA) trong khi đã có `SubjectResponse`. Map sang DTO ở service cho nhất quán + khỏi lộ field nội bộ (`isDeleted`). Thêm `SubjectResponse.from(Subject)` và đổi `SubjectService` trả DTO.

### 5.2. `AdminQuestionController` `@PreAuthorize` gây hiểu nhầm
[AdminQuestionController](fedu/src/main/java/com/fedu/fedu/controller/admin/AdminQuestionController.java) khai `hasAnyRole('TEACHER','ADMIN')` nhưng nằm dưới `/admin/**` → filter `hasRole("ADMIN")` chặn teacher trước. Đổi `@PreAuthorize` về `hasRole('ADMIN')` cho khớp thực tế (teacher quản câu hỏi sẽ tính ở phase nghiệp vụ nếu cần).

### 5.3. Dead code
- `entity/ClassroomStudent.java` + `ClassroomStudentRepository` — trùng `ClassroomSubjectStudent`, không dùng.
- `entity/ClassroomLearningPath.java` + repo + `ClassroomLearningPathResponse` — đã gộp vào `LearningPath`.
- Stub rỗng trong `UserAccountServiceImpl`: `verifyAccount`, `registerUser(UserAccount)`, `updateLastLogin` (call site ở login đã bỏ tại 2.4). Grep usage trước khi xóa.

### 5.4. (Optional) N+1 ở `ClassroomServiceImpl.toResponse`
Mỗi classroom gọi 2 query; `getAllClassrooms` → N+1. Gom query count student + ClassroomSubject theo `classroomId IN (...)`. Chỉ làm khi danh sách lớn.

### 5.5. Config
- Hardcode email `hieudtfptu@gmail.com` trong `MailService.sendEmail` (tham số display-name) và `application.yml` → đưa về biến môi trường / để display name "FEdu System".

**Commit:** `refactor(cleanup): SubjectResponse DTO, dead code, authz annotations`

---

## Checklist nghiệm thu

```powershell
cd fedu
.\mvnw.cmd clean package    # phải xanh (Phase 0 xong)
.\mvnw.cmd spring-boot:run
```

| # | Kịch bản | Kỳ vọng |
|---|---|---|
| 0 | Build | `clean package` thành công |
| 1 | `POST /auth/reset-all-passwords` (ẩn danh) | 404/401 (endpoint đã xóa) |
| 2 | STUDENT xem `/classrooms/student/{id người khác}` | 403 |
| 3 | Login → `/auth/me` → `log-out` → dùng lại token cũ | 401 |
| 4 | `forgot-password` rồi login lại ngay | Login vẫn OK (token không bị null) |
| 5 | Login sai pass & login email không tồn tại | 401, **cùng** message |
| 6 | `GET /auth/reset-password` (X-Secret-Key sai) | 400/409, không phải "successful" giả |
| 7 | `PUT /admin/users/{id}` lỗi (role không tồn tại) | 404 đúng (không phải 200/400 trong body) |
| 8 | `Token.builder().build().getIsRevoked()` | `false` (không null) |

---

## NHẮC LẠI — KHÔNG làm trong guide này (để guide nghiệp vụ riêng)
Cấu trúc nhánh chính/phụ + đánh số node, clone copy material/test/question, import Excel sinh viên, email tự động, siết setup về admin, ownership teacher cross-class. Tất cả nằm trong spec nghiệp vụ đã lưu (memory `learning-path-business-spec`).
