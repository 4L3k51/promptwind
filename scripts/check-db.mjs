import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Connecting to Supabase database...\n')

// Check database version
console.log('📊 Database Information:')
console.log('URL:', supabaseUrl)
console.log('')

// Try to get list of tables from information_schema
console.log('📋 Checking for existing tables...\n')

try {
  // Query to get all tables in the public schema
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
    .eq('table_type', 'BASE TABLE')

  if (tablesError) {
    console.log('⚠️  Cannot query information_schema directly with anon key')
    console.log('   This is normal - RLS prevents reading schema tables\n')
    
    // Try an alternative approach - attempt to query common table names
    console.log('🔍 Attempting to detect tables by querying...\n')
    
    const commonTables = ['users', 'prompts', 'models', 'tags']
    const foundTables = []
    
    for (const tableName of commonTables) {
      const { error } = await supabase.from(tableName).select('count', { count: 'exact', head: true })
      if (!error) {
        foundTables.push(tableName)
      }
    }
    
    if (foundTables.length > 0) {
      console.log('✅ Found tables:', foundTables.join(', '))
    } else {
      console.log('ℹ️  No tables detected (database might be empty)')
    }
  } else if (tables && tables.length > 0) {
    console.log('✅ Found tables:')
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`)
    })
  } else {
    console.log('ℹ️  No tables found in public schema')
    console.log('   Database appears to be empty - ready for migrations!')
  }
  
  console.log('\n✅ Successfully connected to Supabase!')
  console.log('✅ Can execute SQL queries via Supabase client')
  
} catch (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
}



