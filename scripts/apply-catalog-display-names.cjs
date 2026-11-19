/* Apply the reviewed display names without modifying legacy master labels or documents.
   Dry run: node -r dotenv/config scripts/apply-catalog-display-names.cjs
   Apply:   node -r dotenv/config scripts/apply-catalog-display-names.cjs --apply
   Dry runs execute the exact schema/data changes in a rolled-back transaction. */
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {createHash,randomUUID}=require('node:crypto');
const {Client}=require('pg');
const migrationName='20261119090000_catalog_display_names';
const migration=fs.readFileSync(`prisma/migrations/${migrationName}/migration.sql`,'utf8');
const proposals=JSON.parse(fs.readFileSync('docs/data/catalog-name-proposals-2026-11-19.json','utf8'));
const apply=process.argv.includes('--apply');
const protectedTables=['quotations','quotation_items','quotation_item_components','ComponentsOfQuotation','quotation_followups','sales_orders','sales_order_items','components_of_product_in_sales_order','invoices','invoice_items','invoice_packages','invoice_package_items','delivery_challans','delivery_challan_items','goods_receipt_notes','goods_receipt_note_items','material_issues','material_issue_items','stock_balances','stock_ledger','product_serials','product_serial_counters','ProductMedia','ProductComponentsOnVariants','ProductComponent','variant_boms','variant_bom_items','categories','product_approval_requests'];
const quoted=name=>'"'+name.replaceAll('"','""')+'"';
async function fingerprint(c,table,excludeDisplay=false){
 const value=excludeDisplay?"to_jsonb(t)-'displayName'":table==='product_serials'?"to_jsonb(t)-'productNameSnapshot'":'to_jsonb(t)';
 return (await c.query(`SELECT count(*)::int AS rows,md5(COALESCE(string_agg(md5((${value})::text),'' ORDER BY t.id),'')) AS checksum FROM ${quoted(table)} t`)).rows[0];
}
async function main(){
 const c=new Client({connectionString:process.env.DATABASE_URL,connectionTimeoutMillis:15000});
 try{
  await c.connect();
  await c.query('BEGIN');
  await c.query("SET LOCAL lock_timeout='10s'");
  await c.query("SET LOCAL statement_timeout='60s'");
  const schema=new URL(process.env.DATABASE_URL).searchParams.get('schema')||'public';
  assert.match(schema,/^[A-Za-z_][A-Za-z0-9_]*$/);
  await c.query(`SET LOCAL search_path TO ${quoted(schema)}`);
  await c.query('SELECT pg_advisory_xact_lock(20261119,90000)');
  const existing=new Set((await c.query('SELECT tablename FROM pg_tables WHERE schemaname=$1',[schema])).rows.map(r=>r.tablename));
  const tables=protectedTables.filter(t=>existing.has(t));
  await c.query(`LOCK TABLE "Product","ProductVariant" IN SHARE ROW EXCLUSIVE MODE`);
  await c.query(`LOCK TABLE ${tables.map(quoted).join(',')} IN SHARE MODE`);
  const before={};
  for(const t of [...tables,'Product','ProductVariant'])before[t]=await fingerprint(c,t,t==='Product'||t==='ProductVariant');
  const oldProducts=(await c.query('SELECT * FROM "Product" ORDER BY id')).rows;
  const oldVariants=(await c.query('SELECT * FROM "ProductVariant" ORDER BY id')).rows;
  await c.query(migration);
  const result={applied:apply,recordedAt:new Date().toISOString(),schema,products:[],variants:[],held:[],unchanged:0,protectedTables:before};
  for(const [type,rows,entries,field] of [['Product',oldProducts,proposals.products,'name'],['ProductVariant',oldVariants,proposals.variants,'variant']]){
   const map=new Map(rows.map(r=>[r.id,r]));
   for(const entry of entries){
    const old=map.get(entry.id);
    assert(old,`Missing ${type}: ${entry.id}`);
    if(type==='ProductVariant')assert.equal(old.productId,entry.productId,`Parent changed: ${entry.id}`);
    assert.equal(old[field],entry.oldName,`Original label changed since review: ${entry.id}`);
    if(entry.hold){result.held.push({type,id:entry.id,name:entry.oldName,reason:entry.hold});continue;}
    if(old.deletedAt||old.status!=='ACTIVE'||(type==='ProductVariant'&&oldProducts.find(p=>p.id===old.productId)?.deletedAt)){
     result.held.push({type,id:entry.id,name:entry.oldName,reason:'Inactive or archived record is preserved.'});continue;
    }
    if(entry.newName===(old.displayName||old[field])){result.unchanged++;continue;}
    assert(!/Confirm|Identify/i.test(entry.newName),'Unresolved display label');
    assert(!old.displayName||old.displayName===entry.oldName||old.displayName===entry.newName,`Display label changed since review: ${entry.id}`);
    const changed=await c.query(`UPDATE ${quoted(type)} SET "displayName"=$1 WHERE id=$2 AND ${quoted(field)}=$3 RETURNING id`,[entry.newName,entry.id,entry.oldName]);
    assert.equal(changed.rowCount,1);
    result[type==='Product'?'products':'variants'].push({id:entry.id,oldName:entry.oldName,previousDisplayName:old.displayName??null,newName:entry.newName});
   }
  }
  for(const t of [...tables,'Product','ProductVariant'])assert.deepEqual(await fingerprint(c,t,t==='Product'||t==='ProductVariant'),before[t],`Protected data changed: ${t}`);
  if(existing.has('_prisma_migrations')){
   const checksum=createHash('sha256').update(migration).digest('hex');
   const tracked=await c.query('SELECT checksum FROM "_prisma_migrations" WHERE migration_name=$1 AND rolled_back_at IS NULL AND finished_at IS NOT NULL',[migrationName]);
   if(tracked.rowCount)assert.equal(tracked.rows[0].checksum,checksum,'Migration checksum changed.');
   else await c.query('INSERT INTO "_prisma_migrations" (id,checksum,finished_at,migration_name,started_at,applied_steps_count) VALUES ($1,$2,NOW(),$3,NOW(),1)',[randomUUID(),checksum,migrationName]);
  }
  await c.query(apply?'COMMIT':'ROLLBACK');
  fs.mkdirSync('tmp',{recursive:true});
  fs.writeFileSync(`tmp/catalog-display-names-${apply?'applied':'dry-run'}.json`,JSON.stringify(result,null,2));
  console.log(JSON.stringify({applied:apply,productNames:result.products.length,variantNames:result.variants.length,held:result.held.length,alreadyCorrect:result.unchanged,protectedTables:tables.length,historicalData:'exact row checksums unchanged',legacyMasterData:'exact row checksums unchanged excluding displayName'}));
 }catch(error){await c.query('ROLLBACK').catch(()=>{});throw error;}finally{await c.end();}
}
main().catch(e=>{console.error(e.message);process.exitCode=1;});
