import { useState, useRef } from "react";

const LOGO = "data:image/jpeg;base64,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";

const C = {
  white:   "#ffffff",
  gray50:  "#fafafa",
  gray100: "#f4f4f5",
  gray200: "#e4e4e7",
  gray300: "#d1d1d6",
  gray400: "#a1a1aa",
  gray500: "#71717a",
  gray600: "#52525b",
  gray700: "#3f3f46",
  gray800: "#27272a",
  gray900: "#18181b",
  accent:  "#2563eb",
  accentL: "#eff6ff",
};

const BASE_CURRENCIES = [
  { code:"PKR", sym:"PKR" }, { code:"USD", sym:"$"   }, { code:"EUR", sym:"€"   },
  { code:"GBP", sym:"£"   }, { code:"AED", sym:"AED" }, { code:"SAR", sym:"SAR" },
  { code:"CAD", sym:"CA$" }, { code:"AUD", sym:"A$"  },
];

const uid = () => Math.random().toString(36).slice(2,8);

const seed = [
  { id:uid(), type:"header",    name:"Website Layout Design",                         price:"19550", note:"Per hour · PKR 2,800" },
  { id:uid(), type:"included",  name:"Design System & Style Guide",                   price:"",      note:"" },
  { id:uid(), type:"included",  name:"Responsive Design (Desktop / Tablet / Mobile)", price:"",      note:"" },
  { id:uid(), type:"included",  name:"Developer Handoff Documentation",               price:"",      note:"" },
  { id:uid(), type:"deduction", name:"POC Amount",                                    price:"40000", note:"" },
];

const DEF = {
  agencyName:"XTARC", agencyEmail:"xtarcagency@gmail.com", founderLabel:"Founder",
  clientName:"XYZ Company", invoiceNo:"#10002",
  date:"01 Feb 2003", currency:"PKR", customCurrencies:[],
  signatureDataUrl:"", signatureMode:"line",
  total:"255000",
  notes:"All work is reviewed and verified by the client before final delivery.\nPOC amount has been deducted from the invoice total.",
  items: seed,
};

function fmtNum(v) {
  const n = parseFloat(String(v).replace(/,/g,""));
  if (isNaN(n)) return "—";
  return n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
}

function processSignature(dataUrl, cb) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const id = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      const brightness = (d[i]+d[i+1]+d[i+2])/3;
      if (brightness > 180) { d[i+3] = 0; }
      else { d[i]=Math.round(d[i]*0.15); d[i+1]=Math.round(d[i+1]*0.15); d[i+2]=Math.round(d[i+2]*0.15); }
    }
    ctx.putImageData(id, 0, 0);
    cb(canvas.toDataURL("image/png"));
  };
  img.src = dataUrl;
}

function Doc({ inv, allCurrencies }) {
  const cur = allCurrencies.find(c=>c.code===inv.currency)||allCurrencies[0];
  const sym = cur ? cur.sym : inv.currency;
  const PER = 8;
  const pages = [];
  for (let i=0; i<inv.items.length; i+=PER) pages.push(inv.items.slice(i,i+PER));
  if (!pages.length) pages.push([]);
  const colGrid = "1fr 136px";
  const TH = ({children, right}) => (
    <div style={{fontSize:"11px",fontWeight:600,color:C.gray400,letterSpacing:"0.07em",
      textTransform:"uppercase",textAlign:right?"right":"left"}}>{children}</div>
  );
  return (
    <div>
      {pages.map((rows, pi) => (
        <div key={pi} className="iv-page" style={{
          width:"794px", minHeight:"1123px", background:C.white,
          fontFamily:"'Inter',system-ui,sans-serif", color:C.gray900,
          padding:"72px 80px", boxSizing:"border-box",
          display:"flex", flexDirection:"column",
          marginBottom: pi<pages.length-1 ? "40px" : 0,
        }}>
          {pi===0 && <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"56px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                <img src={LOGO} alt="XTARC logo"
                  style={{height:"32px",width:"32px",objectFit:"contain",borderRadius:"4px"}}/>
                <span style={{fontSize:"15px",fontWeight:600,color:C.gray900,letterSpacing:"-0.1px"}}>{inv.agencyName}</span>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:"11px",color:C.gray400,fontWeight:500,marginBottom:"2px"}}>Contact</div>
                <div style={{fontSize:"13px",color:C.gray700}}>{inv.agencyEmail}</div>
              </div>
            </div>
            <div style={{height:"1px",background:C.gray200,marginBottom:"44px"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"60px"}}>
              <div>
                <div style={{fontSize:"11px",fontWeight:600,color:C.gray400,letterSpacing:"0.07em",
                  textTransform:"uppercase",marginBottom:"10px"}}>Billed To</div>
                <div style={{fontSize:"22px",fontWeight:700,color:C.gray900,letterSpacing:"-0.4px",lineHeight:1}}>{inv.clientName}</div>
              </div>
              <div style={{textAlign:"right",display:"grid",rowGap:"16px"}}>
                <div>
                  <div style={{fontSize:"11px",fontWeight:600,color:C.gray400,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:"3px"}}>Invoice</div>
                  <div style={{fontSize:"14px",fontWeight:700,color:C.gray900}}>{inv.invoiceNo}</div>
                </div>
                <div>
                  <div style={{fontSize:"11px",fontWeight:600,color:C.gray400,letterSpacing:"0.07em",textTransform:"uppercase",marginBottom:"3px"}}>Date</div>
                  <div style={{fontSize:"13px",color:C.gray700}}>{inv.date}</div>
                </div>
              </div>
            </div>
          </>}
          {pi>0 && (
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              marginBottom:"36px",paddingBottom:"16px",borderBottom:`1px solid ${C.gray200}`}}>
              <span style={{fontSize:"13px",color:C.gray500,fontWeight:500}}>{inv.agencyName} · {inv.clientName}</span>
              <span style={{fontSize:"12px",color:C.gray400}}>Page {pi+1} of {pages.length}</span>
            </div>
          )}
          <div style={{flex:1}}>
            <div style={{display:"grid",gridTemplateColumns:colGrid,
              paddingBottom:"10px",borderBottom:`1px solid ${C.gray200}`,marginBottom:"2px"}}>
              <TH>Description</TH><TH right>Amount</TH>
            </div>
            {rows.map(item => {
              if (item.type==="header") return (
                <div key={item.id} style={{display:"grid",gridTemplateColumns:colGrid,
                  padding:"18px 0 12px",borderBottom:`1px solid ${C.gray100}`}}>
                  <div>
                    <div style={{fontSize:"14px",fontWeight:600,color:C.gray900,marginBottom:item.note?"3px":0}}>{item.name}</div>
                    {item.note && <div style={{fontSize:"12px",color:C.gray400}}>{item.note}</div>}
                  </div>
                  <div style={{textAlign:"right",fontSize:"14px",fontWeight:600,color:C.gray900,paddingTop:"1px"}}>
                    {item.price ? `${sym} ${fmtNum(item.price)}` : ""}
                  </div>
                </div>
              );
              if (item.type==="included") return (
                <div key={item.id} style={{display:"grid",gridTemplateColumns:colGrid,
                  padding:"9px 0 9px 18px",borderBottom:`1px solid ${C.gray100}`}}>
                  <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <div style={{width:"3px",height:"3px",borderRadius:"50%",background:C.gray300,flexShrink:0}}/>
                    <span style={{fontSize:"13px",color:C.gray500}}>{item.name}</span>
                  </div>
                  <div style={{textAlign:"right",fontSize:"12px",color:C.gray400,fontWeight:500}}>Included</div>
                </div>
              );
              if (item.type==="deduction") return (
                <div key={item.id} style={{display:"grid",gridTemplateColumns:colGrid,
                  padding:"11px 0",borderBottom:`1px solid ${C.gray100}`}}>
                  <span style={{fontSize:"13px",color:C.gray600}}>{item.name}</span>
                  <span style={{textAlign:"right",fontSize:"13px",color:C.gray600}}>
                    {item.price ? `−${sym} ${fmtNum(item.price)}` : ""}
                  </span>
                </div>
              );
              return (
                <div key={item.id} style={{display:"grid",gridTemplateColumns:colGrid,
                  padding:"11px 0",borderBottom:`1px solid ${C.gray100}`}}>
                  <div>
                    <div style={{fontSize:"13px",color:C.gray700}}>{item.name}</div>
                    {item.note && <div style={{fontSize:"12px",color:C.gray400,marginTop:"2px"}}>{item.note}</div>}
                  </div>
                  <div style={{textAlign:"right",fontSize:"13px",color:C.gray700}}>
                    {item.price ? `${sym} ${fmtNum(item.price)}` : ""}
                  </div>
                </div>
              );
            })}
          </div>
          {pi===pages.length-1 && (
            <div style={{marginTop:"auto",paddingTop:"48px"}}>
              {inv.notes && (
                <div style={{marginBottom:"40px",paddingBottom:"32px",borderBottom:`1px solid ${C.gray200}`}}>
                  {inv.notes.split("\n").map((l,i)=>(
                    <p key={i} style={{fontSize:"12px",color:C.gray400,margin:"0 0 4px",lineHeight:1.6}}>{l}</p>
                  ))}
                </div>
              )}
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                <div>
                  {inv.signatureMode==="image" && inv.signatureDataUrl ? (
                    <img src={inv.signatureDataUrl} alt="sig"
                      style={{height:"52px",maxWidth:"160px",objectFit:"contain",display:"block",marginBottom:"8px"}}/>
                  ) : (
                    <div style={{width:"88px",height:"1px",background:C.gray300,marginBottom:"8px"}}/>
                  )}
                  <div style={{fontSize:"12px",color:C.gray500,fontWeight:500}}>{inv.founderLabel}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:"11px",fontWeight:600,color:C.gray400,letterSpacing:"0.07em",
                    textTransform:"uppercase",marginBottom:"6px"}}>Total Due</div>
                  <div style={{fontSize:"28px",fontWeight:700,color:C.gray900,letterSpacing:"-0.8px",lineHeight:1}}>
                    {sym} {fmtNum(inv.total)}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const iBase = {
  width:"100%", boxSizing:"border-box", padding:"7px 10px",
  border:`1px solid ${C.gray200}`, borderRadius:"6px",
  fontSize:"13px", color:C.gray900, background:C.white,
  outline:"none", fontFamily:"inherit", transition:"border-color 0.15s",
};
function Inp(props) {
  return <input {...props} style={{...iBase,...props.style}}
    onFocus={e=>e.target.style.borderColor=C.accent}
    onBlur={e=>e.target.style.borderColor=C.gray200}/>;
}
function Sel({value,onChange,children}) {
  return <select value={value} onChange={onChange}
    style={{...iBase,cursor:"pointer"}}
    onFocus={e=>e.target.style.borderColor=C.accent}
    onBlur={e=>e.target.style.borderColor=C.gray200}>{children}</select>;
}
function Area({value,onChange,rows=3}) {
  return <textarea value={value} onChange={onChange} rows={rows}
    style={{...iBase,resize:"vertical",lineHeight:1.6}}
    onFocus={e=>e.target.style.borderColor=C.accent}
    onBlur={e=>e.target.style.borderColor=C.gray200}/>;
}
const FL = ({label,children}) => (
  <div style={{marginBottom:"18px"}}>
    <div style={{fontSize:"11px",fontWeight:600,color:C.gray400,letterSpacing:"0.07em",
      textTransform:"uppercase",marginBottom:"5px"}}>{label}</div>
    {children}
  </div>
);
const SL = ({children}) => (
  <div style={{fontSize:"11px",fontWeight:600,color:C.gray400,letterSpacing:"0.07em",
    textTransform:"uppercase",margin:"28px 0 14px"}}>{children}</div>
);
const Hr = () => <div style={{height:"1px",background:C.gray100,margin:"6px 0 22px"}}/>;

const ITEM_META = {
  header:    {label:"Section",   accent:C.gray900},
  item:      {label:"Item",      accent:C.gray500},
  included:  {label:"Included",  accent:"#0891b2"},
  deduction: {label:"Deduction", accent:"#dc2626"},
};

function CurrencyModal({ onAdd, onClose }) {
  const [code, setCode] = useState("");
  const [sym,  setSym ] = useState("");
  const valid = code.trim().length > 0 && sym.trim().length > 0;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",zIndex:999,
      display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:C.white,borderRadius:"12px",padding:"28px",width:"340px",
        border:`1px solid ${C.gray200}`}}>
        <div style={{fontSize:"14px",fontWeight:600,color:C.gray900,marginBottom:"20px"}}>Add Custom Currency</div>
        <FL label="Currency Code (e.g. MYR, JPY)">
          <Inp value={code} onChange={e=>setCode(e.target.value.toUpperCase())} placeholder="MYR" maxLength={6}/>
        </FL>
        <FL label="Symbol (e.g. RM, ¥)">
          <Inp value={sym} onChange={e=>setSym(e.target.value)} placeholder="RM" maxLength={8}/>
        </FL>
        <div style={{display:"flex",gap:"8px",marginTop:"8px"}}>
          <button onClick={onClose} style={{flex:1,padding:"8px",border:`1px solid ${C.gray200}`,
            borderRadius:"6px",background:C.white,color:C.gray600,fontSize:"13px",cursor:"pointer",fontFamily:"inherit"}}>
            Cancel
          </button>
          <button disabled={!valid} onClick={()=>{if(valid) onAdd({code:code.trim(),sym:sym.trim()});}} style={{
            flex:1,padding:"8px",border:"none",borderRadius:"6px",
            background:valid?C.gray900:C.gray200,color:valid?C.white:C.gray400,
            fontSize:"13px",fontWeight:600,cursor:valid?"pointer":"default",fontFamily:"inherit",
          }}>Add</button>
        </div>
      </div>
    </div>
  );
}

function SignatureUploader({ inv, set }) {
  const fileRef = useRef();
  const [processing, setProcessing] = useState(false);
  const [dragOver,   setDragOver  ] = useState(false);
  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    setProcessing(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      processSignature(e.target.result, (clean) => {
        set("signatureDataUrl", clean);
        set("signatureMode", "image");
        setProcessing(false);
      });
    };
    reader.readAsDataURL(file);
  };
  const onDrop = (e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); };
  const clear = () => { set("signatureDataUrl",""); set("signatureMode","line"); };
  return (
    <div>
      <div style={{fontSize:"11px",fontWeight:600,color:C.gray400,letterSpacing:"0.07em",
        textTransform:"uppercase",marginBottom:"10px"}}>Signature</div>
      <div style={{display:"flex",gap:"6px",marginBottom:"12px"}}>
        {[{id:"line",label:"Line only"},{id:"image",label:"Upload image"}].map(m=>(
          <button key={m.id} onClick={()=>set("signatureMode",m.id)} style={{
            padding:"5px 12px",borderRadius:"5px",border:`1px solid ${inv.signatureMode===m.id?C.gray900:C.gray200}`,
            background:inv.signatureMode===m.id?C.gray900:C.white,
            color:inv.signatureMode===m.id?C.white:C.gray500,
            fontSize:"12px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s",
          }}>{m.label}</button>
        ))}
      </div>
      {inv.signatureMode==="image" && (
        <>
          {!inv.signatureDataUrl && (
            <div onDragOver={e=>{e.preventDefault();setDragOver(true)}}
              onDragLeave={()=>setDragOver(false)} onDrop={onDrop}
              onClick={()=>fileRef.current.click()}
              style={{border:`1.5px dashed ${dragOver?C.accent:C.gray300}`,borderRadius:"8px",
                padding:"24px 16px",textAlign:"center",cursor:"pointer",
                background:dragOver?C.accentL:C.gray50,transition:"all 0.15s"}}>
              {processing ? (
                <div style={{fontSize:"12px",color:C.gray400}}>Processing…</div>
              ) : (<>
                <div style={{fontSize:"22px",marginBottom:"6px"}}>✍️</div>
                <div style={{fontSize:"12px",fontWeight:500,color:C.gray600,marginBottom:"3px"}}>Drop signature image here</div>
                <div style={{fontSize:"11px",color:C.gray400}}>or click to browse · JPG, PNG, WEBP</div>
                <div style={{fontSize:"11px",color:C.gray400,marginTop:"6px"}}>White background is auto-removed</div>
              </>)}
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}}
                onChange={e=>handleFile(e.target.files[0])}/>
            </div>
          )}
          {inv.signatureDataUrl && (
            <div style={{border:`1px solid ${C.gray200}`,borderRadius:"8px",padding:"16px",
              background:C.gray50,position:"relative"}}>
              <div style={{fontSize:"11px",color:C.gray400,marginBottom:"8px",fontWeight:500}}>Preview</div>
              <div style={{background:C.white,padding:"12px 16px",borderRadius:"6px",
                border:`1px solid ${C.gray100}`,display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
                <div>
                  <img src={inv.signatureDataUrl} alt="sig"
                    style={{height:"44px",maxWidth:"140px",objectFit:"contain",display:"block",marginBottom:"6px"}}/>
                  <div style={{fontSize:"11px",color:C.gray500,fontWeight:500}}>{inv.founderLabel}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:"10px",color:C.gray400,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"3px"}}>Total Due</div>
                  <div style={{fontSize:"16px",fontWeight:700,color:C.gray900}}>PKR 255,000.00</div>
                </div>
              </div>
              <div style={{display:"flex",gap:"6px",marginTop:"10px"}}>
                <button onClick={()=>fileRef.current.click()} style={{flex:1,padding:"6px 10px",
                  border:`1px solid ${C.gray200}`,borderRadius:"6px",background:C.white,
                  color:C.gray600,fontSize:"12px",cursor:"pointer",fontFamily:"inherit"}}>Replace</button>
                <button onClick={clear} style={{padding:"6px 10px",border:"1px solid #fecaca",
                  borderRadius:"6px",background:C.white,color:"#dc2626",fontSize:"12px",
                  cursor:"pointer",fontFamily:"inherit"}}>Remove</button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}}
                onChange={e=>handleFile(e.target.files[0])}/>
            </div>
          )}
        </>
      )}
      {inv.signatureMode==="line" && (
        <div style={{fontSize:"12px",color:C.gray400,lineHeight:1.6,padding:"10px 0"}}>
          A clean horizontal line will appear above the signatory name.
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [inv, setInv]   = useState(DEF);
  const [tab, setTab]   = useState("details");
  const [showCurrModal, setShowCurrModal] = useState(false);
  const allCurrencies = [...BASE_CURRENCIES, ...inv.customCurrencies];
  const set = (k,v) => setInv(p=>({...p,[k]:v}));
  const addItem = type => setInv(p=>({...p,items:[...p.items,{id:uid(),type,name:"",price:"",note:""}]}));
  const upd = (id,k,v) => setInv(p=>({...p,items:p.items.map(it=>it.id===id?{...it,[k]:v}:it)}));
  const del = id => setInv(p=>({...p,items:p.items.filter(it=>it.id!==id)}));
  const mv  = (id,d) => setInv(p=>{
    const a=[...p.items], i=a.findIndex(x=>x.id===id), j=i+d;
    if(j<0||j>=a.length) return p;
    [a[i],a[j]]=[a[j],a[i]]; return {...p,items:a};
  });
  const addCustomCurrency = ({code,sym}) => {
    if (allCurrencies.find(c=>c.code===code)) { setShowCurrModal(false); return; }
    setInv(p=>({...p,customCurrencies:[...p.customCurrencies,{code,sym}],currency:code}));
    setShowCurrModal(false);
  };
  const print = () => {
    const el=document.getElementById("__pr__");
    if(!el) return;
    // Show the hidden invoice
    el.style.display="block";
    // Inject print styles
    const s=document.createElement("style");
    s.id="xtarc-print-style";
    s.textContent=`
      @media print {
        body > * { display: none !important; }
        #__pr__ { display: block !important; }
        #__pr__ .iv-page {
          page-break-after: always;
          box-shadow: none !important;
          margin: 0 !important;
          width: 100% !important;
        }
      }
    `;
    document.head.appendChild(s);
    // Wait for DOM to paint before printing
    setTimeout(() => {
      window.print();
      // Cleanup after print dialog closes
      setTimeout(() => {
        el.style.display="none";
        const existing = document.getElementById("xtarc-print-style");
        if(existing) document.head.removeChild(existing);
      }, 1000);
    }, 300);
  };
  const Tab = ({id,label}) => (
    <button onClick={()=>setTab(id)} style={{
      padding:"5px 14px",borderRadius:"5px",border:"none",
      background:tab===id?C.gray900:"transparent",
      color:tab===id?C.white:C.gray500,
      fontSize:"13px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",transition:"all 0.12s",
    }}>{label}</button>
  );
  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`*{box-sizing:border-box}body{margin:0;background:${C.gray100}}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:${C.gray300};border-radius:2px}`}
      </style>
      <div id="__pr__" style={{display:"none"}}><Doc inv={inv} allCurrencies={allCurrencies}/></div>
      {showCurrModal && <CurrencyModal onAdd={addCustomCurrency} onClose={()=>setShowCurrModal(false)}/>}
      <div style={{fontFamily:"'Inter',system-ui,sans-serif",minHeight:"100vh",background:C.gray100}}>
        <div style={{height:"50px",background:C.white,borderBottom:`1px solid ${C.gray200}`,
          display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"0 24px",position:"sticky",top:0,zIndex:200}}>
          <div style={{display:"flex",alignItems:"center",gap:"20px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <img src={LOGO} alt="XTARC" style={{height:"24px",width:"24px",objectFit:"contain",borderRadius:"4px"}}/>
              <span style={{fontSize:"13px",fontWeight:600,color:C.gray900}}>Invoice Builder</span>
            </div>
            <div style={{width:"1px",height:"14px",background:C.gray200}}/>
            <nav style={{display:"flex",gap:"2px"}}>
              <Tab id="details" label="Details"/>
              <Tab id="items"   label="Items"/>
              <Tab id="preview" label="Preview"/>
            </nav>
          </div>
          <button onClick={print} style={{padding:"6px 16px",background:C.gray900,color:C.white,
            border:"none",borderRadius:"6px",fontSize:"12px",fontWeight:600,
            cursor:"pointer",fontFamily:"inherit",letterSpacing:"0.02em"}}>Export PDF</button>
        </div>
        <div style={{maxWidth:"1280px",margin:"0 auto",padding:"28px 24px",
          display:"flex",gap:"28px",alignItems:"flex-start"}}>
          <div style={{width:"348px",flexShrink:0,background:C.white,
            border:`1px solid ${C.gray200}`,borderRadius:"10px",padding:"22px",
            position:"sticky",top:"70px",maxHeight:"calc(100vh - 94px)",overflowY:"auto"}}>
            {tab==="details" && <>
              <SL>Agency</SL>
              <FL label="Agency Name"><Inp value={inv.agencyName} onChange={e=>set("agencyName",e.target.value)}/></FL>
              <FL label="Email"><Inp value={inv.agencyEmail} onChange={e=>set("agencyEmail",e.target.value)}/></FL>
              <FL label="Signatory Name"><Inp value={inv.founderLabel} onChange={e=>set("founderLabel",e.target.value)}/></FL>
              <Hr/>
              <SL>Signature</SL>
              <SignatureUploader inv={inv} set={set}/>
              <Hr/>
              <SL>Client</SL>
              <FL label="Client Name"><Inp value={inv.clientName} onChange={e=>set("clientName",e.target.value)}/></FL>
              <FL label="Invoice No."><Inp value={inv.invoiceNo} onChange={e=>set("invoiceNo",e.target.value)}/></FL>
              <FL label="Date"><Inp value={inv.date} onChange={e=>set("date",e.target.value)}/></FL>
              <Hr/>
              <SL>Invoice</SL>
              <FL label="Currency">
                <div style={{display:"flex",gap:"6px"}}>
                  <Sel value={inv.currency} onChange={e=>set("currency",e.target.value)}>
                    {allCurrencies.map(c=>(<option key={c.code} value={c.code}>{c.sym} · {c.code}</option>))}
                  </Sel>
                  <button onClick={()=>setShowCurrModal(true)} title="Add custom currency" style={{
                    flexShrink:0,padding:"7px 10px",border:`1px solid ${C.gray200}`,
                    borderRadius:"6px",background:C.white,color:C.gray500,
                    fontSize:"13px",cursor:"pointer",fontFamily:"inherit",transition:"border-color 0.12s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=C.gray400}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=C.gray200}>+</button>
                </div>
                {inv.customCurrencies.length>0 && (
                  <div style={{marginTop:"6px",fontSize:"11px",color:C.gray400}}>
                    Custom: {inv.customCurrencies.map(c=>c.code).join(", ")}
                  </div>
                )}
              </FL>
              <FL label="Total Amount"><Inp type="number" value={inv.total} onChange={e=>set("total",e.target.value)}/></FL>
              <FL label="Footer Notes"><Area value={inv.notes} onChange={e=>set("notes",e.target.value)} rows={4}/></FL>
            </>}
            {tab==="items" && <>
              <div style={{fontSize:"12px",color:C.gray400,marginBottom:"14px",lineHeight:1.5}}>Build your invoice line by line.</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px",marginBottom:"18px"}}>
                {[{type:"header",label:"+ Section"},{type:"item",label:"+ Item"},
                  {type:"included",label:"+ Included"},{type:"deduction",label:"+ Deduction"}
                ].map(({type,label})=>(
                  <button key={type} onClick={()=>addItem(type)} style={{
                    padding:"7px 8px",border:`1px solid ${C.gray200}`,borderRadius:"6px",
                    background:C.white,color:C.gray700,fontSize:"12px",fontWeight:500,
                    cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"border-color 0.12s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=C.gray400}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=C.gray200}
                  >{label}</button>
                ))}
              </div>
              <div style={{height:"1px",background:C.gray100,marginBottom:"16px"}}/>
              {inv.items.length===0 && (
                <div style={{textAlign:"center",padding:"40px 0",color:C.gray400,fontSize:"13px"}}>No items yet</div>
              )}
              {inv.items.map((item)=>{
                const m = ITEM_META[item.type];
                return (
                  <div key={item.id} style={{border:`1px solid ${C.gray100}`,borderRadius:"8px",
                    padding:"11px",marginBottom:"8px",background:C.gray50}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"8px"}}>
                      <span style={{fontSize:"10px",fontWeight:600,color:m.accent,
                        letterSpacing:"0.07em",textTransform:"uppercase"}}>{m.label}</span>
                      <div style={{display:"flex",gap:"3px"}}>
                        {["↑","↓"].map((a,di)=>(
                          <button key={a} onClick={()=>mv(item.id,di===0?-1:1)} style={{
                            background:"none",border:`1px solid ${C.gray200}`,borderRadius:"4px",
                            cursor:"pointer",padding:"1px 6px",fontSize:"10px",color:C.gray500}}>{a}</button>
                        ))}
                        <button onClick={()=>del(item.id)} style={{
                          background:"none",border:"1px solid #fecaca",borderRadius:"4px",
                          cursor:"pointer",padding:"1px 6px",fontSize:"10px",color:"#dc2626"}}>×</button>
                      </div>
                    </div>
                    <Inp placeholder="Description" value={item.name}
                      onChange={e=>upd(item.id,"name",e.target.value)}
                      style={{marginBottom:"6px",fontWeight:item.type==="header"?600:400}}/>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>
                      <Inp placeholder="Amount" type={item.type==="included"?"text":"number"}
                        value={item.price} onChange={e=>upd(item.id,"price",e.target.value)}
                        disabled={item.type==="included"} style={{opacity:item.type==="included"?0.35:1}}/>
                      <Inp placeholder="Note" value={item.note} onChange={e=>upd(item.id,"note",e.target.value)}/>
                    </div>
                  </div>
                );
              })}
            </>}
            {tab==="preview" && (
              <div style={{color:C.gray400,fontSize:"13px",lineHeight:1.7}}>
                <p style={{margin:"0 0 10px"}}>Live preview is on the right.</p>
                <p style={{margin:"0 0 10px"}}>Hit <strong style={{color:C.gray700}}>Export PDF</strong> to print or save.</p>
                <p style={{margin:0}}>Auto-paginates every 8 items.</p>
              </div>
            )}
          </div>
          <div style={{flex:1,overflowX:"auto"}}>
            <div style={{transform:"scale(0.86)",transformOrigin:"top left",width:"calc(100% / 0.86)"}}>
              <Doc inv={inv} allCurrencies={allCurrencies}/>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}