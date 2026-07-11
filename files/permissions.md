# Permissions (Firestore Rules Mapping)

ระบบมีการสิทธิ์การเข้าใช้งานแบ่งตาม Role (Assistant, Admin, Super Admin) โดยบังคับใช้ผ่าน Firestore Security Rules

## ตารางสิทธิ์การเข้าถึง (Access Matrix)

| Collection | Assistant | Admin | Super Admin | รายละเอียด Rules |
| :--- | :---: | :---: | :---: | :--- |
| `users/*` | Read/Write (Own only) | Read/Write (All) | Read/Write (All) | ห้าม Assistant แก้ไข Role ของตนเอง |
| `users/*/logs/*` | Read/Write (Own only) | Read/Write (All) | Read/Write (All) | บันทึกและเรียกดูข้อมูลหัตถการรายวัน |
| `users/*/settings/*` | Read/Write (Own only) | Read/Write (All) | Read/Write (All) | ตั้งค่าเป้าหมายรายเดือน ฯลฯ |
| `procedures/*` | Read Only | Read/Write | Read/Write | การจัดการรายการหัตถการหลักและอัตราค่ามือ |
| `categories/*` | Read Only | Read/Write | Read/Write | หมวดหมู่หัตถการหลัก |
| `announcements/*` | Read Only | Read/Write | Read/Write | ประกาศข่าวสารของคลินิก |
| `audit_logs/*` | Write (Create only) | Read/Write | Read/Write | ประวัติการดำเนินงานที่สำคัญ ห้ามลบ/แก้ไข |
| `rates/*` | Read Only | Read/Write | Read/Write | อัตราค่ามือเริ่มต้น |

---

## รายละเอียดแต่ละบทบาท (Role Privileges)

### 1. Assistant (ผู้ช่วยแพทย์)
- **สิทธิ์การทำงาน**:
  - กรอกและบันทึกประวัติการทำหัตถการของตัวเองในแต่ละวัน (`/users/{userId}/logs/*`)
  - ดูประวัติ สรุปผลงาน และรายงานส่วนตัว
  - แก้ไขการตั้งค่าของตนเอง เช่น เป้าหมายรายเดือน (`/users/{userId}/settings/*`)
- **ข้อจำกัด**:
  - ไม่สามารถดูข้อมูลหรือรายงานของผู้ช่วยคนอื่นได้
  - ไม่สามารถแก้ไขบทบาท (Role) หรือลบข้อมูลตัวเองออกจากระบบได้
  - ไม่สามารถแก้ไขอัตราค่ามือ (Procedure Rate) หลักได้

### 2. Admin (ผู้ดูแลระบบ)
- **สิทธิ์การทำงาน**:
  - ดูประวัติ สรุปข้อมูล และแดชบอร์ดภาพรวมของทีมงานทั้งหมด
  - แก้ไขบันทึกรายการหัตถการหรือค่ามือของผู้ช่วยทุกคน (กรณีมีการกรอกผิดพลาด)
  - เพิ่ม/ลด/แก้ไข รายชื่อหัตถการและกำหนดอัตราค่ามือปกติ (`Procedures`)
  - เปลี่ยนแปลงสิทธิ์ (Role) ของพนักงานจาก Assistant เป็น Admin ได้
- **ข้อจำกัด**:
  - ไม่สามารถดำเนินการลบข้อมูลระดับระบบหรือจัดการสิทธิ์ของ Super Admin ได้

### 3. Super Admin (ผู้ดูแลระบบสูงสุด)
- **สิทธิ์การทำงาน**:
  - สามารถจัดการข้อมูลทุกส่วนในระบบได้อย่างไร้ข้อจำกัด (Full Access)
  - ลบประวัติผู้ใช้งานหรือเคลียร์ข้อมูลระบบทั้งหมด (System Reset)
  - แต่งตั้งหรือถอดถอนผู้ดูแลระบบคนอื่นได้

