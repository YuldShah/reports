set -e
cd /home/ubuntu/reports-app || exit 1
if ! command -v pg_dump >/dev/null 2>&1 || ! command -v psql >/dev/null 2>&1; then
  sudo DEBIAN_FRONTEND=noninteractive apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql-client
fi
DB_URL=$(node -e "const fs=require('fs');let t='';try{t=fs.readFileSync('.env.local','utf8')}catch{};let v='';for(const line of t.split(/\\r?\\n/)){if(!line||/^\\s*#/.test(line))continue;const i=line.indexOf('=');if(i<0)continue;const k=line.slice(0,i).trim();if(k==='DATABASE_URL'){v=line.slice(i+1).trim();break;}}if((v.startsWith('\\\"')&&v.endsWith('\\\"'))||(v.startsWith(\"'\")&&v.endsWith(\"'\")))v=v.slice(1,-1);process.stdout.write(v||process.env.DATABASE_URL||'');")
if [ -z "$DB_URL" ]; then
  echo "BACKUP_STATUS=FAIL:NO_DATABASE_URL"
  exit 1
fi
pg_dump "$DB_URL" > /tmp/reports-target-before-migration.sql
if [ -s /tmp/reports-target-before-migration.sql ]; then
  echo "BACKUP_STATUS=OK"
else
  echo "BACKUP_STATUS=FAIL:EMPTY_DUMP"
  exit 1
fi
