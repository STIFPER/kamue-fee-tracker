# ค่ามือ · Medical Assistant Case-Fee Tracker

ระบบบริหารค่ามือผู้ช่วยแพทย์ที่ใช้งานง่าย ทันสมัย และยืดหยุ่น รองรับการบันทึกงานประจำวัน การคำนวณค่ามืออัตโนมัติ การติดตามรายได้ และการจัดการข้อมูลของทีมทั้งหมดผ่านระบบเดียว

## โครงสร้างโปรเจกต์ (Project Structure)

```text
├── app/                  # ไฟล์เว็บแอปพลิเคชันหลัก (Frontend)
│   ├── index.html        # หน้าหลักเว็บแอป
│   ├── styles.css        # สไตล์และธีมสี (Glassmorphism & Mobile First)
│   ├── app.js            # จัดการ App Shell Routing, Navigation และ UX Transitions
│   ├── views.js          # ส่วนการเรนเดอร์เนื้อหาหน้าจอหลัก
│   └── data/             # ส่วนจัดการข้อมูล
│       ├── catalog.js    # ข้อมูลหัตถการและค่ามือตั้งต้น (Master Catalog)
│       ├── store.js      # ส่วนเก็บข้อมูลบนเครื่อง (Repository Layer)
│       └── calc.js       # ฟังก์ชันการคำนวณเงินสะสมและระดับเลเวล (Tiers)
│
├── เว็บค่ามือ/             # เอกสารข้อกำหนดระบบและการออกแบบ (Specs & Docs)
│   ├── project.md        # วิสัยทัศน์โปรเจกต์ และ Workflows
│   ├── database.md       # โครงสร้างฐานข้อมูลและการออกแบบ Firestore Collections
│   ├── permissions.md    # รายละเอียดสิทธิ์แต่ละ Role (Assistant, Admin, Super Admin)
│   └── calculations.md   # กฎการคำนวณค่ามือ
│
└── firestore.rules       # กฎความปลอดภัย Firestore Security Rules (ใช้จริงใน Firebase)
```

## สิทธิ์ผู้ใช้งาน & ความปลอดภัย (Firestore Rules)
ระบบควบคุมสิทธิ์ผ่าน `firestore.rules` โดยอ้างอิงจากบทบาทผู้ใช้:
1. **Assistant (ผู้ช่วยแพทย์)**: ดูแลและจัดการประวัติการกรอกงานส่วนตัวของตนเองเท่านั้น ไม่สามารถเข้าถึงข้อมูลคนอื่นได้
2. **Admin/Super Admin (ผู้ดูแล)**: จัดการข้อมูลหัตถการหลัก ดูรายงานและแดชบอร์ดภาพรวมของทีมงานทั้งหมดได้

## การติดตั้งและการใช้งาน (Getting Started)
เนื่องจากระบบออกแบบเป็น **Mobile-First Single Page Application (SPA)** ด้วย Vanilla JS และ CSS:
- สามารถเปิดไฟล์ `app/index.html` บนเบราว์เซอร์เพื่อทดลองใช้งานได้ทันที
- หรือรันผ่าน Local HTTP Server (เช่น `Live Server` บน VS Code)
