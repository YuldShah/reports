const fs = require('fs')
const { randomUUID } = require('crypto')
const { Pool } = require('pg')

const parseEnv = (content) => {
  const entries = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=')
      if (index === -1) {
        return [line, '']
      }
      const key = line.slice(0, index).trim()
      const value = line.slice(index + 1).trim().replace(/^"|"$/g, '')
      return [key, value]
    })

  return Object.fromEntries(entries)
}

const slug = (value, fallback) => {
  const base = String(value ?? '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')

  return base || fallback
}

const toOptionObjects = (options, prefix) => {
  if (!Array.isArray(options)) {
    return []
  }

  return options
    .map((option, index) => {
      const label = String(option ?? '').trim()
      if (!label) {
        return null
      }

      return {
        value: slug(label, `${prefix}_${index + 1}`),
        label,
      }
    })
    .filter(Boolean)
}

const hasNumberHint = (field, label) => {
  const validation = field?.validation
  if (validation === 'number') {
    return true
  }

  const normalized = label.toLowerCase()
  return normalized.includes('faqat son') || normalized.includes('faqat raqam') || normalized.includes('raqam') || normalized.includes('soni')
}

const normalizeType = (field, label) => {
  const sourceType = String(field?.type ?? '').toLowerCase()

  if (sourceType === 'date') {
    return 'date'
  }

  if (sourceType === 'long_answer' || sourceType === 'paragraph' || sourceType === 'textarea') {
    return 'textarea'
  }

  if (sourceType === 'multiple_choice' || sourceType === 'linear_scale' || sourceType === 'checkbox' || sourceType === 'select' || sourceType === 'radio') {
    return 'select'
  }

  if (sourceType === 'number') {
    return 'number'
  }

  if (sourceType === 'photo') {
    return 'photo'
  }

  if (hasNumberHint(field, label)) {
    return 'number'
  }

  return 'text'
}

const normalizeFields = (rawFields) => {
  const fields = Array.isArray(rawFields) ? rawFields : []
  const usedIds = new Set()

  const normalized = fields
    .map((field, index) => {
      const label = String(field?.label ?? field?.title ?? `Savol ${index + 1}`).trim()
      if (!label) {
        return null
      }

      let id = String(field?.id ?? '')
      if (!id || id.toLowerCase() === 'email') {
        id = `${slug(label, `field_${index + 1}`)}`
      }
      if (/^\d+$/.test(id)) {
        id = `q_${id}`
      } else {
        id = slug(id, `field_${index + 1}`)
      }

      while (usedIds.has(id)) {
        id = `${id}_${index + 1}`
      }
      usedIds.add(id)

      const type = normalizeType(field, label)
      const required = Boolean(field?.required)

      const question = {
        id,
        label,
        type,
        required,
      }

      const options = toOptionObjects(field?.options ?? field?.choices, id)
      if (type === 'select' && options.length > 0) {
        question.options = options
      }

      if (type === 'number') {
        question.placeholder = '0'
        question.validation = { min: 0 }
      }

      return question
    })
    .filter(Boolean)

  const hasPhoto = normalized.some((field) => field.type === 'photo')
  if (!hasPhoto) {
    normalized.push({
      id: usedIds.has('photo_upload') ? `photo_upload_${normalized.length + 1}` : 'photo_upload',
      label: 'Foto (isbot uchun)',
      type: 'photo',
      required: false,
    })
  }

  return normalized
}

const normalizeTemplate = (template) => {
  const root = template.form ? template.form : template
  const name = String(root.title ?? template.title ?? template.form_title ?? '').trim()
  const description = String(root.description ?? template.description ?? root.note ?? '').trim()
  const rawFields = root.fields ?? root.questions ?? template.fields ?? template.questions ?? []

  return {
    name,
    description,
    questions: normalizeFields(rawFields),
  }
}

const rawTemplates = [
  {
    "title": "Tadbirlarga jalb qilingan mehmonlar",
    "description": "",
    "fields": [
      { "id": 1, "label": "Mehmonning ismi sharifi (o'zbek tili trasliteratsiya qoidalariga muvofiq, asliga to'g'ri shaklda)", "type": "short_answer", "required": true },
      { "id": 2, "label": "Tashrif turi", "type": "multiple_choice", "required": true, "options": ["Mahalliy", "Mintaqaviy (MDHga a'zo mamlakatga mansub)", "Xalqaro"] },
      { "id": 3, "label": "Mehmonning vatani (mamlakat nomi yoki abbreviatsiyasi o'zbek tili imlo qoidalariga muvofiq kiritiladi eg. AQSh)", "type": "short_answer", "required": true },
      { "id": 4, "label": "Mehmon mansub tashkilot nomi (o'zbek tili imlo qoidalariga muvofiq asliga to'g'ri kiritiladi eg. Massachusets texnologiya instituti)", "type": "short_answer", "required": true },
      { "id": 5, "label": "Mehmonning faoliyat yuritadigan tashkilotidagi vazifasi (O'zbek tili imlo qoidalariga muvofiq asliga to'g'ri kiritiladi. eg. Ijrochi direktor deb kiriting, CEO emas)", "type": "short_answer", "required": true },
      { "id": 6, "label": "Tashrif sanasi", "type": "date", "required": true },
      { "id": 7, "label": "Talabalar soni (kutilgan) - (faqat son kiritiladi)", "type": "short_answer", "required": false },
      { "id": 8, "label": "Ishtirok etgan talabalar soni (faqat son kiritiladi)", "type": "short_answer", "required": false },
      { "id": 9, "label": "Mehmonning qisqacha biografiyasi", "type": "long_answer", "required": false },
      { "id": 10, "label": "Tashrif maqsadi va natijalari (rasmiy)", "type": "short_answer", "required": false }
    ]
  },
  {
    "title": "Universitet psixologi",
    "description": "Psixolog faoliyati",
    "fields": [
      { "id": "Email", "label": "Email", "type": "email", "required": true, "validation": "valid_email" },
      { "id": "1427309029", "label": "Chora tadbir nomi", "type": "short_answer", "required": true },
      { "id": "324368202", "label": "Chora tadbir sanasi (boshlangan)", "type": "date", "required": true },
      { "id": "1139955582", "label": "Chora tadbir sanasi (tugallangan)", "type": "date", "required": true },
      { "id": "270919175", "label": "Chora-tadbirga jalb qilingan talabalar soni - agar jalb qilingan bo'lsa (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
      { "id": "167018548", "label": "Shundan birinchi bosqich (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
      { "id": "98747632", "label": "Shundan ikkinchi bosqich (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
      { "id": "1570682999", "label": "Shundan uchinchi bosqich (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
      { "id": "655878077", "label": "Shundan to'rtinchi bosqich (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
      { "id": "1921405487", "label": "Shundan magistrantlar (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
      { "id": "437808059", "label": "Shundan o'g'il bolalar (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
      { "id": "3294886", "label": "Shundan qiz bolalar (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" }
    ]
  },
  {
    "form_title": "Klublar faoliyati",
    "organization": "New Uzbekistan University",
    "fields": [
      { "id": "email", "label": "Email", "type": "email", "required": true },
      { "id": "2013661987", "label": "Klub nomi", "type": "short_answer", "required": true },
      { "id": "734604469", "label": "Klubning faoliyat turi (nomenklatura bo'yicha)", "type": "short_answer", "required": true },
      { "id": "39868692", "label": "Klubning haqiqiy a'zolari soni (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
      { "id": "736137638", "label": "Tadbir nomi", "type": "short_answer", "required": true },
      { "id": "268773175", "label": "Tadbir sanasi", "type": "date", "required": true },
      { "id": "723278747", "label": "Moliyalashtirish miqdori (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
      { "id": "404371293", "label": "Moliyalashtirish miqdori (faqat so'zda)", "type": "short_answer", "required": true },
      { "id": "1833312774", "label": "Kutilgan ishtirokchilar soni (faqat sonda)", "type": "short_answer", "required": true, "validation": "number" },
      { "id": "645020810", "label": "Amaldagi ishtirokchilar soni (faqat sonda)", "type": "short_answer", "required": true, "validation": "number" },
      { "id": "672187769", "label": "Tafsiloti", "type": "paragraph", "required": true }
    ]
  },
  {
    "title": "Bo'limlar faoliyati",
    "description": "DIQQAT!\n\n- Chora-tadbirga talabalar jalb etilmagan hollarda talabalar soni kiritilmaydi.\n- tashqi tadbirlardagi ishtirok ham qamrab olinadi",
    "questions": [
      { "id": 745653530, "label": "Bo'lim nomi (rasmiy)", "type": "multiple_choice", "required": true, "choices": ["Yoshlar ishlari bo'yicha prorektor", "Yoshlar bilan ishlash bo'limi", "Ma'naviyat-ma'rifat bo'limi", "Tyutorlar", "Universitet psixologi", "Talabalar kengashi", "Universitet inspektori", "Xotin-qizlar qo'mitasi raisi"] },
      { "id": 1743816690, "label": "Chora tadbir nomi", "type": "short_answer", "required": true },
      { "id": 2044895535, "label": "CHora-tadbir turi", "type": "multiple_choice", "required": true, "choices": ["Normativ (hujjat ishlari)", "Texnik", "Tashkiliy", "Tarbiyaviy"] },
      { "id": 308902313, "label": "Chora tadbir sanasi (boshlangan)", "type": "date", "required": true },
      { "id": 13971, "label": "Chora tadbir sanasi (tugallangan)", "type": "date", "required": true },
      { "id": 916174227, "label": "Yil", "type": "multiple_choice", "required": true, "choices": ["2025", "2026"] },
      { "id": 1806637205, "label": "Oy (boshlangan sanasi bo'yicha)", "type": "multiple_choice", "required": true, "choices": ["Sentabr", "Oktabr", "Noyabr", "Dekabr", "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust"] },
      { "id": 602845069, "label": "Chora-tadbirga jalb qilingan talabalar soni (faqat son kiritiladi eg. 30)", "type": "short_answer", "required": false },
      { "id": 619150, "label": "Shundan birinchi bosqich  (faqat son kiritiladi)", "type": "short_answer", "required": false },
      { "id": 270081270, "label": "Shundan ikkinchi bosqich  (faqat son kiritiladi)", "type": "short_answer", "required": false },
      { "id": 1348599683, "label": "Shundan uchinchi  bosqich  (faqat son kiritiladi)", "type": "short_answer", "required": false },
      { "id": 3140181, "label": "Shundan to'rtinchi bosqich  (faqat son kiritiladi)", "type": "short_answer", "required": false },
      { "id": 1753999815, "label": "Shundan magistrantlar (faqat son kiritiladi)", "type": "short_answer", "required": false },
      { "id": 647268438, "label": "Shundan o'g'il bolalar  (faqat son kiritiladi)", "type": "short_answer", "required": false },
      { "id": 461482848, "label": "Shundan qiz bolalar  (faqat son kiritiladi)", "type": "short_answer", "required": false }
    ]
  },
  {
    "form_title": "Tadbir loyihalariga doir shakl",
    "description": "DIQQAT!\n1. Sonli ifoda so'ralgan joylarga faqat son kiritiladi.\n2. Sana so'ralgan joyda sana formatiga amal qiling.\n3. Nomlar amaldagi nomenklaturaga muvofiq kiritilishi lozim.",
    "questions": [
      { "id": 600748845, "title": "Tadbir nomi - rasmiy", "type": "short_answer", "required": true },
      { "id": 712962840, "title": "Boshlanish sanasi", "type": "date", "required": true },
      { "id": 1870637669, "title": "Tugash sanasi", "type": "date", "required": true },
      { "id": 178489612, "title": "Yil", "type": "multiple_choice", "required": true, "options": ["2025", "2026"] },
      { "id": 1917790843, "title": "Oy (boshlangan sanasi bo'yicha)", "type": "multiple_choice", "required": true, "options": ["Sentabr", "Oktabr", "Noyabr", "Dekabr", "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust"] },
      { "id": 1633508612, "title": "Hamkor tashkilotlar (bir yoki bir nechta variant tanlanadi)", "type": "checkbox", "required": true, "options": ["Mahalliy tashkilotlar bilan hamkorlikda", "Vazirlik, agentlik va qo'mitalar bilan hamkorlikda", "Xalqaro yoki xorijiy tashkilotlar bilan hamkorlikda", "Oliy davlat boshqaruv organlari bilan hamkorlikda", "Ichki tadbir (hamkorlar yo'q)"] },
      { "id": 1538877497, "title": "Tadbirni loyihalashtirish miqdori (sonda beriladi)", "type": "short_answer", "required": false },
      { "id": 1041974449, "title": "Tadbirni loyihalashtirish miqdori (faqat so'zlarda beriladi)", "type": "short_answer", "required": false },
      { "id": 2093194117, "title": "Kutilgan ishtirokchilar soni (faqat raqam)", "type": "short_answer", "required": false },
      { "id": 226209356, "title": "Amaldagi ishtirokchilar soni", "type": "short_answer", "required": true },
      { "id": 1918167462, "title": "Amaldagi ishtirokchilar soni (o'g'il bolalar)", "type": "short_answer", "required": true },
      { "id": 2046451978, "title": "Amaldagi ishtirokchilar soni (qiz bolalar)", "type": "short_answer", "required": true },
      { "id": 1133558082, "title": "1-bosqich talabalar soni", "type": "short_answer", "required": true },
      { "id": 1618500218, "title": "2-bosqich talabalar soni", "type": "short_answer", "required": true },
      { "id": 1540432951, "title": "3-bosqich talabalar soni", "type": "short_answer", "required": true },
      { "id": 71767180, "title": "4-bosqich talabalar soni", "type": "short_answer", "required": false },
      { "id": 1295017424, "title": "magistrantlar soni", "type": "short_answer", "required": true },
      { "id": 964705239, "title": "Tadbirning turi (bir yoki bir nechta variant tanlanadi)", "type": "checkbox", "required": true, "options": ["Fan va ta'lim", "San'at va madaniyat", "Sport va ko'ngilochar", "Ijtimoiy", "Maxsus (jumladan Guest lecture)"] },
      { "id": 625752972, "title": "Asosiy ijrochi (bir yoki nechta variant)", "type": "checkbox", "required": true, "options": ["Yoshlar ishlari bo'yicha prorektor", "Yoshlar bilan ishlash bo'limi", "Ma'naviyat-ma'rifat bo'limi", "Universitet shifokori", "Tyutorlar", "Universitet psixologi", "Talabalar kengashi", "Universitet inspektori", "Xotin-qizlar qo'mitasi raisi"] },
      { "id": 1784662658, "title": "Ijrochi 2 (agar bo'lsa)", "type": "multiple_choice", "required": false, "options": ["Yoshlar ishlari bo'yicha prorektor", "Yoshlar bilan ishlash bo'limi", "Ma'naviyat-ma'rifat bo'limi", "Universitet shifokori", "Tyutorlar", "Universitet psixologi", "Talabalar kengashi", "Universitet inspektori", "Xotin-qizlar qo'mitasi raisi"] },
      { "id": 318500675, "title": "Ijrochi 3 (agar bo'lsa)", "type": "multiple_choice", "required": false, "options": ["Yoshlar ishlari bo'yicha prorektor", "Yoshlar bilan ishlash bo'limi", "Ma'naviyat-ma'rifat bo'limi", "Universitet shifokori", "Tyutorlar", "Universitet psixologi", "Talabalar kengashi", "Universitet inspektori", "Xotin-qizlar qo'mitasi raisi"] },
      { "id": 1667085943, "title": "Ijrochi 4 (agar bo'lsa)", "type": "multiple_choice", "required": false, "options": ["Yoshlar ishlari bo'yicha prorektor", "Yoshlar bilan ishlash bo'limi", "Ma'naviyat-ma'rifat bo'limi", "Universitet shifokori", "Tyutorlar", "Universitet psixologi", "Talabalar kengashi", "Universitet inspektori", "Xotin-qizlar qo'mitasi raisi"] },
      { "id": 1310945067, "title": "Ijrochi 5 (agar bo'lsa)", "type": "multiple_choice", "required": false, "options": ["Yoshlar ishlari bo'yicha prorektor", "Yoshlar bilan ishlash bo'limi", "Ma'naviyat-ma'rifat bo'limi", "Universitet shifokori", "Tyutorlar", "Universitet psixologi", "Talabalar kengashi", "Universitet inspektori", "Xotin-qizlar qo'mitasi raisi"] },
      { "id": 1271274604, "title": "Ijrochi 6 (agar bo'lsa)", "type": "multiple_choice", "required": false, "options": ["Yoshlar ishlari bo'yicha prorektor", "Yoshlar bilan ishlash bo'limi", "Ma'naviyat-ma'rifat bo'limi", "Universitet shifokori", "Tyutorlar", "Universitet psixologi", "Talabalar kengashi", "Universitet inspektori", "Xotin-qizlar qo'mitasi raisi"] },
      { "id": 328562269, "title": "Tashqi xat raqami (agar bo'lsa)", "type": "short_answer", "required": false },
      { "id": 694188086, "title": "Javob xati raqami (agar bo'lsa)", "type": "short_answer", "required": false }
    ]
  },
  {
    "title": "Talabalarning yutuqlari",
    "organization": "New Uzbekistan University",
    "fields": [
      { "id": "email", "label": "Email", "type": "email", "required": true },
      { "id": "98950934", "label": "Talabaning ism sharifi (yoki jamoa nomi)", "type": "short_answer", "required": true },
      { "id": "1979914203", "label": "Bosqichi", "type": "linear_scale", "required": true, "options": ["1", "2", "3", "4"] },
      { "id": "1769841322", "label": "Ta'lim yo'nalishi", "type": "multiple_choice", "required": true, "options": ["Mexanik muhandislik", "Kimyo muhandisligi", "Iqtisodiyot va ma'lumotlar tahlili", "Sanoat menejmenti", "Pedagogika", "Dasturiy muhandislik", "Amaliy matematika", "Sun'iy intellekt va robototexnika", "Kiberxavfsizlik"] },
      { "id": "576990237", "label": "Gender", "type": "multiple_choice", "required": true, "options": ["O'g'il bola", "Qiz bola"] },
      { "id": "1020123829", "label": "Musoboqa yo'nalishi", "type": "multiple_choice", "required": true, "options": ["Fan va ta'lim", "San'at va madaniyat", "Sport", "Texnologiya", "Other"] },
      { "id": "1823530937", "label": "Musoboqa maqomi", "type": "multiple_choice", "required": true, "options": ["Xalqaro", "Mintaqaviy", "Respublika", "Viloyat", "Tuman", "Ichki (universitet)", "Other"] },
      { "id": "259006257", "label": "Qo'lga kiritgan o'rin (agar bo'lsa)", "type": "linear_scale", "required": true, "options": ["1", "2", "3"] },
      { "id": "337323215", "label": "Nominatsiyasi - agar bo'lsa (nominatsiya nomi asliga to'g'ri kiritiladi)", "type": "short_answer", "required": true }
    ]
  },
  {
    "form": {
      "title": "Universitet inspektori",
      "description": "Universitet inspektori faoliyati",
      "note": "DIQQAT! Chora tadbirga talabalar jalb etilmagan holda talabalar soniga doir bandlar to'ldirilmaydi",
      "fields": [
        { "id": 1, "label": "Email", "type": "email", "required": true },
        { "id": 2, "label": "Chora-tadbir nomi (rasmiy)", "type": "short_answer", "required": true, "validation": "text" },
        { "id": 3, "label": "Chora tadbir sanasi (boshlangan)", "type": "date", "required": true },
        { "id": 4, "label": "Chora tadbir sanasi (tugallangan)", "type": "date", "required": true },
        { "id": 5, "label": "Chora-tadbirga jalb qilingan talabalar soni (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
        { "id": 6, "label": "Shundan birinchi bosqich (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
        { "id": 7, "label": "Shundan ikkinchi bosqich (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
        { "id": 8, "label": "Shundan uchinchi bosqich (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
        { "id": 9, "label": "Shundan to'rtinchi bosqich (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
        { "id": 10, "label": "Shundan magistrantlar (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
        { "id": 11, "label": "Shundan o'g'il bolalar (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
        { "id": 12, "label": "Shundan qiz bolalar (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" }
      ]
    }
  },
  {
    "title": "Xotin-qizlar qo'mitasi raisi",
    "organization": "New Uzbekistan University",
    "fields": [
      { "id": 188050448, "label": "Chora tadbir nomi", "type": "short_answer", "required": true, "validation": "none" },
      { "id": 645379100, "label": "Chora tadbir sanasi (boshlangan)", "type": "date", "required": true, "validation": "none" },
      { "id": 1076863352, "label": "Chora tadbir sanasi (tugallangan)", "type": "date", "required": true, "validation": "none" },
      { "id": 1924270487, "label": "Chora-tadbirga jalb qilingan talabalar soni (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
      { "id": 187199088, "label": "Shundan birinchi bosqich (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
      { "id": 1647159744, "label": "Shundan ikkinchi bosqich (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
      { "id": 642907692, "label": "Shundan uchinchi bosqich (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
      { "id": 124822438, "label": "Shundan to'rtinchi bosqich (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
      { "id": 1941049710, "label": "Shundan magistrantlar (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
      { "id": 63707359, "label": "Shundan o'g'il bolalar (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
      { "id": 600063931, "label": "Shundan qiz bolalar (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" }
    ]
  },
  {
    "title": "Ma'naviyat va ma'rifat bo'limi",
    "description": "DIQQAT! Chora-tadbirga talabalar jalb qilinmagan bo'lsa talabalar soniga doir bandlar to'ldirilmaydi.",
    "organization": "New Uzbekistan University",
    "fields": [
      { "id": "email", "label": "Email", "type": "email", "required": true },
      { "id": "138817942", "label": "Chora tadbir nomi", "type": "short_answer", "required": true },
      { "id": "1278368947", "label": "Chora tadbir sanasi (boshlangan)", "type": "date", "required": true },
      { "id": "2041778565", "label": "Chora tadbir sanasi (tugallangan)", "type": "date", "required": true },
      { "id": "629332225", "label": "Chora-tadbirga jalb qilingan talabalar soni (faqat son kiritiladi)", "type": "short_answer", "validation": "number", "required": true },
      { "id": "1463085921", "label": "Shundan birinchi bosqich (faqat son kiritiladi)", "type": "short_answer", "validation": "number", "required": true },
      { "id": "1213493511", "label": "Shundan ikkinchi bosqich (faqat son kiritiladi)", "type": "short_answer", "validation": "number", "required": true },
      { "id": "450685831", "label": "Shundan uchinchi bosqich (faqat son kiritiladi)", "type": "short_answer", "validation": "number", "required": true },
      { "id": "30143064", "label": "Shundan to'rtinchi bosqich (faqat son kiritiladi)", "type": "short_answer", "validation": "number", "required": true },
      { "id": "2003647170", "label": "Shundan magistrantlar (faqat son kiritiladi)", "type": "short_answer", "validation": "number", "required": true },
      { "id": "1941101071", "label": "Shundan o'g'il bolalar (faqat son kiritiladi)", "type": "short_answer", "validation": "number", "required": true },
      { "id": "1875267596", "label": "Shundan qiz bolalar (faqat son kiritiladi)", "type": "short_answer", "validation": "number", "required": true }
    ]
  },
  {
    "title": "Universitet shifokori faoliyati",
    "organization": "New Uzbekistan University",
    "fields": [
      { "id": 575515662, "label": "Oy bo'yicha murojaatlar soni (raqam kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
      { "id": 434713712, "label": "Oy nomi", "type": "short_answer", "required": true, "validation": "text" },
      { "id": 684903948, "label": "Oy bo'yicha universitet kampusidagi qabullar soni (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" },
      { "id": 204304174, "label": "Oy bo'yicha TTJdagi qabullar soni", "type": "short_answer", "required": false, "validation": "number" },
      { "id": 769336336, "label": "Oy bo'yicha ambulator poliklinikalarga ko'rinish uchun ma'lumotnomalar soni (faqat son kiritiladi)", "type": "short_answer", "required": true, "validation": "number" }
    ]
  }
]

async function main() {
  const envContent = fs.readFileSync('.env.local', 'utf8')
  const env = parseEnv(envContent)
  const databaseUrl = env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing in .env.local')
  }

  const pool = new Pool({ connectionString: databaseUrl })

  try {
    const beforeResult = await pool.query('SELECT id, name, description, questions FROM templates ORDER BY created_at DESC')
    const existingByName = new Map(beforeResult.rows.map((row) => [String(row.name).toLowerCase(), row]))

    const affected = []
    let insertedCount = 0
    let updatedCount = 0

    for (const rawTemplate of rawTemplates) {
      const normalized = normalizeTemplate(rawTemplate)
      if (!normalized.name || normalized.questions.length === 0) {
        continue
      }

      const existing = existingByName.get(normalized.name.toLowerCase())
      if (existing) {
        await pool.query(
          `UPDATE templates
           SET description = $2,
               questions = $3
           WHERE id = $1`,
          [existing.id, normalized.description || null, JSON.stringify(normalized.questions)],
        )
        updatedCount += 1
        affected.push(normalized.name)
      } else {
        const id = randomUUID()
        await pool.query(
          `INSERT INTO templates (id, name, description, questions, is_student_tracker, created_by)
           VALUES ($1, $2, $3, $4, false, null)`,
          [id, normalized.name, normalized.description || null, JSON.stringify(normalized.questions)],
        )
        insertedCount += 1
        affected.push(normalized.name)
      }
    }

    const afterUpsert = await pool.query('SELECT id, name, questions FROM templates ORDER BY created_at DESC')

    let photoAddedCount = 0
    for (const row of afterUpsert.rows) {
      const questions = Array.isArray(row.questions)
        ? row.questions
        : typeof row.questions === 'string'
          ? JSON.parse(row.questions)
          : []

      if (!Array.isArray(questions) || questions.length === 0) {
        continue
      }

      const hasPhoto = questions.some((field) => field && field.type === 'photo')
      if (hasPhoto) {
        continue
      }

      const ids = new Set(questions.map((field) => String(field?.id ?? '')))
      const photoId = ids.has('photo_upload') ? `photo_upload_${questions.length + 1}` : 'photo_upload'

      const patched = [
        ...questions,
        {
          id: photoId,
          label: 'Foto (isbot uchun)',
          type: 'photo',
          required: false,
        },
      ]

      await pool.query('UPDATE templates SET questions = $2 WHERE id = $1', [row.id, JSON.stringify(patched)])
      photoAddedCount += 1
      if (!affected.includes(row.name)) {
        affected.push(row.name)
      }
    }

    const finalResult = await pool.query('SELECT name FROM templates ORDER BY name')

    console.log(`TOTAL_BEFORE=${beforeResult.rows.length}`)
    console.log(`TOTAL_AFTER=${finalResult.rows.length}`)
    console.log(`INSERTED=${insertedCount}`)
    console.log(`UPDATED=${updatedCount}`)
    console.log(`PHOTO_ADDED_EXISTING=${photoAddedCount}`)
    console.log(`AFFECTED_TEMPLATES=${JSON.stringify(affected)}`)
    console.log(`FINAL_TEMPLATE_NAMES=${JSON.stringify(finalResult.rows.map((row) => row.name))}`)
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error(`IMPORT_ERROR=${error.message}`)
  process.exit(1)
})
