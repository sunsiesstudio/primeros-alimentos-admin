/* Comedor público en tiempo real.
   Cada vez que una familia guarda algo (users/{uid}), se recalculan solo sus comidas de hoy
   y se actualizan en publico/comedor. Mismo formato y mismas claves que el admin.
   Anónimo: sin nombres, ids ni fechas de nacimiento; respeta noStats y cuentas familiares. */
const {onDocumentWritten}=require("firebase-functions/v2/firestore");
const {initializeApp}=require("firebase-admin/app");
const {getFirestore,FieldValue}=require("firebase-admin/firestore");
initializeApp();
const db=getFirestore();

const PUB_CAT=new Set(["Aguacate aplastado con huevo duro", "Albóndigas de ternera con zanahoria", "Alubias blancas con verduras", "Boniato asado con huevo duro", "Cordero estofado con patatas", "Crema de brócoli y patata", "Crema de calabacín y patata", "Crema de calabaza con pollo", "Crema de calabaza y zanahoria", "Cuscús con verduras", "Ensaladilla suave de patata, zanahoria y huevo", "Gachas de avena con pera asada y canela", "Gachas de avena con plátano", "Gachas de avena con plátano aplastado", "Garbanzos con calabaza", "Guiso de pavo con patata y zanahoria", "Hamburguesas caseras con boniato asado", "Hamburguesas de lentejas", "Hummus con bastones de verdura", "Hummus suave de aguacate", "Lentejas estofadas con zanahoria", "Menestra de verduras", "Merluza al horno con patata y calabacín", "Merluza con patata y calabacín", "Mousse de aguacate y plátano", "Pasta con brócoli", "Pasta con verduras y pollo", "Pera asada con canela", "Pollo al horno con patatas y zanahorias", "Quinoa con verduras", "Salmón al horno con brócoli", "Salteado de tofu con verduras", "Sopa de pescado con verduras", "Tortilla de calabacín", "Tortilla de patata", "Tortilla francesa", "Tortitas de plátano y avena", "Tostada con aguacate", "Tostada con aguacate y huevo hervido aplastado", "Tostada con queso fresco", "Tostadas de aguacate con huevo duro", "Yogur con plátano aplastado", "Yogur con plátano y avena"]);
const PUB_ML={"Desayuno":"Desayuno","Media mañana":"Desayuno","Comida":"Comida","Merienda":"Merienda","Cena":"Cena"};
const pubDay=d=>new Intl.DateTimeFormat("sv-SE",{timeZone:"Europe/Madrid"}).format(d);
const pubH=s=>{let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
function pubTex(b,mo,name){const n=(name||"").toLowerCase(),sty=((b.prefs||{}).sty)||"";
  if(sty==="blw"||sty==="mix")return "Trozos";
  if(sty==="pure"||/crema|puré|pure|papilla|gachas|porridge|sopa/.test(n))return "Puré";
  if(/aplastad|chafad|mousse|hummus|yogur/.test(n))return "Grumos";
  return mo<7?"Puré":mo<9?"Grumos":"Trozos"}
function pubRate(v,ls){const all=[(v&&v.r)||"",...ls.map(l=>l.r)];if(all.includes("react"))return null;
  const p=(v&&v.r)||ls.map(l=>l.r).find(x=>x&&x!=="pre")||"ok";return p==="love"?"love":p==="ok"?"like":"meh"}
function pubItems(users,day){const out=[];
  users.filter(u=>u&&!u.noStats&&!u.fam).forEach(u=>(Array.isArray(u.babies)?u.babies:[]).forEach((b,bi)=>{
    if(!b||!b.bd)return;const ml=(b.ml||{})[day],ov=(b.ov||{})[day]||{};if(!ml||typeof ml!=="object")return;
    const mo=Math.floor((new Date(day+"T12:00")-new Date(b.bd+"T12:00"))/2629800000);if(!(mo>=4&&mo<=36))return;
    const log=(Array.isArray(b.log)?b.log:[]).filter(l=>l&&l.f&&l.d&&!l.pre),first={};log.forEach(l=>{if(!first[l.f]||l.d<first[l.f])first[l.f]=l.d});
    Object.entries(ml).forEach(([m,v])=>{const meal=PUB_ML[m];if(!meal||!v||v.d!==true)return;
      const ls=log.filter(l=>l.d===day&&l.ml===m),o=ov[m]||{};
      const ings=[...new Set((Array.isArray(o.i)&&o.i.length?o.i:ls.map(l=>l.f)).filter(x=>typeof x==="string"))].slice(0,6);if(!ings.length)return;
      const r=pubRate(v,ls);if(!r)return;
      const nm=(typeof o.n==="string"&&!o.a&&PUB_CAT.has(o.n.trim()))?o.n.trim():ings.length===1?ings[0]:[ings[0],...ings.slice(1).map(x=>x.toLowerCase())].slice(0,-1).join(", ")+" y "+ings.at(-1).toLowerCase();
      out.push({k:pubH(day+"|"+(u.__id||"")+"|"+bi+"|"+m),u:pubH(day+"|"+(u.__id||"")),b:pubH(day+"|"+(u.__id||"")+"|"+bi),ml:meal,m:mo,dish:nm,ings,tex:pubTex(b,mo,nm),r,nw:ings.some(f=>first[f]===day)?1:0})})}));
  return out}

const yesterdayOf=day=>{const d=new Date(day+"T12:00:00Z");d.setUTCDate(d.getUTCDate()-1);return d.toISOString().slice(0,10)};

// Cambia la región si tu base de datos de Firestore está en otra (Firestore > Configuración > Ubicación).
exports.comedor=onDocumentWritten({document:"users/{uid}",region:"europe-west1"},async ev=>{
  const uid=ev.params.uid,after=ev.data&&ev.data.after&&ev.data.after.exists?ev.data.after.data():null;
  const day=pubDay(new Date()),u=pubH(day+"|"+uid);
  const mine=after?pubItems([{...after,__id:uid}],day):[];
  const ref=db.doc("publico/comedor");
  await db.runTransaction(async t=>{
    const snap=await t.get(ref),d=snap.exists?snap.data():{};
    let items=Array.isArray(d.items)?d.items:[],ayer=typeof d.ayer==="number"?d.ayer:0;
    if(d.day!==day){ayer=d.day===yesterdayOf(day)?new Set(items.map(i=>i.b||i.k)).size:0;items=[]}
    const before=JSON.stringify(items.filter(i=>i.u===u));
    if(d.day===day&&before===JSON.stringify(mine))return;
    items=items.filter(i=>i.u!==u).concat(mine);
    t.set(ref,{day,items,n:items.length,ayer,at:FieldValue.serverTimestamp()});
  });
});
