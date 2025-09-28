import { ReportTemplate } from './types'

// Hardcoded report templates
export const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'student_activity_template',
    name: 'Student Activity Report',
    description: "Chora-tadbirga talabalar jalb qilinmagan bo'lsa talabalar soniga doir bandlar to'ldirilmaydi.",
    fields: [
      {
        id: 'event_name',
        label: 'Chora tadbir nomi*',
        type: 'text',
        required: true,
        placeholder: 'Enter event name'
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
        placeholder: 'Enter total number of students',
        validation: { min: 0 }
      },
      {
        id: 'first_year',
        label: 'Shundan birinchi bosqich (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: 'Number of first year students',
        validation: { min: 0 }
      },
      {
        id: 'second_year',
        label: 'Shundan ikkinchi bosqich (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: 'Number of second year students',
        validation: { min: 0 }
      },
      {
        id: 'third_year',
        label: 'Shundan uchinchi bosqich (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: 'Number of third year students',
        validation: { min: 0 }
      },
      {
        id: 'fourth_year',
        label: 'Shundan to\'rtinchi bosqich (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: 'Number of fourth year students',
        validation: { min: 0 }
      },
      {
        id: 'masters',
        label: 'Shundan magistrantlar (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: 'Number of master\'s students',
        validation: { min: 0 }
      },
      {
        id: 'male_students',
        label: 'Shundan o\'g\'il bolalar (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: 'Number of male students',
        validation: { min: 0 }
      },
      {
        id: 'female_students',
        label: 'Shundan qiz bolalar (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: 'Number of female students',
        validation: { min: 0 }
      }
    ],
    createdAt: new Date()
  },
  {
    id: 'youth_work_department_template',
    name: 'Yoshlar bilan ishlash bo\'limi',
    description: 'Talabalar bilan ishlashni taqozo etmagan chora-tadbirlarga talabalar soni kiritilmaydi.',
    fields: [
      {
        id: 'event_name',
        label: 'Chora tadbir nomi*',
        type: 'text',
        required: true,
        placeholder: 'Enter event name'
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
        placeholder: 'Enter total number of students',
        validation: { min: 0 }
      },
      {
        id: 'first_year',
        label: 'Shundan birinchi bosqich (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: 'Number of first year students',
        validation: { min: 0 }
      },
      {
        id: 'second_year',
        label: 'Shundan ikkinchi bosqich (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: 'Number of second year students',
        validation: { min: 0 }
      },
      {
        id: 'third_year',
        label: 'Shundan uchinchi bosqich (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: 'Number of third year students',
        validation: { min: 0 }
      },
      {
        id: 'fourth_year',
        label: 'Shundan to\'rtinchi bosqich (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: 'Number of fourth year students',
        validation: { min: 0 }
      },
      {
        id: 'masters',
        label: 'Shundan magistrantlar (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: 'Number of master\'s students',
        validation: { min: 0 }
      },
      {
        id: 'male_students',
        label: 'Shundan o\'g\'il bolalar (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: 'Number of male students',
        validation: { min: 0 }
      },
      {
        id: 'female_students',
        label: 'Shundan qiz bolalar (faqat son kiritiladi)',
        type: 'number',
        required: true,
        placeholder: 'Number of female students',
        validation: { min: 0 }
      }
    ],
    createdAt: new Date()
  },
  {
    id: 'general_report_template',
    name: 'General Report',
    description: 'Basic report template with title and description',
    fields: [
      {
        id: 'title',
        label: 'Report Title*',
        type: 'text',
        required: true,
        placeholder: 'Enter report title'
      },
      {
        id: 'description',
        label: 'Description*',
        type: 'textarea',
        required: true,
        placeholder: 'Describe the report details'
      },
      {
        id: 'date',
        label: 'Report Date*',
        type: 'date',
        required: true
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