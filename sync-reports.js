const { Pool } = require("pg");

const pool = new Pool({
  connectionString: "postgresql://reports_user:reports_password123@localhost:5432/reports_db"
});

async function syncAllReports() {
  const client = await pool.connect();
  
  try {
    // Get all templates with their questions
    const templatesResult = await client.query(`
      SELECT id, name, questions FROM templates ORDER BY name
    `);
    
    // Build a map of template_id -> { name, questionIdToLabel }
    const templateMap = {};
    for (const t of templatesResult.rows) {
      const questions = t.questions || [];
      const idToLabel = {};
      for (const q of questions) {
        if (q.id && q.label) {
          idToLabel[q.id] = q.label;
        }
      }
      templateMap[t.id] = { name: t.name, idToLabel, questionOrder: questions.map(q => q.id) };
    }
    
    // Get all reports with related data
    const reportsResult = await client.query(`
      SELECT 
        r.id,
        r.created_at,
        r.template_id,
        t.name as template_name,
        COALESCE(te.name, 'Unknown Team') as team_name,
        COALESCE(u.first_name || ' ' || COALESCE(u.last_name, ''), 'Unknown User') as user_name,
        r.answers
      FROM reports r 
      JOIN templates t ON r.template_id = t.id 
      LEFT JOIN teams te ON r.team_id = te.id 
      LEFT JOIN users u ON r.user_id = u.telegram_id 
      ORDER BY t.name, r.created_at
    `);
    
    console.log(`Found ${reportsResult.rows.length} reports to sync`);
    
    let currentTemplate = null;
    let successCount = 0;
    let failCount = 0;
    
    for (const report of reportsResult.rows) {
      const template = templateMap[report.template_id];
      if (!template) {
        console.log(`  ✗ Skipping report ${report.id} - template not found`);
        failCount++;
        continue;
      }
      
      if (currentTemplate !== report.template_name) {
        currentTemplate = report.template_name;
        console.log(`\n=== Syncing ${currentTemplate} ===`);
      }
      
      // Convert answers from {id: value} to [{label, value}] using template question order
      const answers = report.answers || {};
      const answersArray = template.questionOrder
        .filter(qId => answers[qId] !== undefined)
        .map(qId => ({
          label: template.idToLabel[qId] || qId,
          value: String(answers[qId] ?? "")
        }));
      
      // Also add any answer keys not in the template (edge cases)
      for (const [key, value] of Object.entries(answers)) {
        if (!template.questionOrder.includes(key)) {
          answersArray.push({
            label: template.idToLabel[key] || key,
            value: String(value ?? "")
          });
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
        
        if (result.success) {
          console.log(`  ✓ ${report.id.slice(0,8)}... - ${report.user_name}`);
          successCount++;
        } else {
          console.log(`  ✗ ${report.id.slice(0,8)}... - ${result.error}`);
          failCount++;
        }
      } catch (err) {
        console.log(`  ✗ ${report.id.slice(0,8)}... - ${err.message}`);
        failCount++;
      }
      
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300));
    }
    
    console.log(`\n=== Done ===`);
    console.log(`Success: ${successCount}, Failed: ${failCount}`);
    
  } finally {
    client.release();
    await pool.end();
  }
}

syncAllReports().catch(console.error);
