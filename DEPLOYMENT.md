# FEdu — Hướng dẫn Build & Deploy trên máy cá nhân

Tài liệu này hướng dẫn tải mã nguồn từ GitHub và chạy toàn bộ hệ thống (backend + frontend + database) trên một máy cá nhân, kèm sẵn **dữ liệu demo** để test ngay mà không cần nhập liệu.

## 1. Tổng quan hệ thống

| Thành phần | Công nghệ | Cổng mặc định |
|---|---|---|
| Backend API | Java 17, Spring Boot 3.3 (Maven) | `8080` |
| Frontend | React + Vite (Node.js) | `5173` (dev) / `80` (Docker) |
| Database | PostgreSQL (chạy local trên máy) | `5432` |

Điểm quan trọng nhất: **không cần chạy tay bất kỳ file SQL nào**. Schema database do **Flyway** quản lý — khi backend khởi động lần đầu trên một database trống, toàn bộ bảng và dữ liệu tham chiếu được dựng tự động; chạy với profile `demo` sẽ nạp thêm bộ dữ liệu demo (tài khoản, môn học, lộ trình mẫu…).

---

## 2. Yêu cầu phần mềm

| Phần mềm | Bắt buộc | Ghi chú |
|---|---|---|
| [Git](https://git-scm.com/downloads) | ✅ | Clone mã nguồn |
| [PostgreSQL 16+](https://www.postgresql.org/download/) | ✅ | Khi cài **nhớ ghi lại mật khẩu** của user `postgres` |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Cách 1 | Chạy backend + frontend bằng container |
| [JDK 17](https://adoptium.net/) và [Node.js 20+](https://nodejs.org/) | Cách 2 | Chạy trực tiếp không dùng Docker |

Chọn **một trong hai**: Docker (mục 5) hoặc chạy trực tiếp (mục 6). Cả hai đều cần PostgreSQL cài trên máy.

---

## 3. Tải mã nguồn

Toàn bộ hệ thống (cả backend lẫn frontend) nằm trong **một repository duy nhất**:

```powershell
git clone https://github.com/hieudt271004/SWP391_G1_FEdu_Be.git
cd SWP391_G1_FEdu_Be
```

Cấu trúc chính:

```
SWP391_G1_FEdu_Be/
├── fedu/                          # Backend (Spring Boot)
│   └── src/main/resources/
│       ├── application-demo.yml   # Profile demo: DB local + cấu hình chạy sẵn
│       ├── db/migration/          # Flyway migrations (schema + dữ liệu tham chiếu)
│       └── db/demo/               # Seed dữ liệu demo (chỉ nạp ở profile demo)
├── SWP391_G1_FEdu_Fe/             # Frontend (React + Vite)
├── docker-compose.yml
└── .env.example
```

**Mở project trong IDE (tùy chọn):**
- **IntelliJ IDEA** (khuyến nghị — dùng cho cả backend lẫn frontend): mở thư mục gốc `SWP391_G1_FEdu_Be`; IntelliJ tự nhận project Maven trong `fedu/` (nếu chưa, chuột phải `fedu/pom.xml` → *Add as Maven Project*).
- **VS Code** (khi chỉ làm riêng frontend): mở thẳng thư mục `SWP391_G1_FEdu_Fe/`.

---

## 4. Tạo database trống (1 lần duy nhất)

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "CREATE DATABASE fedudb;"
```

(Đổi `18` thành đúng phiên bản PostgreSQL đã cài; nhập mật khẩu `postgres` khi được hỏi. Có thể tạo bằng pgAdmin nếu quen giao diện.)

Chỉ vậy thôi — bảng biểu và dữ liệu sẽ được backend tự dựng ở lần chạy đầu.

---

## 5. Cách 1 — Chạy bằng Docker

Tạo file cấu hình từ mẫu:

```powershell
Copy-Item .env.example .env
```

Mở `.env` và sửa 4 dòng sau — tất cả đều đã có sẵn trong file (container kết nối ra PostgreSQL trên máy qua `host.docker.internal`):

```
DB_URL=jdbc:postgresql://host.docker.internal:5432/fedudb
DB_USERNAME=postgres
DB_PASSWORD=<mật khẩu postgres của bạn>
SPRING_PROFILES_ACTIVE=demo
```

Các biến còn lại giữ nguyên (JWT đã có key test hợp lệ; `MAIL_PASSWORD`/`CLOUDINARY_*` chỉ cần khi dùng tính năng gửi email / upload tài liệu — liên hệ nhóm để nhận).

Chạy (Docker Desktop phải đang mở):

```powershell
docker compose up -d --build
```

Lần đầu build mất khoảng 5–10 phút. Truy cập:

| Địa chỉ | Thành phần |
|---|---|
| `http://localhost` | **Giao diện web** |
| `http://localhost:8080` | API backend |
| `http://localhost:8080/swagger-ui/index.html` | Swagger UI (tài liệu API) |

Lệnh hữu ích: `docker compose logs -f backend` (xem log) · `docker compose down` (dừng) · `docker compose up -d` (chạy lại, không cần build).

---

## 6. Cách 2 — Chạy trực tiếp (không dùng Docker)

### 6.1. Backend (JDK 17)

Profile **`demo`** đã cấu hình sẵn mọi thứ (DB local `fedudb`, JWT key test) — chạy bằng Maven wrapper, không cần cài Maven:

```powershell
cd SWP391_G1_FEdu_Be\fedu
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=demo"
```

(IntelliJ IDEA: mở Run Configuration → *Active profiles* = `demo` → Run.)

Backend chạy tại `http://localhost:8080`, Swagger tại `http://localhost:8080/swagger-ui/index.html`.

> Profile demo mặc định dùng mật khẩu postgres là `123`. Nếu máy bạn đặt khác: chạy `$env:DB_PASSWORD = "<mật khẩu>"` trước khi start, hoặc sửa 1 dòng trong `fedu/src/main/resources/application-demo.yml`.

### 6.2. Frontend (Node.js 20+)

Mở terminal thứ hai:

```powershell
cd SWP391_G1_FEdu_Be\SWP391_G1_FEdu_Fe
npm install
npm run dev
```

Giao diện web tại `http://localhost:5173` (frontend gọi sẵn API ở `localhost:8080`, CORS đã cho phép — không cần cấu hình gì thêm).

---

## 7. Dữ liệu demo & kịch bản test

Lần đầu backend chạy với profile `demo` trên database trống, hệ thống tự nạp:

**Tài khoản (mật khẩu tất cả là `123456`):**

| Email | Vai trò |
|---|---|
| `admin@gmail.com` | Quản trị viên |
| `teacher@fedu.vn` | Giáo viên |
| `student1@fedu.vn` | Học sinh |
| `student2@fedu.vn` | Học sinh |

**Dữ liệu kèm theo:**
- 2 môn học đã published — `JAVA101` (Lập trình Java cơ bản), `WEB201` (Phát triển Web Frontend) — mỗi môn có **1 lộ trình mẫu đầy đủ 9 chặng**: bài test phân loại đầu vào (PLACEMENT), các chặng học chia 3 mức Yếu/TB/Khá, 2 bài test giữa chặng (GATE), 3 bài test tự chọn đổi mức (FREE_CHOICE), 2 buổi học trên lớp — kèm học liệu video và bộ câu hỏi trắc nghiệm cho từng bài test.
- Lớp `SE1801` (kỳ SUMMER 2026) với 2 lớp-môn do `teacher@fedu.vn` phụ trách; cả 2 học sinh đã ghi danh vào cả hai.
- Danh mục học kỳ (2025–2028) và 6 ca học.

**Kịch bản demo gợi ý:**
1. Đăng nhập `teacher@fedu.vn` → vào lớp-môn → **clone lộ trình mẫu về lớp** → tạo bài test phân loại đầu vào → **publish** lộ trình.
2. Đăng nhập `student1@fedu.vn` → làm bài test phân loại → hệ thống xếp mức và mở lộ trình học tương ứng.
3. Học tiếp đến bài test giữa chặng (GATE) để xem cơ chế lên/xuống mức; đăng nhập `admin@gmail.com` để xem phần quản trị.

Ghi chú: đăng nhập bằng Google và tính năng gửi email/upload tài liệu cần credentials riêng (không kèm trong repo) — demo dùng đăng nhập email/mật khẩu như trên.

---

## 8. Quản trị database

- Schema do **Flyway** quản lý: migration nằm ở `fedu/src/main/resources/db/migration/`, tự áp dụng khi backend khởi động; bảng `flyway_schema_history` ghi lại version đã chạy. Ứng dụng không tự tạo bảng qua Hibernate (`ddl-auto: none`).
- Dữ liệu demo (`db/demo/`) **chỉ nạp khi chạy profile `demo` và database còn trống** — không bao giờ ghi đè dữ liệu đang có, khởi động lại nhiều lần không nhân đôi.
- Xem dữ liệu trực tiếp bằng pgAdmin / DBeaver / IntelliJ Database: host `localhost`, port `5432`, database `fedudb`, user `postgres`.
- **Reset về trạng thái demo ban đầu** — xóa và tạo lại database rồi khởi động lại backend:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -h localhost -c "DROP DATABASE fedudb WITH (FORCE);" -c "CREATE DATABASE fedudb;"
```

---

## 9. Build đóng gói (tham khảo)

```powershell
cd fedu
.\mvnw.cmd clean package        # tạo file JAR trong fedu/target/ (thêm -DskipTests nếu muốn bỏ qua test)
java -jar target\fedu-0.0.1-SNAPSHOT.jar --spring.profiles.active=demo   # chạy từ JAR

cd ..\SWP391_G1_FEdu_Fe
npm run build                   # build frontend tĩnh vào dist/
```

---

## 10. Xử lý lỗi thường gặp

| Hiện tượng | Nguyên nhân & cách xử lý |
|---|---|
| `password authentication failed for user "postgres"` | Sai mật khẩu DB — set `$env:DB_PASSWORD` (Cách 2) hoặc sửa `DB_PASSWORD` trong `.env` (Cách 1) |
| `database "fedudb" does not exist` | Chưa tạo database — chạy lệnh ở mục 4 |
| Backend không khởi động, log nhắc Flyway checksum/migration | Database từng chạy bản code khác — reset database (mục 8) rồi chạy lại |
| Docker: backend không kết nối được database | `DB_URL` trong `.env` phải dùng `host.docker.internal`, không phải `localhost` |
| `port is already allocated` / port 8080 bận | Cổng 80/8080 đang bị chương trình khác chiếm — tắt chương trình đó hoặc đổi mapping trong `docker-compose.yml` |
| Frontend báo lỗi CORS | Kiểm tra `ALLOWED_ORIGINS` trong `.env` chứa đúng địa chỉ đang mở frontend |
| Đăng nhập không được | Dùng đúng tài khoản demo ở mục 7 (mật khẩu `123456`); nghi dữ liệu hỏng thì reset database (mục 8) |
| Gửi email không hoạt động | Cần `MAIL_PASSWORD` (Gmail App Password của tài khoản dự án) — tính năng phụ, không ảnh hưởng demo chính |
