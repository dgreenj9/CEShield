'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { PLAN_KEY, EMPTY_PLAN, PROFESSIONS, US_STATES, normalizePlan, resolvePlan, acceptanceFor } from '@/utils/educationPlanning';
import { A, FIG, INS } from '@/components/atlas/theme';
const button = {padding:'9px 12px',border:`1px solid ${A.ruleMinor}`,background:A.paper,color:A.accent,font:`600 13px ${FIG}`,cursor:'pointer'};
const input = {padding:9,border:`1px solid ${A.ruleMinor}`,background:A.paper,color:A.ink,maxWidth:'100%',font:`14px ${FIG}`};
export function useLearningPlan() {
  const [plan,setPlan] = useState(EMPTY_PLAN);
  const [ready,setReady] = useState(false);
  const [error,setError] = useState('');
  useEffect(()=>{try {const raw=localStorage.getItem(PLAN_KEY);if(raw)setPlan(normalizePlan(JSON.parse(raw)));}catch {setError('Your saved plan could not be read. Changes in this session may not persist.');}setReady(true);},[]);
  function save(next) {const clean=normalizePlan(next);setPlan(clean);try {localStorage.setItem(PLAN_KEY,JSON.stringify(clean));setError('');}catch {setError('Browser storage is unavailable. Export your plan to keep a copy.');}}
  function toggle(course) {
    const ids=[course.id,...(course.aliases||[])];
    const selected=plan.items.some(x=>ids.includes(x.courseId));
    if(!selected && plan.items.length>=100){setError('Your plan can hold up to 100 courses. Remove one before adding another.');return;}
    save({...plan,items:selected?plan.items.filter(x=>!ids.includes(x.courseId)):[...plan.items,{courseId:course.id,targetDate:'',note:''}]});
  }
  return {plan,ready,error,save,toggle};
}
export default function LearningPlan({courses, state}) {
  const {plan,save,error,ready}=state;
  const rows=resolvePlan(plan,courses);
  const total=rows.reduce((n,x)=>n+(x.course?.contactHours||0),0);
  function change(id,values){save({...plan,items:plan.items.map(x=>x.courseId===id?{...x,...values}:x)});}
  function download(){const blob=new Blob([JSON.stringify({...plan,exportedOn:new Date().toISOString(),courses:rows.map(x=>({courseId:x.courseId,title:x.course?.title||null,url:x.course?.url||null,acceptance:acceptanceFor(x.course||{}, {profession:plan.profession,jurisdiction:plan.jurisdiction,date:x.targetDate})}))},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='ce-shield-learning-plan.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  return <section aria-label="Learning plan"><h2 style={{fontFamily:INS,fontSize:26}}>Your learning plan</h2><p>Saved in this browser. Planned courses do not count as completed CE. Export a copy to keep or share your plan.</p>{error&&<p role="alert">{error}</p>}
    <div style={{display:'flex',gap:16,flexWrap:'wrap',alignItems:'end',marginBottom:20}}>
      <label>Profession<br/><select aria-label="Plan profession" style={input} value={plan.profession} onChange={e=>save({...plan,profession:e.target.value})}><option value="">Choose</option>{PROFESSIONS.map(x=><option key={x}>{x}</option>)}</select></label>
      <label>License state<br/><select aria-label="Plan state" style={input} value={plan.jurisdiction} onChange={e=>save({...plan,jurisdiction:e.target.value})}><option value="">Choose</option>{US_STATES.map(x=><option key={x}>{x}</option>)}</select></label>
      <button style={button} disabled={!ready} onClick={download}>Export plan</button>
    </div>
    <p style={{fontSize:13,color:A.inkMuted}}>The course log currently supports PT and OT profiles. All listed professions can save and export a learning plan here.</p>
    <p>{rows.length} planned courses · {total} known provider-listed hours · {rows.filter(x=>x.course?.contactHours==null).length} with hours still to check. These are planning totals, not accepted CE totals.</p>
    {!rows.length&&<p>Select Save to plan on a course card to begin.</p>}
    {rows.map(({courseId,course,targetDate,note})=>{const acceptance=acceptanceFor(course||{}, {profession:plan.profession,jurisdiction:plan.jurisdiction,date:targetDate});return <article key={courseId} style={{padding:20,marginBottom:16,border:`1px solid ${A.ruleMinor}`,background:A.paper}}>
      <h3 style={{fontFamily:INS,marginTop:0}}>{course?.title||'Listing no longer available in the catalog'}</h3>
      {course&&<p>{course.providerName} · <a href={course.url} target="_blank" rel="noopener noreferrer">Provider details ↗</a></p>}
      <div style={{display:'flex',gap:16,flexWrap:'wrap'}}><label>Planned date<br/><input aria-label={`Planned date for ${course?.title||courseId}`} type="date" style={input} value={targetDate} onChange={e=>change(courseId,{targetDate:e.target.value})}/></label><label style={{flex:'1 1 220px'}}>Notes<br/><textarea aria-label={`Plan notes for ${course?.title||courseId}`} style={{...input,width:'100%'}} maxLength={1000} value={note} onChange={e=>change(courseId,{note:e.target.value})}/></label></div>
      <p>{acceptance.message}{acceptance.sourceUrl&&<> <a href={acceptance.sourceUrl} target="_blank" rel="noopener noreferrer">Acceptance source ↗</a></>}</p>
      {course?.ceClaims?.map(claim=><p key={claim.sourceUrl+claim.authority} style={{fontSize:13}}>Provider reports {claim.units} {claim.authority} CEUs. This is not a state-license acceptance decision. <a href={claim.sourceUrl} target="_blank" rel="noopener noreferrer">Source ↗</a></p>)}
      <div style={{display:'flex',gap:12,flexWrap:'wrap'}}><button style={button} onClick={()=>save({...plan,items:plan.items.filter(x=>x.courseId!==courseId)})}>Remove from plan</button>{course&&['','PT','OT'].includes(plan.profession)&&<Link style={{...button,textDecoration:'none'}} href={`/courses?catalogCourse=${encodeURIComponent(course.id)}`}>Log after completion →</Link>}</div>
    </article>;})}
  </section>;
}
