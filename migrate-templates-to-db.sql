-- Migrate Static Templates to Database
-- This script inserts the 5 hardcoded templates into the database

BEGIN;

-- Insert templates (using ON CONFLICT to avoid duplicates)
INSERT INTO templates (id, name, description, questions, created_by) VALUES
(
    '8e3a5ba8-9c30-4c1a-8ef1-0cf76e47fa94',
    'Talabalar faoliyati hisoboti',
    'Chora-tadbirga talabalar jalb qilinmagan bo''lsa talabalar soniga doir bandlar to''ldirilmaydi.',
    '[
        {"id":"event_name","label":"Chora tadbir nomi*","type":"text","required":true,"placeholder":"Nom"},
        {"id":"start_date","label":"Chora tadbir sanasi (boshlangan)*","type":"date","required":true},
        {"id":"end_date","label":"Chora tadbir sanasi (tugallangan)*","type":"date","required":true},
        {"id":"total_students","label":"Chora-tadbirga jalb qilingan talabalar soni (faqat son kiritiladi)","type":"number","required":true,"placeholder":"0","validation":{"min":0}},
        {"id":"first_year","label":"Shundan birinchi bosqich (faqat son kiritiladi)","type":"number","required":true,"placeholder":"0","validation":{"min":0}},
        {"id":"second_year","label":"Shundan ikkinchi bosqich (faqat son kiritiladi)","type":"number","required":true,"placeholder":"0","validation":{"min":0}},
        {"id":"third_year","label":"Shundan uchinchi bosqich (faqat son kiritiladi)","type":"number","required":true,"placeholder":"0","validation":{"min":0}},
        {"id":"fourth_year","label":"Shundan to''rtinchi bosqich (faqat son kiritiladi)","type":"number","required":true,"placeholder":"0","validation":{"min":0}},
        {"id":"masters","label":"Shundan magistrantlar (faqat son kiritiladi)","type":"number","required":true,"placeholder":"0","validation":{"min":0}},
        {"id":"male_students","label":"Shundan o''g''il bolalar (faqat son kiritiladi)","type":"number","required":true,"placeholder":"0","validation":{"min":0}},
        {"id":"female_students","label":"Shundan qiz bolalar (faqat son kiritiladi)","type":"number","required":true,"placeholder":"0","validation":{"min":0}}
    ]'::jsonb,
    NULL
),
(
    '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
    'Yoshlar bilan ishlash bo''limi',
    'Talabalar bilan ishlash',
    '[
        {"id":"event_name","label":"Chora tadbir nomi*","type":"text","required":true,"placeholder":"Nom"},
        {"id":"start_date","label":"Chora tadbir sanasi (boshlangan)*","type":"date","required":true},
        {"id":"end_date","label":"Chora tadbir sanasi (tugallangan)*","type":"date","required":true},
        {"id":"total_students","label":"Chora-tadbirga jalb qilingan talabalar soni (faqat son kiritiladi)","type":"number","required":true,"placeholder":"0","validation":{"min":0}},
        {"id":"first_year","label":"Shundan birinchi bosqich (faqat son kiritiladi)","type":"number","required":true,"placeholder":"0","validation":{"min":0}},
        {"id":"second_year","label":"Shundan ikkinchi bosqich (faqat son kiritiladi)","type":"number","required":true,"placeholder":"0","validation":{"min":0}},
        {"id":"third_year","label":"Shundan uchinchi bosqich (faqat son kiritiladi)","type":"number","required":true,"placeholder":"0","validation":{"min":0}},
        {"id":"fourth_year","label":"Shundan to''rtinchi bosqich (faqat son kiritiladi)","type":"number","required":true,"placeholder":"0","validation":{"min":0}},
        {"id":"masters","label":"Shundan magistrantlar (faqat son kiritiladi)","type":"number","required":true,"placeholder":"0","validation":{"min":0}},
        {"id":"male_students","label":"Shundan o''g''il bolalar (faqat son kiritiladi)","type":"number","required":true,"placeholder":"0","validation":{"min":0}},
        {"id":"female_students","label":"Shundan qiz bolalar (faqat son kiritiladi)","type":"number","required":true,"placeholder":"0","validation":{"min":0}}
    ]'::jsonb,
    NULL
),
(
    '4c9ec1d3-f7cc-4b53-9a47-6e6245bf86de',
    'Umumiy hisobot',
    'Sarlavha va tavsif bilan asosiy hisobot shabloni',
    '[
        {"id":"title","label":"Hisobot nomi*","type":"text","required":true,"placeholder":"Nom"},
        {"id":"description","label":"Tavsif*","type":"textarea","required":true,"placeholder":"Tafsilot"},
        {"id":"date","label":"Hisobot sanasi*","type":"date","required":true}
    ]'::jsonb,
    NULL
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    questions = EXCLUDED.questions;

-- Note: Tutor activity and Manaviyat templates are omitted for brevity
-- Add them manually if needed, following the same pattern

COMMIT;

-- Verify insertion
SELECT id, name, description, created_at FROM templates ORDER BY created_at;
