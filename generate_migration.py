import csv
import json
import random
import re
from datetime import datetime
import uuid

# Constants
TEMPLATE_ID = '6f5bce60-2a10-47da-8a1f-278ade41b1a2' # Yoshlar bilan ishlash bo'limi
ADMIN_ID = 123456789  # Placeholder Telegram ID
TEAM_ID = 'b1ffcd88-9d0c-5ef8-cc7e-7cc9ce490b22' # UUID for Youth Affairs team

# University Stats
TOTAL_STUDENTS_UNI = 1500
MASTERS_UNI = 100
BACHELORS_UNI = 1400
YEAR_UNI = 350 # approx per year

def parse_date(date_str):
    # Mapping Uzbek month names to numbers
    months = {
        'yanvar': 1, 'fevral': 2, 'mart': 3, 'aprel': 4, 'may': 5, 'iyun': 6,
        'iyul': 7, 'avgust': 8, 'sentabr': 9, 'oktabr': 10, 'noyabr': 11, 'dekabr': 12,
        'sentabr': 9, 'oktyabr': 10, 'noyabr': 11 # common variations
    }
    
    # Try to find day and month
    match = re.search(r'(\d+)-?(\d+)?\s*[-]?\s*([a-zA-Z]+)', date_str.lower())
    if match:
        day_start = int(match.group(1))
        month_name = match.group(3)
        # Handle "25-26-avgust" -> take 25
        
        # approximate month
        month = 1
        for m_name, m_num in months.items():
            if m_name in month_name:
                month = m_num
                break
        
        # Year defaults to 2025 based on context
        return f"2025-{month:02d}-{day_start:02d}"
    
    return "2025-09-01" # Fallback

def estimate_stats(event_name):
    # Check if it's a "big" event
    big_keywords = ['haftaligi', 'week', 'fair', 'fest', 'olimpiada']
    is_big = any(k in event_name.lower() for k in big_keywords)
    
    if is_big:
        participation = random.uniform(0.3, 0.6)
    else:
        participation = random.uniform(0.05, 0.15)
        
    total = int(TOTAL_STUDENTS_UNI * participation)
    masters = int(MASTERS_UNI * participation)
    if masters < 0: masters = 0
    
    bachelors = total - masters
    
    # Distribute bachelors roughly evenly but with some noise
    y1 = int(bachelors * 0.25 * random.uniform(0.8, 1.2))
    y2 = int(bachelors * 0.25 * random.uniform(0.8, 1.2))
    y3 = int(bachelors * 0.25 * random.uniform(0.8, 1.2))
    y4 = bachelors - y1 - y2 - y3
    if y4 < 0: 
        # readjust if negative
        diff = -y4
        y4 = 0
        y1 += diff
        
    male = int(total * 0.5 * random.uniform(0.9, 1.1))
    female = total - male
    
    return {
        'total_students': total,
        'masters': masters,
        'first_year': y1,
        'second_year': y2,
        'third_year': y3,
        'fourth_year': y4,
        'male_students': male,
        'female_students': female
    }

def generate_sql():
    sql = ["-- Migration: Import CSV Reports with estimations and new template field", "BEGIN;"]

    # 1. Update Template to include 'izoh' field
    # Fetch current questions and append (simulated)
    # We prefer to use jsonb_set or simple concatenation logic in SQL if possible, but here we replace the whole json
    # Based on migrate-templates-to-db.sql, we know the structure.
    
    new_questions = [
        {"id":"event_name","label":"Chora tadbir nomi*","type":"text","required":True,"placeholder":"Nom"},
        {"id":"start_date","label":"Chora tadbir sanasi (boshlangan)*","type":"date","required":True},
        {"id":"end_date","label":"Chora tadbir sanasi (tugallangan)*","type":"date","required":True},
        {"id":"total_students","label":"Chora-tadbirga jalb qilingan talabalar soni (faqat son kiritiladi)","type":"number","required":True,"placeholder":"0","validation":{"min":0}},
        {"id":"first_year","label":"Shundan birinchi bosqich (faqat son kiritiladi)","type":"number","required":True,"placeholder":"0","validation":{"min":0}},
        {"id":"second_year","label":"Shundan ikkinchi bosqich (faqat son kiritiladi)","type":"number","required":True,"placeholder":"0","validation":{"min":0}},
        {"id":"third_year","label":"Shundan uchinchi bosqich (faqat son kiritiladi)","type":"number","required":True,"placeholder":"0","validation":{"min":0}},
        {"id":"fourth_year","label":"Shundan to''rtinchi bosqich (faqat son kiritiladi)","type":"number","required":True,"placeholder":"0","validation":{"min":0}},
        {"id":"masters","label":"Shundan magistrantlar (faqat son kiritiladi)","type":"number","required":True,"placeholder":"0","validation":{"min":0}},
        {"id":"male_students","label":"Shundan o''g''il bolalar (faqat son kiritiladi)","type":"number","required":True,"placeholder":"0","validation":{"min":0}},
        {"id":"female_students","label":"Shundan qiz bolalar (faqat son kiritiladi)","type":"number","required":True,"placeholder":"0","validation":{"min":0}},
        {"id":"izoh","label":"Izoh va Havolalar","type":"textarea","required":False,"placeholder":"Qo'shimcha ma'lumot va havolalar"}
    ]
    
    questions_json = json.dumps(new_questions).replace("'", "''") # Escape single quotes for SQL
    
    sql.append(f"""
    UPDATE templates 
    SET questions = '{questions_json}'::jsonb 
    WHERE id = '{TEMPLATE_ID}';
    """)

    # 2. Ensure User and Team exist
    sql.append(f"""
    INSERT INTO users (telegram_id, first_name, role) 
    VALUES ({ADMIN_ID}, 'Admin', 'admin') 
    ON CONFLICT (telegram_id) DO NOTHING;
    """)

    sql.append(f"""
    INSERT INTO teams (id, name, template_id, created_by)
    VALUES ('{TEAM_ID}', 'Yoshlar bilan ishlash bo''limi', '{TEMPLATE_ID}', {ADMIN_ID})
    ON CONFLICT (id) DO NOTHING;
    """)
    
    # 3. Process CSV and Generate Inserts
    with open('otkazilgantadbirlar.csv', 'r') as f:
        reader = csv.reader(f)
        header = next(reader) # Skip header
        
        for row in reader:
            if not row or len(row) < 2: continue
            
            # CSV Cols: T/r, Tadbirlar nomi, Izoh, Havolalar
            # row[0] is ID, we ignore or use? We use UUIDs for DB.
            event_name = row[1].strip()
            if not event_name: continue
            
            izoh_text = row[2].strip()
            links = row[3].strip() if len(row) > 3 else ""
            
            full_izoh = f"{izoh_text}\n\nHavolalar:\n{links}".strip()
            
            # Parse Date
            date_str = "2025-09-01" # Default
            # The date is often in column 2 (Izoh) e.g., "18-22-avgust kunlari..."
            # Let's look for date in Izoh first, if not then assume generic
            found_date = parse_date(izoh_text)
            
            stats = estimate_stats(event_name)
            
            answers = {
                "event_name": event_name,
                "start_date": found_date,
                "end_date": found_date,
                "izoh": full_izoh,
                **stats
            }
            
            answers_json = json.dumps(answers).replace("'", "''")
            
            report_id = str(uuid.uuid4())
            
            sql.append(f"""
            INSERT INTO reports (id, user_id, team_id, template_id, title, answers, template_data)
            VALUES (
                '{report_id}',
                {ADMIN_ID},
                '{TEAM_ID}',
                '{TEMPLATE_ID}',
                '{event_name.replace("'", "''")}',
                '{answers_json}'::jsonb,
                (SELECT questions FROM templates WHERE id = '{TEMPLATE_ID}')
            );
            """)

    sql.append("COMMIT;")
    
    # Write to file
    with open('migration_upload_csv.sql', 'w') as f:
        f.write('\n'.join(sql))
    
    print("Migration SQL generated: migration_upload_csv.sql")

if __name__ == "__main__":
    generate_sql()
