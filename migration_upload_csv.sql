-- Migration: Import CSV Reports with estimations and new template field
BEGIN;

    UPDATE templates 
    SET questions = '[{"id": "event_name", "label": "Chora tadbir nomi*", "type": "text", "required": true, "placeholder": "Nom"}, {"id": "start_date", "label": "Chora tadbir sanasi (boshlangan)*", "type": "date", "required": true}, {"id": "end_date", "label": "Chora tadbir sanasi (tugallangan)*", "type": "date", "required": true}, {"id": "total_students", "label": "Chora-tadbirga jalb qilingan talabalar soni (faqat son kiritiladi)", "type": "number", "required": true, "placeholder": "0", "validation": {"min": 0}}, {"id": "first_year", "label": "Shundan birinchi bosqich (faqat son kiritiladi)", "type": "number", "required": true, "placeholder": "0", "validation": {"min": 0}}, {"id": "second_year", "label": "Shundan ikkinchi bosqich (faqat son kiritiladi)", "type": "number", "required": true, "placeholder": "0", "validation": {"min": 0}}, {"id": "third_year", "label": "Shundan uchinchi bosqich (faqat son kiritiladi)", "type": "number", "required": true, "placeholder": "0", "validation": {"min": 0}}, {"id": "fourth_year", "label": "Shundan to''''rtinchi bosqich (faqat son kiritiladi)", "type": "number", "required": true, "placeholder": "0", "validation": {"min": 0}}, {"id": "masters", "label": "Shundan magistrantlar (faqat son kiritiladi)", "type": "number", "required": true, "placeholder": "0", "validation": {"min": 0}}, {"id": "male_students", "label": "Shundan o''''g''''il bolalar (faqat son kiritiladi)", "type": "number", "required": true, "placeholder": "0", "validation": {"min": 0}}, {"id": "female_students", "label": "Shundan qiz bolalar (faqat son kiritiladi)", "type": "number", "required": true, "placeholder": "0", "validation": {"min": 0}}, {"id": "izoh", "label": "Izoh va Havolalar", "type": "textarea", "required": false, "placeholder": "Qo''shimcha ma''lumot va havolalar"}]'::jsonb 
    WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2';
    

    INSERT INTO users (telegram_id, first_name, role) 
    VALUES (123456789, 'Admin', 'admin') 
    ON CONFLICT (telegram_id) DO NOTHING;
    

    INSERT INTO teams (id, name, template_id, created_by)
    VALUES ('b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22', 'Yoshlar bilan ishlash bo''limi', '6f5bce60-2a10-47da-8a1f-278ade41b1a2', 123456789)
    ON CONFLICT (id) DO NOTHING;
                

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '9494acaa-5d60-4850-9e5a-b33d39a96ac8',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                '- talabalikka qabul qilingan 1-bosqich talabalar uchun Talabalar Kengashi bilan hamkorlikda tanishtiruv haftaligini o‘tkazish;',
                '{"event_name": "-\u00a0talabalikka qabul qilingan 1-bosqich talabalar uchun Talabalar Kengashi bilan hamkorlikda tanishtiruv haftaligini o\u2018tkazish;", "start_date": "2025-09-01", "end_date": "2025-09-01", "izoh": "Havolalar:\nhttps://t.me/Students_Channel2021/2492", "total_students": 891, "masters": 59, "first_year": 184, "second_year": 202, "third_year": 169, "fourth_year": 277, "male_students": 400, "female_students": 491}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '5c35f59b-3ba5-483a-af34-e991f6832655',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                '- 2023/2024 o‘quv yilida faol bo‘lgan talabalarni taqdirlash;',
                '{"event_name": "-\u00a02023/2024 o\u2018quv yilida faol bo\u2018lgan talabalarni taqdirlash;", "start_date": "2025-09-01", "end_date": "2025-09-01", "izoh": "Havolalar:\nhttps://t.me/Students_Channel2021/2500", "total_students": 129, "masters": 8, "first_year": 31, "second_year": 25, "third_year": 27, "fourth_year": 38, "male_students": 70, "female_students": 59}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '6ed2aebe-f4ee-4cef-89f6-08fed4dc7a98',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                '- Talabalar kengashiga saylangan prezidentning inauguratsiya marosimini o‘tkazish.',
                '{"event_name": "-\u00a0Talabalar kengashiga saylangan prezidentning inauguratsiya marosimini o\u2018tkazish.", "start_date": "2025-09-01", "end_date": "2025-09-01", "izoh": "Havolalar:\nhttps://t.me/Students_Channel2021/2505", "total_students": 167, "masters": 11, "first_year": 38, "second_year": 46, "third_year": 36, "fourth_year": 36, "male_students": 78, "female_students": 89}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                'bbaa7ee5-b211-47d3-af29-601c0b3edad6',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                '- Mustaqilligimizning 33 yilligi munosabati bilan Oʻzbekiston Mustaqilligi kunini ham nishonlash.',
                '{"event_name": "-\u00a0Mustaqilligimizning 33 yilligi munosabati bilan O\u02bbzbekiston Mustaqilligi kunini ham nishonlash.", "start_date": "2025-09-01", "end_date": "2025-09-01", "izoh": "Havolalar:\nhttps://t.me/Students_Channel2021/2513", "total_students": 195, "masters": 13, "first_year": 38, "second_year": 50, "third_year": 53, "fourth_year": 41, "male_students": 91, "female_students": 104}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                'f50b7eb4-764c-45cb-821a-f1b1c704a355',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Osmon ostida studentlar uchun film jarayonini o’tkazish',
                '{"event_name": "Osmon ostida studentlar uchun film jarayonini o\u2019tkazish", "start_date": "2025-01-90", "end_date": "2025-01-90", "izoh": "\u201cDolzarb 90 kun\u201d doirasida 19-iyul kuni universitet stadionida o\u2018tkazildi.\n\nHavolalar:\nTalabalar telegram sahifasida yoritilgan", "total_students": 151, "masters": 10, "first_year": 30, "second_year": 35, "third_year": 31, "fourth_year": 45, "male_students": 81, "female_students": 70}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                'd953ddfc-a6b0-44d4-8e23-9ed6da18e058',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Tanishtiruv haftaligi davomida faol qatnashgan talabalarga bir kunlik Renessans oromgohiga sayohat',
                '{"event_name": "Tanishtiruv haftaligi davomida faol qatnashgan talabalarga bir kunlik Renessans oromgohiga sayohat", "start_date": "2025-08-25", "end_date": "2025-08-25", "izoh": "25-26-avgust kunlari davomida o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2538", "total_students": 857, "masters": 57, "first_year": 162, "second_year": 201, "third_year": 220, "fourth_year": 217, "male_students": 456, "female_students": 401}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                'e80504f4-d108-43d3-a9ca-8c540a8f5f32',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Basketbol federatsiyasi bilan hamkorlik o‘rnatish',
                '{"event_name": "Basketbol federatsiyasi bilan hamkorlik o\u2018rnatish", "start_date": "2025-08-28", "end_date": "2025-08-28", "izoh": "28-avgust kuni hamkorlik memorandumi ikki taraflama imzolandi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2559", "total_students": 222, "masters": 14, "first_year": 47, "second_year": 55, "third_year": 55, "fourth_year": 51, "male_students": 112, "female_students": 110}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '22974601-96f9-4c43-8734-9f0198fb8f33',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Talabalar o‘rtasida “Zakovat” intellektual o‘yini o‘tkazish',
                '{"event_name": "Talabalar o\u2018rtasida \u201cZakovat\u201d intellektual o\u2018yini o\u2018tkazish", "start_date": "2025-09-02", "end_date": "2025-09-02", "izoh": "2-sentabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2563", "total_students": 128, "masters": 8, "first_year": 35, "second_year": 24, "third_year": 31, "fourth_year": 30, "male_students": 65, "female_students": 63}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                'bfa632a0-aca6-4f63-84d3-308cf485615b',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Talabalar o‘rtasida “Arm Wrestling” musobaqasi o‘tkazish.',
                '{"event_name": "Talabalar o\u2018rtasida \u201cArm Wrestling\u201d musobaqasi o\u2018tkazish.", "start_date": "2025-09-04", "end_date": "2025-09-04", "izoh": "4-sentabr kuni o\u2018tkazildi.\n\nHavolalar:\nNatijalar e\u2019loni:", "total_students": 197, "masters": 13, "first_year": 51, "second_year": 52, "third_year": 49, "fourth_year": 32, "male_students": 101, "female_students": 96}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '6ac0f1c7-c446-4f1f-9998-3b9544047395',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Xalqaro shaxmat federatsiyasi prezidenti, Arkadiy Dvorkovichning universitetga tashrifi va “Yangi O‘zbekiston Kubogi” shaxmat musobaqasi g‘oliblarini taqdirlash',
                '{"event_name": "Xalqaro shaxmat federatsiyasi prezidenti, Arkadiy Dvorkovichning universitetga tashrifi va \u201cYangi O\u2018zbekiston Kubogi\u201d shaxmat musobaqasi g\u2018oliblarini taqdirlash", "start_date": "2025-09-05", "end_date": "2025-09-05", "izoh": "5-sentabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2589", "total_students": 203, "masters": 13, "first_year": 39, "second_year": 51, "third_year": 40, "fourth_year": 60, "male_students": 107, "female_students": 96}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '8c2486e9-f5fd-4b0e-bb4e-638875130474',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Talabalar o‘rtasida shaxmat musobasi o‘tkazish',
                '{"event_name": "Talabalar o\u2018rtasida shaxmat musobasi o\u2018tkazish", "start_date": "2025-09-06", "end_date": "2025-09-06", "izoh": "6-sentabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2595", "total_students": 97, "masters": 6, "first_year": 20, "second_year": 19, "third_year": 20, "fourth_year": 32, "male_students": 47, "female_students": 50}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '6442b35f-0e99-432f-ad6c-515fd2dfaed3',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Universitet “Travel club” tashabbusi bilan So‘qoq qorovulxonasiga sayohat',
                '{"event_name": "Universitet \u201cTravel club\u201d tashabbusi bilan So\u2018qoq qorovulxonasiga sayohat", "start_date": "2025-09-06", "end_date": "2025-09-06", "izoh": "6-sentabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2608", "total_students": 217, "masters": 14, "first_year": 46, "second_year": 48, "third_year": 59, "fourth_year": 50, "male_students": 100, "female_students": 117}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '89fe44db-9caa-40b0-bbbc-da110a3cba5f',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Universitetning “See you at the museum” klubi tomonidan Temuriylar davlat muzeyiga talabalar bilan tashrif',
                '{"event_name": "Universitetning \u201cSee you at the museum\u201d klubi tomonidan Temuriylar davlat muzeyiga talabalar bilan tashrif", "start_date": "2025-09-07", "end_date": "2025-09-07", "izoh": "7-sentabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/newuu_sc/1866", "total_students": 165, "masters": 11, "first_year": 43, "second_year": 35, "third_year": 33, "fourth_year": 43, "male_students": 79, "female_students": 86}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                'b6dea9fe-54d4-4406-895a-ed2bc8a5bf92',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Universitet “Shaxmat klubi” tomonidan “Blitz 3+2” musobaqa',
                '{"event_name": "Universitet \u201cShaxmat klubi\u201d tomonidan \u201cBlitz 3+2\u201d musobaqa", "start_date": "2025-09-06", "end_date": "2025-09-06", "izoh": "6-sentabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2595", "total_students": 102, "masters": 6, "first_year": 23, "second_year": 27, "third_year": 28, "fourth_year": 18, "male_students": 55, "female_students": 47}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '78c1a7eb-fe26-4310-9de1-0de161e4e47c',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Volta 3x3 musobaqasi',
                '{"event_name": "Volta 3x3 musobaqasi", "start_date": "2025-09-13", "end_date": "2025-09-13", "izoh": "13-sentabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2623", "total_students": 129, "masters": 8, "first_year": 36, "second_year": 26, "third_year": 26, "fourth_year": 33, "male_students": 58, "female_students": 71}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '23411f7d-fff0-481b-9fcf-beff30c68b0c',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Clubs Fair 2025',
                '{"event_name": "Clubs Fair 2025", "start_date": "2025-09-12", "end_date": "2025-09-12", "izoh": "12-sentabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2634", "total_students": 841, "masters": 56, "first_year": 217, "second_year": 178, "third_year": 189, "fourth_year": 201, "male_students": 424, "female_students": 417}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '28c743cb-3f44-4eb6-a7ab-af1db5636d1b',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'ICPC Training Contest',
                '{"event_name": "ICPC Training Contest", "start_date": "2025-09-18", "end_date": "2025-09-18", "izoh": "18-sentabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2659", "total_students": 126, "masters": 8, "first_year": 28, "second_year": 32, "third_year": 31, "fourth_year": 27, "male_students": 62, "female_students": 64}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                'a2231b87-5718-4fae-b38a-85394c89d4be',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Universitetning “Kibersport” klubi tashabbusi bilan “Wingmania Season I” kibersport musobaqasi',
                '{"event_name": "Universitetning \u201cKibersport\u201d klubi tashabbusi bilan \u201cWingmania Season I\u201d kibersport musobaqasi", "start_date": "2025-10-03", "end_date": "2025-10-03", "izoh": "3-oktabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2718", "total_students": 105, "masters": 7, "first_year": 20, "second_year": 27, "third_year": 27, "fourth_year": 24, "male_students": 52, "female_students": 53}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '42732de4-8dc8-47e6-a9f0-27c0459ed13f',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Space Fest 2025',
                '{"event_name": "Space Fest 2025", "start_date": "2025-10-04", "end_date": "2025-10-04", "izoh": "4-oktabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2676", "total_students": 552, "masters": 36, "first_year": 131, "second_year": 153, "third_year": 114, "fourth_year": 118, "male_students": 262, "female_students": 290}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '11984aea-6125-4bd2-af9f-d4460aa63609',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Universitetning “Travel club” tashabbusi bilan Lashkarakka sayohat',
                '{"event_name": "Universitetning \u201cTravel club\u201d tashabbusi bilan Lashkarakka sayohat", "start_date": "2025-10-05", "end_date": "2025-10-05", "izoh": "5-oktabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2706", "total_students": 146, "masters": 9, "first_year": 34, "second_year": 36, "third_year": 29, "fourth_year": 38, "male_students": 78, "female_students": 68}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                'c984025a-150a-4d4c-b1ae-e1bdabd0334f',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Ixtisoslashtirilgan ta’lim muassasalari agentligi direktori Sevara Shakirova Yangi O‘zbekiston universiteti yotoqxonasiga tashrif buyurdi.',
                '{"event_name": "Ixtisoslashtirilgan ta\u2019lim muassasalari agentligi direktori Sevara Shakirova Yangi O\u2018zbekiston universiteti yotoqxonasiga tashrif buyurdi.", "start_date": "2025-10-10", "end_date": "2025-10-10", "izoh": "10-oktabr kuni.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2789", "total_students": 113, "masters": 7, "first_year": 29, "second_year": 28, "third_year": 24, "fourth_year": 25, "male_students": 54, "female_students": 59}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                'f14f4875-7e8e-4694-a447-3df74f16a124',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'O‘zbek tiliga davlat tili “Fast typing”',
                '{"event_name": "O\u2018zbek tiliga davlat tili \u201cFast typing\u201d", "start_date": "2025-10-21", "end_date": "2025-10-21", "izoh": "21-oktabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2825", "total_students": 219, "masters": 14, "first_year": 59, "second_year": 43, "third_year": 44, "fourth_year": 59, "male_students": 106, "female_students": 113}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                'ad493ed3-b3b2-4a09-bda5-90971221d884',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                '“Her Network Community”, “Fashion and Art” klublari tomonidan qizlar uchun pichnic',
                '{"event_name": "\u201cHer Network Community\u201d, \u201cFashion and Art\u201d klublari tomonidan qizlar uchun pichnic", "start_date": "2025-10-21", "end_date": "2025-10-21", "izoh": "21-oktyabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/newuu_sc/2184", "total_students": 187, "masters": 12, "first_year": 48, "second_year": 39, "third_year": 37, "fourth_year": 51, "male_students": 89, "female_students": 98}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '2ca09949-e21e-4f7f-9092-1518ad4d4a14',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                '“Zakovat klubi” tomonidan Futball Quiz',
                '{"event_name": "\u201cZakovat klubi\u201d tomonidan Futball Quiz", "start_date": "2025-10-24", "end_date": "2025-10-24", "izoh": "24-oktyabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/newuu_sc/2204", "total_students": 121, "masters": 8, "first_year": 32, "second_year": 28, "third_year": 28, "fourth_year": 25, "male_students": 66, "female_students": 55}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                'da7a7b53-5052-4ff1-b006-77afe79e4c92',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Shanaraq va Readers klublar tomonidan “Book talk” boldi',
                '{"event_name": "Shanaraq va Readers klublar tomonidan \u201cBook talk\u201d boldi", "start_date": "2025-10-25", "end_date": "2025-10-25", "izoh": "25-oktyabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/newuu_sc/2208", "total_students": 182, "masters": 12, "first_year": 42, "second_year": 43, "third_year": 44, "fourth_year": 41, "male_students": 93, "female_students": 89}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '972d03f2-c766-4b8b-872a-798712a2c783',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Hogwards Intern Klubi tarafdan klub sessiyasi',
                '{"event_name": "Hogwards Intern Klubi tarafdan klub sessiyasi", "start_date": "2025-10-25", "end_date": "2025-10-25", "izoh": "25-oktyabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/newuu_sc/2213", "total_students": 190, "masters": 12, "first_year": 53, "second_year": 49, "third_year": 38, "fourth_year": 38, "male_students": 101, "female_students": 89}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                'd37fad09-03e5-49f1-9512-4eca26407ed7',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                '“Work and Travel” boyicha “guest lecture”',
                '{"event_name": "\u201cWork and Travel\u201d boyicha \u201cguest lecture\u201d", "start_date": "2025-10-29", "end_date": "2025-10-29", "izoh": "29-oktyabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/newuu_sc/2236", "total_students": 84, "masters": 5, "first_year": 20, "second_year": 21, "third_year": 21, "fourth_year": 17, "male_students": 39, "female_students": 45}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '1998adc9-1f56-4090-a1c1-731bf5d7f5ff',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                '“Huawei ICT Academy” boyicha ma`ruza',
                '{"event_name": "\u201cHuawei ICT Academy\u201d boyicha ma`ruza", "start_date": "2025-10-30", "end_date": "2025-10-30", "izoh": "30-oktyabro\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2879", "total_students": 159, "masters": 10, "first_year": 31, "second_year": 42, "third_year": 38, "fourth_year": 38, "male_students": 77, "female_students": 82}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                'e8d99d45-ad51-4408-992f-9395be0bf457',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Sport haftaligi',
                '{"event_name": "Sport haftaligi", "start_date": "2025-10-27", "end_date": "2025-10-27", "izoh": "27-30- oktyabr kunlari\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2868", "total_students": 585, "masters": 39, "first_year": 123, "second_year": 127, "third_year": 136, "fourth_year": 160, "male_students": 263, "female_students": 322}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '92cbe1e7-3ca2-4571-83a2-6e2adff3bf66',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                '“Chill party” ko`ngil ochar tadbir',
                '{"event_name": "\u201cChill party\u201d ko`ngil ochar tadbir", "start_date": "2025-10-31", "end_date": "2025-10-31", "izoh": "31-oktyabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2898", "total_students": 221, "masters": 14, "first_year": 54, "second_year": 55, "third_year": 59, "fourth_year": 39, "male_students": 121, "female_students": 100}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '6ee14e01-b970-4851-84a8-433f212735e1',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Yangi O`zbekiston va Nazarbayev universtitetlar o`rtasida onlayn uchrashuv',
                '{"event_name": "Yangi O`zbekiston va Nazarbayev universtitetlar o`rtasida onlayn uchrashuv", "start_date": "2025-10-31", "end_date": "2025-10-31", "izoh": "31-oktyabr kuni\n\nHavolalar:\nhttps://t.me/newuu_sc/2253", "total_students": 189, "masters": 12, "first_year": 42, "second_year": 37, "third_year": 37, "fourth_year": 61, "male_students": 101, "female_students": 88}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '2743b585-55cb-4536-b2f7-ff016511bf43',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Futbol musobaqasi',
                '{"event_name": "Futbol musobaqasi", "start_date": "2025-11-01", "end_date": "2025-11-01", "izoh": "1-2-noyabr kunlari o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/newuu_sc/2313", "total_students": 116, "masters": 7, "first_year": 22, "second_year": 27, "third_year": 27, "fourth_year": 33, "male_students": 61, "female_students": 55}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '2110dbb2-c611-4d68-95e6-ada71cb67207',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                '“See you at the museum” klubi tomonidan “Academy Gallery”ga tashrif',
                '{"event_name": "\u201cSee you at the museum\u201d klubi tomonidan \u201cAcademy Gallery\u201dga tashrif", "start_date": "2025-11-06", "end_date": "2025-11-06", "izoh": "6-noyabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/newuu_sc/2269", "total_students": 173, "masters": 11, "first_year": 36, "second_year": 34, "third_year": 36, "fourth_year": 56, "male_students": 90, "female_students": 83}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '014f22e1-45bc-4133-ba10-499eeaaa4d79',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Maxsus mehmon Boburjon Adxamov ishtirokida tarmoq yaratish (networking) va tavsiyalar bo‘yicha uchrashuv.',
                '{"event_name": "Maxsus mehmon Boburjon Adxamov ishtirokida tarmoq yaratish (networking) va tavsiyalar bo\u2018yicha uchrashuv.", "start_date": "2025-11-08", "end_date": "2025-11-08", "izoh": "8-noyabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/newuu_sc/2273", "total_students": 222, "masters": 14, "first_year": 46, "second_year": 50, "third_year": 55, "fourth_year": 57, "male_students": 107, "female_students": 115}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '4eb1f9d6-e349-4eb5-99f2-e8fbeff71839',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Universitetlararo Memorandum bo‘yicha o‘tkazilgan uchrashuv',
                '{"event_name": "Universitetlararo Memorandum bo\u2018yicha o\u2018tkazilgan uchrashuv", "start_date": "2025-11-08", "end_date": "2025-11-08", "izoh": "8-noyabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/newuu_sc/2290", "total_students": 85, "masters": 5, "first_year": 19, "second_year": 23, "third_year": 23, "fourth_year": 15, "male_students": 39, "female_students": 46}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '1f1cf29f-677f-4039-9879-db72bd6cf04a',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                '“Travel club” tomonidan Samarqand shahri bo‘ylab sayohat va Marafon',
                '{"event_name": "\u201cTravel club\u201d tomonidan Samarqand shahri bo\u2018ylab sayohat va Marafon", "start_date": "2025-11-08", "end_date": "2025-11-08", "izoh": "8-9-noyabr kunlari o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2929", "total_students": 222, "masters": 14, "first_year": 55, "second_year": 47, "third_year": 52, "fourth_year": 54, "male_students": 113, "female_students": 109}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                'a1cd2f44-dd31-417e-ac34-54da86c3b17d',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                '“SPORTS WEEK”  2025 taqdirlash marosimi',
                '{"event_name": "\u201cSPORTS WEEK\u201d\u00a0 2025 taqdirlash marosimi", "start_date": "2025-11-12", "end_date": "2025-11-12", "izoh": "12-noyabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2939", "total_students": 887, "masters": 59, "first_year": 247, "second_year": 229, "third_year": 166, "fourth_year": 186, "male_students": 478, "female_students": 409}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '4e052637-fbba-4c6f-bd8b-8bc83482d828',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                '“Film odyssey” klub tomonidan ‘Dead Poets Society’ filmi namoyishi',
                '{"event_name": "\u201cFilm odyssey\u201d klub tomonidan \u2018Dead Poets Society\u2019 filmi namoyishi", "start_date": "2025-11-14", "end_date": "2025-11-14", "izoh": "14-noyabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/newuu_sc/2336", "total_students": 131, "masters": 8, "first_year": 26, "second_year": 33, "third_year": 26, "fourth_year": 38, "male_students": 64, "female_students": 67}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                'feb49c57-e0d1-4296-80eb-14d0ecc15068',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Xalqaro talabalar kuni munosabati bilan “Party”',
                '{"event_name": "Xalqaro talabalar kuni munosabati bilan \u201cParty\u201d", "start_date": "2025-11-16", "end_date": "2025-11-16", "izoh": "16-noyabr kuni\u00a0 o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/newuu_sc/2339", "total_students": 111, "masters": 7, "first_year": 30, "second_year": 30, "third_year": 24, "fourth_year": 20, "male_students": 51, "female_students": 60}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                'b25c0c95-c4d4-4b4b-b78d-197d7a6f22ca',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                '“Film odyssey” klub tomonidan The Intouchables’ filmi namoyishi',
                '{"event_name": "\u201cFilm odyssey\u201d klub tomonidan The Intouchables\u2019 filmi namoyishi", "start_date": "2025-11-21", "end_date": "2025-11-21", "izoh": "21-noyabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/2993", "total_students": 123, "masters": 8, "first_year": 34, "second_year": 32, "third_year": 23, "fourth_year": 26, "male_students": 64, "female_students": 59}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                'd5023eb1-c2f0-47e2-b38f-c9b31c22b6d3',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'UZQuiz intellektual musobaqasi',
                '{"event_name": "UZQuiz intellektual musobaqasi", "start_date": "2025-11-20", "end_date": "2025-11-20", "izoh": "20-noyabr\u00a0 kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/3008", "total_students": 191, "masters": 12, "first_year": 44, "second_year": 42, "third_year": 50, "fourth_year": 43, "male_students": 101, "female_students": 90}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                'fcab1110-7bf9-4a21-94cd-b06f2830ecbd',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Universitetlararo Stol Tennis Musobaqasi',
                '{"event_name": "Universitetlararo Stol Tennis Musobaqasi", "start_date": "2025-11-23", "end_date": "2025-11-23", "izoh": "23-noyabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/newuu_sc/2359", "total_students": 111, "masters": 7, "first_year": 26, "second_year": 29, "third_year": 27, "fourth_year": 22, "male_students": 59, "female_students": 52}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '59774f59-dde4-413f-826b-737e3243943f',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'Yangi O‘zbekiston Universiteti “Eco Club”ning rasmiy ochilishi va daraxt ekish tadbiri',
                '{"event_name": "Yangi O\u2018zbekiston Universiteti \u201cEco Club\u201dning rasmiy ochilishi va daraxt ekish tadbiri", "start_date": "2025-11-27", "end_date": "2025-11-27", "izoh": "27-noyabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/3036", "total_students": 139, "masters": 9, "first_year": 30, "second_year": 30, "third_year": 30, "fourth_year": 40, "male_students": 65, "female_students": 74}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            

            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '551f8207-ba6f-42cd-a8aa-7cc7e6698a96',
                123456789,
                'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22',
                '6f5bce60-2a10-47da-8a1f-278ade41b1a2',
                'O‘zbekiston Respublikasi Konstitutsiyasi Qoidalari va Prinsiplari bo‘yicha Olimpiada',
                '{"event_name": "O\u2018zbekiston Respublikasi Konstitutsiyasi Qoidalari va Prinsiplari bo\u2018yicha Olimpiada", "start_date": "2025-11-27", "end_date": "2025-11-27", "izoh": "27-noyabr kuni o\u2018tkazildi.\n\nHavolalar:\nhttps://t.me/Students_Channel2021/3042", "total_students": 547, "masters": 36, "first_year": 147, "second_year": 115, "third_year": 124, "fourth_year": 125, "male_students": 288, "female_students": 259}'::jsonb,
                (SELECT questions FROM templates WHERE id = '6f5bce60-2a10-47da-8a1f-278ade41b1a2')
            );
            
COMMIT;