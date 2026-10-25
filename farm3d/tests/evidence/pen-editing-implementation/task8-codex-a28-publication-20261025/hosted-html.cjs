const assert=require('node:assert/strict');
const normalize=s=>s.replace(/\br:'[0-9a-f]{16}'/,"r:'REQUEST'").replace(/\bt:'[A-Za-z0-9+/=]+'/,"t:'TIME'");
exports.originalHtml=function(actual,expected,template){
 const a=actual.toString('utf8'),b=expected.toString('utf8');if(a===b)return actual;
 const i=b.lastIndexOf('</body>'),j=a.lastIndexOf('</body>');assert(i>=0&&j>=i);
 assert.equal(a.slice(0,i),b.slice(0,i),'original HTML prefix exact');assert.equal(a.slice(j),b.slice(i),'original HTML suffix exact');
 assert.equal(normalize(a.slice(i,j)),normalize(template),'only the captured Cloudflare JSD insertion; request/time fields may vary');
 return Buffer.from(a.slice(0,i)+a.slice(j));
};
