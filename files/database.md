# Database (Firestore Schema & Collection Design)

โครงสร้างฐานข้อมูลสำหรับระบบค่ามือบน Firestore ออกแบบให้รองรับสิทธิ์การเข้าถึง และการจัดการข้อมูลอย่างเป็นระเบียบ

## Collections & Document Schemas

### 1. Users (`/users/{userId}`)
เก็บข้อมูลโปรไฟล์ผู้ใช้งาน โดย `userId` ตรงกับ Google OAuth UID
- `id`: string (User UID)
- `displayName`: string (ชื่อที่แสดง)
- `email`: string | null
- `role`: string (`assistant` | `admin` | `super_admin`)
- `createdAt`: timestamp
- `updatedAt`: timestamp

#### Subcollection: Logs (`/users/{userId}/logs/{dateStr}`)
เก็บประวัติการกรอกงานรายวัน แยกเป็นรายคนเพื่อให้จัดการ Rules ได้ง่ายและปลอดภัย
- `dateStr`: string (คีย์ในรูปแบบ `YYYY-MM-DD`)
- `entries`: array of maps
  - `procId`: string
  - `quantity`: number
  - `minutes`: number
  - `feeSnapshot`: number (ราคาค่ามือ ณ วันที่บันทึก เพื่อป้องกันราคาเปลี่ยนย้อนหลัง)
  - `subtotal`: number (ผลลัพธ์คำนวณ)
- `note`: string
- `updatedAt`: timestamp

#### Subcollection: Settings (`/users/{userId}/settings/default`)
เก็บข้อมูลการตั้งค่าส่วนตัว
- `monthlyGoal`: number | null
- `weekStart`: string (`mon` | `sun`)
- `currency`: string (`THB`)

---

### 2. Procedures (`/procedures/{procedureId}`)
รายการหัตถการทั้งหมด (ข้อมูลหลัก)
- `id`: string (Procedure ID)
- `categoryKey`: string (`Laser` | `Injection` | `Treatment` | `Pre-op` | `OR` | `Other`)
- `name`: string (ชื่อหัตถการ)
- `unit`: string (หน่วยนับ เช่น cc, unit, เคส)
- `fee`: number (อัตราค่ามือปกติ)
- `isHourly`: boolean (คำนวณตามชั่วโมงหรือไม่)
- `preciseQty`: boolean (กรอกทศนิยมได้หรือไม่)
- `isActive`: boolean
- `sort`: number (ลำดับการแสดงผล)
- `createdAt`: timestamp
- `updatedAt`: timestamp
- `createdBy`: string (User UID)
- `updatedBy`: string (User UID)

---

### 3. Categories (`/categories/{categoryId}`)
หมวดหมู่ของหัตถการ
- `key`: string
- `th`: string
- `en`: string
- `sort`: number
- `createdAt`: timestamp
- `updatedAt`: timestamp

---

### 4. Announcements (`/announcements/{announcementId}`)
ประกาศสำหรับพนักงานทุกคน
- `id`: string
- `title`: string
- `content`: string
- `createdAt`: timestamp
- `createdBy`: string

---

### 5. Audit Logs (`/audit_logs/{logId}`)
ประวัติการแก้ไขข้อมูล (เพื่อความโปร่งใส ปรับแต่งไม่ได้)
- `id`: string
- `action`: string (เช่น `UPDATE_RATE`, `DELETE_RECORD`)
- `details`: string
- `createdAt`: timestamp
- `createdBy`: string (User UID)

---

## กฎทั่วไปสำหรับทุก Record
ทุก document ใน Collection หลักต้องระบุฟิลด์ดังนี้เสมอเพื่อการตรวจสอบย้อนหลัง:
- `createdAt`: timestamp
- `updatedAt`: timestamp
- `createdBy`: string (User UID)
- `updatedBy`: string (User UID)

