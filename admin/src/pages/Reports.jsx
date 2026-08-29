import {useEffect,useMemo,useState} from 'react';
import {adminApi} from '../api';
import '../report-center.css';

const money=n=>`₹${Number(n||0).toLocaleString('en-IN',{maximumFractionDigits:2})}`;
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const dateTime=value=>new Date(value).toLocaleString('en-IN',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});
const pct=n=>`${Number(n||0).toFixed(1)}%`;
const escapeCsv=value=>`"${String(value??'').replaceAll('"','""')}"`;

function shiftAnchor(anchor,period,direction){
  const [y,m,d]=anchor.split('-').map(Number);const x=new Date(Date.UTC(y,m-1,d));
  if(period==='daily')x.setUTCDate(x.getUTCDate()+direction);
  else if(period==='weekly')x.setUTCDate(x.getUTCDate()+direction*7);
  else if(period==='monthly')x.setUTCMonth(x.getUTCMonth()+direction,1);
  else x.setUTCFullYear(x.getUTCFullYear()+direction,0,1);
  return `${x.getUTCFullYear()}-${String(x.getUTCMonth()+1).padStart(2,'0')}-${String(x.getUTCDate()).padStart(2,'0')}`;
}

export default function Reports(){
  const [period,setPeriod]=useState('daily');const [anchor,setAnchor]=useState(today);const [active,setActive]=useState('sales');const [data,setData]=useState(null);const [loading,setLoading]=useState(true);const [error,setError]=useState('');
  useEffect(()=>{let live=true;setLoading(true);setError('');adminApi(`/admin/reports?period=${period}&anchor=${anchor}`).then(d=>{if(live)setData(d)}).catch(e=>{if(live)setError(e.message)}).finally(()=>{if(live)setLoading(false)});return()=>{live=false}},[period,anchor]);

  const cards=useMemo(()=>{
    if(!data)return[];const s=data.summary;
    if(active==='profit')return [['Gross Profit',money(s.profit.gross),'Product margin after discounts'],['Online Profit',money(s.profit.online),'Online orders'],['POS Profit',money(s.profit.pos),'Walk-in shop bills'],['Product Cost',money(s.profit.totalCost),'Cost of goods sold'],['Margin',pct(s.profit.marginPercent),'Gross profit / product revenue']];
    if(active==='expenses')return [['Total Expense',money(s.expenses.total),'Cash Management expenses'],['Expense Entries',s.expenses.entries,'Entries in selected period'],['Average Expense',money(s.expenses.average),'Average per expense entry'],['Stock Cost',money(s.stock.cost),'Current inventory snapshot'],['Stock Retail',money(s.stock.retail),'Current selling-value snapshot']];
    if(active==='cash')return [['Cash / Funds In',money(s.cash.income),'Recorded income ledger'],['Cash / Funds Out',money(s.cash.expense),'Recorded expense ledger'],['Net Cash Movement',money(s.cash.net),'Income minus expense'],['Ledger Entries',s.cash.entries,'Selected period'],['Sales Reference',money(s.sales.total),'Sales report for same period']];
    return [['Total Sales',money(s.sales.total),'Online + paid POS'],['Online Sales',money(s.sales.online),'Customer website orders'],['POS / Shop Sales',money(s.sales.pos),'Paid counter bills'],['Transactions',s.sales.transactions,'All sales bills'],['Average Bill',money(s.sales.averageBill),'Sales / transactions']];
  },[active,data]);

  const rows=useMemo(()=>data?.[active]||[],[data,active]);
  const tabNames={sales:'Sales Report',profit:'Profit Report',expenses:'Expense Report',cash:'Cash Report'};
  function downloadCsv(){
    if(!data)return;let header=[],body=[];
    if(active==='sales'){header=['Date','Reference','Channel','Customer','Payment Method','Payment Status','Order Status','Amount'];body=rows.map(r=>[dateTime(r.date),r.reference,r.channel,r.customer,r.paymentMethod,r.paymentStatus,r.status,r.sales])}
    else if(active==='profit'){header=['Date','Reference','Channel','Product Revenue','Cost','Gross Profit','Margin %'];body=rows.map(r=>[dateTime(r.date),r.reference,r.channel,r.productRevenue,r.cost,r.profit,r.marginPercent])}
    else if(active==='expenses'){header=['Date','Category','Note','Amount'];body=rows.map(r=>[dateTime(r.date),r.category,r.note,r.amount])}
    else{header=['Date','Type','Category','Note','Amount'];body=rows.map(r=>[dateTime(r.date),r.type,r.category,r.note,r.amount])}
    const csv='\uFEFF'+[header,...body].map(row=>row.map(escapeCsv).join(',')).join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`SBN-Kirana-${active}-${data.range.startDay}-to-${data.range.endDay}.csv`;a.click();URL.revokeObjectURL(url);
  }
  function printReport(){const old=document.title;document.title=`SBN Kirana - ${tabNames[active]} - ${data?.range?.label||''}`;window.print();setTimeout(()=>{document.title=old},250)}
  function periodInput(){
    if(period==='monthly')return <input type="month" value={anchor.slice(0,7)} onChange={e=>e.target.value&&setAnchor(`${e.target.value}-01`)}/>;
    if(period==='yearly')return <input type="number" min="2020" max="2100" value={anchor.slice(0,4)} onChange={e=>{const y=String(e.target.value).slice(0,4);if(y.length===4)setAnchor(`${y}-01-01`)}}/>;
    return <input type="date" value={anchor} onChange={e=>e.target.value&&setAnchor(e.target.value)}/>;
  }

  return <div className="report-center">
    <div className="admin-title report-title"><div><small>BUSINESS REPORTING</small><h1>Sales & Profit Reports</h1><p>Separate Sales, Profit, Expense and Cash reports with period-wise printable records.</p></div><div className="report-period-badge"><small>REPORT PERIOD</small><b>{data?.range?.label||'Loading...'}</b></div></div>

    <section className="panel report-controls">
      <div className="report-control-left"><div className="report-period-tabs">{['daily','weekly','monthly','yearly'].map(p=><button type="button" key={p} className={period===p?'active':''} onClick={()=>setPeriod(p)}>{p[0].toUpperCase()+p.slice(1)}</button>)}</div><button type="button" className="report-nav-button" onClick={()=>setAnchor(a=>shiftAnchor(a,period,-1))}>‹</button><label className="report-date-control"><span>{period==='weekly'?'DATE IN WEEK':period.toUpperCase()}</span>{periodInput()}</label><button type="button" className="report-nav-button" onClick={()=>setAnchor(a=>shiftAnchor(a,period,1))}>›</button><button type="button" className="report-nav-button" onClick={()=>setAnchor(today())}>Today</button></div>
      <div className="report-actions"><button type="button" className="secondary" onClick={downloadCsv} disabled={!data}>↓ Download CSV</button><button type="button" className="primary" onClick={printReport} disabled={!data}>⎙ Print / Save PDF</button></div>
    </section>

    <div className="report-tabs">{[['sales','Sales Report','Orders & shop bills'],['profit','Profit Report','Revenue, cost & margin'],['expenses','Expense Report','Expense ledger'],['cash','Cash Report','Income & expense movement']].map(([key,label,sub])=><button type="button" key={key} className={active===key?'active':''} onClick={()=>setActive(key)}>{label}<small>{sub}</small></button>)}</div>

    {error&&<div className="report-error">{error}</div>}
    {loading?<div className="panel report-loading">Loading {period} reports...</div>:data&&<>
      <div className="report-summary-grid">{cards.map(([label,value,sub])=><div className="report-summary-card" key={label}><small>{label}</small><strong>{value}</strong><span>{sub}</span></div>)}</div>

      {active==='expenses'&&data.expenseByCategory?.length>0&&<section className="panel expense-category-section"><h3>Expense by category</h3><div className="expense-category-grid">{data.expenseByCategory.map(x=><div key={x.category}><small>{x.category}</small><b>{money(x.total)}</b></div>)}</div></section>}

      <section className="panel report-table-panel">
        <div className="report-table-head"><div><h2>{tabNames[active]}</h2><p>{data.range.label} · SBN KIRANA AND GROCERY</p></div><span>{rows.length} record{rows.length===1?'':'s'}</span></div>
        <div className="report-table-wrap">{rows.length===0?<div className="report-empty"><b>No records for this period</b><span>Choose another day, week, month or year.</span></div>:active==='sales'?<table className="report-data-table"><thead><tr><th>Date</th><th>Reference</th><th>Channel</th><th>Customer</th><th>Payment</th><th>Status</th><th className="money-cell">Sales</th></tr></thead><tbody>{rows.map((r,i)=><tr key={`${r.reference}-${i}`}><td>{dateTime(r.date)}</td><td><strong>{r.reference}</strong></td><td><span className={`report-channel ${r.channel.startsWith('POS')?'pos':''}`}>{r.channel}</span></td><td>{r.customer}</td><td>{r.paymentMethod}<br/><small>{r.paymentStatus}</small></td><td>{r.status}</td><td className="money-cell">{money(r.sales)}</td></tr>)}</tbody></table>:active==='profit'?<table className="report-data-table"><thead><tr><th>Date</th><th>Reference</th><th>Channel</th><th className="money-cell">Product Revenue</th><th className="money-cell">Cost</th><th className="money-cell">Gross Profit</th><th className="money-cell">Margin</th></tr></thead><tbody>{rows.map((r,i)=><tr key={`${r.reference}-${i}`}><td>{dateTime(r.date)}</td><td><strong>{r.reference}</strong></td><td><span className={`report-channel ${r.channel.startsWith('POS')?'pos':''}`}>{r.channel}</span></td><td className="money-cell">{money(r.productRevenue)}</td><td className="money-cell">{money(r.cost)}</td><td className={`money-cell ${r.profit>=0?'report-positive':'report-negative'}`}>{money(r.profit)}</td><td className="money-cell">{pct(r.marginPercent)}</td></tr>)}</tbody></table>:active==='expenses'?<table className="report-data-table"><thead><tr><th>Date</th><th>Category</th><th>Note</th><th className="money-cell">Expense</th></tr></thead><tbody>{rows.map((r,i)=><tr key={`${r.date}-${i}`}><td>{dateTime(r.date)}</td><td><strong>{r.category}</strong></td><td>{r.note||'—'}</td><td className="money-cell report-negative">{money(r.amount)}</td></tr>)}</tbody></table>:<table className="report-data-table"><thead><tr><th>Date</th><th>Type</th><th>Category</th><th>Note</th><th className="money-cell">Amount</th></tr></thead><tbody>{rows.map((r,i)=><tr key={`${r.date}-${i}`}><td>{dateTime(r.date)}</td><td><span className={`report-entry-type ${r.type}`}>{r.type}</span></td><td><strong>{r.category}</strong></td><td>{r.note||'—'}</td><td className={`money-cell ${r.type==='income'?'report-positive':'report-negative'}`}>{r.type==='income'?'+':'−'} {money(r.amount)}</td></tr>)}</tbody></table>}</div>
      </section>

      <div className="report-stock-strip"><span>Current inventory cost <b>{money(data.summary.stock.cost)}</b></span><span>Current inventory retail value <b>{money(data.summary.stock.retail)}</b></span></div>
      <div className="report-footnote"><span>Sales excludes cancelled/refunded transactions. Profit uses item selling value minus recorded product cost and bill discounts.</span><span>Cash Report is based on Cash Management ledger entries. Generated {new Date().toLocaleString('en-IN')}.</span></div>
    </>}
  </div>;
}
