import { ReportTemplate } from './types'

// Hardcoded report templates
export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'student_activity_template',
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
    id: 'youth_work_department_template',
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
    id: 'general_report_template',
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
    id: 'tutor_activity_template',
    name: 'Tyutorlar faoliyati',
    description: "Tyutorlar tomonidan o'tkazilgan tadbirlarni hujjatlashtirish",
    fields: [
      {
        id: 'tutor_full_name',
        label: 'Xodimning ism-sharifi*',
        type: 'text',
        required: true,
        placeholder: 'Ism sharif'
      },
      {
        id: 'event_name',
        label: 'Chora tadbir nomi*',
        type: 'text',
        required: true,
        placeholder: 'Nom'
      },
      {
        id: 'event_date',
        label: 'Chora tadbir sanasi*',
        type: 'date',
        required: true,
        placeholder: 'Month, day, year'
      },
      {
        id: 'event_type',
        label: "Chora tadbir turi (nomenklatura bo'yicha)*",
        type: 'text',
        required: true,
        placeholder: "Tadbir turi"
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
      }
    ],
    createdAt: new Date()
  },
  {
    id: 'manaviyat_va_marifat_bolimi_template',
    name: "Ma'naviyat va ma'rifat bo'limi",
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
        id: 'event_date',
        label: 'Chora tadbir sanasi (boshlangan)',
        type: 'date',
        required: true,
        placeholder: 'Month, day, year'
      },
      {
        id: 'event_date',
        label: 'Chora tadbir sanasi (tugagan)',
        type: 'date',
        required: true,
        placeholder: 'Month, day, year'
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
        id : "boys",
        label : "Shundan o'g'il bolalar (faqar sonda)",
        type : "number",
        required : false,
        placeholder : "0",
        validation : {min : 0}
      },
      {
        id : "girls",
        label : "Shundan qiz bolalar (faqar sonda)",
        type : "number",
        required : false,
        placeholder : "0",
        validation : {min : 0}
      }
    ],
    createdAt: new Date()
  }
]

export const getTemplateById = (templateId: string): ReportTemplate | null => {
  return REPORT_TEMPLATES.find(template => template.id === templateId) || null
}

export const getAllTemplates = (): ReportTemplate[] => {
  return REPORT_TEMPLATES
}