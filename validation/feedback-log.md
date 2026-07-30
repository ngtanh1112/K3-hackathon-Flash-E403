# Feedback Log - VLearn AI Quiz

Muc tieu validation: kiem tra hoc vien co tim thay tinh nang Quiz nhanh khong, co hieu quiz duoc tao tu slide dang mo khong, va explanation sau khi tra loi co giup biet can on lai phan nao khong.

## Cach Test

- Moi nguoi test dung prototype trong 8-10 phut.
- Task chinh: mo tai lieu, tao quiz, tra loi it nhat 2 cau, xem ket qua, hoi Tutor mot cau ngoai pham vi.
- Nhom quan sat hanh vi truoc, sau do moi hoi feedback.
- Feedback duoc ghi lai theo y chinh, co trich quote ngan khi can.

## Log Feedback

| Thoi gian | Nguoi test | Nhiem vu | Quan sat | Feedback | Hanh dong tiep theo |
|---|---|---|---|---|---|
| 30/07/2026 16:30 | Phan Tran Tuong Vi | Tim nut Quiz, tao 5 cau tu `AI LLM foundation.pdf`, tra loi 2 cau | Tim thay nut Quiz trong khoang 10 giay. Sau khi tra loi sai, doc explanation truoc khi bam Next. | "Biet sai o dau thi hay hon quiz binh thuong, nhung em muon thay no lay tu trang nao." | Them citation/trang vao explanation va nut nhay ve trang lien quan. |
| 30/07/2026 17:00 | Nguyen Minh Thai | Dung PDF viewer, tao quiz, xem score cuoi bai | Ban dau tuong Tutor va Quiz la cung mot tinh nang. Sau khi mo sidebar Quiz thi lam duoc flow den ket qua. | "Neu vua vao da thay Generate Quiz thi de hieu hon, chat de phia sau cung duoc." | Doi default sidebar sang Quiz intro thay vi chat mac dinh. |
| 30/07/2026 17:25 | Nguyen Thi Xuan Mai | Upload tai lieu moi o Admin, quay ve Student tao quiz | Upload duoc file, nhung hoi lo lang AI co dung file vua upload hay van dung tai lieu demo. | "Can co dong nao noi quiz dang tao tu file minh vua upload." | Hien ten tai lieu dang mo trong IntroCard va context cua quiz. |
| 30/07/2026 18:10 | User test noi bo 01 | Hoi Tutor cau ngoai pham vi: "giup minh code Python" | Tutor tu choi, nhung cau tu choi ban dau hoi dai. | "Noi ngan gon la duoc, minh chi can biet no khong tra loi ngoai bai." | Rut gon cau tu choi, huong nguoi hoc ve noi dung slide hien tai. |
| 30/07/2026 18:40 | User test noi bo 02 | Khoanh vung bang Visual Explain roi tao quiz moi | Nguoi test thich viec quiz co cau lien quan vung vua khoanh, nhung khong ro trace da duoc luu. | "Neu cau nao lay tu vung minh khoanh thi nen danh dau." | Them tag `Personalized from Visual Explain` cho cau hoi duoc tao tu trace. |

## Cau Hoi Validation Va Ket Qua

| Cau hoi | Ket qua quan sat |
|---|---|
| Ban co tim thay nut Quiz trong 15 giay khong? | 3/3 willing users tim thay sau khi doi default sang Quiz intro. |
| Ban co hieu quiz duoc tao tu slide dang mo khong? | 2/3 hieu ngay; 1/3 can them ten tai lieu/context trong IntroCard. |
| Explanation sau khi tra loi co giup biet can on lai gi khong? | 3/3 noi explanation huu ich hon chi xem dap an dung/sai. |
| Sidebar Quiz co lam mat tap trung khoi PDF khong? | 2/3 thay chap nhan duoc; 1/3 muon co nut dong/thu gon ro hon. |
| Tutor co nen tra loi ngoai bai hoc khong? | 3/3 dong y nen tu choi ngan gon va keo ve noi dung bai hoc. |

## Thay Doi Sau Validation

| Thay doi | Ly do |
|---|---|
| Mo sidebar mac dinh o man hinh Quiz intro | 3/3 user tim tinh nang tao quiz truoc khi muon chat |
| Hien ten tai lieu dang mo trong IntroCard | Giam nghi ngo AI dang dung sai source |
| Them citation/trang trong explanation | User muon tu doi chieu lai slide sau khi sai |
| Them review weak topics o man ket qua | Giup hoc vien biet can on phan nao tiep theo |
| Them tag personalized cho cau tu Visual Explain | Lam ro cau hoi nao duoc ca nhan hoa tu vung khoanh |

## Ket Luan Validation

Validation cho thay pain "hoc xong nhung khong biet minh hieu sai o dau" la co that voi nhom user test. Flow tao quiz duoc chap nhan neu nut Quiz ro, context tai lieu ro, va explanation co can cu. Huong tiep theo neu co them thoi gian la luu lich su diem theo tung bai va cho giang vien xem cac chu de hoc vien sai nhieu.
