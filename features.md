# Attendance SaaS — Product Functional Specification (Detailed)

**Version:** v1.1
**Audience:** Product Owner, PM, Design, Engineering
**Product Type:** Multi-tenant SaaS
**Tech Stack:** NestJS + NextJS + Supabase
**Goal:** Mô tả đầy đủ mục đích, phạm vi, cách hệ thống hoạt động ở mức nghiệp vụ (không đi sâu kỹ thuật)

Công nghệ sữ dụng:
- Backend: Nestjs, supabase
- Frontend: Nextjs, tailwindcss, shadcn, responsive

---

# 1. Executive Summary

## 1.1 Bài toán kinh doanh

Nhiều doanh nghiệp hiện gặp các vấn đề:

* Không theo dõi được giờ vào/ra thực tế của nhân viên
* Khó phát hiện đi trễ, về sớm
* Thiếu bằng chứng khi có tranh chấp
* Quản lý mất nhiều thời gian tổng hợp báo cáo
* Quy trình chấm công thủ công hoặc rời rạc

Sản phẩm này nhằm cung cấp một hệ thống chấm công web tập trung, dễ triển khai cho nhiều doanh nghiệp khác nhau (SaaS), giúp:

* Minh bạch thời gian làm việc
* Giảm gian lận chấm công
* Giúp quản lý có dữ liệu theo thời gian thực
* Giảm công việc thủ công cho bộ phận vận hành

⚠️ Phạm vi hiện tại **không bao gồm tính lương**.

---

# 2. Vision & Success Criteria

## 2.1 Tầm nhìn v1

Cho phép một công ty có thể:

* onboard nhanh trong vài phút
* tạo ca làm việc
* thêm nhân viên
* bắt đầu chấm công ngay trong ngày

---

## 2.2 Định nghĩa thành công (pilot)

Một công ty pilot được coi là thành công khi:

* Nhân viên check-in/out hằng ngày
* Manager theo dõi được team
* Dữ liệu late/early chính xác
* Không có lỗi blocker trong vận hành thực tế

---

# 3. Người dùng & Vai trò

Hệ thống phục vụ nhiều cấp người dùng trong doanh nghiệp.

---

## 3.1 Owner (Chủ công ty)

**Ai là người này?**
Người đăng ký công ty đầu tiên trên hệ thống.

**Họ cần gì?**

* Thiết lập công ty nhanh
* Bắt đầu dùng ngay
* Không cần phụ thuộc support

**Vai trò trong hệ thống**

* Cấu hình ban đầu
* Có toàn quyền (tương tự Admin)
* Thường chỉ dùng ở giai đoạn đầu

---

## 3.2 Admin (Quản trị hệ thống)

**Ai là người này?**

* IT nội bộ
* HR vận hành
* Operations

**Mục tiêu**

* Quản trị người dùng
* Quản lý ca làm việc
* Xử lý sự cố chấm công
* Đảm bảo dữ liệu đúng

Đây là **vai trò vận hành trung tâm** của hệ thống.

---

## 3.3 Manager (Quản lý)

**Ai là người này?**

* Trưởng nhóm
* Trưởng phòng
* Line manager

**Họ quan tâm điều gì?**

* Ai đi trễ
* Ai về sớm
* Nhân viên có chấm công không
* Báo cáo team theo tháng

Manager **không cấu hình hệ thống**, chỉ giám sát team.

---

## 3.4 Employee (Nhân viên)

**Đây là user sử dụng hằng ngày.**

**Mục tiêu rất đơn giản:**

* Chấm công nhanh
* Không bị rắc rối
* Xem lại lịch sử của mình

⚠️ UX cho nhóm này phải cực kỳ đơn giản.

---

## 3.5 Executive (CEO / Director)

**Họ không vận hành hằng ngày.**

**Họ cần:**

* bức tranh tổng thể
* xu hướng đi trễ
* tỷ lệ đi làm đúng giờ
* drill-down khi cần

---

# 4. Hành trình sử dụng chính (Core User Journey)

---

# 4.1 Hành trình của một công ty mới

## Bước 1 — Đăng ký công ty

Owner điền:

* tên công ty
* email
* mật khẩu

Sau khi hoàn tất, hệ thống tự động tạo tenant riêng cho công ty.

👉 Mục tiêu: **self-service hoàn toàn**

---

## Bước 2 — Guided Setup (rất quan trọng)

Ngay sau đăng ký, Owner được dẫn qua wizard để tránh cấu hình thiếu.

---

### Step 2.1 — Cấu hình công ty

Owner phải chọn:

* múi giờ của công ty
* (tuỳ chọn) IP nội bộ

**Vì sao bước này quan trọng?**

* toàn bộ logic late/early phụ thuộc timezone
* nếu sai sẽ sai toàn bộ dữ liệu

---

### Step 2.2 — Tạo ca làm việc đầu tiên

Owner/Admin tạo ít nhất 1 shift, ví dụ:

* 08:30 – 17:30
* grace 5 phút

**Nếu không có shift → nhân viên không thể chấm công đúng.**

---

### Step 2.3 — Thêm người dùng đầu tiên

Owner có thể:

* tạo Admin
* tạo Manager
* import nhân viên
* hoặc tạm bỏ qua

Sau bước này, công ty đã sẵn sàng vận hành.

---

# 5. Trải nghiệm chấm công của nhân viên

Đây là **luồng quan trọng nhất của toàn bộ sản phẩm**.

---

## 5.1 Check-in buổi sáng

### Mục tiêu UX

* nhanh
* rõ ràng
* ít thao tác
* khó gian lận

---

### Luồng chi tiết

1. Nhân viên đăng nhập
2. Vào trang Home
3. Thấy nút CHECK-IN lớn
4. Bấm CHECK-IN
5. Hệ thống bật camera trước
6. Nhân viên chụp khuôn mặt
7. Hệ thống tính toán đi trễ hay không
8. Nếu đi trễ → bắt buộc nhập lý do
9. Nhân viên submit

---

### Điều gì xảy ra phía hệ thống

Hệ thống ghi nhận:

* thời điểm check-in
* ảnh khuôn mặt
* IP
* số phút đi trễ
* phân loại late

---

## 5.2 Check-out buổi chiều

Luồng tương tự check-in.

Nếu về sớm → bắt buộc nhập note.

---

## 5.3 Trường hợp quên checkout

Nếu qua nửa đêm theo timezone công ty mà chưa checkout:

Hệ thống tự động:

* đánh dấu thiếu checkout
* trạng thái = missing
* nguồn = system

Nhân viên sau đó có thể giải trình để Admin chỉnh.

---

# 6. Logic tính đi trễ / về sớm

---

## 6.1 Grace period

Mặc định: **5 phút**

Ví dụ:

* ca bắt đầu 08:30
* check-in 08:33

→ vẫn bị ghi nhận trễ 3 phút
→ nhưng thuộc nhóm “within grace”

Điều này giúp:

* báo cáo trung thực
* nhưng không quá khắt khe

---

## 6.2 Early leave

Nếu checkout trước giờ kết thúc ca:

* hệ thống tính số phút về sớm
* bắt buộc note

---

# 7. Bằng chứng (Evidence)

Hệ thống sử dụng **ảnh chụp tại thời điểm chấm công** để:

* tăng tính minh bạch
* hỗ trợ khi có tranh chấp
* hạn chế chấm công hộ

⚠️ V1 **không dùng nhận diện khuôn mặt**.

---

## 7.1 Quy tắc

* chỉ cho chụp từ camera
* không cho upload ảnh
* lưu ảnh có thời hạn (90–180 ngày)

---

# 8. Góc nhìn của Manager

Manager sử dụng hệ thống chủ yếu để **giám sát**.

---

## 8.1 Danh sách nhân viên

Manager chỉ thấy nhân viên thuộc quyền quản lý.

Quan hệ này do Admin/Owner thiết lập.

---

## 8.2 Theo dõi chấm công

Manager có thể:

* xem theo ngày
* xem theo tháng
* lọc theo nhân viên
* xem note giải trình

---

## 8.3 Báo cáo team

Manager có thể xem:

* tổng số lần đi trễ
* tỷ lệ đi làm đúng giờ
* xu hướng theo tháng

---

# 9. Góc nhìn của Executive

Executive cần **insight cấp cao**, không cần thao tác chi tiết.

---

## 9.1 Dashboard

Hiển thị:

* attendance rate toàn công ty
* top nhân viên đi trễ
* tổng hợp theo tháng

---

## 9.2 Drill-down

Executive có thể:

* click vào từng nhân viên
* xem lịch sử chi tiết

Nhưng **không chỉnh sửa dữ liệu**.

---

# 10. Vai trò của Admin trong vận hành

Admin là người giữ cho hệ thống chạy trơn tru.

---

## 10.1 Quản lý người dùng

Admin có thể:

* tạo user
* đổi role
* vô hiệu hoá user
* import CSV

---

## 10.2 Quản lý ca làm việc

Admin:

* tạo shift
* chỉnh shift
* gán shift cho user
* đổi shift theo ngày hiệu lực

---

## 10.3 Điều chỉnh chấm công (rất quan trọng)

Dùng khi:

* hệ thống lỗi
* nhân viên quên chấm
* manager yêu cầu

---

### Quy trình

Admin mở record → nhập giờ mới → nhập lý do → lưu.

---

### Nguyên tắc an toàn

Hệ thống phải:

* lưu lịch sử trước/sau
* biết ai chỉnh
* biết khi nào chỉnh
* không mất dữ liệu gốc

---

# 11. Báo cáo & xuất dữ liệu

Hệ thống hỗ trợ:

* báo cáo theo tháng
* thống kê đi trễ
* export CSV

Mục tiêu là giúp doanh nghiệp **dễ đối soát nội bộ**.

---

# 12. Bảo mật & phân tách dữ liệu

Đây là yêu cầu bắt buộc vì là SaaS.

---

## 12.1 Multi-tenant isolation

Mỗi công ty có:

* dữ liệu riêng
* user riêng
* cấu hình riêng

Không được phép truy cập chéo.

---

## 12.2 Row Level Security

Mọi truy vấn phải bị giới hạn theo `company_id`.

---

# 13. Những gì KHÔNG nằm trong MVP

Để tránh scope creep, v1 **không bao gồm**:

* tính lương
* nhận diện khuôn mặt
* mobile native app
* định vị GPS
* workflow duyệt giải trình

---

# 14. Tổng kết

Sản phẩm v1 tập trung vào một mục tiêu duy nhất:

> **Giúp doanh nghiệp theo dõi giờ làm việc minh bạch, đơn giản và triển khai nhanh.**

Ưu tiên:

1. Trải nghiệm check-in mượt
2. Dữ liệu chính xác
3. Manager nhìn được ngay
4. Admin xử lý được sự cố
5. Onboarding công ty nhanh

---

**END OF DOCUMENT**
