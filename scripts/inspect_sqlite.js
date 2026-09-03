const { DatabaseSync } = require('node:sqlite');
const dbPath = 'C:/Users/a-a-p/Desktop/Sistema_Maitre_BPO_Local_v1/data/maitre.db';
const db = new DatabaseSync(dbPath);

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table';").all();
console.log("Tabelas encontradas em Sistema_Maitre_BPO_Local_v1/data/maitre.db:\n");

for (const t of tables) {
  try {
    const count = db.prepare(`SELECT count(*) as count FROM "${t.name}"`).get();
    console.log(`- ${t.name}: ${count.count} registros`);
    if (count.count > 0 && !t.name.startsWith('_')) {
      const sample = db.prepare(`SELECT * FROM "${t.name}" LIMIT 5`).all();
      console.log(`  Exemplo de ${t.name}:`, JSON.stringify(sample, null, 2));
    }
  } catch (e) {
    console.log(`- ${t.name}: erro ${e.message}`);
  }
}
