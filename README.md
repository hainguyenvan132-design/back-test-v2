# Trạm tín hiệu coin

Mở `index.html` bằng trình duyệt (Chrome hoặc Safari qua đường link, không mở trực tiếp từ ứng dụng ghi chú). Toàn bộ app nằm trong **một file `index.html`**: mỗi chỉ báo là một khối `<script>` riêng, đầu khối có chú thích ghi chỉ báo cung cấp gì và tín hiệu ra sao.

## Thư mục

| Đường dẫn | Việc |
|---|---|
| `index.html` | App (giao diện, engine chấm điểm, backtest, các chỉ báo) |
| `bot/run.js` | Bot quét tín hiệu, nhắn Telegram, ghi `data/` (nạp lại engine từ `index.html`, không viết lại) |
| `bot/config.json` | Danh sách mã, chế độ spot/futures, bộ lọc bổ trợ, cảnh báo đổi hướng |
| `data/signals.json`, `data/state.json` | Kết quả tín hiệu thật do bot ghi (tab "Kết quả thật" đọc file này) |
| `.github/workflows/signals.yml` | Chạy bot mỗi 15 phút trên GitHub Actions |
| `tools/bundle.py` | Chỉ cần khi quay lại bản tách `js/*.js`: gộp thành một file. Với `index.html` hiện tại (đã gộp sẵn) thì không cần |

## Chỉ báo hiện có

| Mã | Chỉ báo | Nhóm | Nút "Bổ trợ" mặc định |
|---|---|---|---|
| `macd` | MACD 12·26·9 | Động lượng | luôn tính |
| `srsi` | StochRSI + RSI 14 | Động lượng | luôn tính |
| `div` | Phân kỳ RSI/MACD | Động lượng | bật |
| `st` | Supertrend (ATR 10, ×3) | Xu hướng | tắt |
| `hull` | Hull Suite (HMA 55) | Xu hướng | tắt |
| `struct` | Cấu trúc giá BOS/CHoCH | Xu hướng | bật |
| `fvgob` | FVG Order Blocks [BigBeluga] | Vùng cung cầu | bật |
| `wyk` | Wyckoff (Spring, Upthrust, SOS, SOW) | Vùng cung cầu | tắt |
| `obv` | OBV | Dòng tiền | bật |
| `bb` | Bollinger 20·2 | Biến động | luôn tính |
| `vol` | Volume xác nhận | (không tính nhóm) | luôn tính |
| `reg` | ADX 14: "Lọc đi ngang" (ADX dưới 20 thì bỏ phiếu và tín hiệu của nhóm Xu hướng) | bộ lọc | tắt |
| `grp` | "Gom nhóm chỉ báo" (xem dưới) | cách chấm điểm | bật |

Đã bỏ: Fibonacci, FRVP, Ichimoku, Kalman, KDJ, Elliott, EMA 50/200, VWAP, Vùng giá (hỗ trợ/kháng cự).

## Cách chấm điểm

- Mỗi tín hiệu cần từ 3 điểm và từ 2 chỉ báo độc lập, trong cửa sổ 3 nến.
- **Gom nhóm chỉ báo (`grp`, mặc định bật):** các chỉ báo cùng nhóm chỉ được tính một lần (lấy cái mạnh nhất), và "độc lập" nghĩa là thuộc các nhóm khác nhau. Phần Dự báo cũng vậy: mỗi nhóm đóng góp tối đa một phiếu. Tắt nút này để về cách cũ (mỗi chỉ báo cộng điểm riêng) và so sánh kết quả.
- **Backtest:** khớp tại giá đóng cửa nến tín hiệu, có phí theo thị trường, chạm cả SL và TP trong một nến thì tính thua. Hiển thị tỷ lệ thắng, kỳ vọng (R), profit factor, sụt giảm tối đa, Sharpe và Sortino theo lệnh, MAE/MFE, kết quả theo chế độ thị trường (ADX), 30% dữ liệu mới nhất, và so với mua và giữ.

## Cảnh báo tương quan

Khi bộ quét có từ 3 mã trở lên cùng chiều, app hiện cảnh báo kèm tương quan lợi suất 1h trung bình giữa các mã đó (từ 0,6 trở lên thì coi là gần như một cược). Bot cũng nhắn cảnh báo tương tự khi một lần quét có từ `corrMin` (mặc định 3) tín hiệu mới cùng chiều.

## Lưu dữ liệu nến

Nút "⬇ Lưu nến" (thanh trên cùng) tải nến đang xem ra file CSV, tên file có mã, khung, thị trường, nguồn và thời điểm tải. Dữ liệu được lấy từ sàn tại lúc chạy nên chạy lại backtest sau này có thể ra kết quả khác; lưu file này để chạy lại đúng trên dữ liệu cũ.

## Thêm hoặc sửa chỉ báo

Mỗi chỉ báo tự đăng ký bằng `Indicators.register({...})` (xem chú thích ở khối "CORE: sổ đăng ký chỉ báo" trong `index.html`). Khai báo `group` để chỉ báo thuộc một nhóm khi gom nhóm. Nút bật/tắt, nhãn lý do và phiếu Dự báo có sẵn từ khai báo đó. Muốn đổi ngưỡng vào lệnh, cách gom nhóm hay cách tính Dự báo thì sửa khối "ENGINE: analyze()"; backtest nằm ở khối "ENGINE: backtest".

## Futures V2 (mới)

- Mở `futures.html` để dùng giao diện web responsive trên điện thoại, máy tính bảng và PC. Trang V1 có nút **Futures V2** để chuyển nhanh.
- `bot/futures-engine.js` là engine dùng chung cho bot và giao diện backtest: EMA20/EMA50 định hướng 15m + 5m, xác nhận phá cấu trúc/RSI/volume ở 1m; SL theo swing 5m và ATR; TP mặc định 1,8R.
- `bot/futures-run.js` quét hợp đồng Binance USDⓈ-M Futures; `bot/futures-config.json` chứa danh sách mã và mức rủi ro mặc định 0,75%.
- `.github/workflows/futures.yml` chạy nền mỗi 5 phút và cập nhật `data/futures-signals.json`. Có thể bật Telegram bằng GitHub Secrets `TELEGRAM_BOT_TOKEN` và `TELEGRAM_CHAT_ID`.
- Backtest trên trang Futures V2 tải nến 1m từ Binance, tối đa 7 ngày trong giao diện hiện tại. Đây là backtest sàng lọc ban đầu, chưa có funding, mô phỏng thanh lý, spread theo từng thời điểm hay walk-forward; cần kiểm tra thêm trước khi dùng tiền thật.

### Cách triển khai

1. Giải nén và đưa toàn bộ thư mục dự án lên repository GitHub hiện tại (giữ nguyên cấu trúc thư mục).
2. Vào **Settings → Pages**, chọn nguồn triển khai phù hợp với repository. Nếu dùng GitHub Pages, chọn branch đang dùng và thư mục `/ (root)`.
3. Vào **Actions**, bật workflow nếu GitHub yêu cầu; chạy thủ công `Futures V2 scan` lần đầu để tạo `data/futures-signals.json`.
4. Mở URL GitHub Pages có đuôi `/futures.html` trên điện thoại/tablet. Nên thêm trang vào màn hình chính của trình duyệt.
5. Muốn nhận Telegram: thêm hai Secrets nêu trên trong **Settings → Secrets and variables → Actions**.

Lưu ý: GitHub Actions là bot quét nền; trang web không cần mở để bot hoạt động. Lịch cron GitHub có thể trễ vài phút và không phải dịch vụ giao dịch thời gian thực.
