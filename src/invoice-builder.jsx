import { useState, useRef, useEffect, useCallback } from "react";

/* ─── TOKENS ────────────────────────────────────────────────────────────── */
const C = {
  white:"#ffffff", gray50:"#fafafa", gray100:"#f4f4f5", gray200:"#e4e4e7",
  gray300:"#d1d1d6", gray400:"#a1a1aa", gray500:"#71717a", gray600:"#52525b",
  gray700:"#3f3f46", gray800:"#27272a", gray900:"#18181b",
  accent:"#2563eb", accentL:"#eff6ff",
};

const BASE_CURRENCIES = [
  {code:"PKR",sym:"PKR"},{code:"USD",sym:"$"},{code:"EUR",sym:"€"},
  {code:"GBP",sym:"£"},{code:"AED",sym:"AED"},{code:"SAR",sym:"SAR"},
  {code:"CAD",sym:"CA$"},{code:"AUD",sym:"A$"},
];

const ITEMS_PER_PAGE = 8;
const uid = () => Math.random().toString(36).slice(2,8);
const mkItem = (type="item") => ({
  id:uid(), type, name:"", note:"", hours:"", rate:"", price:"",
  bold:false, italic:false, includedLabel:"Included",
});

/* ─── HELPERS ───────────────────────────────────────────────────────────── */
function fmtNum(v) {
  const n = parseFloat(String(v||"").replace(/,/g,""));
  if (isNaN(n)) return "";
  return n.toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
}

function computePrice(item) {
  if (item.type==="included") return null;
  if (item.hours && item.rate) {
    const h=parseFloat(item.hours), r=parseFloat(item.rate);
    if (!isNaN(h) && !isNaN(r)) return (h*r).toFixed(2);
  }
  return item.price||"";
}

function calcGrandTotal(inv) {
  const sub = inv.items.reduce((acc,item) => {
    if (item.type==="included") return acc;
    const p = parseFloat(computePrice(item)||"0");
    if (isNaN(p)) return acc;
    return item.type==="deduction" ? acc-p : acc+p;
  }, 0);
  const tax  = inv.taxRate      ? sub*(parseFloat(inv.taxRate)/100)      : 0;
  const disc = inv.discountRate ? sub*(parseFloat(inv.discountRate)/100) : 0;
  if (inv.total && inv.total !== "")
    return { grand:parseFloat(inv.total), sub, tax, disc, override:true };
  return { grand:sub+tax-disc, sub, tax, disc, override:false };
}

/* ─── UNDO ──────────────────────────────────────────────────────────────── */
function useUndoable(init) {
  const [stack, setStack] = useState([init]);
  const [idx,   setIdx]   = useState(0);
  const state   = stack[idx];
  const canUndo = idx > 0;
  const canRedo = idx < stack.length - 1;
  const set = useCallback(u => {
    setStack(prev => {
      const next = typeof u === "function" ? u(prev[idx]) : u;
      const ns = [...prev.slice(0,idx+1), next].slice(-40);
      setIdx(ns.length - 1);
      return ns;
    });
  }, [idx]);
  const undo = useCallback(() => { if (canUndo) setIdx(i=>i-1); }, [canUndo]);
  const redo = useCallback(() => { if (canRedo) setIdx(i=>i+1); }, [canRedo]);
  return [state, set, undo, redo, canUndo, canRedo];
}

/* ─── INLINE EDITABLE ───────────────────────────────────────────────────── */
function Editable({ value, onChange, placeholder, style, multiline, onEnter, onTab }) {
  const [editing, setEditing] = useState(false);
  const [local,   setLocal]   = useState(value);
  const ref = useRef(null);

  useEffect(() => { if (!editing) setLocal(value); }, [value, editing]);
  useEffect(() => {
    if (editing && ref.current) {
      ref.current.focus();
      try { ref.current.select(); } catch(e) {}
    }
  }, [editing]);

  const commit = () => { setEditing(false); if (local !== value) onChange(local); };
  const handleKey = e => {
    if (e.key==="Escape")            { setLocal(value); setEditing(false); return; }
    if (e.key==="Enter" && !multiline) { e.preventDefault(); commit(); onEnter&&onEnter(); return; }
    if (e.key==="Tab")               { e.preventDefault(); commit(); onTab&&onTab(); }
  };

  const base = {
    background:C.white, border:`1px solid ${C.gray300}`, outline:"none",
    width:"100%", fontFamily:"inherit", padding:"6px 8px", margin:0,
    fontSize:"inherit", color:"inherit", fontWeight:"inherit",
    fontStyle:"inherit", resize:"none", lineHeight:"inherit",
    letterSpacing:"inherit", borderRadius:"6px",
    boxShadow:"inset 0 1px 0 rgba(255,255,255,0.25)", ...style,
  };

  if (editing) {
    if (multiline) return (
      <textarea ref={ref} value={local} rows={2}
        style={{...base, resize:"none", overflow:"hidden"}}
        onChange={e=>setLocal(e.target.value)} onBlur={commit} onKeyDown={handleKey}/>
    );
    return (
      <input ref={ref} value={local} style={base}
        onChange={e=>setLocal(e.target.value)} onBlur={commit} onKeyDown={handleKey}/>
    );
  }

  return (
    <div onClick={()=>setEditing(true)} className="editable-field"
      style={{
        cursor:"text", minWidth:"30px", minHeight:"1.2em",
        borderRadius:"6px",
        border:`1px solid ${C.gray300}`,
        background:C.white,
        transition:"border-color 0.15s, background 0.15s, box-shadow 0.15s",
        padding:"6px 8px",
        boxShadow:"inset 0 1px 0 rgba(255,255,255,0.25)",
        ...style,
      }}
      onMouseEnter={e=>{ e.currentTarget.style.borderColor=C.accent; e.currentTarget.style.background=C.accentL; e.currentTarget.style.boxShadow=`0 0 0 3px rgba(37,99,235,0.08)`; }}
      onMouseLeave={e=>{ e.currentTarget.style.borderColor=C.gray300; e.currentTarget.style.background=C.white; e.currentTarget.style.boxShadow="inset 0 1px 0 rgba(255,255,255,0.25)"; }}>
      {local || <span className="edit-placeholder" style={{opacity:0.35,fontWeight:400,fontStyle:"normal",color:C.gray400}}>{placeholder}</span>}
    </div>
  );
}

/* ─── SIGNATURE TOOLS ───────────────────────────────────────────────────── */
function processSignatureImg(dataUrl, cb) {
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width=img.width; c.height=img.height;
    const ctx=c.getContext("2d"); ctx.drawImage(img,0,0);
    const id=ctx.getImageData(0,0,c.width,c.height); const d=id.data;
    for (let i=0;i<d.length;i+=4) {
      const b=(d[i]+d[i+1]+d[i+2])/3;
      if (b>200) { d[i+3]=0; }
      else { d[i]=Math.round(d[i]*0.3); d[i+1]=Math.round(d[i+1]*0.3); d[i+2]=Math.round(d[i+2]*0.3); }
    }
    ctx.putImageData(id,0,0); cb(c.toDataURL("image/png"));
  };
  img.src = dataUrl;
}

function DrawPad({ onSave, onCancel }) {
  const cRef=useRef(null); const dr=useRef(false); const last=useRef({x:0,y:0});
  const [empty,setEmpty]=useState(true);
  const gp=(e,c)=>{const r=c.getBoundingClientRect(),sx=c.width/r.width,sy=c.height/r.height;if(e.touches)return{x:(e.touches[0].clientX-r.left)*sx,y:(e.touches[0].clientY-r.top)*sy};return{x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy};};
  const start=e=>{e.preventDefault();dr.current=true;last.current=gp(e,cRef.current);setEmpty(false);};
  const move=e=>{e.preventDefault();if(!dr.current)return;const c=cRef.current,ctx=c.getContext("2d"),p=gp(e,c);ctx.beginPath();ctx.moveTo(last.current.x,last.current.y);ctx.lineTo(p.x,p.y);ctx.strokeStyle="#18181b";ctx.lineWidth=2;ctx.lineCap="round";ctx.lineJoin="round";ctx.stroke();last.current=p;};
  const clr=()=>{cRef.current.getContext("2d").clearRect(0,0,cRef.current.width,cRef.current.height);setEmpty(true);};
  return (
    <div>
      <div style={{position:"relative",border:`1.5px solid ${C.gray200}`,borderRadius:"8px",overflow:"hidden",background:C.gray50,marginBottom:"8px"}}>
        <canvas ref={cRef} width={480} height={140} style={{display:"block",width:"100%",height:"100px",cursor:"crosshair",touchAction:"none"}}
          onMouseDown={start} onMouseMove={move} onMouseUp={()=>dr.current=false} onMouseLeave={()=>dr.current=false}
          onTouchStart={start} onTouchMove={move} onTouchEnd={()=>dr.current=false}/>
        {empty&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",color:C.gray300,pointerEvents:"none"}}>Sign here</div>}
      </div>
      <div style={{display:"flex",gap:"6px"}}>
        <button onClick={clr} style={GBS()}>Clear</button>
        <button onClick={onCancel} style={GBS()}>Cancel</button>
        <button onClick={()=>onSave(cRef.current.toDataURL("image/png"))} disabled={empty} style={GBS(empty?"ghost":"dark")}>Save</button>
      </div>
    </div>
  );
}

function TypeSig({ name, onSave, onCancel }) {
  const [text,setText]=useState(name||""); const [fi,setFi]=useState(0);
  const fonts=[{l:"Cursive",f:"Dancing Script,cursive"},{l:"Elegant",f:"Great Vibes,cursive"},{l:"Bold",f:"Pacifico,cursive"},{l:"Natural",f:"Caveat,cursive"},{l:"Classic",f:"Satisfy,cursive"}];
  const save=()=>{if(!text.trim())return;const c=document.createElement("canvas");c.width=500;c.height=140;const ctx=c.getContext("2d");ctx.font=`54px ${fonts[fi].f}`;ctx.fillStyle="#18181b";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(text,250,70);onSave(c.toDataURL("image/png"));};
  return (
    <div>
      <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&family=Great+Vibes&family=Pacifico&family=Caveat:wght@600&family=Satisfy&display=swap" rel="stylesheet"/>
      <input value={text} onChange={e=>setText(e.target.value)} placeholder="Type your name…"
        style={{width:"100%",boxSizing:"border-box",padding:"8px 10px",border:`1.5px solid ${C.accent}`,borderRadius:"6px",fontSize:"13px",outline:"none",fontFamily:"inherit",marginBottom:"10px"}}/>
      <div style={{display:"flex",gap:"6px",flexWrap:"wrap",marginBottom:"10px"}}>
        {fonts.map((f,i)=><button key={i} onClick={()=>setFi(i)} style={{padding:"3px 10px",borderRadius:"20px",cursor:"pointer",fontFamily:"inherit",fontSize:"11px",fontWeight:600,border:`1.5px solid ${i===fi?C.accent:C.gray200}`,background:i===fi?C.accentL:C.white,color:i===fi?C.accent:C.gray500}}>{f.l}</button>)}
      </div>
      {text.trim()&&<div style={{padding:"12px",background:C.gray50,borderRadius:"8px",textAlign:"center",marginBottom:"10px",minHeight:"56px",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontFamily:fonts[fi].f,fontSize:"38px",color:C.gray900}}>{text}</span></div>}
      <div style={{display:"flex",gap:"6px"}}>
        <button onClick={onCancel} style={GBS()}>Cancel</button>
        <button onClick={save} disabled={!text.trim()} style={GBS(!text.trim()?"ghost":"dark")}>Use Signature</button>
      </div>
    </div>
  );
}

/* ─── BUTTON STYLE ──────────────────────────────────────────────────────── */
function GBS(v="default") {
  const base={padding:"7px 14px",borderRadius:"7px",fontSize:"12px",fontWeight:500,cursor:"pointer",fontFamily:"inherit",border:"none",transition:"all 0.12s",lineHeight:1.4};
  if (v==="dark")    return {...base, background:C.gray900, color:C.white};
  if (v==="ghost")   return {...base, background:C.gray100, color:C.gray400, cursor:"default"};
  if (v==="danger")  return {...base, background:"#fef2f2", color:"#dc2626", border:"1px solid #fecaca"};
  if (v==="accent")  return {...base, background:C.accent,  color:C.white};
  if (v==="outline") return {...base, background:C.white,   color:C.gray700, border:`1px solid ${C.gray200}`};
  return {...base, background:C.white, color:C.gray700, border:`1px solid ${C.gray200}`};
}

/* ─── ROW TOOLBAR ───────────────────────────────────────────────────────── */
function RowToolbar({ item, onDel, onDup, onMv, onChangeType, onBold, onItalic, canUp, canDown }) {
  return (
    <div style={{display:"inline-flex",alignItems:"center",gap:"2px",padding:"4px 8px",
      background:"#1e293b",borderRadius:"8px",
      boxShadow:"0 4px 14px rgba(0,0,0,0.2)",border:"1px solid rgba(255,255,255,0.07)"}}>
      <select value={item.type} onChange={e=>onChangeType(e.target.value)}
        style={{background:"transparent",border:"none",color:"#94a3b8",fontSize:"11px",cursor:"pointer",outline:"none",fontFamily:"inherit",padding:"2px 4px",borderRadius:"4px"}}>
        {["header","item","included","deduction"].map(t=>(
          <option key={t} value={t} style={{background:"#1e293b",color:"#e2e8f0"}}>{t[0].toUpperCase()+t.slice(1)}</option>
        ))}
      </select>
      <div style={{width:"1px",height:"14px",background:"rgba(255,255,255,0.1)",margin:"0 2px"}}/>
      <button onClick={onBold}   title="Bold"   style={{background:item.bold?"rgba(255,255,255,0.12)":"transparent",border:"none",color:item.bold?"#fff":"#64748b",fontSize:"12px",fontWeight:700,cursor:"pointer",padding:"3px 6px",borderRadius:"4px",lineHeight:1}}>B</button>
      <button onClick={onItalic} title="Italic" style={{background:item.italic?"rgba(255,255,255,0.12)":"transparent",border:"none",color:item.italic?"#fff":"#64748b",fontSize:"12px",fontStyle:"italic",cursor:"pointer",padding:"3px 6px",borderRadius:"4px",lineHeight:1}}>I</button>
      <div style={{width:"1px",height:"14px",background:"rgba(255,255,255,0.1)",margin:"0 2px"}}/>
      <button onClick={()=>onMv(-1)} disabled={!canUp}   style={{background:"transparent",border:"none",color:canUp?"#94a3b8":"#334155",fontSize:"12px",cursor:canUp?"pointer":"default",padding:"2px 5px",borderRadius:"4px"}}>↑</button>
      <button onClick={()=>onMv(1)}  disabled={!canDown} style={{background:"transparent",border:"none",color:canDown?"#94a3b8":"#334155",fontSize:"12px",cursor:canDown?"pointer":"default",padding:"2px 5px",borderRadius:"4px"}}>↓</button>
      <div style={{width:"1px",height:"14px",background:"rgba(255,255,255,0.1)",margin:"0 2px"}}/>
      <button onClick={onDup} title="Duplicate" style={{background:"transparent",border:"none",color:"#94a3b8",fontSize:"12px",cursor:"pointer",padding:"2px 5px",borderRadius:"4px"}}>⧉</button>
      <button onClick={onDel} title="Delete"    style={{background:"transparent",border:"none",color:"#f87171",fontSize:"13px",cursor:"pointer",padding:"2px 5px",borderRadius:"4px",lineHeight:1}}>×</button>
    </div>
  );
}

/* ─── INVOICE ROW ───────────────────────────────────────────────────────── */
function InvoiceRow({ item, idx, total, inv, sym, onUpd, onDel, onDup, onMv, onInsert }) {
  const [hov, setHov] = useState(false);
  const TOOLBAR_ZONE = 38;
  const twoCol  = inv.columnMode === "2";
  const colGrid = twoCol ? "1fr 90px 70px 110px" : "1fr 130px";
  const price   = computePrice(item);

  const ns = {
    fontSize:   item.type==="header" ? "14px" : "13px",
    fontWeight: item.bold ? 700 : (item.type==="header" ? 600 : 400),
    fontStyle:  item.italic ? "italic" : "normal",
    color:      item.type==="included" ? C.gray500 : item.type==="deduction" ? C.gray600 : C.gray900,
    lineHeight: 1.4,
  };

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{position:"relative", borderBottom:`1px solid ${C.gray100}`,
        background:hov?"#f8faff":"transparent", transition:"background 0.1s",
        overflow:"visible",
        paddingTop:hov ? `${TOOLBAR_ZONE}px` : 0,
        marginTop:hov ? `-${TOOLBAR_ZONE}px` : 0,
        zIndex:hov ? 20 : 1}}>

      {/* Toolbar — floats above the row, centered, hidden in PDF */}
      {hov && (
        <div data-noprint="1"
          style={{position:"absolute",top:"4px",left:"50%",transform:"translateX(-50%)",
            zIndex:50,pointerEvents:"all",whiteSpace:"nowrap"}}
          onMouseEnter={()=>setHov(true)}>
          <RowToolbar item={item} canUp={idx>0} canDown={idx<total-1}
            onDel={()=>onDel(item.id)} onDup={()=>onDup(item.id)}
            onMv={d=>onMv(item.id,d)}
            onChangeType={t=>onUpd(item.id,"type",t)}
            onBold={()=>onUpd(item.id,"bold",!item.bold)}
            onItalic={()=>onUpd(item.id,"italic",!item.italic)}/>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:colGrid,gap:"12px",alignItems:"start",padding:"11px 0"}}>

        {/* Description column */}
        <div style={{display:"flex",alignItems:"flex-start",gap:"5px",paddingLeft:item.type==="included"?"12px":0}}>
          <span data-noprint="1" style={{color:C.gray300,fontSize:"11px",paddingTop:"3px",cursor:"grab",flexShrink:0,
            opacity:hov?1:0,transition:"opacity 0.15s",userSelect:"none"}}
            draggable onDragStart={e=>e.dataTransfer.setData("rowId",item.id)}>⠿</span>
          <div style={{flex:1,minWidth:0}}>
            {item.type==="included" && <div style={{width:"3px",height:"3px",borderRadius:"50%",background:C.gray300,marginBottom:"5px"}}/>}
            <Editable value={item.name} onChange={v=>onUpd(item.id,"name",v)}
              placeholder={item.type==="header"?"Section name…":item.type==="included"?"Included item…":item.type==="deduction"?"Deduction…":"Item description…"}
              style={ns}/>
            {/* Note — editable for non-included */}
            {item.type !== "included" && (
              <Editable value={item.note||""} onChange={v=>onUpd(item.id,"note",v)}
                placeholder="Add note…"
                style={{fontSize:"11px",color:C.gray400,lineHeight:1.4,marginTop:"3px"}}/>
            )}
            {/* Hrs × Rate calculator pill — single col only, hidden in PDF */}
            {item.type !== "included" && !twoCol && (
              <div data-noprint="1" style={{display:"inline-flex",alignItems:"center",gap:"3px",marginTop:"5px",
                background:C.gray100,borderRadius:"6px",padding:"3px 8px"}}>
                <Editable value={item.hours||""} onChange={v=>onUpd(item.id,"hours",v)}
                  placeholder="Qty" style={{fontSize:"11px",color:C.gray700,minWidth:"28px",maxWidth:"48px"}}/>
                <span style={{fontSize:"11px",color:C.gray400,userSelect:"none"}}>×</span>
                <Editable value={item.rate||""} onChange={v=>onUpd(item.id,"rate",v)}
                  placeholder="Rate" style={{fontSize:"11px",color:C.gray700,minWidth:"28px",maxWidth:"60px"}}/>
                {item.hours && item.rate && parseFloat(item.hours)>0 && parseFloat(item.rate)>0 && (
                  <span style={{fontSize:"11px",color:"#059669",fontWeight:600,marginLeft:"3px",userSelect:"none"}}>
                    = {sym} {fmtNum(parseFloat(item.hours)*parseFloat(item.rate))}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Two-col: unit cost + qty */}
        {twoCol && <>
          <Editable value={item.rate||""} onChange={v=>onUpd(item.id,"rate",v)}
            placeholder="—" style={{fontSize:"13px",color:C.gray600,textAlign:"right"}}/>
          <Editable value={item.hours||""} onChange={v=>onUpd(item.id,"hours",v)}
            placeholder="—" style={{fontSize:"13px",color:C.gray600,textAlign:"center"}}/>
        </>}

        {/* Amount column */}
        <div style={{textAlign:"right"}}>
          {item.type === "included" ? (
            <Editable value={item.includedLabel||"Included"} onChange={v=>onUpd(item.id,"includedLabel",v)}
              placeholder="Included"
              style={{fontSize:"12px",color:C.gray400,fontWeight:500,textAlign:"right",display:"inline-block"}}/>
          ) : item.type === "deduction" ? (
            <div>
              <Editable value={item.price||""} onChange={v=>onUpd(item.id,"price",v)}
                placeholder="0.00" style={{fontSize:"13px",color:C.gray600,textAlign:"right"}}/>
              {item.price && <div data-noprint="1" style={{fontSize:"10px",color:C.gray400,marginTop:"1px"}}>deducted</div>}
            </div>
          ) : (
            <div>
              {price && item.hours && item.rate && parseFloat(item.hours)>0 ? (
                <div>
                  <span style={{fontSize:"13px",color:C.gray800,fontWeight:item.bold?700:500}}>{sym} {fmtNum(price)}</span>
                  <div data-noprint="1" style={{fontSize:"10px",color:"#059669",marginTop:"1px"}}>auto-calc</div>
                </div>
              ) : (
                <div>
                  <Editable value={item.price||""} onChange={v=>onUpd(item.id,"price",v)}
                    placeholder="0.00" style={{fontSize:"13px",color:C.gray700,textAlign:"right"}}/>
                  <div data-noprint="1" style={{fontSize:"10px",color:C.gray400,marginTop:"1px"}}>click to set</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Insert-after + button — hidden in PDF */}
      {hov && (
        <div data-noprint="1" style={{position:"absolute",bottom:"-10px",left:"50%",transform:"translateX(-50%)",zIndex:40}}
          onMouseEnter={()=>setHov(true)}>
          <button onClick={()=>onInsert(item.id)}
            style={{width:"20px",height:"20px",borderRadius:"50%",border:`1.5px solid ${C.accent}`,
              background:C.white,color:C.accent,fontSize:"13px",lineHeight:1,cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",padding:0,
              boxShadow:"0 1px 4px rgba(0,0,0,0.12)"}}>+</button>
        </div>
      )}
    </div>
  );
}

/* ─── ADD ROW MENU ──────────────────────────────────────────────────────── */
function AddRowMenu({ onAdd }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const types = [
    {t:"item",      l:"Line Item",      d:"Price or qty × rate"},
    {t:"header",    l:"Section",        d:"Group heading"},
    {t:"included",  l:"Included",       d:"No-charge item"},
    {t:"deduction", l:"Deduction",      d:"Subtract from total"},
  ];

  return (
    <div ref={ref} style={{position:"relative",display:"inline-block"}}>
      <button onClick={()=>setOpen(o=>!o)}
        style={{display:"flex",alignItems:"center",gap:"6px",padding:"7px 14px",
          border:`1.5px dashed ${open?C.accent:C.gray300}`,borderRadius:"8px",
          background:open?C.accentL:"transparent",color:open?C.accent:C.gray400,
          fontSize:"12px",cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s",fontWeight:500}}>
        + Add row <span style={{fontSize:"10px",opacity:0.7}}>▾</span>
      </button>
      {open && (
        <div style={{position:"absolute",top:"calc(100% + 6px)",left:0,background:C.white,
          border:`1px solid ${C.gray200}`,borderRadius:"10px",
          boxShadow:"0 8px 24px rgba(0,0,0,0.1)",zIndex:100,overflow:"hidden",minWidth:"200px"}}>
          {types.map(({t,l,d}) => (
            <button key={t} onClick={()=>{onAdd(t);setOpen(false);}}
              style={{display:"block",width:"100%",padding:"10px 16px",background:"none",
                border:"none",textAlign:"left",cursor:"pointer",fontFamily:"inherit",
                borderBottom:`1px solid ${C.gray100}`}}
              onMouseEnter={e=>e.currentTarget.style.background=C.gray50}
              onMouseLeave={e=>e.currentTarget.style.background="none"}>
              <div style={{fontSize:"13px",fontWeight:500,color:C.gray900}}>{l}</div>
              <div style={{fontSize:"11px",color:C.gray400,marginTop:"1px"}}>{d}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── SETTINGS DRAWER ───────────────────────────────────────────────────── */
function SettingsDrawer({ inv, set, allCurrencies, onAddCurrency, onClose, onSaveDefaultSig, ui }) {
  const [sigMode,  setSigMode]  = useState("none");
  const [proc,     setProc]     = useState(false);
  const [ncc,      setNcc]      = useState("");
  const [ncs,      setNcs]      = useState("");
  const fRef = useRef(null);

  const handleFile = file => {
    if (!file || !file.type.startsWith("image/")) return;
    setProc(true);
    const r = new FileReader();
    r.onload = e => processSignatureImg(e.target.result, c => {
      onSaveDefaultSig(c); setProc(false); setSigMode("none");
    });
    r.readAsDataURL(file);
  };

  const iStyle = {width:"100%",boxSizing:"border-box",padding:"8px 11px",border:`1px solid ${ui.inputBorder}`,borderRadius:"8px",fontSize:"13px",color:ui.text,background:ui.inputBg,outline:"none",fontFamily:"inherit"};
  const onFoc  = e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; };
  const onBlr  = e => { e.target.style.borderColor = ui.inputBorder; e.target.style.boxShadow = "none"; };
  const Inp    = ({v,c,ph,t="text"}) => <input type={t} value={v} onChange={e=>c(e.target.value)} placeholder={ph||""} style={iStyle} onFocus={onFoc} onBlur={onBlr}/>;
  const Sel    = ({v,c,opts}) => <select value={v} onChange={e=>c(e.target.value)} style={{...iStyle,cursor:"pointer"}} onFocus={onFoc} onBlur={onBlr}>{opts.map(([val,lbl])=><option key={val} value={val}>{lbl}</option>)}</select>;
  const FL     = ({l,children}) => <div style={{marginBottom:"14px"}}><div style={{fontSize:"11px",fontWeight:600,color:ui.muted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:"5px"}}>{l}</div>{children}</div>;
  const Sec    = ({children}) => <div style={{fontSize:"11px",fontWeight:700,color:ui.section,textTransform:"uppercase",letterSpacing:"0.08em",margin:"24px 0 14px",paddingBottom:"8px",borderBottom:`1px solid ${ui.softBorder}`}}>{children}</div>;

  return (
    <div style={{position:"fixed",top:0,right:0,bottom:0,
      width:"min(320px, 100vw)",background:ui.panel,
      borderLeft:`1px solid ${ui.border}`,zIndex:500,overflowY:"auto",
      fontFamily:"Inter,system-ui,sans-serif",display:"flex",flexDirection:"column"}}>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
        padding:"16px 20px",borderBottom:`1px solid ${ui.softBorder}`,
        position:"sticky",top:0,background:ui.panel,zIndex:1}}>
        <span style={{fontSize:"14px",fontWeight:600,color:ui.text,letterSpacing:"-0.1px"}}>Settings</span>
        <button onClick={onClose}
          style={{background:"none",border:"none",cursor:"pointer",color:ui.muted,
            width:"28px",height:"28px",borderRadius:"6px",fontSize:"18px",
            display:"flex",alignItems:"center",justifyContent:"center"}}
          onMouseEnter={e=>{e.currentTarget.style.background=ui.hover;e.currentTarget.style.color=ui.text;}}
          onMouseLeave={e=>{e.currentTarget.style.background="none";e.currentTarget.style.color=C.gray400;}}>×</button>
      </div>

      <div style={{padding:"0 20px 32px",flex:1}}>
        <Sec>Currency</Sec>
        <FL l="Active currency">
          <Sel v={inv.currency} c={v=>set("currency",v)} opts={allCurrencies.map(c=>[c.code,`${c.sym} — ${c.code}`])}/>
        </FL>
        <FL l="Add custom currency">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px",marginBottom:"6px"}}>
            <input value={ncc} onChange={e=>setNcc(e.target.value.toUpperCase())} placeholder="Code" maxLength={6} style={{...iStyle,padding:"7px 10px",fontSize:"12px"}} onFocus={onFoc} onBlur={onBlr}/>
            <input value={ncs} onChange={e=>setNcs(e.target.value)} placeholder="Symbol" maxLength={8} style={{...iStyle,padding:"7px 10px",fontSize:"12px"}} onFocus={onFoc} onBlur={onBlr}/>
          </div>
          <button onClick={()=>{if(ncc&&ncs){onAddCurrency({code:ncc.trim(),sym:ncs.trim()});setNcc("");setNcs("");}}} style={{...GBS("dark"),width:"100%",padding:"8px"}}>Add Currency</button>
        </FL>

        <Sec>Table Layout</Sec>
        <FL l="Column mode">
          <Sel v={inv.columnMode} c={v=>set("columnMode",v)} opts={[["1","Single column"],["2","Two columns (Qty + Rate)"]]}/>
        </FL>
        <FL l={inv.columnMode==="1"?"Column header name":"Description column"}>
          <Inp v={inv.col1Name||""} c={v=>set("col1Name",v)} ph="Description"/>
        </FL>
        {inv.columnMode==="2" && <>
          <FL l="Unit cost column"><Inp v={inv.col2Name||""} c={v=>set("col2Name",v)} ph="Unit Cost"/></FL>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px"}}>
            <FL l="Qty column"><Inp v={inv.col3Name||""} c={v=>set("col3Name",v)} ph="Qty"/></FL>
            <FL l="Amount column"><Inp v={inv.col4Name||""} c={v=>set("col4Name",v)} ph="Amount"/></FL>
          </div>
        </>}

        <Sec>Tax &amp; Discount</Sec>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"8px",marginBottom:"14px"}}>
          <FL l="Tax %"><Inp v={inv.taxRate||""} c={v=>set("taxRate",v)} ph="e.g. 17" t="number"/></FL>
          <FL l="Discount %"><Inp v={inv.discountRate||""} c={v=>set("discountRate",v)} ph="e.g. 10" t="number"/></FL>
        </div>

        <Sec>Invoice Status <span style={{fontWeight:400,textTransform:"none",fontSize:"10px"}}>(optional)</span></Sec>
        <FL l="Status">
          <Sel v={inv.status||""} c={v=>set("status",v)} opts={[["","None"],["Draft","Draft"],["Sent","Sent"],["Paid","Paid"],["Overdue","Overdue"]]}/>
        </FL>

        <Sec>Default Signature</Sec>
        <p style={{fontSize:"12px",color:C.gray400,lineHeight:1.6,marginBottom:"12px",marginTop:0}}>
          Stored in your browser. Appears on every invoice automatically.
        </p>

        {inv.signatureDataUrl && sigMode==="none" && (
          <div style={{border:`1px solid ${C.gray100}`,borderRadius:"10px",padding:"16px",background:C.gray50,marginBottom:"12px"}}>
            <img src={inv.signatureDataUrl} alt="sig" style={{height:"60px",maxWidth:"100%",objectFit:"contain",display:"block",marginBottom:"12px"}}/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px"}}>
              <button onClick={()=>setSigMode("draw")} style={{...GBS("outline"),fontSize:"11px",padding:"6px 8px"}}>✏️ Redraw</button>
              <button onClick={()=>setSigMode("type")} style={{...GBS("outline"),fontSize:"11px",padding:"6px 8px"}}>Aa Retype</button>
              <button onClick={()=>fRef.current.click()} style={{...GBS("outline"),fontSize:"11px",padding:"6px 8px"}}>↑ Upload</button>
              <button onClick={()=>onSaveDefaultSig("")} style={{...GBS("danger"),fontSize:"11px",padding:"6px 8px"}}>Remove</button>
            </div>
          </div>
        )}
        {!inv.signatureDataUrl && sigMode==="none" && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"8px",marginBottom:"12px"}}>
            {[{id:"draw",l:"✏️ Draw"},{id:"type",l:"Aa Type"},{id:"upload",l:"↑ Upload"}].map(m=>(
              <button key={m.id} onClick={()=>m.id==="upload"?fRef.current.click():setSigMode(m.id)}
                style={{...GBS("outline"),padding:"10px 6px",fontSize:"12px",textAlign:"center"}}>{m.l}</button>
            ))}
          </div>
        )}
        <input ref={fRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
        {sigMode==="draw" && <DrawPad onSave={d=>{onSaveDefaultSig(d);setSigMode("none");}} onCancel={()=>setSigMode("none")}/>}
        {sigMode==="type" && <TypeSig name={inv.founderLabel} onSave={d=>{onSaveDefaultSig(d);setSigMode("none");}} onCancel={()=>setSigMode("none")}/>}
      </div>
    </div>
  );
}

/* ─── TEMPLATES MODAL ───────────────────────────────────────────────────── */
function TemplatesModal({ inv, onLoad, onClose, ui }) {
  const [tpls, setTpls] = useState(() => {
    try { return JSON.parse(localStorage.getItem("xtarc_tpl")||"[]"); } catch { return []; }
  });
  const [name, setName] = useState("");

  const save = () => {
    if (!name.trim()) return;
    const t = {id:uid(),name:name.trim(),savedAt:new Date().toLocaleDateString("en-GB"),
      clientName:inv.clientName, data:{...inv,items:inv.items.map(i=>({...i}))}};
    const u = [t,...tpls.filter(x=>x.name!==name.trim())];
    setTpls(u); localStorage.setItem("xtarc_tpl",JSON.stringify(u)); setName("");
  };
  const del = id => {
    const u = tpls.filter(t=>t.id!==id);
    setTpls(u); localStorage.setItem("xtarc_tpl",JSON.stringify(u));
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.2)",zIndex:600,
      display:"flex",alignItems:"center",justifyContent:"center",padding:"20px"}}>
      <div style={{background:C.white,borderRadius:"14px",
        width:"min(480px, calc(100vw - 32px))",maxHeight:"80vh",
        display:"flex",flexDirection:"column",
        boxShadow:"0 20px 60px rgba(0,0,0,0.15)",border:`1px solid ${C.gray200}`,
        fontFamily:"Inter,system-ui,sans-serif"}}>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
          padding:"18px 22px",borderBottom:`1px solid ${C.gray100}`}}>
          <div>
            <div style={{fontSize:"15px",fontWeight:600,color:C.gray900}}>Templates</div>
            <div style={{fontSize:"12px",color:C.gray400,marginTop:"2px"}}>Save and reuse invoice structures</div>
          </div>
          <button onClick={onClose}
            style={{background:"none",border:"none",cursor:"pointer",color:C.gray400,
              fontSize:"20px",width:"32px",height:"32px",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"6px"}}
            onMouseEnter={e=>e.currentTarget.style.background=C.gray100}
            onMouseLeave={e=>e.currentTarget.style.background="none"}>×</button>
        </div>

        <div style={{padding:"16px 22px",borderBottom:`1px solid ${C.gray100}`}}>
          <div style={{display:"flex",gap:"8px"}}>
            <input value={name} onChange={e=>setName(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&save()}
              placeholder="Name this template…"
              style={{flex:1,padding:"8px 12px",border:`1px solid ${C.gray200}`,borderRadius:"8px",
                fontSize:"13px",color:C.gray900,outline:"none",fontFamily:"inherit"}}
              onFocus={e=>e.target.style.borderColor=C.accent}
              onBlur={e=>e.target.style.borderColor=C.gray200}/>
            <button onClick={save} style={{...GBS("dark"),padding:"8px 16px"}}>Save current</button>
          </div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"12px 22px"}}>
          {tpls.length===0 && (
            <div style={{textAlign:"center",padding:"32px 0",color:C.gray400,fontSize:"13px"}}>
              No templates saved yet. Fill in an invoice and save it above.
            </div>
          )}
          {tpls.map(t=>(
            <div key={t.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:"12px 14px",border:`1px solid ${C.gray100}`,borderRadius:"10px",
              marginBottom:"8px",background:C.gray50}}>
              <div>
                <div style={{fontSize:"13px",fontWeight:600,color:C.gray900}}>{t.name}</div>
                <div style={{fontSize:"11px",color:C.gray400,marginTop:"2px"}}>{t.savedAt} · {t.clientName||"—"}</div>
              </div>
              <div style={{display:"flex",gap:"6px"}}>
                <button onClick={()=>{onLoad(t.data);onClose();}} style={{...GBS("outline"),fontSize:"12px",padding:"5px 12px"}}>Load</button>
                <button onClick={()=>del(t.id)} style={{...GBS("danger"),fontSize:"12px",padding:"5px 10px"}}>×</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── PAGINATE ──────────────────────────────────────────────────────────── */
function paginate(items, n) {
  const p = [];
  for (let i=0; i<items.length; i+=n) p.push(items.slice(i,i+n));
  if (!p.length) p.push([]);
  return p;
}

/* ─── INVOICE CANVAS ────────────────────────────────────────────────────── */
function InvoiceCanvas({ inv, set, allCurrencies, LOGO_B64, SIG_B64_FALLBACK }) {
  const cur     = allCurrencies.find(c=>c.code===inv.currency) || allCurrencies[0];
  const sym     = cur ? cur.sym : inv.currency;
  const twoCol  = inv.columnMode === "2";
  const colGrid = twoCol ? "1fr 90px 70px 110px" : "1fr 130px";
  const pages   = paginate(inv.items, ITEMS_PER_PAGE);
  const { grand, sub, tax, disc, override } = calcGrandTotal(inv);

  const updItem = (id,k,v) => set(p=>({...p,items:p.items.map(it=>it.id===id?{...it,[k]:v}:it)}));
  const delItem = id => set(p=>({...p,items:p.items.filter(it=>it.id!==id)}));
  const dupItem = id => set(p=>{const i=p.items.findIndex(x=>x.id===id);if(i<0)return p;return{...p,items:[...p.items.slice(0,i+1),{...p.items[i],id:uid()},...p.items.slice(i+1)]};});
  const mvItem  = (id,d) => set(p=>{const a=[...p.items],i=a.findIndex(x=>x.id===id),j=i+d;if(j<0||j>=a.length)return p;[a[i],a[j]]=[a[j],a[i]];return{...p,items:a};});
  const insertAfter = id => set(p=>{const i=p.items.findIndex(x=>x.id===id);return{...p,items:[...p.items.slice(0,i+1),mkItem("item"),...p.items.slice(i+1)]};});
  const onDrop  = (e,tid) => {
    const sid = e.dataTransfer.getData("rowId");
    if (!sid || sid===tid) return;
    set(p=>{const a=[...p.items],si=a.findIndex(x=>x.id===sid),ti=a.findIndex(x=>x.id===tid);if(si<0||ti<0)return p;const[item]=a.splice(si,1);a.splice(ti,0,item);return{...p,items:a};});
  };

  const LS = {fontSize:"11px",fontWeight:600,color:C.gray400,letterSpacing:"0.07em",textTransform:"uppercase"};
  const SC = {Draft:{bg:"#f1f5f9",c:"#475569"},Sent:{bg:"#dbeafe",c:"#1d4ed8"},Paid:{bg:"#dcfce7",c:"#166534"},Overdue:{bg:"#fee2e2",c:"#dc2626"}};
  const sc = inv.status ? (SC[inv.status]||null) : null;
  const PS = {width:"794px",background:C.white,fontFamily:"Inter,system-ui,sans-serif",color:C.gray900,padding:"64px 72px",boxSizing:"border-box",display:"flex",flexDirection:"column"};

  return (
    <div id="__pr__">
      {pages.map((rows, pi) => (
        <div key={pi} className="iv-page"
          style={{...PS, minHeight:"1123px", marginBottom:pi<pages.length-1?"32px":0}}>

          {/* Page 1 header */}
          {pi===0 && <>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"48px"}}>
              <div style={{display:"flex",alignItems:"center",gap:"10px"}}>
                <img src={LOGO_B64} alt="logo" style={{height:"32px",width:"32px",objectFit:"contain",borderRadius:"4px"}}/>
                <Editable value={inv.agencyName} onChange={v=>set(p=>({...p,agencyName:v}))}
                  placeholder="Agency name" style={{fontSize:"15px",fontWeight:600,color:C.gray900}}/>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{...LS,marginBottom:"3px"}}>Contact</div>
                <Editable value={inv.agencyEmail} onChange={v=>set(p=>({...p,agencyEmail:v}))}
                  placeholder="email@agency.com" style={{fontSize:"13px",color:C.gray700}}/>
              </div>
            </div>
            <div style={{height:"1px",background:C.gray200,marginBottom:"40px"}}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"52px"}}>
              <div>
                <div style={{...LS,marginBottom:"10px"}}>Billed To</div>
                <Editable value={inv.clientName} onChange={v=>set(p=>({...p,clientName:v}))}
                  placeholder="Client name" style={{fontSize:"22px",fontWeight:700,color:C.gray900,letterSpacing:"-0.4px",lineHeight:1}}/>
              </div>
              <div style={{textAlign:"right",display:"grid",rowGap:"12px"}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"flex-end",gap:"8px"}}>
                  {sc && <span style={{fontSize:"10px",fontWeight:600,padding:"3px 8px",borderRadius:"12px",background:sc.bg,color:sc.c,letterSpacing:"0.04em"}}>{inv.status}</span>}
                  <div>
                    <div style={{...LS,marginBottom:"3px"}}>Invoice</div>
                    <Editable value={inv.invoiceNo} onChange={v=>set(p=>({...p,invoiceNo:v}))}
                      placeholder="#00001" style={{fontSize:"14px",fontWeight:700,color:C.gray900}}/>
                  </div>
                </div>
                <div>
                  <div style={{...LS,marginBottom:"3px"}}>Date</div>
                  <Editable value={inv.date} onChange={v=>set(p=>({...p,date:v}))}
                    placeholder="DD MMM YYYY" style={{fontSize:"13px",color:C.gray700}}/>
                </div>
                <div>
                  <div style={{...LS,marginBottom:"3px"}}>Due Date</div>
                  <Editable value={inv.dueDate||""} onChange={v=>set(p=>({...p,dueDate:v}))}
                    placeholder="—" style={{fontSize:"13px",color:C.gray700}}/>
                </div>
              </div>
            </div>
          </>}

          {/* Continuation header */}
          {pi>0 && (
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              marginBottom:"32px",paddingBottom:"16px",borderBottom:`1px solid ${C.gray200}`}}>
              <span style={{fontSize:"13px",color:C.gray500,fontWeight:500}}>{inv.agencyName} · {inv.clientName}</span>
              <span style={{fontSize:"12px",color:C.gray400}}>Page {pi+1} of {pages.length}</span>
            </div>
          )}

          {/* Table header */}
          <div style={{display:"grid",gridTemplateColumns:colGrid,gap:"12px",
            paddingBottom:"10px",borderBottom:`1.5px solid ${C.gray300}`,marginBottom:"2px"}}>
            <div style={LS}>{inv.col1Name||"Description"}</div>
            {twoCol && <>
              <div style={{...LS,textAlign:"right"}}>{inv.col2Name||"Unit Cost"}</div>
              <div style={{...LS,textAlign:"center"}}>{inv.col3Name||"Qty"}</div>
            </>}
            <div style={{...LS,textAlign:"right"}}>{inv.col4Name||"Amount"}</div>
          </div>

          {/* Rows */}
          <div style={{flex:1,overflow:"visible",paddingTop:"4px"}} onDragOver={e=>e.preventDefault()}>
            {rows.map(item => (
              <div key={item.id} onDrop={e=>onDrop(e,item.id)} onDragOver={e=>e.preventDefault()}>
                <InvoiceRow item={item} idx={inv.items.indexOf(item)} total={inv.items.length}
                  inv={inv} sym={sym}
                  onUpd={updItem} onDel={delItem} onDup={dupItem} onMv={mvItem} onInsert={insertAfter}/>
              </div>
            ))}
          </div>

          {/* Add row — last page only */}
          {pi===pages.length-1 && (
            <div data-noprint="1" style={{marginTop:"8px",marginBottom:"12px"}}>
              <AddRowMenu onAdd={t=>set(p=>({...p,items:[...p.items,mkItem(t)]}))}/>
            </div>
          )}

          {/* Footer — last page only */}
          {pi===pages.length-1 && (
            <div style={{marginTop:"auto",paddingTop:"28px"}}>
              {(inv.taxRate||inv.discountRate) && (
                <div style={{marginBottom:"16px",paddingBottom:"16px",borderBottom:`1px solid ${C.gray100}`}}>
                  {inv.discountRate && <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:"12px",color:C.gray600}}><span>Discount ({inv.discountRate}%)</span><span>−{sym} {fmtNum(disc)}</span></div>}
                  {inv.taxRate && <div style={{display:"flex",justifyContent:"space-between",padding:"3px 0",fontSize:"12px",color:C.gray600}}><span>Tax ({inv.taxRate}%)</span><span>+{sym} {fmtNum(tax)}</span></div>}
                </div>
              )}
              <div style={{marginBottom:"32px"}}>
                <Editable value={inv.notes} onChange={v=>set(p=>({...p,notes:v}))}
                  placeholder="Footer notes…" multiline style={{fontSize:"12px",color:C.gray400,lineHeight:1.6}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
                <div>
                  {inv.signatureDataUrl ? (
                    <img src={inv.signatureDataUrl} alt="sig"
                      style={{height:"72px",maxWidth:"220px",objectFit:"contain",display:"block",marginBottom:"8px"}}/>
                  ) : (
                    <div style={{width:"80px",height:"1px",background:C.gray200,marginBottom:"8px"}}/>
                  )}
                  <Editable value={inv.founderLabel} onChange={v=>set(p=>({...p,founderLabel:v}))}
                    placeholder="Signatory" style={{fontSize:"12px",color:C.gray500,fontWeight:500}}/>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{...LS,marginBottom:"6px"}}>Total Due</div>
                  <div style={{fontSize:"28px",fontWeight:700,color:C.gray900,letterSpacing:"-0.8px",lineHeight:1}}>
                    {sym} {fmtNum(grand)||"—"}
                  </div>
                  {!override && grand>0 && (
                    <div data-noprint="1" style={{fontSize:"10px",color:C.gray400,marginTop:"3px"}}>
                      auto · <span style={{cursor:"pointer",color:C.accent}}
                        onClick={()=>set(p=>({...p,total:grand.toFixed(2)}))}>lock in ↓</span>
                    </div>
                  )}
                  {override && (
                    <div data-noprint="1" style={{fontSize:"10px",color:"#f59e0b",marginTop:"3px",cursor:"pointer"}}
                      onClick={()=>set(p=>({...p,total:""}))}>overridden · reset ↺</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── MOBILE SCALER ─────────────────────────────────────────────────────── */
function MobileScaler({ children }) {
  const [scale, setScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    const measure = () => {
      const vw = window.innerWidth;
      if (vw < 860) {
        // On mobile/tablet, scale the 794px invoice to fit viewport
        const padding = vw < 480 ? 8 : 16;
        const available = vw - padding * 2;
        const s = Math.min(available / 794, 1);
        setScale(s);
        setIsMobile(true);
      } else {
        setScale(0.88); // desktop default
        setIsMobile(false);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  return (
    <div ref={wrapRef} style={{
      width: isMobile ? `${794 * scale}px` : "794px",
      height: isMobile ? `${1123 * scale}px` : "auto",
      transformOrigin: "top left",
      transform: `scale(${scale})`,
      marginBottom: isMobile ? `${(1123 * scale - 1123) + 60}px` : "60px",
      flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

/* ─── MAIN APP ──────────────────────────────────────────────────────────── */
export default function App() {
  const assets = { logo: "data:image/png;base64,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", sig: "data:image/png;base64,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" };

  const DEF_INV = {
    agencyName:"XTARC", agencyEmail:"xtarcagency@gmail.com", founderLabel:"Sameer Siddiqui",
    clientName:"XYZ Company", invoiceNo:"#10002", date:"01 Feb 2003", dueDate:"",
    currency:"PKR", customCurrencies:[], signatureDataUrl:"",
    total:"", taxRate:"", discountRate:"",
    columnMode:"1", col1Name:"Description", col2Name:"Unit Cost", col3Name:"Qty", col4Name:"Amount",
    pdfQuality:"medium", status:"",
    notes:"All work is reviewed and verified by the client before final delivery.",
    items:[
      {id:uid(),type:"header",   name:"Website Layout Design",note:"Per hour · PKR 2,800",hours:"6.98",rate:"2800",price:"",bold:true, italic:false,includedLabel:"Included"},
      {id:uid(),type:"included", name:"Design System & Style Guide",            note:"",hours:"",rate:"",price:"",bold:false,italic:false,includedLabel:"Included"},
      {id:uid(),type:"included", name:"Responsive Design (Desktop/Tablet/Mobile)",note:"",hours:"",rate:"",price:"",bold:false,italic:false,includedLabel:"Included"},
      {id:uid(),type:"included", name:"Developer Handoff Documentation",        note:"",hours:"",rate:"",price:"",bold:false,italic:false,includedLabel:"Included"},
    ],
  };

  const [inv, setInv, undo, redo, canUndo, canRedo] = useUndoable(DEF_INV);
  const [showSettings,  setShowSettings]  = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [showQual,      setShowQual]      = useState(false);
  const [dark,          setDark]          = useState(() => {
    try { return JSON.parse(localStorage.getItem("xtarc_ui_dark") || "true"); }
    catch { return true; }
  });
  const qualRef = useRef(null);
  const allCurrencies = [...BASE_CURRENCIES, ...(inv.customCurrencies||[])];
  const UI = dark ? {
    bg:"#050608", panel:"#0b0d11", border:"rgba(255,255,255,0.12)", softBorder:"rgba(255,255,255,0.08)",
    text:"#f4f7fb", muted:"#9ba7b5", section:"#6f7b89", hover:"rgba(255,255,255,0.06)",
    inputBg:"#12161c", inputBorder:"rgba(255,255,255,0.14)", overlay:"rgba(0,0,0,0.52)"
  } : {
    bg:C.gray100, panel:C.white, border:C.gray200, softBorder:C.gray100,
    text:C.gray900, muted:C.gray500, section:C.gray300, hover:C.gray100,
    inputBg:C.white, inputBorder:C.gray200, overlay:"rgba(0,0,0,0.18)"
  };

  // Keyboard shortcuts
  useEffect(() => {
    const h = e => {
      if ((e.metaKey||e.ctrlKey) && e.key==="z" && !e.shiftKey) { e.preventDefault(); undo(); }
      if ((e.metaKey||e.ctrlKey) && (e.key==="y" || (e.key==="z"&&e.shiftKey))) { e.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [undo, redo]);

  // Close quality dropdown on outside click
  useEffect(() => {
    if (!showQual) return;
    const h = e => { if (qualRef.current && !qualRef.current.contains(e.target)) setShowQual(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [showQual]);

  // Load stored signature on mount
  useEffect(() => {
    const stored = localStorage.getItem("xtarc_default_sig");
    if (stored) setInv(p=>({...p,signatureDataUrl:stored}));
    else setInv(p=>({...p,signatureDataUrl:assets.sig}));
  }, []);
  useEffect(() => {
    localStorage.setItem("xtarc_ui_dark", JSON.stringify(dark));
  }, [dark]);

  const saveDefaultSig = dataUrl => {
    setInv(p=>({...p,signatureDataUrl:dataUrl}));
    if (dataUrl) localStorage.setItem("xtarc_default_sig", dataUrl);
    else localStorage.removeItem("xtarc_default_sig");
  };

  const loadScript = src => new Promise((res,rej) => {
    if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
    const s = document.createElement("script"); s.src=src; s.onload=res; s.onerror=rej;
    document.head.appendChild(s);
  });

  const handleExport = async () => {
    if (loading) return;
    setLoading(true);
    const el = document.getElementById("__pr__");
    if (!el) { setLoading(false); return; }

    // Move element to body to escape any CSS transform wrappers
    // This is the key fix for text distortion
    const originalParent = el.parentNode;
    const originalNextSibling = el.nextSibling;
    document.body.appendChild(el);
    el.style.cssText = "position:fixed;top:-99999px;left:0;width:794px;background:white;z-index:-1;";

    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js");
      const jsPDF = window.jspdf.jsPDF, h2c = window.html2canvas;

      // Wait for layout to settle
      await new Promise(r=>setTimeout(r,300));

      const sm={low:1.5,medium:2.5,high:3.5}, qm={low:0.65,medium:0.88,high:0.96};
      const scale=sm[inv.pdfQuality]||2.5, qual=qm[inv.pdfQuality]||0.88;
      const pgs = el.querySelectorAll(".iv-page");
      const pdf = new jsPDF({unit:"pt",format:"a4",orientation:"portrait"});
      const pW=pdf.internal.pageSize.getWidth(), pH=pdf.internal.pageSize.getHeight();

      for (let i=0;i<pgs.length;i++) {
        const canvas = await h2c(pgs[i], {
          scale,
          useCORS:true,
          allowTaint:true,
          backgroundColor:"#ffffff",
          logging:false,
          imageTimeout:0,
          onclone: (doc) => {
            // Hide all UI-only elements
            doc.querySelectorAll("[data-noprint]").forEach(n => { n.style.display="none"; });
            // Hide empty placeholder text in editable fields
            doc.querySelectorAll(".edit-placeholder").forEach(n => { n.style.display="none"; });
            // Clean up hover states
            doc.querySelectorAll(".row-hover-bg").forEach(n => { n.style.background="transparent"; });
            // Fix fonts — use system fonts which render correctly in canvas
            const s = doc.createElement("style");
            s.textContent = [
              "* { font-family: -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif !important; }",
              "[data-noprint] { display: none !important; }",
              ".edit-placeholder { display: none !important; }",
              "input, textarea { display: none !important; }",
              ".iv-page { transform: none !important; }",
              // Hide editable field borders in PDF
              ".editable-field { outline: none !important; background: transparent !important; padding: 0 !important; margin: 0 !important; }",
            ].join(" ");
            doc.head.appendChild(s);
          }
        });
        const imgData = canvas.toDataURL("image/jpeg", qual);
        const r=pW/canvas.width, h=Math.min(canvas.height*r,pH);
        if (i>0) pdf.addPage();
        pdf.addImage(imgData,"JPEG",0,0,pW,h);
      }
      pdf.save(`${inv.agencyName}_Invoice_${inv.invoiceNo.replace(/[^a-zA-Z0-9]/g,"_")}.pdf`);
    } catch(err) {
      console.error(err);
      alert("Export failed: " + err.message);
    } finally {
      // Restore element to original position
      el.style.cssText = "";
      if (originalNextSibling) {
        originalParent.insertBefore(el, originalNextSibling);
      } else {
        originalParent.appendChild(el);
      }
      setLoading(false);
    }
  };

  const QL = {low:"Low", medium:"Med", high:"High"};

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>
      <style>{`
        * { box-sizing: border-box; }
        body { margin:0; background:${UI.bg}; color:${UI.text}; font-family:Inter,system-ui,sans-serif; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:${dark ? "rgba(255,255,255,0.18)" : C.gray300}; border-radius:2px; }

        /* Mobile responsive */
        @media (max-width: 768px) {
          .topbar-hint { display: none !important; }
          .topbar-nav { gap: 2px !important; }
          .topbar-btn-label { display: none !important; }
          .invoice-scale-wrapper { transform: none !important; width: 100% !important; }
          .invoice-canvas-outer { padding: 12px 8px !important; }
        }
        @media (max-width: 480px) {
          .topbar-actions { gap: 4px !important; }
        }
      `}</style>

      {showTemplates && (
        <TemplatesModal inv={inv}
          ui={UI}
          onLoad={d=>setInv({...d,items:(d.items||[]).map(i=>({...i,id:uid()}))})}
          onClose={()=>setShowTemplates(false)}/>
      )}

      <div style={{minHeight:"100vh",background:`radial-gradient(circle at top left, ${dark ? "rgba(37,99,235,0.12)" : "rgba(37,99,235,0.06)"} 0, transparent 30%), ${UI.bg}`}}>

        {/* Top bar */}
        <div style={{
          minHeight:"56px",background:dark ? "rgba(5,6,8,0.9)" : "rgba(255,255,255,0.92)",borderBottom:`1px solid ${UI.border}`,
          backdropFilter:"blur(16px)",
          display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"0 16px",position:"sticky",top:0,zIndex:300,
          flexWrap:"wrap",gap:"8px",paddingTop:"8px",paddingBottom:"8px"}}>

          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            {assets.logo && <img src={assets.logo} alt="XTARC" style={{height:"26px",width:"26px",objectFit:"contain",borderRadius:"3px"}}/>}
            <div>
              <div style={{fontSize:"15px",fontWeight:600,color:UI.text}}>XTARC Invoice Builder</div>
              <div className="topbar-hint" style={{fontSize:"11px",color:UI.muted,marginTop:"2px",letterSpacing:"0.05em",textTransform:"uppercase"}}>Edit in place · export clean PDF</div>
            </div>
          </div>

          <div className="topbar-actions" style={{display:"flex",alignItems:"center",gap:"6px",flexWrap:"wrap"}}>
            <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={{...GBS(canUndo?"outline":"ghost"),padding:"5px 9px",fontSize:"14px"}}>↩</button>
            <button onClick={redo} disabled={!canRedo} title="Redo"          style={{...GBS(canRedo?"outline":"ghost"),padding:"5px 9px",fontSize:"14px"}}>↪</button>
            <div style={{width:"1px",height:"14px",background:UI.border,margin:"0 2px"}}/>
            <button onClick={()=>setDark(v=>!v)} style={{...GBS(dark?"dark":"outline"),fontSize:"12px"}}><span>{dark ? "☀" : "☾"}</span><span className="topbar-btn-label"> {dark ? "Light" : "Dark"}</span></button>
            <button onClick={()=>setShowTemplates(true)} style={{...GBS("outline"),fontSize:"12px"}}><span>📋</span><span className="topbar-btn-label"> Templates</span></button>
            <button onClick={()=>setShowSettings(s=>!s)} style={{...GBS(showSettings?"dark":"outline"),fontSize:"12px"}}><span>⚙</span><span className="topbar-btn-label"> Settings</span></button>
            {/* Export PDF + Quality split button */}
            <div ref={qualRef} style={{position:"relative",display:"flex"}}>
              <button onClick={handleExport} disabled={loading}
                style={{...GBS(loading?"ghost":"dark"),padding:"6px 14px",fontSize:"12px",
                  borderRadius:"7px 0 0 7px",borderRight:"1px solid rgba(255,255,255,0.12)",minWidth:"100px"}}>
                {loading ? "Generating…" : "Export PDF"}
              </button>
              <button onClick={()=>setShowQual(o=>!o)}
                style={{...GBS(loading?"ghost":"dark"),padding:"6px 9px",fontSize:"11px",
                  borderRadius:"0 7px 7px 0",borderLeft:"1px solid rgba(255,255,255,0.08)"}}>
                {QL[inv.pdfQuality]||"Med"} ▾
              </button>
              {showQual && (
                <div style={{position:"absolute",top:"calc(100% + 4px)",right:0,background:UI.panel,
                  border:`1px solid ${UI.border}`,borderRadius:"8px",
                  boxShadow:"0 12px 30px rgba(0,0,0,0.32)",zIndex:100,overflow:"hidden",minWidth:"170px"}}>
                  {[{v:"low",l:"Low quality",d:"Small file size"},{v:"medium",l:"Medium quality",d:"Recommended"},{v:"high",l:"High quality",d:"Sharp, larger file"}].map(({v,l,d})=>(
                    <button key={v} onClick={()=>{setInv(p=>({...p,pdfQuality:v}));setShowQual(false);}}
                      style={{display:"block",width:"100%",padding:"10px 14px",
                        background:inv.pdfQuality===v?UI.hover:"none",border:"none",
                        textAlign:"left",cursor:"pointer",fontFamily:"inherit",borderBottom:`1px solid ${UI.softBorder}`}}
                      onMouseEnter={e=>e.currentTarget.style.background=UI.hover}
                      onMouseLeave={e=>e.currentTarget.style.background=inv.pdfQuality===v?UI.hover:"none"}>
                      <div style={{fontSize:"12px",fontWeight:500,color:UI.text}}>{l}</div>
                      <div style={{fontSize:"11px",color:UI.muted}}>{d}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Invoice canvas */}
        <div className="invoice-canvas-outer" style={{padding:"32px 24px 40px",display:"flex",justifyContent:"center",overflowX:"auto"}}>
          <div style={{background:UI.panel,border:`1px solid ${UI.border}`,borderRadius:"18px",padding:"18px",
            boxShadow:dark ? "0 24px 70px rgba(0,0,0,0.45)" : "0 18px 45px rgba(15,23,42,0.08)"}}>
            <MobileScaler>
              <InvoiceCanvas inv={inv} set={setInv} allCurrencies={allCurrencies}
                LOGO_B64={assets.logo} SIG_B64_FALLBACK={assets.sig}/>
            </MobileScaler>
          </div>
        </div>
      </div>

      {/* Settings drawer */}
      {showSettings && <>
        <div onClick={()=>setShowSettings(false)}
          style={{position:"fixed",inset:0,background:UI.overlay,zIndex:499}}/>
        <SettingsDrawer inv={inv} set={(k,v)=>setInv(p=>({...p,[k]:v}))}
          ui={UI}
          allCurrencies={allCurrencies}
          onAddCurrency={({code,sym})=>{if(!allCurrencies.find(c=>c.code===code))setInv(p=>({...p,customCurrencies:[...(p.customCurrencies||[]),{code,sym}],currency:code}));}}
          onClose={()=>setShowSettings(false)}
          onSaveDefaultSig={saveDefaultSig}/>
      </>}
    </>
  );
}
