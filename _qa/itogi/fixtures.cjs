const H=require('../c31/harness.cjs');
const defaults={results:true,attention:false,bonus:true,staff:true,top:false},KEY='omoti_anikina_stats_sections_v1';
const base={ok:true,totals:{mochiQty:651,salesAmount:120345,cashReceived:14960,yandexQty:20},staff:[{seller:'Ярмарка',qty:599},{seller:'Евгений',qty:33},{seller:'Марина',qty:11,selfDeduct:2530,selfUnpaidQty:25},{seller:'Анна',qty:8},{seller:'Людмила',qty:0}],topFlavors:[['Дубайский шоколад',68],['Мята шоколад',54],['Сникерс',49],['Банан- Нутелла',41],['Трюфель',41],['Сливочный лимон',36],['Твикс',36],['Бабл Гам',35]].map(([name,qty])=>({name,qty})),payments:[],defects:[{name:'Сникерс',qty:10},{name:'Дубайский шоколад',qty:6},{name:'Клубника',qty:6},...H.catalog.filter(n=>!['Сникерс','Дубайский шоколад','Клубника'].includes(n)).slice(0,19).map((name,i)=>({name,qty:i===0?46:1}))],loyaltySummary:{cardChecks:79,spentMinor:103500,earnedMinor:274400,pendingCount:0,activity:{changesCount:1,cancelledCount:1,spentAdjustmentMinor:0,earnedAdjustmentMinor:-900}}};
function fixture(preset='default'){
 const summary=JSON.parse(JSON.stringify(base)),open={...defaults};let scroll=0,period='week',index=1,sheet=false;
 if(preset==='all-closed')for(const k of Object.keys(open))open[k]=false;
 if(preset==='all-open')for(const k of Object.keys(open))open[k]=true;
 if(preset==='attention-open'||preset==='debtors'){open.attention=true;scroll=150;}
 if(preset==='mid-open')scroll=330;
 if(preset==='mid-closed'){open.bonus=false;open.staff=false;open.top=true;scroll=40;}
 if(preset==='top-open'){open.top=true;scroll=1e6;}
 if(preset==='period')sheet=true;
 if(preset==='current')index=0;
 if(preset==='month'){period='month';index=1;}
 if(preset==='all-time')period='all';
 if(preset==='no-problems'||preset==='empty'){summary.defects=[];summary.staff.forEach(x=>{delete x.selfDeduct;delete x.selfUnpaidQty;});}
 if(preset==='only-brak')summary.staff.forEach(x=>{delete x.selfDeduct;delete x.selfUnpaidQty;});
 if(preset==='debtors')Object.assign(summary.staff[4],{selfDeduct:400,selfUnpaidQty:4});
 if(preset==='bonus-unknown'){summary.loyaltySummary={cardChecks:null,spentMinor:null,earnedMinor:null,incompleteChecks:1,pendingCount:0};scroll=300;}
 if(preset==='bonus-pending'){summary.loyaltySummary.pendingCount=2;delete summary.loyaltySummary.activity;scroll=300;}
 if(preset==='mooncakes')summary.totals.mooncakeQty=12;
 if(preset==='empty'){summary.totals={mochiQty:0,salesAmount:0,cashReceived:0,yandexQty:0};summary.staff=[];summary.topFlavors=[];summary.loyaltySummary={cardChecks:0,spentMinor:0,earnedMinor:0,pendingCount:0};}
 return {summary,open,scroll,period,index,sheet};
}
async function context(browser,url,width=390,height=844,{preset='default',seedSections=true,summary:override,mode='',...opts}={}){
 const f=fixture(preset),other={...opts.storage},seed=Object.hasOwn(other,KEY)?other[KEY]:seedSections?f.open:undefined;delete other[KEY];const t=await H.context(browser,url,width,height,{...opts,storage:other});let summary=override||f.summary,kind=mode;
 if(seed!==undefined)await t.ctx.addInitScript(({key,value})=>{if(localStorage.getItem(key)===null)localStorage.setItem(key,typeof value==='string'?value:JSON.stringify(value));},{key:KEY,value:seed});
 await t.ctx.route('**/b2c-api/b2c/cashier/anikina/summary*',async r=>{if(kind==='error')return r.abort('connectionreset');if(kind==='loading')await new Promise(resolve=>setTimeout(resolve,8000));return r.fulfill({contentType:'application/json',body:JSON.stringify(summary)});});
 return {...t,fixture:f,setSummary(x){summary=x;},setStatsMode(x){kind=x;}};
}
async function enter(t,url,{ios=false,usePeriod=true}={}){const p=t.page;await p.goto(url);await p.waitForFunction(()=>window.C31UI&&promotionConfig);await p.evaluate(()=>document.fonts.ready);if(ios)await p.addStyleTag({content:':root{--k-safe-t:59px!important;--k-safe-b:34px!important}'});await p.evaluate(()=>switchTab('stats'));await p.waitForFunction(()=>document.getElementById('stats-content').style.display==='block');if(usePeriod){await p.evaluate(({period,index})=>{if(period==='all')selectAll();else if(period==='month')selectMonth(index);else selectWeek(index);},t.fixture);await p.waitForFunction(()=>document.getElementById('stats-content').style.display==='block');}}
module.exports={H,defaults,KEY,base,fixture,context,enter};
