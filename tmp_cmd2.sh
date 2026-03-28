cd /home/ubuntu/reports-app
DB_URL=
node -e "const u=new URL(process.argv[1]); console.log('DB_HOST='+u.hostname); console.log('DB_PORT='+(u.port||'5432')); console.log('DB_NAME='+(u.pathname||'').replace('/',''));" ""
