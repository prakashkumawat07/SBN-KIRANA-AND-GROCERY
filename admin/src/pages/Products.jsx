import {useEffect,useState} from 'react';
import {adminApi} from '../api';
import '../products-admin.css';

const CATEGORIES=['Staples','Dairy','Snacks','Cooking','Beverages','Personal Care','Home Care','Household','Baby Care','Other'];
const STOCK_UNITS=['qty','kg','g','ltr','ml','pack'];
const CUSTOMER_BADGES=[['none','No customer stock badge'],['limited','Limited stock · Order soon'],['selling_fast','Selling fast'],['popular','Popular choice'],['fresh','Fresh arrival'],['best_value','Best value']];
const makeBlank=()=>({name:'',brand:'',sku:'',barcode:'',category:'Staples',price:'',mrp:'',costPrice:'',unit:'1 kg',stock:'',stockUnit:'qty',lowStockThreshold:10,customerBadge:'none',description:'',tags:'',featured:false,images:[]});
const imageSrc=img=>typeof img==='string'?img:img?.src||'';
const imageThumb=img=>typeof img==='string'?img:img?.thumbnail||img?.src||'';

function loadImage(file){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file);const img=new Image();
    img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not read image'))};
    img.src=url;
  });
}

async function imageVariant(file,maxSide,quality,maxChars){
  const img=await loadImage(file);
  const scale=Math.min(1,maxSide/Math.max(img.naturalWidth,img.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
  const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);
  let q=quality;let data=canvas.toDataURL('image/webp',q);
  while(data.length>maxChars&&q>0.42){q-=0.08;data=canvas.toDataURL('image/webp',q)}
  if(data.length>maxChars)throw new Error('One image is still too large after compression. Choose a smaller image.');
  return data;
}

export default function Products(){
  const [items,setItems]=useState([]);const [form,setForm]=useState(makeBlank);const [edit,setEdit]=useState(null);const [imageUrl,setImageUrl]=useState('');const [busy,setBusy]=useState(false);const [uploadBusy,setUploadBusy]=useState(false);const [error,setError]=useState('');
  const load=()=>adminApi('/admin/products').then(setItems).catch(e=>setError(e.message));
  useEffect(()=>{load()},[]);

  function reset(){setForm(makeBlank());setEdit(null);setImageUrl('');setError('')}
  function normalizeImages(p){
    const rows=Array.isArray(p.images)&&p.images.length?p.images:(p.image?[{src:p.image,thumbnail:p.image,alt:p.name}]:[]);
    return rows.map(i=>typeof i==='string'?{src:i,thumbnail:i,alt:p.name}:{src:i.src,thumbnail:i.thumbnail||i.src,alt:i.alt||p.name}).filter(i=>i.src).slice(0,5);
  }
  function start(p){
    setEdit(p._id);setError('');setImageUrl('');setForm({name:p.name||'',brand:p.brand||'',sku:p.sku||'',barcode:p.barcode||'',category:p.category||'Staples',price:p.price??'',mrp:p.mrp??'',costPrice:p.costPrice??'',unit:p.unit||'1 kg',stock:p.stock??'',stockUnit:p.stockUnit||'qty',lowStockThreshold:p.lowStockThreshold??10,customerBadge:p.customerBadge||'none',description:p.description||'',tags:(p.tags||[]).join(', '),featured:Boolean(p.featured),images:normalizeImages(p)});window.scrollTo({top:0,behavior:'smooth'})
  }
  async function uploadImages(e){
    const files=Array.from(e.target.files||[]);e.target.value='';if(!files.length)return;
    if(form.images.length+files.length>5)return setError('Maximum 5 product images are allowed. Remove an image before adding more.');
    const allowed=['image/jpeg','image/png','image/webp'];if(files.some(f=>!allowed.includes(f.type)))return setError('Only JPG, PNG and WEBP product images are allowed.');
    if(files.some(f=>f.size>8*1024*1024))return setError('Each original image must be under 8 MB.');
    setUploadBusy(true);setError('');
    try{
      const added=[];
      for(const file of files){
        const src=await imageVariant(file,1200,0.76,390000);
        const thumbnail=await imageVariant(file,520,0.72,105000);
        added.push({src,thumbnail,alt:form.name||file.name.replace(/\.[^.]+$/,'')});
      }
      const next=[...form.images,...added];
      if(JSON.stringify(next).length>2400000)throw new Error('Combined image size is too large. Remove one image or use smaller files.');
      setForm(x=>({...x,images:next}));
    }catch(e){setError(e.message)}finally{setUploadBusy(false)}
  }
  function addImageUrl(){
    const url=imageUrl.trim();if(!/^https?:\/\//i.test(url))return setError('Enter a valid http/https image URL.');if(form.images.length>=5)return setError('Maximum 5 product images are allowed.');
    setForm(x=>({...x,images:[...x.images,{src:url,thumbnail:url,alt:x.name||'Product image'}]}));setImageUrl('');setError('')
  }
  function removeImage(index){setForm(x=>({...x,images:x.images.filter((_,i)=>i!==index)}))}
  function primaryImage(index){setForm(x=>{const images=[...x.images];const [picked]=images.splice(index,1);return {...x,images:[picked,...images]}})}

  async function submit(e){
    e.preventDefault();setError('');
    const price=Number(form.price),mrp=Number(form.mrp),costPrice=Number(form.costPrice)||0,stock=Number(form.stock),lowStockThreshold=Number(form.lowStockThreshold)||0;
    if(!form.images.length)return setError('Upload at least one product image.');
    if(!Number.isFinite(price)||price<0||!Number.isFinite(mrp)||mrp<price)return setError('MRP must be greater than or equal to the selling price.');
    if(!Number.isFinite(stock)||stock<0)return setError('Enter a valid stock amount.');
    const tags=form.tags.split(',').map(v=>v.trim()).filter(Boolean).slice(0,12);
    const images=form.images.map((img,index)=>({src:imageSrc(img),thumbnail:imageThumb(img),alt:String(img.alt||form.name||`Product image ${index+1}`).slice(0,180)}));
    const payload={name:form.name.trim(),brand:form.brand.trim(),sku:form.sku.trim(),barcode:form.barcode.trim(),category:form.category,price,mrp,costPrice,unit:form.unit.trim(),stock,stockUnit:form.stockUnit,lowStockThreshold,customerBadge:form.customerBadge,description:form.description.trim(),tags,featured:form.featured,images,image:images[0].thumbnail||images[0].src};
    setBusy(true);
    try{await adminApi(edit?`/admin/products/${edit}`:'/admin/products',{method:edit?'PUT':'POST',body:JSON.stringify(payload)});reset();await load()}catch(e){setError(e.message)}finally{setBusy(false)}
  }
  async function del(id){if(!confirm('Delete this product?'))return;try{await adminApi(`/admin/products/${id}`,{method:'DELETE'});await load()}catch(e){setError(e.message)}}

  return <><div className="admin-title"><div><small>PRODUCT MANAGEMENT</small><h1>Catalog, Images & Inventory</h1><p>Create complete product listings with multiple customer-facing images, pricing, purchase cost and stock controls.</p></div></div>
    <div className="product-admin-layout">
      <form className="panel product-editor" onSubmit={submit}>
        <div className="product-editor-head"><div><small>{edit?'EDIT PRODUCT':'NEW PRODUCT'}</small><h2>{edit?'Update product':'Add product'}</h2></div>{edit&&<button type="button" className="product-cancel" onClick={reset}>Cancel edit</button>}</div>
        {error&&<div className="admin-alert">{error}</div>}

        <section className="product-form-section"><h3>Basic information</h3><div className="product-form-grid"><label>Item name<input required maxLength="160" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Example: Aashirvaad Atta"/></label><label>Category<select value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>{CATEGORIES.map(v=><option key={v}>{v}</option>)}</select></label><label>Brand<input maxLength="100" value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})} placeholder="Example: Aashirvaad"/></label><label>SKU / Item code<input maxLength="80" value={form.sku} onChange={e=>setForm({...form,sku:e.target.value})} placeholder="Example: ATTA-5KG-001"/></label><label>Barcode (optional)<input maxLength="80" value={form.barcode} onChange={e=>setForm({...form,barcode:e.target.value})} placeholder="EAN / UPC / local code"/></label><label>Pack / selling unit<input required maxLength="60" value={form.unit} onChange={e=>setForm({...form,unit:e.target.value})} placeholder="1 kg / 500 g / 1 pack"/></label></div></section>

        <section className="product-form-section"><h3>Pricing & margin</h3><div className="product-form-grid pricing"><label>Selling price ₹<input required min="0" step="0.01" type="number" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label><label>MRP ₹<input required min="0" step="0.01" type="number" value={form.mrp} onChange={e=>setForm({...form,mrp:e.target.value})}/></label><label>Cost price ₹<input min="0" step="0.01" type="number" value={form.costPrice} onChange={e=>setForm({...form,costPrice:e.target.value})}/><small>Admin only · used for margin/profit reports</small></label><div className="margin-preview"><small>ESTIMATED MARGIN</small><b>₹{Math.max((Number(form.price)||0)-(Number(form.costPrice)||0),0).toFixed(2)}</b><span>{Number(form.price)>0?`${Math.max((((Number(form.price)||0)-(Number(form.costPrice)||0))/(Number(form.price)||1))*100,0).toFixed(1)}% of selling price`:'Enter price'}</span></div></div></section>

        <section className="product-form-section"><h3>Stock</h3><div className="product-form-grid"><label>Stock amount<input required min="0" step="0.01" type="number" value={form.stock} onChange={e=>setForm({...form,stock:e.target.value})}/></label><label>Stock unit<select value={form.stockUnit} onChange={e=>setForm({...form,stockUnit:e.target.value})}>{STOCK_UNITS.map(v=><option key={v} value={v}>{v.toUpperCase()}</option>)}</select></label><label>Low stock alert at<input min="0" step="0.01" type="number" value={form.lowStockThreshold} onChange={e=>setForm({...form,lowStockThreshold:e.target.value})}/><small>Admin only · dashboard will flag stock at or below this amount</small></label></div></section>

        <section className="product-form-section"><div className="section-title-row"><div><h3>Product images</h3><p>Upload up to 5 images. The first image is the primary card image; all images appear as a slider on the product page.</p></div><span>{form.images.length}/5</span></div><label className="product-upload-box"><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={uploadImages} disabled={uploadBusy||form.images.length>=5}/><b>{uploadBusy?'Optimizing images...':'＋ Upload multiple images'}</b><small>JPG/PNG/WEBP · auto compressed for faster loading</small></label><div className="image-url-row"><input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="Or paste an image URL"/><button type="button" onClick={addImageUrl}>Add URL</button></div>{form.images.length>0&&<div className="product-image-manager">{form.images.map((img,index)=><article key={`${imageSrc(img).slice(0,35)}-${index}`}><div className="product-image-preview"><img src={imageThumb(img)} alt={img.alt||form.name}/>{index===0&&<span>PRIMARY</span>}</div><div><button type="button" disabled={index===0} onClick={()=>primaryImage(index)}>Make primary</button><button type="button" className="remove" onClick={()=>removeImage(index)}>Remove</button></div></article>)}</div>}</section>

        <section className="product-form-section"><h3>Customer information & marketing</h3><label>Description<textarea rows="5" maxLength="2500" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Product quality, usage, pack information, key details..."/></label><div className="product-form-grid"><label>Customer stock / marketing badge<select value={form.customerBadge} onChange={e=>setForm({...form,customerBadge:e.target.value})}>{CUSTOMER_BADGES.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><small>Exact stock quantity stays admin-only. Choose a badge only when you want customers to see a marketing message.</small></label><label>Search tags<input value={form.tags} onChange={e=>setForm({...form,tags:e.target.value})} placeholder="atta, flour, wheat, grocery"/><small>Comma separated; improves storefront search</small></label></div><label className="featured-toggle"><input type="checkbox" checked={form.featured} onChange={e=>setForm({...form,featured:e.target.checked})}/><span><b>Featured product</b><small>Prioritize this product in featured/popular sections.</small></span></label></section>
        <button className="product-save" disabled={busy||uploadBusy}>{busy?'Saving product...':edit?'Save Product Changes':'Add Product'}</button>
      </form>

      <section className="panel product-inventory-panel"><div className="panel-head"><div><h2>Product inventory</h2><small>Click Edit to manage images, pricing, customer badge and details.</small></div><span>{items.length} products</span></div><div className="inventory product-inventory-list">{items.map(p=><div className={`inventory-item ${p.stock<=p.lowStockThreshold?'low-stock-row':''}`} key={p._id}><img src={p.image} alt={p.name}/><div className="grow"><b>{p.name}</b><small>{p.brand?`${p.brand} · `:''}{p.category} · {p.unit}</small><small>SKU {p.sku||'—'} · {p.images?.length||1} image{(p.images?.length||1)===1?'':'s'} · Badge {p.customerBadge&&p.customerBadge!=='none'?p.customerBadge.replace('_',' '):'none'}</small></div><div className="inventory-price"><strong>₹{p.price}</strong><small>MRP ₹{p.mrp} · Cost ₹{p.costPrice||0}</small></div><span className="inventory-stock">{p.stock} {p.stockUnit||'qty'}<small>{p.stock<=p.lowStockThreshold?'Low stock':'In stock'}</small></span><button className="small" onClick={()=>start(p)}>Edit</button><button className="small danger" onClick={()=>del(p._id)}>Delete</button></div>)}</div></section>
    </div>
  </>;
}
