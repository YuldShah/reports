-- Migration: Add "Talablar turar joylari" template
-- Run this on the VPS database

INSERT INTO templates (id, name, description, questions, is_student_tracker, created_at)
VALUES (
  gen_random_uuid(),
  'Talablar turar joylari',
  'Talabalar turar joylari bo''yicha hisobot',
  '[
    {"id": "ijara", "label": "Ijara", "type": "number", "required": true, "placeholder": ""},
    {"id": "ota_ona_bilan", "label": "Ota onasi bilan/qarindoshi bilan", "type": "number", "required": true, "placeholder": ""},
    {"id": "yotoqxona", "label": "Yotoqxona", "type": "number", "required": true, "placeholder": ""}
  ]'::jsonb,
  false,
  NOW()
);
