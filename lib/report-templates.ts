import { ReportTemplate } from './types'
import { createTemplate, getTemplateById as getDbTemplateById } from './database'

type StaticReportTemplate = ReportTemplate & { key: string }

const STATIC_REPORT_TEMPLATES: StaticReportTemplate[] = [
  {
    id: '8e3a5ba8-9c30-4c1a-8ef1-0cf76e47fa94',
    key: 'student_activity_template',
    name: 'Talabalar faoliyati hisoboti',
    description: "Chora-tadbirga talabalar jalb qilinmagan bo'lsa talabalar soniga doir bandlar to'ldirilmaydi.",
    fields: [
      {
        id: 'event_name',
        label: 'Chora tadbir nomi*',
        type: 'text',
        required: true,
        placeholder: 'Nom'
      },
      {
        id: 'start_date',
        label: 'Chora tadbir sanasi (boshlangan)*',
        type: 'date',
        required: true
      },
      {
        id: 'end_date',
        label: 'Chora tadbir sanasi (tugallangan)*',
        type: 'date',
        required: true
      },
      {
        id: 'total_students',
        label: 'Chora-tadbirga jalb qilingan talabalar soni (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'first_year',
        label: 'Shundan birinchi bosqich (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'second_year',
        label: 'Shundan ikkinchi bosqich (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'third_year',
        label: 'Shundan uchinchi bosqich (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'fourth_year',
        label: 'Shundan to\'rtinchi bosqich (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'masters',
        label: 'Shundan magistrantlar (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'male_students',
        label: 'Shundan o\'g\'il bolalar (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'female_students',
        label: 'Shundan qiz bolalar (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: '0',
        validation: { min: 0 }
      }
    ],
    createdAt: new Date()
  },
  {
    id: '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
    key: 'youth_work_department_template',
    name: 'Yoshlar bilan ishlash bo\'limi',
    description: 'Talabalar bilan ishlash',
    fields: [
      {
        id: 'event_name',
        label: 'Chora tadbir nomi*',
        type: 'text',
        required: true,
        placeholder: 'Nom'
      },
      {
        id: 'start_date',
        label: 'Chora tadbir sanasi (boshlangan)*',
        type: 'date',
        required: true
      },
      {
        id: 'end_date',
        label: 'Chora tadbir sanasi (tugallangan)*',
        type: 'date',
        required: true
      },
      {
        id: 'total_students',
        label: 'Chora-tadbirga jalb qilingan talabalar soni (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'first_year',
        label: 'Shundan birinchi bosqich (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'second_year',
        label: 'Shundan ikkinchi bosqich (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'third_year',
        label: 'Shundan uchinchi bosqich (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'fourth_year',
        label: 'Shundan to\'rtinchi bosqich (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'masters',
        label: 'Shundan magistrantlar (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'male_students',
        label: 'Shundan o\'g\'il bolalar (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'female_students',
        label: 'Shundan qiz bolalar (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: '0',
        validation: { min: 0 }
      }
    ],
    createdAt: new Date()
  },
  {
    id: '4c9ec1d3-f7cc-4b53-9a47-6e6245bf86de',
    key: 'general_report_template',
    name: 'Umumiy hisobot',
    description: 'Sarlavha va tavsif bilan asosiy hisobot shabloni',
    fields: [
      {
        id: 'title',
        label: 'Hisobot nomi*',
        type: 'text',
        required: true,
        placeholder: 'Nom'
      },
      {
        id: 'description',
        label: 'Tavsif*',
        type: 'textarea',
        required: true,
        placeholder: 'Tafsilot'
      },
      {
        id: 'date',
        label: 'Hisobot sanasi*',
        type: 'date',
        required: true
      }
    ],
    createdAt: new Date()
  },
  {
    id: '29245ffb-8826-4a16-8f1f-37ec8ce6c1cf',
    key: 'tutor_activity_template',
    name: 'Tyutorlar faoliyati',
    description: "Tyutorlar tomonidan o'tkazilgan tadbirlarni hujjatlashtirish",
    fields: [
      {
        id: 'tutor_full_name',
        label: 'Xodimning ism-sharifi',
        type: 'text',
        required: true,
        placeholder: 'Ism sharif'
      },
      {
        id: 'event_name',
        label: 'Chora tadbir nomi',
        type: 'text',
        required: true,
        placeholder: 'Nom'
      },
      {
        id: 'event_date',
        label: 'Chora tadbir sanasi',
        type: 'date',
        required: true,
        placeholder: 'Month, day, year'
      },
      {
        id: 'event_type',
        label: "Chora tadbir turi (nomenklatura bo'yicha)",
        type: 'select',
        required: true,
        options: [
          {
            value: "Talabalarning turar joylari bo'yicha amalga oshirilgan ishlar",
            label: "Talabalarning turar joylari bo'yicha amalga oshirilgan ishlar",
          },
          {
            value: "Talabalaming ijtimoiy-psixologik portretini shakllantirish",
            label: "Talabalaming ijtimoiy-psixologik portretini shakllantirish",
          },
          {
            value:
              "Talabalami boy tarixiy, milliy va diniy an'analarimizga yot bo'lgan illatlarga murosasizlik hamda ularga qarshi kurash ruhida tarbiyalash",
            label:
              "Talabalami boy tarixiy, milliy va diniy an'analarimizga yot bo'lgan illatlarga murosasizlik hamda ularga qarshi kurash ruhida tarbiyalash",
          },
          {
            value: "Talabalaming qonuniy manfaatini himoya qilish",
            label: "Talabalaming qonuniy manfaatini himoya qilish",
          },
          {
            value: "Talabalar turar joyiga tashrif buyurib talabalar hayotini yaqindan o'rganish",
            label: "Talabalar turar joyiga tashrif buyurib talabalar hayotini yaqindan o'rganish",
          },
          {
            value:
              "Talabalar ijara xonadonlariga tashrif buyurib talabalar hayotini va yaratilgan sharoitlarni yaqindan o'rganish",
            label:
              "Talabalar ijara xonadonlariga tashrif buyurib talabalar hayotini va yaratilgan sharoitlarni yaqindan o'rganish",
          },
          { value: "Bayram tadbirlari", label: "Bayram tadbirlari" },
          { value: "Start-up tanlovlar", label: "Start-up tanlovlar" },
          { value: "Ma'rifiy tadbirlar", label: "Ma'rifiy tadbirlar" },
          { value: "Ilmiy konferensiyalar", label: "Ilmiy konferensiyalar" },
          {
            value: "Mehmon professor ishtirokida ma'ruza",
            label: "Mehmon professor ishtirokida ma'ruza",
          },
          { value: "Uchrashuvlar", label: "Uchrashuvlar" },
          { value: "Sport tadbirlari", label: "Sport tadbirlari" },
          {
            value:
              "Talabalarning bo'sh vaqtlarini mazmunli tashkil etish (kono, konsert, teatr, muzeylarga tashrif)",
            label:
              "Talabalarning bo'sh vaqtlarini mazmunli tashkil etish (kono, konsert, teatr, muzeylarga tashrif)",
          },
          { value: "Ilmiy tadbirlar", label: "Ilmiy tadbirlar" },
          {
            value: "Besh tashabbus doirasidagi tanlovlar",
            label: "Besh tashabbus doirasidagi tanlovlar",
          },
          { value: "Sayohatlar", label: "Sayohatlar" },
        ],
      },
      {
        id: 'total_students',
        label: 'Chora tadbirga jalb qilingan talabalar soni (faqat sonda)',
        type: 'number',
        required: false,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'boys',
        label: "Shundan o'g'il bolalar (faqat sonda)",
        type: 'number',
        required: false,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'girls',
        label: "Shundan qiz bolalar (faqat sonda)",
        type: 'number',
        required: false,
        placeholder: '0',
        validation: { min: 0 }
      }
    ],
    createdAt: new Date()
  },
  {
    id: 'f4d2c9f0-6e7a-4ffb-98d7-15e8880af6d1',
    key: 'manaviyat_va_marifat_bolimi_template',
    name: "Ma'naviyat va ma'rifat bo'limi",
    description: "Chora-tadbirga talabalar jalb qilinmagan bo'lsa talabalar soniga doir bandlar to'ldirilmaydi.",
    fields: [
      {
        id: 'tutor_full_name',
        label: 'Xodimning ism-sharifi',
        type: 'text',
        required: true,
        placeholder: 'Ism sharif'
      },
      {
        id: 'event_name',
        label: 'Chora tadbir nomi',
        type: 'text',
        required: true,
        placeholder: 'Nom'
      },
      {
        id: 'event_date_start',
        label: 'Chora tadbir sanasi (boshlangan)',
        type: 'date',
        required: true,
        placeholder: 'Month, day, year'
      },
      {
        id: 'event_date_end',
        label: 'Chora tadbir sanasi (tugagan)',
        type: 'date',
        required: true,
        placeholder: 'Month, day, year'
      },
      {
        id: 'event_type',
        label: "Chora tadbir turi (nomenklatura bo'yicha)",
        type: 'select',
        required: true,
        options: [
          {
            value: "Talabalarning turar joylari bo'yicha amalga oshirilgan ishlar",
            label: "Talabalarning turar joylari bo'yicha amalga oshirilgan ishlar",
          },
          {
            value: "Talabalaming ijtimoiy-psixologik portretini shakllantirish",
            label: "Talabalaming ijtimoiy-psixologik portretini shakllantirish",
          },
          {
            value:
              "Talabalami boy tarixiy, milliy va diniy an'analarimizga yot bo'lgan illatlarga murosasizlik hamda ularga qarshi kurash ruhida tarbiyalash",
            label:
              "Talabalami boy tarixiy, milliy va diniy an'analarimizga yot bo'lgan illatlarga murosasizlik hamda ularga qarshi kurash ruhida tarbiyalash",
          },
          {
            value: "Talabalaming qonuniy manfaatini himoya qilish",
            label: "Talabalaming qonuniy manfaatini himoya qilish",
          },
          {
            value: "Talabalar turar joyiga tashrif buyurib talabalar hayotini yaqindan o'rganish",
            label: "Talabalar turar joyiga tashrif buyurib talabalar hayotini yaqindan o'rganish",
          },
          {
            value:
              "Talabalar ijara xonadonlariga tashrif buyurib talabalar hayotini va yaratilgan sharoitlarni yaqindan o'rganish",
            label:
              "Talabalar ijara xonadonlariga tashrif buyurib talabalar hayotini va yaratilgan sharoitlarni yaqindan o'rganish",
          },
          { value: "Bayram tadbirlari", label: "Bayram tadbirlari" },
          { value: "Start-up tanlovlar", label: "Start-up tanlovlar" },
          { value: "Ma'rifiy tadbirlar", label: "Ma'rifiy tadbirlar" },
          { value: "Ilmiy konferensiyalar", label: "Ilmiy konferensiyalar" },
          {
            value: "Mehmon professor ishtirokida ma'ruza",
            label: "Mehmon professor ishtirokida ma'ruza",
          },
          { value: "Uchrashuvlar", label: "Uchrashuvlar" },
          { value: "Sport tadbirlari", label: "Sport tadbirlari" },
          {
            value:
              "Talabalarning bo'sh vaqtlarini mazmunli tashkil etish (kono, konsert, teatr, muzeylarga tashrif)",
            label:
              "Talabalarning bo'sh vaqtlarini mazmunli tashkil etish (kono, konsert, teatr, muzeylarga tashrif)",
          },
          { value: "Ilmiy tadbirlar", label: "Ilmiy tadbirlar" },
          {
            value: "Besh tashabbus doirasidagi tanlovlar",
            label: "Besh tashabbus doirasidagi tanlovlar",
          },
          { value: "Sayohatlar", label: "Sayohatlar" },
        ],
      },
      {
        id: 'total_students',
        label: 'Chora tadbirga jalb qilingan talabalar soni (faqat sonda)',
        type: 'number',
        required: false,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'first_year',
        label: 'Shundan birinchi bosqich (faqat sonda)',
        type: 'number',
        required: false,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'second_year',
        label: 'Shundan ikkinchi bosqich (faqat sonda)',
        type: 'number',
        required: false,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'third_year',
        label: 'Shundan uchinchi bosqich  (faqat sonda)',
        type: 'number',
        required: false,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'fourth_year',
        label: "Shundan to'rtinchi bosqich  (faqat sonda)",
        type: 'number',
        required: false,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'masters',
        label: 'Shundan magistrantlar  (faqat sonda)',
        type: 'number',
        required: false,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'boys',
        label: "Shundan o'g'il bolalar (faqat sonda)",
        type: 'number',
        required: false,
        placeholder: '0',
        validation: { min: 0 }
      },
      {
        id: 'girls',
        label: "Shundan qiz bolalar (faqat sonda)",
        type: 'number',
        required: false,
        placeholder: '0',
        validation: { min: 0 }
      }
    ],
    createdAt: new Date()
  }
]

export const REPORT_TEMPLATES: StaticReportTemplate[] = STATIC_REPORT_TEMPLATES

const cloneFields = (fields: StaticReportTemplate['fields']): any[] => JSON.parse(JSON.stringify(fields))

let templatesSynced = false
let syncPromise: Promise<void> | null = null

export const ensureStaticTemplatesSynced = async (): Promise<void> => {
  if (templatesSynced) {
    return
  }

  if (!syncPromise) {
    syncPromise = (async () => {
      for (const template of STATIC_REPORT_TEMPLATES) {
        try {
          const existing = await getDbTemplateById(template.id)
          if (!existing) {
            await createTemplate({
              id: template.id,
              name: template.name,
              description: template.description,
              questions: cloneFields(template.fields),
              createdBy: null,
            })
          }
        } catch (error) {
          console.error(`Failed to sync template ${template.key}`, error)
          throw error
        }
      }
      templatesSynced = true
    })().finally(() => {
      syncPromise = null
    })
  }

  await syncPromise
}

export const getTemplateById = (identifier: string): ReportTemplate | null => {
  return STATIC_REPORT_TEMPLATES.find(
    (template) => template.id === identifier || template.key === identifier,
  ) || null
}

export const getTemplateByKey = (key: string): ReportTemplate | null => {
  return STATIC_REPORT_TEMPLATES.find((template) => template.key === key) || null
}

export const getAllTemplates = (): ReportTemplate[] => {
  return STATIC_REPORT_TEMPLATES
}
