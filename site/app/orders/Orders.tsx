"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAccount, useSendTransaction, useSignMessage, useSwitchChain } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AGLAR, AG_SIRASI } from "@/lib/aglar";
import { complaintDraft, complaintFields, complaintAction, complaintMessage, COMPLAINT_PAYMENT_CHAIN, COMPLAINT_FEE, COMPLAINT_TREASURY, type ComplaintAction, type ComplaintDraft, type ComplaintFields, type ComplaintRecord } from "@/lib/complaints";
import { ComplaintCard, type ComplaintList } from "@/components/ComplaintRecords";
import ComplaintDetail from "./ComplaintDetail";
const blank: ComplaintFields = { requested:"",happened:"",problem:"",evidence:"" };
export function ComplaintInputs({ fields, setFields, disabled=false }: { fields: ComplaintFields; setFields:(v:ComplaintFields)=>void; disabled?:boolean }) {
  return <div className="space-y-5">{([
    ["requested","What did you request?",1500,"Describe the service or task you asked for."],
    ["happened","What happened?",2000,"Describe the response or outcome, including any relevant dates."],
    ["problem","Where was the problem?",1500,"Explain the specific issue and what resolution you want."],
    ["evidence","Evidence reference (optional)",1000,"Order number, public transaction hash or a public evidence reference. No secrets or customer data."],
  ] as const).map(([key,label,max,placeholder])=><label key={key} className="block text-sm font-medium">{label}<textarea className="girdi mt-2 min-h-24 w-full" value={fields[key]} disabled={disabled} maxLength={max} onChange={e=>setFields({...fields,[key]:e.target.value})} placeholder={placeholder}/><span className="mt-1 block text-right text-xs font-normal text-[var(--soluk)]">{key==="evidence"?"Optional":"At least 20 characters"} · {fields[key].length}/{max}</span></label>)}</div>;
}
export async function sendComplaintAction(action:ComplaintAction, sign:(message:string)=>Promise<`0x${string}`>) {
  const normalized=complaintAction.parse(action);
  const signature=await sign(complaintMessage(normalized));
  const r=await fetch("/api/complaints",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:normalized,signature})});
  const data=await r.json();if(!r.ok)throw new Error(data.error||"Could not save this action.");return data as {record:ComplaintRecord};
}
export default function Orders() {
  const params=useSearchParams();const router=useRouter();const cache=useQueryClient();const {address,chainId}=useAccount();
  const signer=useSignMessage();const switching=useSwitchChain();const sending=useSendTransaction();
  const [fields,setFields]=useState(blank);const [chain,setChain]=useState<ComplaintDraft["chain"]>((["sepolia","arbitrum","arc"].includes(params.get("chain")||"")?params.get("chain"):"arc") as ComplaintDraft["chain"]);
  const [agentId,setAgentId]=useState(params.get("agentId")||"");const [demo,setDemo]=useState(false);const [consent,setConsent]=useState(false);
  const [prepared,setPrepared]=useState<ComplaintRecord|null>(null);const [tx,setTx]=useState("");const [busy,setBusy]=useState("");const [error,setError]=useState("");const [notice,setNotice]=useState("");
  const [mine,setMine]=useState(false);const [filter,setFilter]=useState("all");const [page,setPage]=useState(1);
  const id=params.get("id");
  useEffect(()=>{
    queueMicrotask(()=>{
      setPrepared(null);setTx("");setError("");
      if(!address)return;
      try { const raw=localStorage.getItem(`nomen-complaint-recovery:${address.toLowerCase()}`);if(raw){const saved=JSON.parse(raw);if(saved.record?.initialDraft?.author===address.toLowerCase()){setPrepared(saved.record);setTx(saved.tx||"");}} } catch { /* Recovery is optional; the signed draft remains in the database. */ }
    });
  },[address]);
  const query=useQuery<ComplaintList>({queryKey:["complaints","orders",mine?address:"all",params.get("chain"),params.get("agentId"),filter,page],enabled:!id&&(!mine||!!address),queryFn:async()=>{
    const p=new URLSearchParams({status:filter,page:String(page)});if(mine&&address)p.set("author",address);if(params.get("chain"))p.set("chain",params.get("chain")!);if(params.get("agentId"))p.set("agentId",params.get("agentId")!);
    const r=await fetch(`/api/complaints?${p}`);if(!r.ok)throw new Error();return r.json();
  },retry:false});
  const sign=(message:string)=>signer.signMessageAsync({message,account:address});
  function saveRecovery(record:ComplaintRecord, hash:string){try{localStorage.setItem(`nomen-complaint-recovery:${record.author}`,JSON.stringify({record,tx:hash}));}catch{setNotice("Browser recovery is unavailable. Keep the payment hash before closing this page.");}}
  async function prepare(){
    if(!address)return;setError("");setBusy("Confirm the draft in your wallet…");
    try {
      const draft=complaintDraft.parse({...fields,id:crypto.randomUUID(),author:address,chain,agentId:Number(agentId),demo});
      const {record}=await sendComplaintAction({type:"prepare",draft,timestamp:Date.now()},sign);
      if(record.paymentTx){router.push(`/orders?id=${record.id}`);return;}
      setPrepared(record);setTx("");saveRecovery(record,"");setNotice("Your reserved draft is shown below. If this wallet already had a draft for this agent, that existing draft is restored. Review it before paying.");
    }catch(e){setError(e instanceof Error?e.message:"Could not prepare the draft.");}finally{setBusy("");}
  }
  async function publish(hash:string){
    if(!prepared||!address)return;setBusy("Confirm publication in your wallet…");setError("");
    try{const {record}=await sendComplaintAction({type:"publish",id:prepared.id,author:address.toLowerCase(),transaction:hash.toLowerCase(),timestamp:Date.now()},sign);try{localStorage.removeItem(`nomen-complaint-recovery:${record.author}`);}catch{}setPrepared(null);setTx("");await cache.invalidateQueries({queryKey:["complaints"]});router.push(`/orders?id=${record.id}`);}catch(e){setError(e instanceof Error?e.message:"Publication failed. Retry with the same hash; do not pay again.");}finally{setBusy("");}
  }
  async function pay(){
    if(!prepared||!address)return;setError("");setBusy("Approve 5 test USDC in your wallet…");
    try{
      const refreshed=await sendComplaintAction({type:"prepare",draft:prepared.initialDraft,timestamp:Date.now()},sign);
      if(refreshed.record.paymentTx){router.push(`/orders?id=${refreshed.record.id}`);return;}
      if(refreshed.record.commitment!==prepared.commitment){setPrepared(refreshed.record);saveRecovery(refreshed.record,"");setNotice("The reserved draft was restored from the server. Review it before paying.");return;}
      const hash=await sending.sendTransactionAsync({account:prepared.author as `0x${string}`,chainId:COMPLAINT_PAYMENT_CHAIN,to:COMPLAINT_TREASURY,value:BigInt(COMPLAINT_FEE),data:refreshed.record.commitment as `0x${string}`});setTx(hash);saveRecovery(prepared,hash);setNotice("Payment sent. Wait for confirmation, then choose Verify payment & publish. Keep this hash if you close the page.");}catch(e){setError(e instanceof Error?e.message:"Payment was not sent.");}finally{setBusy("");}
  }
  if(id)return <ComplaintDetail id={id}/>;
  return <main className="mx-auto max-w-6xl px-5 py-10">
    <p className="text-xs uppercase tracking-widest text-[var(--soluk)]">Orders · publication records</p><h1 className="mt-3 text-4xl tracking-tight">Make an issue visible.<br/>Keep the resolution visible, too.</h1>
    <p className="mt-5 max-w-3xl text-[var(--soluk)]">File one complaint per wallet and agent. The publication fee covers future edits, provider replies and resolution updates. These are complaint publication orders, not orders for an agent’s service.</p>
    <div className="mt-6 rounded-xl bg-amber-50 p-5 text-sm text-amber-950"><strong>Testnet only · 5 test USDC on Arc Testnet, plus gas.</strong><p className="mt-2">No real dollars are charged. Payment discourages casual spam; it does not prove a purchase, service use or the truth of a claim. No complaints does not mean good performance.</p></div>
    <div className="mt-10 grid items-start gap-8 lg:grid-cols-[1.05fr_1fr]">
      <section className="rounded-2xl border border-[var(--cizgi)] p-5 sm:p-7"><h2 className="text-xl font-medium">{prepared?"Your reserved publication":"File a complaint"}</h2>
        {!prepared?<><div className="my-5 grid gap-4 sm:grid-cols-2"><label className="text-sm">Agent network<select className="girdi mt-2 w-full" value={chain} onChange={e=>setChain(e.target.value as ComplaintDraft["chain"])}>{AG_SIRASI.map(k=><option key={k} value={k}>{AGLAR[k].ad}</option>)}</select></label><label className="text-sm">Agent ID<input className="girdi mt-2 w-full" inputMode="numeric" value={agentId} onChange={e=>setAgentId(e.target.value.replace(/\D/g,""))}/></label></div>
        <ComplaintInputs fields={fields} setFields={setFields} disabled={!!busy}/><p className="mt-3 text-xs text-[var(--soluk)]">Evidence references are user-supplied and unverified. Do not include private messages, personal information, passwords or API keys.</p>
        <label className="mt-5 flex items-start gap-2 text-sm"><input type="checkbox" checked={demo} onChange={e=>setDemo(e.target.checked)}/>This is a synthetic TEST record, not a real complaint.</label>
        <label className="mt-4 flex items-start gap-2 text-sm"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/>I agree to publish these statements and evidence references publicly. The publication fee is non-refundable and is not a donation.</label>
        <button className="dugme dugme-koyu mt-5" disabled={!address||!consent||!!busy||!complaintFields.safeParse(fields).success||!Number.isSafeInteger(Number(agentId))||Number(agentId)<1} onClick={prepare}>Sign & prepare · no fee yet</button>
        {!address&&<p className="mt-3 text-sm">Connect a wallet using the button above.</p>}</>:<>
          <p className="mt-3 text-sm">{AGLAR[prepared.chain].ad} · Agent #{prepared.agentId}{prepared.demo?" · TEST":""}</p>
          <div className="mt-5 space-y-4 text-sm">{(["requested","happened","problem","evidence"] as const).map(key=>[key,prepared.fields[key]] as const).map(([key,value])=>value&&<div key={key}><h3 className="font-medium">{key==="requested"?"What you requested":key==="happened"?"What happened":key==="problem"?"The problem":"Evidence reference (unverified)"}</h3><p className="mt-1 whitespace-pre-wrap break-words leading-6">{value}</p></div>)}</div>
          <p className="mt-5 text-xs text-[var(--soluk)]">This draft is reserved for your wallet. The payment binds this original text; later signed edits stay in the record history. Your fee covers updates.</p>
          <p className="mt-3 break-all text-xs">Recipient: {COMPLAINT_TREASURY}</p>
          {chainId!==COMPLAINT_PAYMENT_CHAIN?<button className="dugme mt-4" disabled={!!busy||switching.isPending} onClick={()=>switching.switchChain({chainId:COMPLAINT_PAYMENT_CHAIN})}>Switch to Arc Testnet</button>:<button className="dugme dugme-koyu mt-4" disabled={!!busy||!!tx||prepared.author!==address?.toLowerCase()} onClick={pay}>Pay 5 test USDC publication fee</button>}
          <label className="mt-5 block text-sm">Already paid? Restore your Arc transaction hash<input className="girdi mt-2 w-full font-mono text-xs" value={tx} onChange={e=>{setTx(e.target.value);saveRecovery(prepared,e.target.value);}} placeholder="0x…"/></label>
          <button className="dugme mt-3" disabled={!!busy||!/^0x[0-9a-fA-F]{64}$/.test(tx)||prepared.author!==address?.toLowerCase()} onClick={()=>publish(tx)}>Verify payment & publish</button>
          {/^0x[0-9a-fA-F]{64}$/.test(tx)&&<a className="mt-3 block text-sm underline" href={`https://testnet.arcscan.app/tx/${tx}`} target="_blank" rel="noopener noreferrer">Check payment confirmation ↗</a>}
        </>}
        {busy&&<p className="mt-4 text-sm" role="status">{busy}</p>}{notice&&<p className="mt-4 text-sm" role="status">{notice}</p>}{(error||switching.error)&&<p className="mt-4 break-words text-sm text-red-700" role="alert">{error||"Network switch failed. Try again in your wallet."}</p>}
      </section>
      <section><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-xl font-medium">Complaint records</h2><button className="dugme" disabled={!address} onClick={()=>{setMine(!mine);setPage(1);}}>{mine?"Show all":"My records"}</button></div>
      {params.get("agentId")&&<p className="mt-3 text-sm">Filtered to {params.get("chain")} · Agent #{params.get("agentId")}. <Link className="underline" href="/orders">Clear filter</Link></p>}
      {query.data&&<p className="mt-4 text-sm">{query.data.open} open · {query.data.resolved} resolved · {query.data.flagged} flagged <span className="text-[var(--soluk)]">(excludes demos)</span></p>}
      <label className="my-4 block text-sm">Show<select className="girdi ml-3" value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}}><option value="all">All records</option><option value="open">Open</option><option value="resolved">Resolved</option><option value="flagged">Flagged for review</option></select></label>
      {query.isPending&&<p role="status">Loading records…</p>}{query.isError&&<p role="alert">Records unavailable. <button className="underline" onClick={()=>query.refetch()}>Retry</button></p>}
      {query.data?.total===0&&<div className="rounded-xl border border-dashed border-[var(--cizgi)] p-6 text-sm">No complaint records found. This is not an endorsement of an agent.</div>}
      <div className="space-y-4">{query.data?.records.map(r=><ComplaintCard key={r.id} record={r}/>)}</div>
      {(query.data?.pages||0)>1&&<div className="mt-5 flex gap-3"><button className="dugme" disabled={page===1} onClick={()=>setPage(page-1)}>Previous</button><span>{page}/{query.data?.pages}</span><button className="dugme" disabled={page>=query.data!.pages} onClick={()=>setPage(page+1)}>Next</button></div>}
      </section>
    </div>
  </main>;
}
