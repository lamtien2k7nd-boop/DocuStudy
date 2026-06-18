# 📚 DocuStudy - Nền tảng Tài liệu Học tập Trực tuyến

**DocuStudy** là một ứng dụng web hiện đại được thiết kế để hỗ trợ việc chia sẻ, tìm kiếm và quản lý tài liệu học tập. Với giao diện trực quan và hệ thống phân loại thông minh, người dùng có thể dễ dàng tiếp cận nguồn tài nguyên giáo dục chất lượng cao.

---

## ✨ Tính năng nổi bật

- 🏠 **Trang chủ Năng động**: Hiển thị tài liệu mới nhất, xu hướng và các chuyên mục nổi bật.
- 🔍 **Tìm kiếm & Phân loại**: 
  - Lọc tài liệu theo **Môn học** (Toán, Lý, Hóa...), **Khối lớp** (10, 11, 12...), và **Loại đề thi**.
  - Hệ thống thẻ (tags) linh hoạt giúp phân loại chi tiết.
- 🔐 **Hệ thống Tài khoản Bảo mật**:
  - Đăng ký và đăng nhập tiêu chuẩn với mật khẩu mã hóa (Bcrypt).
  - Tích hợp **Social Login**: Google, GitHub, Facebook, và Discord qua Passport.js.
- 📊 **Dashboard Admin Chuyên nghiệp**:
  - Quản lý danh sách tài liệu, người dùng và các danh mục.
  - Thống kê lượt truy cập và tải xuống trực quan với biểu đồ (Chart.js).
- ⬇️ **Theo dõi Tải xuống**: Hệ thống tự động ghi lại lượt tải và log truy cập để phân tích xu hướng.
- 📰 **Tin tức Giáo dục**: Cập nhật các bài viết, tin tức mới nhất về giáo dục và thi cử.

---

## 🛠️ Công nghệ sử dụng

- **Backend**: Node.js, Express.js.
- **Database**: SQLite3 (Quản lý dữ liệu gọn nhẹ, hiệu quả).
- **Template Engine**: EJS (Embedded JavaScript) với Layouts.
- **Authentication**: Passport.js.
- **Styling**: Vanilla CSS (Tối ưu hóa hiệu năng và tùy biến cao).
- **Tooling**: Nodemon (Chế độ phát triển), Dotenv (Quản lý biến môi trường).

---

## 🚀 Hướng dẫn cài đặt

### 1. Yêu cầu hệ thống
- Đã cài đặt [Node.js](https://nodejs.org/) (Khuyến nghị v16+).
- Trình duyệt web hiện đại (Chrome, Edge, Firefox...).

### 2. Các bước cài đặt
1. **Tải mã nguồn**:
   ```bash
   git clone <url-repository>
   cd "Tu dev web"
   ```

2. **Cài đặt dependencies**:
   ```bash
   npm install
   ```

3. **Cấu hình môi trường**:
   Tạo file `.env` tại thư mục gốc và cung cấp các thông tin cần thiết (tham khảo mẫu bên dưới):
   ```env
   PORT=3001
   SESSION_SECRET=your_secret_key_here
   
   # Social Authentication
   GOOGLE_CLIENT_ID=your_id
   GOOGLE_CLIENT_SECRET=your_secret
   GITHUB_CLIENT_ID=your_id
   GITHUB_CLIENT_SECRET=your_secret
   # Tương tự cho Discord và Facebook...
   ```

4. **Khởi chạy ứng dụng**:
   - **Chế độ phát triển** (tự động reload khi sửa code):
     ```bash
     npm run dev
     ```
   - **Chế độ sản xuất**:
     ```bash
     npm start
     ```

5. **Truy cập**: Mở trình duyệt và đi tới `http://localhost:3001`.

---

## 📂 Cấu trúc dự án

```text
├── database/           # Chứa file cơ sở dữ liệu SQLite (.db)
├── scripts/            # Các kịch bản tiện ích (seed dữ liệu...)
├── src/
│   ├── config/         # Cấu hình Database, Passport, social auth
│   ├── controllers/    # Xử lý logic nghiệp vụ xử lý request/response
│   ├── middlewares/    # Các bộ lọc (Auth, Logger, Error logic)
│   ├── models/         # (Tương lai) Định nghĩa Schema/Thao tác DB
│   ├── public/         # Tài nguyên tĩnh (CSS, JS client, Images)
│   ├── routes/         # Định nghĩa các endpoint (vùng dẫn) URL
│   ├── views/          # Giao diện EJS (Templates)
│   └── server.js       # Điểm khởi đầu của ứng dụng
├── .env                # Biến môi trường quan trọng
└── package.json        # Thông tin project và thư viện
```

---

## 👤 Tác giả
Dự án được phát triển và duy trì bởi **Tu Dev** (lamtien2k7nd).

---
*Cập nhật lần cuối: 18/06/2026*
