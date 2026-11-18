const fs=require('node:fs'); const path=require('node:path'); const {spawnSync}=require('node:child_process');
fs.mkdirSync('tmp',{recursive:true});
let schema=fs.readFileSync('prisma/schema.prisma','utf8').replace(/\r\n/g,'\n');
schema=schema.replace('  role          String @default("USER")\n','');
for(const name of ['certificationMarking','certificationReference','certificationVerifiedAt','shareTokenHash','shareExpiresAt','customerSnapshot','gstMode','advanceApplied','unpaidWagesForward'])schema=schema.replace(new RegExp('^  '+name+' .*\\n','m'),'');
schema=schema.replace(/\nmodel (RateLimit|SubmissionLimit|WebsiteEnquiry|EmailOutbox) \{[\s\S]*?\n\}/g,'');
fs.writeFileSync('tmp/pre-system-integrity.prisma',schema);
const result=spawnSync(process.execPath,[path.resolve('node_modules/prisma/build/index.js'),'migrate','diff','--from-empty','--to-schema','tmp/pre-system-integrity.prisma','--script','--output','tmp/pre-system-integrity.sql'],{stdio:'inherit',env:{...process.env,DATABASE_URL:process.env.DATABASE_URL||process.env.TEST_DATABASE_URL||'postgresql://test:test@localhost:5432/test'}});
process.exitCode=result.status??1;
