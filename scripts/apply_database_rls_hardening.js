require('dotenv/config');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function hardenDatabaseSecurity() {
  const client = await pool.connect();
  try {
    console.log('🔒 1. Obtendo todas as tabelas do schema public...');
    const tablesRes = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);

    const tables = tablesRes.rows.map(r => r.tablename);
    console.log(`Encontradas ${tables.length} tabelas no schema public:`, tables);

    console.log('\n🔒 2. Ativando Row Level Security (RLS) e revogando acesso do role "anon" no PostgREST...');
    for (const table of tables) {
      await client.query(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);
      // Revoga SELECT, INSERT, UPDATE, DELETE diretos para anon e authenticated na API REST pública
      await client.query(`REVOKE ALL ON TABLE public."${table}" FROM anon;`);
      console.log(`  ✓ RLS ativado e acesso anônimo revogado para: ${table}`);
    }

    console.log('\n🔒 3. Verificando status de rowsecurity após blindagem:');
    const verifyRes = await client.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename;
    `);
    console.table(verifyRes.rows);

    console.log('✅ Blindagem de RLS concluída com sucesso no PostgreSQL/Supabase!');
  } catch (err) {
    console.error('❌ Erro ao aplicar blindagem de RLS:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

hardenDatabaseSecurity();
