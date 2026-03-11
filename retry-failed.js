const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://reports_user:reports_password123@localhost:5432/reports_db"
});

const failedIds = [
  "f494927b", "7682811b", "d953ddfc", "e80504f4", "22974601",
  "bfa632a0", "6ac0f1c7", "8c2486e9", "6442b35f", "89fe44db", "551f8207"
];

async function retryFailed() {
  const client = await pool.connect();
  
  try {
    const templatesResult = await client.query(`SELECT id, name, questions FROM templates`);
    const templateMap = {};
    for (const t of templatesResult.rows) {
      const questions = t.questions || [];
      const idToLabel = {};
      for (const q of questions) {
        if (q.id && q.label) idToLabel[q.id] = q.label;
      }
      templateMap[t.id] = { name: t.name, idToLabel, questionOrder: questions.map(q => q.id) };
    }
    
    const reportsResult = await client.query(`
      SELECT r.id, r.created_at, r.template_id, t.name as template_name,
        COALESCE(te.name, 'Unknown Team') as team_name,
        COALESCE(u.first_name || ' ' || COALESCE(u.last_name, ''), 'Unknown User') as user_name,
        r.answers
      FROM reports r 
      JOIN templates t ON r.template_id = t.id 
      LEFT JOIN teams te ON r.team_id = te.id 
      LEFT JOIN users u ON r.user_id = u.telegram_id 
      WHERE ${failedIds.map((_, i) => `r.id::text LIKE $${i+1}`).join(" OR ")}
    `, failedIds.map(id => id + "%"));
    
    console.log(`Retrying ${reportsResult.rows.length} failed reports with longer delays...`);
    
    for (const report of reportsResult.rows) {
      const template = templateMap[report.template_id];
      if (!template) { console.log(`  ✗ ${report.id} - template not found`); continue; }
      
      const answers = report.answers || {};
      const answersArray = template.questionOrder
        .filter(qId => answers[qId] !== undefined)
        .map(qId => ({ label: template.idToLabel[qId] || qId, value: String(answers[qId] ?? "") }));
      
      for (const [key, value] of Object.entries(answers)) {
        if (!template.questionOrder.includes(key)) {
          answersArray.push({ label: template.idToLabel[key] || key, value: String(value ?? "") });
        }
      }
      
      const payload = {
        templateName: report.template_name,
        reportData: {
          reportId: report.id,
          timestamp: report.created_at.toISOString(),
          teamName: report.team_name,
          userName: report.user_name,
          answers: answersArray
        }
      };
      
      try {
        const response = await fetch("http://localhost:3001/api/sheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        console.log(result.success ? `  ✓ ${report.id.slice(0,8)}... - ${report.user_name}` : `  ✗ ${report.id.slice(0,8)}... - ${result.error}`);
      } catch (err) {
        console.log(`  ✗ ${report.id.slice(0,8)}... - ${err.message}`);
      }
      
      // 2 second delay between requests
      await new Promise(r => setTimeout(r, 2000));
    }
  } finally {
    client.release();
    await pool.end();
  }
}

retryFailed().catch(console.error);
