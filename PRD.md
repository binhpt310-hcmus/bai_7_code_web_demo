# PRD - Website Quản Lý Quán Cà Phê

Product Requirements Document
Phiên bản: 1.0
Dùng làm demo thực hành cho Bài 7 - Khóa học Vibe Coding Thực Chiến

## 1. Tổng quan sản phẩm

### 1.1 Bối cảnh

Đây là một website demo cho một quán cà phê đơn lẻ (1 địa điểm, không phải chuỗi), phục vụ hai nhóm người dùng: khách hàng đặt món qua web, và đội ngũ vận hành quán (chủ quán + nhân viên) xử lý đơn hàng và quản lý thực đơn ngay trên cùng một hệ thống.

Sản phẩm được xây dựng với logic nghiệp vụ đơn giản (đủ dùng cho một quán quy mô nhỏ - vừa, không cần tồn kho phức tạp, không cần tích hợp thanh toán online, không cần đa chi nhánh), nhưng phần giao diện (frontend) cần được đầu tư kỹ để tạo trải nghiệm hiện đại, mượt mà, không "sến" hay rập khuôn - xem chi tiết định hướng thiết kế trong `DESIGN.md`.

### 1.2 Mục tiêu sản phẩm

- Cho phép khách hàng xem thực đơn, đặt món (mang đi hoặc dùng tại quán) và theo dõi trạng thái đơn hàng của mình theo thời gian thực mà không cần gọi nhân viên.
- Cho phép nhân viên quán tiếp nhận, xử lý và cập nhật trạng thái đơn hàng nhanh chóng ngay trên một màn hình vận hành (order queue).
- Cho phép chủ quán quản lý toàn bộ thực đơn, quản lý tài khoản nhân viên, và xem báo cáo doanh thu/đơn hàng cơ bản, mà không cần nhờ ai hỗ trợ kỹ thuật.
- Là một sản phẩm demo hoàn chỉnh, dễ hiểu, dùng để minh họa toàn bộ quy trình Vibe Coding: từ PRD, thiết kế, đến code, debug, deploy (Bài 1-8 của khóa học).

### 1.3 Ngoài phạm vi (Out of scope)

Để giữ logic đơn giản như yêu cầu, các mục sau KHÔNG nằm trong phạm vi bản demo này:

- Thanh toán online (Momo, VNPay, thẻ ngân hàng, cổng thanh toán thẻ...). Hệ thống không xử lý giao dịch tiền thật qua mạng. Toàn bộ thanh toán diễn ra tại quầy (tiền mặt hoặc POS riêng của quán); hệ thống chỉ ghi nhận lại việc "đã thu tiền tại chỗ" dưới dạng trạng thái thanh toán (xem Mục 4.3 và 6.5), không phải một giao dịch thanh toán điện tử.
- Quản lý tồn kho nguyên vật liệu, công thức pha chế, định lượng nguyên liệu.
- Đa chi nhánh / đa quán (multi-tenant). Hệ thống phục vụ đúng 1 quán.
- Chương trình khách hàng thân thiết, tích điểm, mã giảm giá phức tạp (có thể để ngỏ cho mở rộng sau).
- Ứng dụng di động riêng (native app). Chỉ có web, responsive tốt trên điện thoại.
- Đặt bàn trước theo khung giờ cụ thể (có thể là hướng mở rộng ở bản sau).

## 2. Đối tượng người dùng và vai trò

Hệ thống có 3 vai trò, quản lý qua cơ chế phân quyền (role-based access control):

| Vai trò | Mô tả | Phạm vi truy cập |
| --- | --- | --- |
| Khách hàng (Customer) | Người dùng công khai, không bắt buộc phải có tài khoản để xem menu, nhưng cần đăng nhập/để lại thông tin để đặt món và theo dõi đơn | Trang Client: menu, giỏ hàng, đặt món, theo dõi đơn của chính mình |
| Chủ quán (Owner) | Người quản lý cao nhất, duy nhất 1 tài khoản Owner cho mỗi quán | Toàn bộ trang Admin: menu, đơn hàng, nhân viên, báo cáo, cài đặt quán |
| Nhân viên (Staff) | Nhiều tài khoản Staff do Owner tạo ra (pha chế, thu ngân, phục vụ) | Trang Admin, giới hạn: xử lý đơn hàng, xem menu; KHÔNG quản lý nhân viên, KHÔNG xem báo cáo doanh thu |

Chủ quán và nhân viên dùng chung một khu vực Admin, chỉ khác nhau ở các mục menu hiển thị và hành động được phép thực hiện (xem Mục 5 - Ma trận phân quyền).

## 3. User stories

### 3.1 Khách hàng

- Là khách hàng, tôi muốn xem thực đơn theo danh mục (cà phê, trà, đá xay, bánh...) kèm hình ảnh và giá, để chọn món nhanh chóng.
- Là khách hàng, tôi muốn tìm kiếm hoặc lọc món theo danh mục, để tìm đúng món mình thích mà không cần cuộn hết trang.
- Là khách hàng, tôi muốn thêm món vào giỏ hàng, tùy chỉnh số lượng và ghi chú (ít đá, không đường...), trước khi đặt.
- Là khách hàng, tôi muốn chọn hình thức nhận món (mang đi / dùng tại quán, kèm số bàn nếu có), để nhân viên chuẩn bị đúng cách.
- Là khách hàng, tôi muốn xác nhận đơn hàng và nhận mã đơn, để có căn cứ theo dõi và nhận món.
- Là khách hàng, tôi muốn xem trạng thái đơn hàng của mình cập nhật theo thời gian thực (Đã nhận - Đang pha chế - Sẵn sàng - Hoàn tất), để biết khi nào ra lấy món.
- Là khách hàng, tôi muốn xem lại lịch sử các đơn đã đặt (nếu có tài khoản), để đặt lại món yêu thích nhanh hơn.

### 3.2 Nhân viên (Staff)

- Là nhân viên, tôi muốn đăng nhập vào khu vực vận hành riêng, để bắt đầu ca làm việc.
- Là nhân viên, tôi muốn thấy danh sách đơn hàng mới theo thời gian thực dưới dạng hàng đợi (queue), sắp xếp theo thời gian đặt, để không bỏ sót đơn nào.
- Là nhân viên, tôi muốn cập nhật trạng thái từng đơn hàng (xác nhận, bắt đầu pha chế, sẵn sàng, đã giao/hoàn tất, hoặc hủy kèm lý do), để khách hàng và các nhân viên khác đều nắm được tiến độ.
- Là nhân viên, tôi muốn xem chi tiết một đơn hàng (món, số lượng, ghi chú, hình thức nhận), để chuẩn bị đúng yêu cầu.
- Là nhân viên, tôi muốn xem thực đơn hiện tại (kể cả món đang hết hàng), để tư vấn khách tại quầy nếu cần, nhưng không thể chỉnh sửa menu.
- Là nhân viên, tôi muốn bấm "Xác nhận thanh toán" ngay sau khi thu tiền mặt/quẹt POS của khách tại quầy, để đơn hàng được tính đúng vào doanh thu của quán.

### 3.3 Chủ quán (Owner)

- Là chủ quán, tôi muốn thêm/sửa/xóa món trong thực đơn (tên, mô tả, giá, hình ảnh, danh mục, trạng thái còn hàng/hết hàng), để thực đơn luôn cập nhật.
- Là chủ quán, tôi muốn tạo tài khoản cho nhân viên mới và thu hồi/khóa tài khoản khi nhân viên nghỉ việc, để kiểm soát ai được truy cập hệ thống.
- Là chủ quán, tôi muốn xem toàn bộ đơn hàng của quán (không chỉ đơn đang xử lý) để giám sát hoạt động chung.
- Là chủ quán, tôi muốn xem báo cáo doanh thu và số lượng đơn theo ngày/tuần/tháng, cùng các món bán chạy nhất, để ra quyết định kinh doanh.
- Là chủ quán, tôi muốn chỉnh sửa thông tin quán (tên, giờ mở cửa, địa chỉ, số điện thoại), để thông tin hiển thị cho khách luôn chính xác.
- Là chủ quán, tôi có toàn bộ quyền của nhân viên (xử lý đơn hàng), để có thể trực tiếp vận hành khi cần.

## 4. Yêu cầu chức năng

### 4.1 Phía Client (khách hàng)

| Mã | Chức năng | Mô tả |
| --- | --- | --- |
| C1 | Trang chủ / Thực đơn | Hiển thị thông tin quán, danh sách món theo danh mục, ảnh, giá, trạng thái còn/hết hàng |
| C2 | Tìm kiếm và lọc món | Lọc theo danh mục, tìm theo tên món |
| C3 | Chi tiết món | Xem mô tả, ảnh lớn, tùy chọn (size, topping nếu có), ghi chú riêng |
| C4 | Giỏ hàng | Thêm/sửa số lượng/xóa món, xem tạm tính, ghi chú theo từng món |
| C5 | Đặt hàng (checkout) | Chọn hình thức nhận (mang đi/tại quán + số bàn), nhập tên và số điện thoại liên hệ, xác nhận đặt hàng |
| C6 | Theo dõi đơn hàng | Xem trạng thái đơn theo mã đơn hoặc số điện thoại, cập nhật real-time hoặc auto-refresh |
| C7 | Tài khoản khách hàng (tùy chọn) | Đăng ký/đăng nhập đơn giản (email hoặc số điện thoại + mật khẩu) để lưu lịch sử đơn hàng |

### 4.2 Phía Admin - dùng chung cho Owner và Staff

| Mã | Chức năng | Owner | Staff |
| --- | --- | --- | --- |
| A1 | Đăng nhập Admin | Có | Có |
| A2 | Bảng điều khiển đơn hàng (order queue theo trạng thái) | Có | Có |
| A3 | Cập nhật trạng thái đơn hàng | Có | Có |
| A4 | Xem chi tiết đơn hàng | Có | Có |
| A5 | Xem thực đơn (read-only) | Có | Có |
| A6 | Quản lý thực đơn (thêm/sửa/xóa món, danh mục) | Có | Không |
| A7 | Quản lý tài khoản nhân viên (thêm/khóa/xóa, đặt lại mật khẩu) | Có | Không |
| A8 | Báo cáo doanh thu và thống kê đơn hàng | Có | Không |
| A9 | Cài đặt thông tin quán | Có | Không |
| A10 | Xem toàn bộ lịch sử đơn hàng (kể cả đã hoàn tất/hủy) | Có | Chỉ xem đơn trong ca / gần đây |
| A11 | Xác nhận thanh toán đơn hàng (thu tiền tại quầy) | Có | Có |

### 4.3 Quy ước quan trọng: "Xác nhận thanh toán" nghĩa là gì

Vì hệ thống không tích hợp cổng thanh toán online (xem Mục 1.3), hành động **"Xác nhận thanh toán"** không phải là một giao dịch điện tử - nó chỉ là bước Nhân viên/Chủ quán bấm xác nhận **sau khi đã trực tiếp thu tiền mặt (hoặc quẹt POS riêng của quán) tại quầy** từ khách hàng. Nói cách khác: **mọi đơn hàng được đánh dấu "Đã thanh toán" trong hệ thống đều mặc định là thanh toán tại chỗ (on-site/in-person), không phải thanh toán online.** Đây là quy ước bắt buộc phải hiểu đúng khi lập trình, vì nó quyết định đơn hàng nào được tính vào doanh thu ở Mục 6.5.

Khách hàng KHÔNG có quyền tự xác nhận thanh toán (tránh trường hợp khách bấm xác nhận nhưng chưa thực sự trả tiền, làm sai lệch doanh thu). Chỉ Nhân viên hoặc Chủ quán - người trực tiếp cầm tiền/máy POS tại quầy - mới có quyền bấm "Xác nhận thanh toán" cho một đơn hàng cụ thể.

## 5. Ma trận phân quyền (RBAC)

Nguyên tắc: Owner luôn có tất cả quyền của Staff, cộng thêm các quyền quản trị. Staff không có quyền quản trị (menu, nhân sự, báo cáo, cài đặt).

| Hành động | Owner | Staff | Khách hàng |
| --- | --- | --- | --- |
| Xem thực đơn | Có | Có | Có |
| Đặt món | Không áp dụng | Không áp dụng | Có |
| Xử lý / cập nhật trạng thái đơn hàng | Có | Có | Không |
| Thêm/sửa/xóa món, danh mục | Có | Không | Không |
| Bật/tắt trạng thái còn hàng của món | Có | Có (nhanh, tại quầy) | Không |
| Xác nhận thanh toán đơn hàng (tại quầy) | Có | Có | Không |
| Quản lý tài khoản nhân viên | Có | Không | Không |
| Xem báo cáo doanh thu | Có | Không | Không |
| Sửa thông tin quán | Có | Không | Không |
| Xem lịch sử đơn hàng đầy đủ | Có | Giới hạn | Chỉ đơn của mình |

Ghi chú kỹ thuật cho phần code: đây chính là logic Row Level Security / kiểm tra vai trò (role check) mà khóa học đã học ở Bài 4 và Bài 7 - áp dụng vào database thật (ví dụ Supabase) khi triển khai.

## 6. Luồng nghiệp vụ chính

### 6.1 Luồng đặt món của khách hàng

1. Khách vào trang chủ, xem thực đơn theo danh mục.
2. Khách thêm món vào giỏ hàng, có thể tùy chỉnh số lượng và ghi chú.
3. Khách vào giỏ hàng, kiểm tra lại, chọn hình thức nhận (mang đi / tại quán).
4. Khách nhập tên và số điện thoại liên hệ (không bắt buộc tạo tài khoản), xác nhận đặt hàng.
5. Hệ thống tạo đơn hàng với trạng thái "Chờ xác nhận", trả về mã đơn cho khách.
6. Khách được chuyển đến trang theo dõi đơn hàng, thấy trạng thái cập nhật theo thời gian thực.

### 6.2 Luồng xử lý đơn hàng của nhân viên

1. Nhân viên đăng nhập vào khu vực Admin.
2. Đơn hàng mới xuất hiện ở cột "Chờ xác nhận" trên bảng điều khiển dạng cột trạng thái (kanban-style order queue).
3. Nhân viên bấm xác nhận, đơn chuyển sang "Đang pha chế".
4. Khi hoàn tất pha chế, nhân viên chuyển đơn sang "Sẵn sàng lấy món".
5. Khi khách nhận món, nhân viên chuyển đơn sang "Hoàn tất". Nếu khách không đến nhận hoặc hủy, nhân viên chuyển sang "Đã hủy" kèm lý do.
6. Mỗi lần đổi trạng thái, trạng thái phía khách hàng cập nhật tương ứng.

### 6.3 Luồng quản lý thực đơn của chủ quán

1. Owner vào mục Quản lý thực đơn.
2. Owner thêm danh mục mới (nếu cần) hoặc chọn danh mục có sẵn.
3. Owner thêm món mới: tên, mô tả, giá, ảnh, danh mục, trạng thái còn hàng.
4. Món mới lập tức xuất hiện trên trang Client (không cần deploy lại, đúng nguyên tắc đã học ở Bài 7: code và dữ liệu tách rời).
5. Owner có thể sửa giá, ảnh, hoặc chuyển trạng thái hết hàng bất cứ lúc nào.

### 6.4 Luồng quản lý nhân viên của chủ quán

1. Owner vào mục Quản lý nhân viên.
2. Owner tạo tài khoản mới: họ tên, số điện thoại/email, mật khẩu tạm thời, vai trò (mặc định Staff).
3. Nhân viên đăng nhập lần đầu bằng thông tin được cấp.
4. Khi nhân viên nghỉ việc, Owner khóa hoặc xóa tài khoản để thu hồi quyền truy cập ngay lập tức.

### 6.5 Luồng xác nhận thanh toán và tính doanh thu

1. Đơn hàng khi được tạo luôn bắt đầu ở trạng thái thanh toán "Chưa thanh toán" (`payment_status = unpaid`), độc lập với trạng thái xử lý món (chờ xác nhận/đang pha chế/sẵn sàng/hoàn tất).
2. Khi khách hàng trả tiền tại quầy (tiền mặt hoặc POS riêng của quán), Nhân viên hoặc Chủ quán mở chi tiết đơn hàng và bấm "Xác nhận thanh toán". Hệ thống ghi nhận `payment_status = paid`, kèm thời điểm xác nhận và tài khoản đã xác nhận.
3. Thông thường bước xác nhận thanh toán diễn ra cùng lúc hoặc ngay trước khi chuyển đơn sang "Hoàn tất", nhưng hai trạng thái này độc lập với nhau trong dữ liệu để xử lý được các trường hợp thực tế: khách nhận món rồi mới ra quầy trả tiền, hoặc khách trả tiền trước rồi chờ lấy món.
4. Một đơn hàng chỉ được tính vào doanh thu khi đồng thời thỏa 2 điều kiện: `payment_status = paid` VÀ trạng thái đơn khác "Đã hủy". Đơn "Đã hủy" dù lỡ được đánh dấu đã thanh toán (trường hợp hoàn tiền) cũng không tính vào doanh thu - nếu có hoàn tiền, Nhân viên/Chủ quán cần xử lý ngoài hệ thống và ghi chú lại trong phần ghi chú đơn hàng ở bản demo này.
5. **Công thức tính doanh thu:** Doanh thu (theo khoảng thời gian được chọn) = tổng `orders.total_amount` của tất cả đơn thỏa điều kiện ở bước 4, có `payment_confirmed_at` nằm trong khoảng thời gian đó.
6. Trang Báo cáo (A8, chỉ Owner) hiển thị: tổng doanh thu và tổng số đơn đã thanh toán theo ngày/tuần/tháng (có thể chọn khoảng ngày tùy ý), doanh thu trung bình mỗi đơn, và danh sách món bán chạy nhất (tính theo tổng số lượng trong `order_items` thuộc các đơn đã thanh toán).
7. Đơn "Chưa thanh toán" vẫn hiển thị trên bảng điều khiển vận hành (để Nhân viên biết cần thu tiền) nhưng không được cộng vào số liệu doanh thu cho đến khi được xác nhận.

## 7. Mô hình dữ liệu (đơn giản hóa)

Đây là mô hình dữ liệu ở mức khái niệm, đủ dùng để bắt đầu code (chi tiết cột và kiểu dữ liệu do AI hỗ trợ sinh khi cài đặt database):

- **users**: id, họ tên, email/số điện thoại, mật khẩu (hash), vai trò (owner / staff), trạng thái tài khoản (đang hoạt động / đã khóa), ngày tạo.
- **categories**: id, tên danh mục, thứ tự hiển thị.
- **menu_items**: id, category_id, tên món, mô tả, giá, ảnh, trạng thái còn hàng (true/false), thứ tự hiển thị.
- **customers**: id (tùy chọn nếu có tài khoản khách hàng), họ tên, số điện thoại/email, mật khẩu (hash, nếu có tài khoản).
- **orders**: id, mã đơn hiển thị cho khách, customer_id (có thể null nếu đặt không cần tài khoản), tên khách, số điện thoại liên hệ, hình thức nhận (mang đi/tại quán), số bàn (nếu có), trạng thái đơn (chờ xác nhận / đang pha chế / sẵn sàng / hoàn tất / đã hủy), **payment_status (chưa thanh toán / đã thanh toán)**, **payment_confirmed_at (thời điểm xác nhận thanh toán, null nếu chưa thanh toán)**, **payment_confirmed_by (id của Owner/Staff đã xác nhận)**, tổng tiền (total_amount), ghi chú, thời gian tạo, thời gian cập nhật.
- **order_items**: id, order_id, menu_item_id, số lượng, đơn giá tại thời điểm đặt, ghi chú riêng cho món.

Quan hệ chính: 1 category có nhiều menu_items; 1 order có nhiều order_items; 1 user (staff/owner) xử lý nhiều orders (chỉ cần lưu ai cập nhật lần cuối, không cần lịch sử phân công phức tạp).

## 8. Yêu cầu phi chức năng

- **Đơn giản trước, mở rộng sau**: ưu tiên logic dễ hiểu, dễ debug, đúng tinh thần "logic đơn giản" của khóa học; không tối ưu sớm cho quy mô lớn.
- **Responsive**: trang Client phải dùng tốt trên điện thoại (khách thường đặt món bằng điện thoại), trang Admin tối ưu cho tablet/laptop tại quầy.
- **Cập nhật gần thời gian thực**: trạng thái đơn hàng nên cập nhật tự động (real-time subscription hoặc polling mỗi vài giây), không bắt khách/nhân viên phải bấm F5.
- **Bảo mật cơ bản**: mật khẩu phải hash, không hardcode API key, phân quyền phải được kiểm tra ở phía server/database (không chỉ ẩn nút trên giao diện).
- **Hiệu năng**: trang thực đơn tải dưới 3 giây, ảnh món ăn được nén hợp lý.
- **Khả năng bảo trì**: Owner/Staff không rành kỹ thuật vẫn thao tác được toàn bộ nghiệp vụ hằng ngày (thêm món, xử lý đơn) mà không cần sửa code.

## 9. Giả định và ràng buộc

- Quán chỉ có 1 địa điểm, không cần chọn chi nhánh khi đặt món.
- Thanh toán thực hiện ngoài hệ thống (tại quầy), hệ thống chỉ ghi nhận trạng thái đơn hàng, không xử lý giao dịch tiền.
- Số lượng nhân viên đồng thời sử dụng hệ thống ở mức nhỏ (dưới 20 tài khoản), không cần tối ưu cho quy mô doanh nghiệp lớn.
- Ảnh món ăn do Owner tự tải lên, hệ thống không cần công cụ chỉnh sửa ảnh tích hợp.

## 10. Tiêu chí thành công (Acceptance Criteria)

- Khách hàng có thể đặt một đơn hàng hoàn chỉnh từ trang chủ đến khi nhận được mã đơn, trong tối đa 4 bước thao tác chính (xem menu, thêm giỏ, checkout, xác nhận).
- Nhân viên nhìn thấy đơn hàng mới xuất hiện trên bảng điều khiển trong vòng vài giây sau khi khách đặt, không cần tải lại trang thủ công.
- Chủ quán thêm một món mới và món đó xuất hiện trên trang Client ngay lập tức, không cần deploy lại code.
- Tài khoản Staff bị từ chối khi cố truy cập các trang chỉ dành cho Owner (quản lý nhân viên, báo cáo, cài đặt), kể cả khi truy cập trực tiếp bằng URL.
- Nhân viên/Chủ quán xác nhận thanh toán một đơn hàng, và số tiền của đơn đó xuất hiện ngay trong báo cáo doanh thu của đúng ngày hôm đó; đơn "Chưa thanh toán" hoặc "Đã hủy" không được cộng vào doanh thu.
- Khách hàng không nhìn thấy và không thể gọi được hành động "Xác nhận thanh toán" ở bất kỳ đâu trên giao diện Client.
- Toàn bộ luồng hoạt động ổn định trên cả điện thoại và laptop.

## 11. Lộ trình đề xuất (MVP -> mở rộng)

1. **MVP (bắt buộc cho demo)**: Mục 4.1 (C1-C6), Mục 4.2 (A1-A7, A11), xác nhận thanh toán và báo cáo doanh thu cơ bản (A8, Mục 6.5), phân quyền Owner/Staff cơ bản.
2. **Mở rộng ngắn hạn**: Tài khoản khách hàng + lịch sử đơn (C7), cài đặt quán (A9), báo cáo doanh thu nâng cao (biểu đồ theo khoảng ngày tùy chọn, xuất file).
3. **Mở rộng dài hạn (ngoài phạm vi demo)**: thanh toán online thật (cổng thanh toán), đặt bàn theo khung giờ, chương trình khách hàng thân thiết, ứng dụng di động.
