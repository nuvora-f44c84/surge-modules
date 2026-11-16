const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const code = fs.readFileSync(path.join(__dirname,'../src/cf-autorank/premium-route.js'),'utf8');
async function simulate(outcomes, fallback='REJECT') {
  let pick='example A', saved=null;
  const probes=[], actions=[];
  const options=[fallback,'example A','example B'];
  const nodes=['example A','example B','DIRECT'].map((name,index)=>({name,group:'pool',identifier:'POLICY::' + index}));
  const env={
    $argument:'pool|verified|' + fallback, $network:{v4:{primaryInterface:'mock'}},
    $surge:{selectGroupDetails:()=>({groups:{verified:options},decisions:{verified:pick}}),
      setSelectGroupPolicy:(g,n)=>{assert.equal(g,'verified');assert.ok(options.includes(n));actions.push(n);pick=n;return true;}},
    $persistentStore:{read:()=>saved,write:value=>{saved=value;return true;}},
    $httpAPI:(m,p,q,cb)=>cb({'external-policies':[...nodes,{name:'example A',group:'unrelated',identifier:'POLICY::bad'}]}),
    $httpClient:{get:(req,cb)=>{probes.push(req.policy);assert.equal(req['auto-cookie'],false);
      assert.equal(req['auto-redirect'],false);cb(null,{status:200},outcomes.shift());}},
    CFYouTubePremium:{classify:r=>({status:r.data?'available':'unknown',region:r.data})},
    console:{log(){}}, $done(){}
  };
  await vm.runInNewContext(code,env);
  return {pick,probes,actions,saved:JSON.parse(saved)};
}
test('chooses a specific external node only after two matching positive checks',async ()=>{
  const r=await simulate([null,'US','US']);
  assert.deepEqual(r.probes,['POLICY::0','POLICY::1','POLICY::1']);
  assert.deepEqual(r.actions,['REJECT','example B']);assert.equal(r.saved.last,'example B');
});
for(const fallback of ['REJECT','pool']) test('uses '+fallback+' after inconclusive or inconsistent results',async ()=>{
  const r=await simulate(['US','CA',null],fallback);assert.deepEqual(r.actions,[fallback]);assert.equal(r.pick,fallback);
});
