import fs from 'node:fs/promises';
import {mergeCourseListings,courseScore} from '../../src/utils/educationCatalog.js';
const read=async name=>JSON.parse(await fs.readFile(new URL('../../src/data/education/'+name+'.json',import.meta.url),'utf8'));
const [discovered,curated,unavailable,registry,coverage]=await Promise.all(['discoveredCourses','courses','unavailableCourses','providers','coverage'].map(read));
const courses=mergeCourseListings(discovered,curated,unavailable);
const age=date=>date?Math.floor((Date.now()-Date.parse(date))/86400000):null;
const report={generatedAt:new Date().toISOString(),listings:courses.length,providers:registry.providers.length,checked:curated.length,evaluated:courses.filter(c=>courseScore(c)!==null).length,
 staleFacts:curated.filter(c=>age(c.reviewedOn)>180).map(c=>({id:c.id,title:c.title,reviewedOn:c.reviewedOn})),
 providersNeedingAttention:coverage.filter(c=>c.status==='blocked'||c.errors?.length||c.apiPaginationPending||c.catalogPaginationPending).map(c=>({providerId:c.providerId,status:c.status,errors:c.errors,paginationPending:Boolean(c.apiPaginationPending||c.catalogPaginationPending)})),
 missingFacts:{hours:courses.filter(c=>c.contactHours==null).length,audience:courses.filter(c=>!c.disciplines?.length).length,level:courses.filter(c=>!c.level&&!c.providerFacts?.level).length}};
await fs.mkdir(new URL('../../artifacts/catalog/',import.meta.url),{recursive:true});
await fs.writeFile(new URL('../../artifacts/catalog/maintenance-summary.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({listings:report.listings,providers:report.providers,checked:report.checked,evaluated:report.evaluated,providersNeedingAttention:report.providersNeedingAttention.length}));
