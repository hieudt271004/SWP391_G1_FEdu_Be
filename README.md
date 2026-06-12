# 🎓 FEdu - Education Management Platform

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3-green.svg?style=flat-square&logo=spring)](https://spring.io/)
[![React](https://img.shields.io/badge/React-18-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Vite](https://img.shields.io/badge/Vite-6-purple.svg?style=flat-square&logo=vite)](https://vite.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4-38B2AC.svg?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

**FEdu** là một nền tảng quản lý và học tập trực tuyến (LMS - Learning Management System) được phát triển bởi các sinh viên trường Đại học FPT (Nhóm 1 - Môn học SWP391). Hệ thống được thiết kế để kết nối Admin, Giảng viên (Teacher), Trợ giảng (Sub-Mentor) và Sinh viên (Student) nhằm tối ưu hóa trải nghiệm dạy và học.

---

## 🌟 Tính năng nổi bật theo vai trò

| Vai trò                       | Mô tả chức năng chính                                                                                                                                                                                            |
| :---------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **🔑 Admin**                  | Quản trị viên hệ thống, quản lý tài khoản người dùng, phân quyền, cấu hình môn học và lớp học.                                                                                                                   |
| **👨‍🏫 Teacher (Giảng viên)**   | Tạo lộ trình học tập (`Learning Path`), tạo node bài học (`Learning Node`), tải tài liệu (`Materials`), bài kiểm tra (`Tests`), chấm điểm bài tập (`Submissions`), giải đáp thắc mắc và xử lý các ticket hỗ trợ. |
| **🧑‍🎓 Student (Sinh viên)**    | Tham gia lớp học, học theo lộ trình trực quan, xem video/tài liệu học tập, làm bài kiểm tra trắc nghiệm (`Tests`), nộp bài tập (`Submissions`), gửi câu hỏi thảo luận, gửi ticket yêu cầu hỗ trợ.                |
| **🙋‍♂️ Sub-Mentor (Trợ giảng)** | Hỗ trợ giảng viên trả lời các thắc mắc của sinh viên, xử lý và hỗ trợ kỹ thuật/kiến thức thông qua hệ thống `Support Tickets`.                                                                                   |

---

## 🛠️ Công nghệ sử dụng

### 🖥️ Backend (`/fedu`)

- **Framework**: Java 17 + Spring Boot 3.3
- **Security**: Spring Security + Stateless JWT Authentication (Access, Refresh & Reset tokens)
- **Database Access**: Spring Data JPA + Hibernate
- **API Documentation**: Springdoc OpenAPI / Swagger UI
- **Build Tool**: Maven Wrapper (`mvnw`)

### 🎨 Frontend (`/SWP391_G1_FEdu_Fe`)

- **Framework**: React 18 + TypeScript + Vite 6
- **CSS & UI Components**: Tailwind CSS v4 + Shadcn UI + Radix UI + Material UI Icons
- **Routing & State**: React Router Dom v7 + Axios
- **Charts**: Recharts (thống kê tiến độ)

### 🗄️ Database

- **Database Engine**: PostgreSQL (Deploy trên cloud Neon.tech)
- **Quản lý Schema**: Khởi tạo thủ công thông qua tệp tin SQL script `fedudb_script.sql` (Hibernate `ddl-auto` cấu hình là `none`).

---

## 📂 Cấu trúc dự án

```text
SWP391_G1_FEdu_Be/
├── fedu/                     # Thư mục chứa mã nguồn Backend (Spring Boot Project)
│   ├── src/main/java/        # Mã nguồn Java (Controllers, Services, Repositories, DTOs, Entities...)
│   ├── src/main/resources/   # Cấu hình ứng dụng (application.yml, static templates...)
│   ├── fedudb_script.sql     # Script khởi tạo cơ sở dữ liệu PostgreSQL
│   ├── mvnw / mvnw.cmd       # Maven wrapper khởi chạy dự án
│   └── pom.xml               # Khai báo dependencies của Maven
├── SWP391_G1_FEdu_Fe/        # Thư mục chứa mã nguồn Frontend (React + Vite Project)
│   ├── src/                  # Mã nguồn React (Components, Pages, Services, Hooks...)
│   ├── package.json          # Cấu hình dependencies & scripts của NPM/PNPM
│   └── vite.config.ts        # Cấu hình Vite dev server
└── README.md                 # Tệp hướng dẫn này
```

---

## 🚀 Hướng dẫn cài đặt & Khởi chạy

### 1. Chuẩn bị Cơ sở dữ liệu (Database)

1. Cài đặt PostgreSQL (hoặc sử dụng dịch vụ đám mây như Neon, Supabase).
2. Tạo cơ sở dữ liệu mới (ví dụ đặt tên là `fedu_db`).
3. Chạy toàn bộ file script `/fedu/fedudb_script.sql` trong cơ sở dữ liệu vừa tạo để dựng schema và dữ liệu mẫu (Roles...).

### 2. Cấu hình Biến môi trường (Environment Variables)

Ứng dụng backend Spring Boot cần một số biến môi trường để chạy ổn định (tham khảo trong `fedu/src/main/resources/application.yml`). Bạn cần thiết lập các biến sau trong hệ điều hành của mình hoặc trong công cụ chạy dự án (như IntelliJ IDEA):

- `DB_PASSWORD`: Mật khẩu của tài khoản cơ sở dữ liệu PostgreSQL.
- `MAIL_PASSWORD`: Mật khẩu ứng dụng Gmail (để gửi mail kích hoạt, reset mật khẩu).
- `JWT_ACCESS_KEY`: Chuỗi khóa bảo mật ký Access Token JWT (độ dài tối thiểu 256-bit).
- `JWT_REFRESH_KEY`: Chuỗi khóa bảo mật ký Refresh Token JWT.
- `JWT_RESET_KEY`: Chuỗi khóa bảo mật ký Reset Password Token.

### 3. Khởi chạy Backend (`fedu`)

Di chuyển vào thư mục `fedu/` và thực hiện các lệnh sau:

- **Chạy dự án ở chế độ phát triển (Development):**
  ```bash
  ./mvnw spring-boot:run
  ```
- **Build dự án thành file JAR:**
  ```bash
  ./mvnw clean package
  ```
- **Chạy các unit test:**
  ```bash
  ./mvnw test
  ```
  Backend sẽ khởi chạy tại cổng mặc định: `http://localhost:8080`

### 4. Khởi chạy Frontend (`SWP391_G1_FEdu_Fe`)

Di chuyển vào thư mục `SWP391_G1_FEdu_Fe/` và thực hiện các lệnh sau:

- **Cài đặt thư viện:**
  ```bash
  npm install   # hoặc pnpm install
  ```
- **Khởi chạy Development Server:**
  ```bash
  npm run dev   # hoặc pnpm dev
  ```
  Frontend sẽ được phục vụ tại địa chỉ: `http://localhost:5173`

---

## 📖 Tài liệu API (API Documentation)

Hệ thống đã tích hợp sẵn **Swagger UI** giúp việc phát triển và tích hợp API giữa frontend và backend trở nên dễ dàng.

- Địa chỉ Swagger UI: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
- Các endpoint `/auth/*` và Swagger được miễn kiểm tra bảo mật (whitelist) để lập trình viên dễ dàng thử nghiệm.

---

## 🛡️ Quy chuẩn phát triển (Coding Conventions)

Để duy trì tính thống nhất của mã nguồn, đội ngũ phát triển tuân thủ các quy tắc sau:

### Quy chuẩn phản hồi API (Response Envelope)

Mọi API Controller đều phải trả về định dạng chuẩn bọc trong `ResponseData<T>`:

```json
{
  "status": 200,
  "message": "Thông điệp phản hồi",
  "data": { ... }
}
```

Các lỗi được xử lý tập trung bởi `@RestControllerAdvice` trong `GlobalExceptionHandler`, ánh xạ các exception (như `InvalidDataException`, `ResourceNotFoundException`) về cùng định dạng JSON trên.

### Quy chuẩn Bảo mật & Phân quyền (Security & Roles)

- Phân quyền dựa trên URL được cấu hình tại `config/AppConfig.java`.
- Kiểm tra xác thực token diễn ra tại bộ lọc `config/PreFilter.java` trước khi yêu cầu đi sâu vào Controller.
- Phân quyền cụ thể cho các API:
  - `/admin/**` yêu cầu quyền `ADMIN`.
  - `/teacher/**` và `/teacher-manage/**` yêu cầu quyền `TEACHER`.
  - `/student/sub-mentor/**` yêu cầu quyền `SUB_MENTOR`.
  - `/student/**` yêu cầu quyền `STUDENT`.

---

## 👥 Thành viên thực hiện (Group 1 - SWP391)

- Sinh viên Đại học FPT.
- Liên hệ hỗ trợ: `hieudtfptu@gmail.com`
  test update
