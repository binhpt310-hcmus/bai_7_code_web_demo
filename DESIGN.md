# DESIGN.md - Định hướng thiết kế Website Quản Lý Quán Cà Phê

Đi kèm với `PRD.md`. Tài liệu này định hướng phần frontend (giao diện) để tránh giao diện "AI mặc định" nhàm chán, rập khuôn, trong khi logic nghiệp vụ phía sau vẫn giữ đơn giản theo đúng PRD.

## 1. Triết lý thiết kế và nguồn tham khảo

Dự án áp dụng nguyên tắc từ skill thiết kế mã nguồn mở **Taste Skill** (`https://github.com/Leonxlnx/taste-skill`) - một bộ quy tắc "anti-slop" giúp AI coding agent (Claude Code, Cursor, Codex...) tạo giao diện có gu thẩm mỹ thay vì giao diện chung chung, thay vì tự nghĩ lại. Nếu bạn code bằng AI agent, có thể cài trực tiếp skill này trước khi bắt đầu:

```
npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"
```

Component/UI cụ thể (button, card, form, modal, loader...) được lấy cảm hứng và có thể copy-paste trực tiếp từ:

- **Uiverse.io** (`https://uiverse.io`) - thư viện element UI mã nguồn mở, thuần CSS hoặc Tailwind, phù hợp cho các chi tiết nhỏ (nút bấm, toggle, loader, tooltip, background pattern).
- **UI Layouts** (`https://www.ui-layouts.com/components`) - thư viện component React + Next.js + Tailwind + Motion (Framer Motion), phù hợp cho các khối lớn hơn có tương tác/animation (card sản phẩm, tab, modal, drawer, carousel, form nâng cao).

Nguyên tắc dùng chung: **copy để lấy cảm hứng và cấu trúc, không copy y nguyên màu sắc/nội dung mẫu.** Mọi component mượn về đều phải được chỉnh lại theo bảng màu và token thiết kế ở Mục 3 bên dưới, để cả trang có phong cách nhất quán, không phải một mớ component "chắp vá" từ nhiều template khác nhau.

## 2. Ba "dial" cấu hình mức độ thiết kế

Theo mô hình của Taste Skill, thiết lập trước 3 thông số để mọi quyết định layout/màu/động hoạ đều nhất quán, tránh vừa làm vừa đoán:

| Dial | Trang Client (khách hàng) | Trang Admin (Owner/Staff) |
| --- | --- | --- |
| DESIGN_VARIANCE (1 = đối xứng tuyệt đối, 10 = phá cách) | 6 - ấm áp, hiện đại, có điểm nhấn bố cục nhưng vẫn dễ quét mắt để chọn món nhanh | 4 - ưu tiên rõ ràng, dễ thao tác nhanh khi đang phục vụ khách, hạn chế phá cách |
| MOTION_INTENSITY (1 = tĩnh, 10 = điện ảnh) | 5 - có hiệu ứng mượt khi hover/thêm giỏ hàng/chuyển trạng thái, không lạm dụng | 3 - chuyển động tối thiểu, chỉ để phản hồi thao tác (không làm chậm quy trình vận hành) |
| VISUAL_DENSITY (1 = thoáng như phòng tranh, 10 = dày như buồng lái) | 3 - thoáng, ảnh món ăn là trung tâm, nhiều khoảng trắng | 6 - dày hơn vì cần thấy nhiều đơn hàng/món cùng lúc trên một màn hình |

Hai khu vực Client và Admin vì vậy nên có "cảm giác" khác nhau rõ rệt dù dùng chung 1 bảng màu: Client giống một trang thực đơn cao cấp, Admin giống một bảng điều khiển vận hành gọn gàng.

## 3. Hệ thống thiết kế (Design tokens)

### 3.1 Bảng màu

Tránh bảng màu "kem/be + đồng/hạt dẻ" (be #f5f1ea, đồng #b08947, nâu espresso #1a1714...) - đây là tổ hợp mà AI hay mặc định cho mọi thương hiệu "ấm áp, thủ công" (quán cà phê, đồ da, gốm...), khiến quán của bạn trông giống hệt hàng nghìn trang demo khác. Thay vào đó, chọn bảng **"Terracotta + Slate"** với 1 màu nhấn duy nhất, thực thi có chủ đích:

| Vai trò | Token | Giá trị gợi ý | Ghi chú |
| --- | --- | --- | --- |
| Nền chính | `--color-bg` | `#FAF9F6` (trắng ngà rất nhạt, gần trung tính) | Không dùng be đậm |
| Nền phụ / card | `--color-surface` | `#FFFFFF` | Card nổi trên nền chính bằng shadow nhẹ, không viền màu |
| Chữ chính | `--color-ink` | `#221D1A` (đen ấm, không phải nâu espresso điển hình) | Dùng cho heading và body |
| Chữ phụ | `--color-muted` | `#6B6460` | Mô tả món, ghi chú, timestamp |
| Màu nhấn duy nhất | `--color-accent` | `#C2542D` (terracotta/cam đất cháy) | CTA, badge trạng thái quan trọng, icon active - dùng nhất quán toàn site |
| Nền tối/slate (khu Admin, header) | `--color-slate` | `#2B2E33` | Dùng cho thanh điều hướng Admin hoặc section tối, không dùng nâu |
| Trạng thái thành công | `--color-success` | `#3F7A5C` (xanh rêu, không dùng xanh lá neon) | Đơn hoàn tất, còn hàng |
| Trạng thái cảnh báo/hết hàng | `--color-warning` | `#C2542D` (dùng lại accent) hoặc `#B4532C` | Hết hàng, cần chú ý |
| Trạng thái lỗi/hủy | `--color-danger` | `#9B3B3B` | Đơn bị hủy, lỗi form |

Quy tắc bắt buộc: toàn bộ site chỉ dùng **1 màu nhấn bão hòa cao** (`--color-accent`), không thêm màu nhấn thứ hai (không thêm xanh dương/tím ở phần khác của trang). Nếu cần phân biệt trạng thái đơn hàng, dùng sắc độ và icon khác nhau của cùng hệ màu trung tính + accent, không phát sinh thêm palette.

### 3.2 Typography

- Font chính: một font sans hiện đại, không dùng Inter làm mặc định. Gợi ý: `Geist`, `Outfit`, hoặc `Satoshi` cho heading; giữ nguyên font đó (đậm/nghiêng) cho phần nhấn chữ trong tiêu đề, không chèn font serif ngẫu nhiên để "tạo cảm giác cao cấp".
- Heading: `text-4xl` đến `text-6xl`, `tracking-tight`, `leading-tight`.
- Body: `text-base`, `leading-relaxed`, đoạn mô tả món giới hạn khoảng 65 ký tự/dòng để dễ đọc.
- Không dùng font serif trang trí trừ khi có lý do thương hiệu rõ ràng (PRD này không yêu cầu, nên mặc định sans-serif toàn bộ).

### 3.3 Bo góc, đổ bóng, khoảng cách

- **Khóa 1 hệ số bo góc cho toàn site**: dùng bo góc mềm `rounded-2xl` (khoảng 16px) cho card món ăn, modal, khối nội dung lớn; `rounded-full` (bo tròn hết) cho nút bấm và badge trạng thái; `rounded-lg` (8px) cho input/form. Không trộn lẫn card vuông cạnh với nút bo tròn tùy hứng.
- Đổ bóng: dùng shadow rất nhẹ, ám màu theo nền (không dùng bóng đen thuần túy) - ví dụ `shadow-[0_8px_24px_-8px_rgba(34,29,26,0.15)]`.
- Khoảng cách: chọn nhất quán 1 trong 2 hệ số `gap-4`/`gap-6` (Client, thoáng hơn) hoặc `gap-3`/`gap-4` (Admin, dày hơn), không trộn lẫn tùy trang.

### 3.4 Icon và trạng thái tương tác

- Dùng 1 bộ icon duy nhất cho toàn site (gợi ý `@phosphor-icons/react` hoặc `@tabler/icons-react`), không trộn nhiều bộ icon khác nhau, không tự vẽ icon SVG tay.
- Mọi nút bấm phải có đủ 4 trạng thái: mặc định, hover, active (nhấn xuống nhẹ bằng `scale-[0.98]`), disabled (mờ + không cho click).
- Mọi khu vực tải dữ liệu (danh sách món, danh sách đơn hàng) phải có skeleton loader đúng hình dạng nội dung thật, không dùng spinner tròn chung chung.
- Mọi danh sách có thể rỗng (giỏ hàng trống, chưa có đơn hàng nào, tìm không ra món) phải có trạng thái rỗng được thiết kế tử tế, kèm hướng dẫn hành động tiếp theo (ví dụ "Giỏ hàng đang trống - Xem thực đơn").

## 4. Ánh xạ component sang Uiverse.io / UI Layouts

Bảng dưới gợi ý nên lấy cảm hứng/component nào từ 2 nguồn cho từng phần giao diện. Khi triển khai, nhờ AI coding agent mở đúng trang component, đọc code mẫu, rồi viết lại theo token màu ở Mục 3.

| Khu vực giao diện | Component cần | Nguồn gợi ý | Ghi chú |
| --- | --- | --- | --- |
| Thanh điều hướng Client (logo, danh mục, giỏ hàng) | Responsive header | UI Layouts - Responsive-Header | Phải hiển thị gọn trên 1 dòng ở desktop, thu gọn hamburger ở mobile |
| Thẻ món ăn trong danh sách thực đơn | Product card / hover card | UI Layouts - Product-Cards, Hover cards | Ảnh món + tên + giá + nút thêm giỏ hàng nhanh |
| Lọc theo danh mục (cà phê, trà, bánh...) | Tabs | UI Layouts - Tabs | Thay cho dropdown, giúp thao tác 1 chạm trên mobile |
| Giỏ hàng | Drawer (trượt từ phải) | UI Layouts - Motion Drawer / Directional Drawer | Không cần chuyển hẳn sang trang mới, giữ ngữ cảnh đang xem menu |
| Xác nhận đặt hàng / chi tiết đơn hàng | Modal/Dialog | UI Layouts - Dialog, Responsive Modal | Responsive Modal để tự chuyển thành bottom-sheet trên mobile |
| Nút "Thêm vào giỏ", nút CTA chính | Button với hiệu ứng nhấn nhẹ | UI Layouts - Buttons; Uiverse.io - Button Effects (hover/gradient/3D, chọn loại tinh giản, không chọn hiệu ứng quá lòe loẹt) | CTA chính toàn site dùng chung 1 kiểu nút, không đổi kiểu giữa các trang |
| Vùng tải dữ liệu (menu, đơn hàng) | Skeleton loader | UI Layouts - Shimmer Loader; Uiverse.io - Loading UI/CSS Loaders | Ưu tiên shimmer đúng khung hình, tránh spinner tròn giữa màn hình trắng |
| Toggle "Còn hàng / Hết hàng" (Admin) | Toggle switch | Uiverse.io - Toggle Switches | Phản hồi tức thì khi Owner/Staff bật tắt |
| Form đăng nhập Admin, form thêm món | Input field, password field | UI Layouts - Password, File Upload (ảnh món); Uiverse.io - Input Fields, Checkbox UI | Label luôn nằm trên input, không dùng placeholder thay label (đúng PRD Mục 8) |
| Bảng điều khiển đơn hàng (order queue) | Bố cục dạng cột theo trạng thái (kanban-lite) | Tự dựng bằng CSS Grid, tham khảo bố cục "Card Components" của Uiverse.io cho từng thẻ đơn hàng | Không dùng thư viện kanban nặng, chỉ cần 4-5 cột trạng thái tĩnh |
| Thông báo đơn hàng mới / cập nhật trạng thái | Toast | UI Layouts - Dialog (biến thể toast) hoặc component toast nhẹ từ Uiverse.io | Chỉ dùng cho thông báo tạm thời, không dùng cho lỗi form (lỗi form hiển thị inline) |
| Danh sách nhân viên (Admin - Owner only) | Bảng dữ liệu đơn giản + hover row | Uiverse.io - Card Components/Profile Cards cho mỗi nhân viên, hoặc bảng HTML thuần với `divide-y` | Không cần thư viện data-table phức tạp vì số lượng nhân viên nhỏ |
| Biểu đồ doanh thu (Owner) | Chart đơn giản + stat card | Dùng thư viện chart nhẹ (ví dụ Recharts) cho biểu đồ; tham khảo "Large stat callouts" và Uiverse.io Card Components cho các thẻ số liệu | Thuộc MVP theo PRD Mục 6.5 và 11, chỉ 1 biểu đồ chính, không nhồi nhiều loại chart |
| Badge trạng thái thanh toán (Chưa/Đã thanh toán) | Badge/Tag nhỏ | Uiverse.io - tham khảo nhóm "Card Components"/Tooltip cho kiểu badge bo tròn nhỏ | Không dùng `--color-accent` cho badge này, xem Mục 5.4 |

## 5. Bố cục từng màn hình

### 5.1 Trang chủ / Thực đơn (Client)

- Hero ngắn gọn trong 1 màn hình đầu: tên quán, 1 câu giới thiệu, ảnh/nền món signature, nút CTA duy nhất "Xem thực đơn" hoặc cuộn thẳng xuống menu. Không nhồi thêm badge "được yêu thích bởi...", không thêm tagline phụ dưới CTA.
- Thanh danh mục dạng tab ngang, dính lại (sticky) khi cuộn xuống để luôn chọn danh mục được.
- Lưới thẻ món dạng `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4`, mỗi thẻ có ảnh vuông/4:3, tên, giá, badge "Hết hàng" nếu cần (mờ ảnh + khóa nút thêm giỏ).
- Nút giỏ hàng nổi (floating) góc dưới hoặc trong thanh điều hướng, hiển thị số lượng món hiện có.

### 5.2 Giỏ hàng và đặt hàng (Client)

- Giỏ hàng mở dạng drawer trượt từ bên phải (desktop) hoặc full-screen (mobile), không chuyển trang đột ngột.
- Mỗi dòng: ảnh nhỏ, tên món, bộ đếm số lượng, ghi chú, giá dòng, nút xóa.
- Bước checkout: chọn hình thức nhận (segmented control 2 lựa chọn: Mang đi / Tại quán, khi chọn "Tại quán" hiện thêm ô số bàn), nhập tên và số điện thoại, nút "Xác nhận đặt hàng" cỡ lớn, rõ ràng, không bị bọc chữ.

### 5.3 Theo dõi đơn hàng (Client)

- Hiển thị mã đơn to, rõ, cùng thanh tiến trình 4 bước (Chờ xác nhận - Đang pha chế - Sẵn sàng - Hoàn tất), bước hiện tại được nhấn bằng màu accent, các bước còn lại màu trung tính.
- Tự làm mới trạng thái mà không cần khách bấm F5 (poll định kỳ vài giây, hoặc realtime subscription nếu dùng Supabase Realtime).

### 5.4 Bảng điều khiển đơn hàng (Admin - Owner + Staff)

- Bố cục dạng cột theo trạng thái (Chờ xác nhận / Đang pha chế / Sẵn sàng / Hoàn tất), mỗi đơn hàng là 1 thẻ nhỏ trong cột, thẻ hiển thị mã đơn, giờ đặt, tóm tắt món, hình thức nhận.
- Bấm vào thẻ mở chi tiết đầy đủ (modal), có nút chuyển trạng thái ngay trong modal để không phải quay lại danh sách.
- Vì VISUAL_DENSITY ở Admin cao hơn Client, có thể dùng cỡ chữ nhỏ hơn 1 bậc và khoảng cách hẹp hơn, miễn vẫn đảm bảo tương phản đọc được.
- Mỗi thẻ đơn hàng và modal chi tiết đều có 1 badge trạng thái thanh toán riêng biệt với badge trạng thái món (2 badge độc lập, không gộp chung): "Chưa thanh toán" dùng `--color-muted` nền xám nhạt, "Đã thanh toán" dùng `--color-success` nền xanh rêu nhạt. Không dùng `--color-accent` cho badge này để tránh trùng với màu CTA chính.
- Trong modal chi tiết đơn hàng có nút riêng "Xác nhận thanh toán" (chỉ hiện với Owner/Staff, không bao giờ hiện ở phía Client) - bấm xong badge chuyển ngay từ "Chưa thanh toán" sang "Đã thanh toán" kèm hiệu ứng nhấn nhẹ, không cần tải lại trang. Sau khi xác nhận, nút này chuyển thành trạng thái đã hoàn tất (disabled, đổi nhãn "Đã thu tiền lúc HH:mm") để tránh bấm nhầm lần hai.

### 5.5 Quản lý thực đơn (Admin - Owner only)

- Danh sách món dạng bảng hoặc lưới nhỏ gọn, có bộ lọc theo danh mục, nút "Thêm món mới" nổi bật ở góc trên.
- Form thêm/sửa món: các trường tên, mô tả, giá, danh mục (dropdown), ảnh (kéo-thả upload), toggle còn hàng/hết hàng - label luôn ở trên, có phần xem trước (preview) thẻ món sẽ hiển thị cho khách ngay trong form.

### 5.6 Quản lý nhân viên (Admin - Owner only)

- Danh sách nhân viên dạng thẻ hoặc bảng: tên, vai trò, trạng thái (đang hoạt động/đã khóa), nút khóa/mở khóa nhanh.
- Form tạo nhân viên mới tối giản: họ tên, số điện thoại/email, mật khẩu tạm thời (có thể tự sinh), xác nhận.

### 5.7 Báo cáo doanh thu (Admin - Owner only)

- Vài thẻ số liệu lớn ở trên cùng (dùng pattern "Large stat callouts": số to 60-72pt, nhãn nhỏ bên dưới): Doanh thu hôm nay, Số đơn đã thanh toán hôm nay, Doanh thu trung bình/đơn - chỉ tính đơn có `payment_status = paid` và không bị hủy, đúng theo công thức ở `PRD.md` Mục 6.5.
- Bộ chọn khoảng thời gian đơn giản (Hôm nay / 7 ngày / 30 ngày / tùy chọn khoảng ngày) ngay phía trên các thẻ số liệu, đổi số liệu tức thì khi chọn.
- Biểu đồ cột hoặc đường đơn giản thể hiện doanh thu theo ngày trong khoảng đã chọn, dùng đúng `--color-accent` cho cột/đường chính, không thêm màu thứ hai.
- Bảng "Món bán chạy nhất" dạng danh sách xếp hạng (tên món, số lượng đã bán, doanh thu đóng góp), chỉ tính trên các đơn đã thanh toán.
- Không nhồi quá nhiều biểu đồ; ở bản MVP chỉ cần 1 biểu đồ chính + 1 bảng xếp hạng là đủ, tránh biến trang báo cáo thành "cockpit" quá tải khi VISUAL_DENSITY mục tiêu của Admin chỉ ở mức 6.

## 6. Responsive

- Breakpoint chuẩn: `sm 640`, `md 768`, `lg 1024`, `xl 1280`.
- Trang Client: thiết kế ưu tiên mobile trước (khách đặt món chủ yếu bằng điện thoại), kiểm tra kỹ ở 375px.
- Trang Admin: thiết kế ưu tiên tablet/laptop (nhân viên thao tác tại quầy), tối thiểu hỗ trợ tốt ở 768px trở lên, không bắt buộc tối ưu cực chi tiết cho màn hình quá nhỏ.
- Không dùng `h-screen` cho phần hero, dùng `min-h-[100dvh]` để tránh giật layout trên Safari di động.

## 7. Chuyển động (Motion) - giữ tinh giản

Đúng tinh thần MOTION_INTENSITY thấp-vừa đã đặt ở Mục 2, chỉ dùng chuyển động ở các điểm sau, không hơn:

- Thẻ món: hơi nâng lên (`-translate-y-1`) và tăng shadow nhẹ khi hover.
- Thêm vào giỏ: icon giỏ hàng "nảy" nhẹ hoặc số lượng đếm tăng có hiệu ứng đếm số (motion number).
- Chuyển trạng thái đơn hàng: thanh tiến trình animate mượt sang bước mới, không giật cục.
- Mở/đóng drawer giỏ hàng và modal: trượt/mờ dần trong khoảng 200-300ms.
- Tuyệt đối tránh: hiệu ứng scroll-hijack, parallax phức tạp, hiệu ứng 3D xoay sản phẩm - không cần thiết cho một web đặt món và làm chậm thao tác của nhân viên khi đang phục vụ khách.
- Luôn tôn trọng `prefers-reduced-motion`: tắt hoặc giảm hiệu ứng cho người dùng đã bật chế độ giảm chuyển động ở trình duyệt/hệ điều hành.

## 8. Danh sách kiểm tra trước khi bàn giao (Pre-flight checklist)

Trước khi xem một màn hình là "xong", kiểm tra:

- [ ] Hero (nếu có) vừa khít màn hình đầu, không cần cuộn mới thấy nút hành động chính.
- [ ] Toàn trang chỉ dùng đúng 1 màu nhấn bão hòa cao, không phát sinh màu nhấn thứ hai.
- [ ] Toàn trang dùng đúng 1 hệ số bo góc theo từng loại phần tử (nút tròn, card 16px, input 8px), không lẫn lộn.
- [ ] Mọi nút bấm có đủ trạng thái hover/active/disabled và chữ trên nút không bị xuống dòng.
- [ ] Mọi form có label phía trên, không dùng placeholder thay label, có thông báo lỗi rõ ràng ngay dưới input.
- [ ] Mọi vùng có thể rỗng hoặc đang tải đều có trạng thái rỗng/skeleton được thiết kế, không để trắng trơn.
- [ ] Điều hướng chính hiển thị gọn trên 1 dòng ở desktop.
- [ ] Đã kiểm tra tương phản màu chữ/nền đạt chuẩn dễ đọc (đặc biệt bảng trạng thái đơn hàng, nút CTA).
- [ ] Đã test trên cả điện thoại (Client) và tablet/laptop (Admin) bằng Responsively App như đã học ở Bài 6.
