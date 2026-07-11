// ข้อมูลหัตถการและค่ามือตั้งต้น (Master Template)
// อัปเดตล่าสุดจาก procedures_data.json (ผู้ใช้ส่งมา 2026-07) — เพิ่ม "ยาเบลอ" และหมวด "อื่นๆ"
// ตรงกับ database.md > procedure_master / user_procedures

const CATEGORIES = [
  { key: 'Laser', th: 'เลเซอร์', en: 'Laser' },
  { key: 'Injection', th: 'ฉีด', en: 'Injection' },
  { key: 'Treatment', th: 'ทรีตเมนต์', en: 'Treatment' },
  { key: 'Pre-op', th: 'พรีออป', en: 'Pre-op' },
  { key: 'OR', th: 'ห้องผ่าตัด', en: 'OR' },
  { key: 'Other', th: 'อื่นๆ', en: 'Other' },
];

const PROCEDURE_MASTER = [
  { id: 'laser_ulthera', cat: 'Laser', name: 'Ulthera Prime', unit: '1 เคส', fee: 150 },
  { id: 'laser_endolift', cat: 'Laser', name: 'Endolift X', unit: '1 เคส', fee: 150 },
  { id: 'laser_skinrefine', cat: 'Laser', name: 'SkinRefine Pro', unit: '1 เคส', fee: 50 },
  { id: 'laser_oligio', cat: 'Laser', name: 'Oligio X', unit: '1 เคส', fee: 100 },

  { id: 'inj_botox', cat: 'Injection', name: 'Botox — ทุกยี่ห้อ', unit: '1 unit', fee: 1, preciseQty: true },
  { id: 'inj_filler', cat: 'Injection', name: 'Filler — ทุกยี่ห้อ / ทุกรุ่น', unit: '1 cc', fee: 50, preciseQty: true },
  { id: 'inj_radiesse', cat: 'Injection', name: 'Radiesse', unit: '1 กล่อง', fee: 50 },
  { id: 'inj_sculptra', cat: 'Injection', name: 'Sculptra', unit: '1 ขวด', fee: 50 },
  { id: 'inj_belotero', cat: 'Injection', name: 'Belotero Revive', unit: '1 cc', fee: 50, preciseQty: true },
  { id: 'inj_skinvive', cat: 'Injection', name: 'Skinvive', unit: '1 cc', fee: 50, preciseQty: true },
  { id: 'inj_profhilo', cat: 'Injection', name: 'Profhilo', unit: '1 กล่อง 2 cc', fee: 50 },
  { id: 'inj_vitaran', cat: 'Injection', name: 'Vitaran', unit: '1 cc', fee: 25, preciseQty: true },
  { id: 'inj_mintlift', cat: 'Injection', name: 'Mint Lift', unit: '1 เคส', fee: 150 },
  { id: 'inj_prp_case', cat: 'Injection', name: 'PRP Skin / Hair (เข้าเคส)', unit: '1 เคส', fee: 30 },
  { id: 'inj_prp_blood', cat: 'Injection', name: 'PRP Skin / Hair (เจาะเลือด)', unit: '1 เคส', fee: 35 },
  { id: 'inj_setdara_case', cat: 'Injection', name: 'Set ผิวดารา (เข้าเคส)', unit: '1 เคส', fee: 50 },
  { id: 'inj_setdara_blood', cat: 'Injection', name: 'Set ผิวดารา (เจาะเลือด)', unit: '1 เคส', fee: 35 },
  { id: 'inj_setceleb_case', cat: 'Injection', name: 'Set ผิว Celeb (เข้าเคส)', unit: '1 เคส', fee: 100 },
  { id: 'inj_setceleb_blood', cat: 'Injection', name: 'Set ผิว Celeb (เจาะเลือด)', unit: '1 เคส', fee: 35 },
  { id: 'inj_setelite_case', cat: 'Injection', name: 'Set ผิว Elite (เข้าเคส)', unit: '1 เคส', fee: 150 },
  { id: 'inj_setelite_blood', cat: 'Injection', name: 'Set ผิว Elite (เจาะเลือด)', unit: '1 เคส', fee: 35 },
  { id: 'inj_beams_face', cat: 'Injection', name: 'BEAMS Booster (ฉีดหน้า)', unit: '1 เคส', fee: 50 },
  { id: 'inj_beams_body', cat: 'Injection', name: 'BEAMS Booster (ฉีดตัว)', unit: '1 เคส', fee: 100 },
  { id: 'inj_nadplus', cat: 'Injection', name: 'NAD+ (พยาบาลฉีดเท่านั้น)', unit: '1 เคส', fee: 50 },
  { id: 'inj_nadiv', cat: 'Injection', name: 'NAD IV (เข้าเคส)', unit: '1 เคส', fee: 50 },
  { id: 'inj_dissolve_filler', cat: 'Injection', name: 'สลาย Filler', unit: '1 ครั้ง', fee: 20 },
  { id: 'inj_subcision', cat: 'Injection', name: 'Subcision', unit: '1 ครั้ง', fee: 20 },
  { id: 'inj_keloid', cat: 'Injection', name: 'ฉีดคีลอยด์', unit: '1 ครั้ง', fee: 10 },

  { id: 'trt_treatment', cat: 'Treatment', name: 'Treatment', unit: '1 เคส', fee: 150 },
  { id: 'trt_lifting', cat: 'Treatment', name: 'Lifting Treatment (เฉพาะแถม)', unit: '1 เคส', fee: 75 },
  { id: 'trt_hair', cat: 'Treatment', name: 'Hair Treatment (เฉพาะแถม)', unit: '1 เคส', fee: 75 },
  { id: 'trt_blur', cat: 'Treatment', name: 'ยาเบลอ', unit: '1 เคส', fee: 35 },

  { id: 'preop_blood', cat: 'Pre-op', name: 'เจาะเลือด (Pre-op)', unit: '1 ครั้ง', fee: 35 },
  { id: 'preop_ekg', cat: 'Pre-op', name: 'ตรวจ EKG', unit: '1 ครั้ง', fee: 10 },

  { id: 'or_hours', cat: 'OR', name: 'ชั่วโมง OR', unit: 'ต่อชั่วโมง', fee: 100, hourly: true },

  { id: 'other_iv', cat: 'Other', name: 'IV', unit: '1 เคส', fee: 35 },
  { id: 'other_shampoo', cat: 'Other', name: 'สระผม', unit: '1 เคส', fee: 30 },
  { id: 'other_offstaple', cat: 'Other', name: 'Off staple', unit: '1 เคส', fee: 20 },
  { id: 'other_stitch', cat: 'Other', name: 'ตัดไหม', unit: '1 เคส', fee: 30 },
  { id: 'other_wound', cat: 'Other', name: 'ทำแผล (ฉายแสง)', unit: '1 เคส', fee: 10 },
];

// ระบบระดับ (Tier) — คำนวณจากยอดสะสมรายเดือน อิงรายได้ทั่วไปของอาชีพ ~5,000–6,000 บาท/เดือน ให้อยู่ราวระดับกลาง
const TIERS = [
  { key: 'bronze', en: 'Bronze', th: 'ทองแดง', badge: 'B', min: 0 },
  { key: 'silver', en: 'Silver', th: 'เงิน', badge: 'S', min: 3000 },
  { key: 'gold', en: 'Gold', th: 'ทอง', badge: 'G', min: 5500 },
  { key: 'platinum', en: 'Platinum', th: 'แพลทินัม', badge: 'P', min: 8000 },
  { key: 'diamond', en: 'Diamond', th: 'เพชร', badge: 'D', min: 12000 },
];
