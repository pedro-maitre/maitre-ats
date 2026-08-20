require('dotenv/config');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function applyPolicies() {
  const client = await pool.connect();
  try {
    console.log('Connected to PostgreSQL. Creating Storage RLS policies for resumes bucket...');

    // Drop old conflicting policies if any
    await client.query(`
      DROP POLICY IF EXISTS "Public Uploads to resumes bucket" ON storage.objects;
      DROP POLICY IF EXISTS "Public Select from resumes bucket" ON storage.objects;
      DROP POLICY IF EXISTS "Public Update on resumes bucket" ON storage.objects;
      DROP POLICY IF EXISTS "Allow all for resumes bucket" ON storage.objects;
    `);

    // Create comprehensive policy for resumes bucket
    await client.query(`
      CREATE POLICY "Allow public insert on resumes"
      ON storage.objects FOR INSERT
      TO public, anon, authenticated
      WITH CHECK (bucket_id = 'resumes');

      CREATE POLICY "Allow public select on resumes"
      ON storage.objects FOR SELECT
      TO public, anon, authenticated
      USING (bucket_id = 'resumes');

      CREATE POLICY "Allow public update on resumes"
      ON storage.objects FOR UPDATE
      TO public, anon, authenticated
      USING (bucket_id = 'resumes')
      WITH CHECK (bucket_id = 'resumes');
    `);

    console.log('Storage policies successfully created on storage.objects!');

    const res = await client.query(`
      SELECT policyname, permissive, roles, cmd 
      FROM pg_policies 
      WHERE tablename = 'objects' AND schemaname = 'storage';
    `);
    console.log('Active storage.objects policies:', res.rows);
  } catch (err) {
    console.error('Error applying policies:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

applyPolicies();
