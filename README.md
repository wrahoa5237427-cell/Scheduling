# Lịch học

Web cá nhân để quản lý việc học và thời gian: hôm nay phải làm gì, việc nào quá hạn, thời gian đang đi đâu, và coding có đang ăn hết thời gian của IELTS / Toán HSG / việc trên lớp không.

Đây là công cụ cho một người dùng, không phải SaaS. Ưu tiên: chạy ổn định, đơn giản, nhanh.

## Stack

| Lớp | Công nghệ |
| --- | --- |
| Frontend | Vite, React 18, TypeScript, React Router |
| Backend | Supabase: Auth (email + mật khẩu), Postgres, Row Level Security |
| Hosting | Vercel (static, SPA rewrite) |

Không có server riêng: trình duyệt nói chuyện thẳng với Supabase, RLS đảm bảo mỗi tài khoản chỉ thấy dữ liệu của mình. Chưa có tính năng file/ảnh nên chưa dùng Supabase Storage.

## Cấu trúc thư mục

```text
supabase/migrations/   schema SQL (bảng, ràng buộc, index, trigger, RLS, grants)
src/
  lib/                 logic thuần, có test: ngày, định dạng, thống kê, timer
  data/                api.ts (mọi truy cập DB) + DataProvider (state trung tâm)
  components/          Layout, Dialog, Toast, icons, thanh thời gian
  features/            auth, dashboard, tasks, projects, focus, goals
  styles/              tokens -> base -> layout -> components
```

## Chạy local

```bash
npm install
cp .env.example .env      # điền URL + publishable key của Supabase
npm run dev
npm test                  # test logic trong src/lib
npm run typecheck
```

Cần Node 20 trở lên để chạy app. `npm test` chạy TypeScript trực tiếp nên cần Node 22.18 trở lên.

## Thiết lập Supabase

1. Chạy `supabase/migrations/20261008000000_init.sql` (SQL Editor hoặc `supabase db push`).
2. Lấy **Project URL** và **publishable key** ở Project Settings > API.
3. Authentication > Providers > Email: nếu không muốn xác nhận email thì tắt "Confirm email".
4. Sau khi tạo tài khoản của bạn, nên tắt "Allow new users to sign up" (Authentication > Sign In / Providers). Nếu để mở, ai biết URL cũng tạo được tài khoản riêng (không đọc được dữ liệu của bạn, nhưng dùng tài nguyên của bạn).

## Biến môi trường

| Tên | Ý nghĩa |
| --- | --- |
| `VITE_SUPABASE_URL` | URL project Supabase |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable (anon) key. An toàn để lộ ở trình duyệt vì đã có RLS. Không bao giờ dùng service_role key ở đây. |

## Deploy lên Vercel

1. Import repo vào Vercel (framework tự nhận Vite: build `npm run build`, output `dist`).
2. Thêm hai biến môi trường ở trên cho Production (và Preview nếu cần).
3. Deploy. `vercel.json` đã có rewrite về `index.html` để reload ở `/tasks`, `/focus`... không bị 404.

## Quy tắc nghiệp vụ cần biết

- Tuần bắt đầu từ thứ Hai, theo giờ máy của bạn.
- "Hôm nay" gồm việc có hạn hôm nay (chưa xong và đã xong) và việc hoàn thành trong hôm nay. "Quá hạn" là việc chưa xong có hạn trước hôm nay. "Sắp tới" là 7 ngày tới.
- `completed_at` do database tự đặt khi đổi status; client chỉ đổi `TODO`/`DONE`.
- Mục tiêu tuần tự chuyển sang các tuần sau cho đến khi bạn đổi. Đặt 0 hoặc để trống nghĩa là không có mục tiêu.
- Coding dùng mục tiêu như một giới hạn: vượt thì chỉ nhắc, không khóa timer.
- Timer tính theo mốc thời gian (không đếm tick) nên tab nền hay reload không làm sai giờ. Phiên đang chạy được lưu trong `localStorage`.

## Known issues

- Timer đang chạy chỉ nằm trên thiết bị bắt đầu nó (localStorage). Mở app ở máy khác sẽ không thấy phiên đang chạy; các phiên đã kết thúc thì đồng bộ bình thường.
- Một phiên qua nửa đêm được tính hết vào ngày bắt đầu.
- Đổi lĩnh vực của project sau khi tạo chưa hỗ trợ (tránh lệch với các việc bên trong).

## Future improvements (chưa làm, ngoài scope V1)

- Weekly review (màn hình tổng kết tuần, xem các tuần trước)
- Tìm kiếm việc, phím tắt
- Thêm thời gian thủ công khi quên bật timer
- Timer đồng bộ giữa các thiết bị (bảng `active_timer`)
- Option "đánh dấu xong" ngay khi kết thúc phiên focus gắn với một việc
- Lặp lại việc theo lịch (recurring)
