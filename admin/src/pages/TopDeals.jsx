import {useEffect,useMemo,useState} from 'react';
import {adminApi} from '../api';
import '../top-deals-admin.css';

const RAILS=[
  ['hot_deals','🔥','Hot Deals'],['trending','⚡','Trending'],['best_value','₹','Best Value'],['top_picks','★','Top Picks'],['daily_essentials','🛒','Daily Essentials'],['staples','🌾','Staples'],['dairy','🥛','Dairy'],['snacks','🍪','Snacks & Beverages'],['home_care','🧼','Home & Personal Care']
];
const BADGES=[['none','No badge'],['limited','Limited Stock'],['selling_fast','Selling Fast'],['few_left','Few Left'],['in_stock','In Stock'],['popular','Popular choice'],['fresh','Fresh arrival'],['best_value','Best value'],['hot_deal','Hot deal'],['trending','Trending now'],['today_pick',"Today's pick"]];
const normalize=p=>({dealRails:Array.isArray(p.dealRails)?p.dealRails:[],dealPriority:Number(p.dealPriority)||0,dealLabel:p.dealLabel||'',customerBadge:p.customerBadge||'none'});

export default function TopDeals(){
  const [products,setProducts]=useState([]);const [drafts,setDrafts]=useState({});const [search,setSearch]=useState('');const [saving,setSaving]=useState('');const [message,setMessage]=useState('');const [error,setError]=useState('');
  async function load(){try{const rows=await adminApi('/admin/products');setProducts(rows);setDrafts(Object.fromEntries(rows.map(p=>[p._id,normalize(p)])))}catch(e){setError(e.message)}}
  useEffect(()=>{load()},[]);
  const filtered=useMemo(()=>{const q=search.trim().toLowerCase();return !q?products:products.filter(p=>`${p.name} ${p.category} ${p.brand||''}`.toLowerCase().includes(q))},[products,search]);
  const counts=useMemo(()=>Object.fromEntries(RAILS.map(([key])=>[key,products.filter(p=>(drafts[p._id]?.dealRails||[]).includes(key)).length])),[products,drafts]);
  function patch(id,next){setDrafts(d=>({...d,[id]:{...d[id],...next}}))}
  function toggleRail(id,key){const current=drafts[id]?.dealRails||[];patch(id,{dealRails:current.includes(key)?current.filter(x=>x!==key):[...current,key]})}
  function smartFill(p){const rails=[];if((p.discount||0)>=8)rails.push('hot_deals');if(p.featured)rails.push('top_picks','trending');if((p.discount||0)>0)rails.push('best_value');if(['Staples','Cooking','Household','Home Care'].includes(p.category))rails.push('daily_essentials');if(['Staples','Cooking'].includes(p.category))rails.push('staples');if(['Dairy','Tea & Breakfast'].includes(p.category))rails.push('dairy');if(['Snacks','Beverages'].includes(p.category))rails.push('snacks');if(['Home Care','Personal Care','Household','Baby Care'].includes(p.category))rails.push('home_care');patch(p._id,{dealRails:[...new Set(rails)],dealPriority:Math.min(100,Math.max(10,p.discount||0)+(p.featured?25:0)),customerBadge:p.featured?'today_pick':((p.discount||0)>=10?'hot_deal':drafts[p._id]?.customerBadge||'none')})}
  async function save(p){setSaving(p._id);setMessage('');setError('');try{const d=drafts[p._id]||normalize(p);await adminApi(`/admin/products/${p._id}`,{method:'PUT',body:JSON.stringify({dealRails:d.dealRails,dealPriority:Number(d.dealPriority)||0,dealLabel:String(d.dealLabel||'').trim(),customerBadge:d.customerBadge})});setMessage(`${p.name} merchandising updated`);await load()}catch(e){setError(e.message)}finally{setSaving('')}}

  return <><div className="admin-title"><div><small>MERCHANDISING CONTROL</small><h1>Top Deals Manager</h1><p>Control which products appear in each customer-facing deal rail on mobile and desktop.</p></div><span>{products.length} products</span></div>
    {message&&<div className="admin-note">✓ {message}</div>}{error&&<div className="admin-alert">{error}</div>}
    <section className="panel deal-admin-summary"><div><small>STORE STRATEGY</small><h2>Independent deal rails</h2><p>One product can appear in multiple rails. Higher priority products appear earlier.</p></div><div className="deal-admin-counts">{RAILS.map(([key,icon,label])=><span key={key}><b>{icon} {counts[key]||0}</b><small>{label}</small></span>)}</div></section>
    <section className="panel deal-admin-tools"><div><h2>Product merchandising</h2><p>Assign rails, badge, priority and a short customer-facing marketing line.</p></div><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search product or category..."/></section>
    <div className="deal-admin-list">{filtered.map(p=>{const d=drafts[p._id]||normalize(p);return <article className="panel deal-admin-card" key={p._id}>
      <div className="deal-admin-product"><img src={p.image} alt={p.name}/><div><b>{p.name}</b><span>{p.category} · {p.unit}</span><small>₹{p.price}{p.mrp>p.price?` · ${p.discount}% off`:''} · Admin stock: {p.stock} {p.stockUnit||'qty'}</small></div></div>
      <div className="deal-admin-fields"><label>Customer badge<select value={d.customerBadge} onChange={e=>patch(p._id,{customerBadge:e.target.value})}>{BADGES.map(([v,l])=><option value={v} key={v}>{l}</option>)}</select></label><label>Display priority<input type="number" min="0" max="100" value={d.dealPriority} onChange={e=>patch(p._id,{dealPriority:e.target.value})}/><small>100 = first, 0 = normal</small></label><label className="deal-label-field">Marketing line<input maxLength="80" value={d.dealLabel} onChange={e=>patch(p._id,{dealLabel:e.target.value})} placeholder="Example: Weekend favourite"/><small>Optional. Customer sees this instead of internal stock quantity.</small></label></div>
      <div className="deal-rail-selector">{RAILS.map(([key,icon,label])=><label className={(d.dealRails||[]).includes(key)?'selected':''} key={key}><input type="checkbox" checked={(d.dealRails||[]).includes(key)} onChange={()=>toggleRail(p._id,key)}/><span>{icon}</span><b>{label}</b></label>)}</div>
      <div className="deal-admin-actions"><button type="button" className="deal-smart" onClick={()=>smartFill(p)}>✨ Smart fill</button><button type="button" className="deal-save" disabled={saving===p._id} onClick={()=>save(p)}>{saving===p._id?'Saving...':'Save merchandising'}</button></div>
    </article>})}{!filtered.length&&<div className="panel deal-admin-empty">No matching products.</div>}</div>
  </>;
}
