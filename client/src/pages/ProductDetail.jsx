import {useEffect,useState} from 'react';
import {Link,useLocation,useNavigate,useParams} from 'react-router-dom';
import {api} from '../api';
import {useCart} from '../context/CartContext';
import {useAuth} from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import '../product-gallery.css';

const WISH='sbn_wishlist';
const stars=n=>'★★★★★'.slice(0,Math.round(Number(n)||0))+'☆☆☆☆☆'.slice(0,5-Math.round(Number(n)||0));
const MARKETING_BADGES={
  limited:{icon:'⏳',label:'Limited stock',detail:'Popular item · order soon'},
  selling_fast:{icon:'🔥',label:'Selling fast',detail:'Trending with customers'},
  popular:{icon:'★',label:'Popular choice',detail:'Frequently chosen essential'},
  fresh:{icon:'✨',label:'Fresh arrival',detail:'Recently added to the store'},
  best_value:{icon:'₹',label:'Best value',detail:'Strong everyday value'}
};
const normalizeImages=product=>{
  const list=Array.isArray(product?.images)?product.images:[];
  const rows=list.map((img,index)=>typeof img==='string'?{src:img,thumbnail:img,alt:`${product.name} image ${index+1}`}:{src:img?.src,thumbnail:img?.thumbnail||img?.src,alt:img?.alt||`${product.name} image ${index+1}`}).filter(x=>x.src);
  return rows.length?rows:(product?.image?[{src:product.image,thumbnail:product.image,alt:product.name}]:[]);
};

export default function ProductDetail(){
  const {id}=useParams();const nav=useNavigate();const location=useLocation();const {addToCart}=useCart();const {user}=useAuth();
  const [product,setProduct]=useState(null);const [related,setRelated]=useState([]);const [error,setError]=useState('');const [saved,setSaved]=useState(false);const [reviews,setReviews]=useState({average:0,count:0,reviews:[]});const [eligibility,setEligibility]=useState(null);const [reviewForm,setReviewForm]=useState({rating:5,title:'',comment:''});const [reviewMsg,setReviewMsg]=useState('');
  const [activeImage,setActiveImage]=useState(0);const [zoomOpen,setZoomOpen]=useState(false);const [touchStart,setTouchStart]=useState(null);
  const loadReviews=()=>api(`/reviews/${id}`).then(setReviews).catch(()=>{});
  const loadEligibility=()=>user?api(`/reviews/${id}/eligibility`).then(d=>{setEligibility(d);if(d.existing)setReviewForm({rating:d.existing.rating||5,title:d.existing.title||'',comment:d.existing.comment||''})}).catch(()=>setEligibility({eligible:false,existing:null})):setEligibility(null);
  useEffect(()=>{setError('');setEligibility(null);setReviewMsg('');setActiveImage(0);setZoomOpen(false);loadReviews();loadEligibility();api(`/products/${id}`).then(p=>{setProduct(p);document.title=`${p.name} | SBN Kirana`;const d=document.querySelector('meta[name="description"]');if(d)d.setAttribute('content',`${p.name} ${p.unit||''} at SBN Kirana. ${p.description||'Shop groceries and daily essentials online.'}`);const ids=JSON.parse(localStorage.getItem(WISH)||'[]');setSaved(ids.includes(p._id));return api(`/products?category=${encodeURIComponent(p.category)}`)}).then(list=>setRelated((list||[]).filter(x=>x._id!==id&&x.category!=='Fruits & Vegetables').slice(0,4))).catch(e=>setError(e.message));return()=>{document.title='SBN Kirana | Online Grocery & Daily Essentials'}},[id,user?.id]);
  useEffect(()=>{if(location.hash==='#rate-product'&&eligibility?.eligible){const timer=setTimeout(()=>document.getElementById('rate-product')?.scrollIntoView({behavior:'smooth',block:'start'}),120);return()=>clearTimeout(timer)}},[location.hash,eligibility?.eligible,id]);
  function toggleSave(){if(!product)return;let ids=JSON.parse(localStorage.getItem(WISH)||'[]');ids=ids.includes(product._id)?ids.filter(x=>x!==product._id):[product._id,...ids];localStorage.setItem(WISH,JSON.stringify(ids));setSaved(ids.includes(product._id))}
  function share(){const url=window.location.href;const text=encodeURIComponent(`Check ${product.name} on SBN Kirana – ₹${product.price} ${url}`);window.open(`https://wa.me/?text=${text}`,'_blank','noopener,noreferrer')}
  function buyNow(){if(!product?.stock)return;addToCart(product);nav('/checkout')}
  async function submitReview(e){e.preventDefault();setReviewMsg('');try{await api(`/reviews/${id}`,{method:'POST',body:JSON.stringify(reviewForm)});setReviewMsg('Submitted successfully. Your rating and suggestion will appear publicly only after admin approval.');await loadEligibility();window.dispatchEvent(new Event('sbn:reviews-updated'))}catch(e){setReviewMsg(e.message)}}
  if(error)return <main className="section"><div className="alert">{error}</div></main>;
  if(!product)return <main className="section"><div className="loading">Loading product...</div></main>;

  const gallery=normalizeImages(product);const active=gallery[Math.min(activeImage,gallery.length-1)]||{src:product.image,thumbnail:product.image,alt:product.name};
  const save=Math.max((product.mrp||0)-(product.price||0),0);const canReview=Boolean(user&&eligibility?.eligible);const hasPublicReviews=Number(reviews.count)>0;const existing=eligibility?.existing;const marketing=MARKETING_BADGES[product.customerBadge]||null;
  function moveImage(direction){if(gallery.length<2)return;setActiveImage(i=>(i+direction+gallery.length)%gallery.length)}
  function touchEnd(e){if(touchStart===null)return;const end=e.changedTouches?.[0]?.clientX??touchStart;const delta=end-touchStart;if(Math.abs(delta)>45)moveImage(delta<0?1:-1);setTouchStart(null)}

  return <main className="product-detail-page">
    <div className="product-breadcrumb"><Link to="/">Home</Link> / <Link to="/products">Products</Link> / <span>{product.name}</span></div>
    <section className="product-detail-card">
      <div className="product-gallery">
        {gallery.length>1&&<div className="product-gallery-thumbs">{gallery.map((img,index)=><button type="button" key={`${img.src.slice(0,30)}-${index}`} className={index===activeImage?'active':''} onClick={()=>setActiveImage(index)} aria-label={`View image ${index+1}`}><img src={img.thumbnail||img.src} alt=""/></button>)}</div>}
        <div className="product-gallery-stage" onTouchStart={e=>setTouchStart(e.touches?.[0]?.clientX??null)} onTouchEnd={touchEnd}>
          <button type="button" className="gallery-main-image" onClick={()=>setZoomOpen(true)} aria-label="Open product image"><img src={active.src} alt={active.alt||product.name}/></button>
          {product.discount>0&&<span className="gallery-discount">{product.discount}% OFF</span>}
          {gallery.length>1&&<><button type="button" className="gallery-arrow prev" onClick={()=>moveImage(-1)} aria-label="Previous image">‹</button><button type="button" className="gallery-arrow next" onClick={()=>moveImage(1)} aria-label="Next image">›</button><div className="gallery-counter">{activeImage+1} / {gallery.length}</div></>}
          <small className="gallery-zoom-hint">Click image to zoom{gallery.length>1?' · swipe or use arrows':''}</small>
        </div>
      </div>
      <div className="product-detail-copy"><span className="product-detail-category">{product.category}</span><h1>{product.name}</h1>{product.brand&&<div className="product-brand-line">Brand: <b>{product.brand}</b></div>}{hasPublicReviews&&<div className="product-rating-summary"><b>{stars(reviews.average)}</b><span>{reviews.average} · {reviews.count} review{reviews.count===1?'':'s'}</span></div>}<p className="product-detail-unit">Pack / unit: {product.unit}</p><div className="detail-price"><strong>₹{product.price}</strong>{product.mrp>product.price&&<del>₹{product.mrp}</del>}</div>{save>0&&<div className="detail-saving">You save ₹{save}</div>}<p className="detail-description">{product.description||'Quality grocery and daily essential from SBN Kirana. Current selling price and ordering options are shown clearly before checkout.'}</p>{marketing&&product.stock>0&&<div className="detail-stock marketing">{marketing.icon} <b>{marketing.label}</b> · {marketing.detail}</div>}<div className="product-detail-facts"><div><small>CATEGORY</small><b>{product.category}</b></div><div><small>PACK</small><b>{product.unit||'—'}</b></div><div><small>SHOPPING</small><b>{marketing?.label||'Easy ordering'}</b></div><div><small>SAVING</small><b>{save?`₹${save}`:'Everyday value'}</b></div></div>{(product.sku||product.tags?.length>0)&&<div className="product-extra-info">{product.sku&&<span><small>SKU</small><b>{product.sku}</b></span>}{product.tags?.length>0&&<span className="product-tags"><small>SEARCH / PRODUCT TAGS</small><b>{product.tags.join(' · ')}</b></span>}</div>}<div className={`detail-stock ${product.stock?'in':'out'}`}>{product.stock?'✓ Available for ordering':'Currently unavailable'}</div><div className="detail-actions"><button className="detail-add" disabled={!product.stock} onClick={()=>addToCart(product)}>＋ Add to Cart</button><button className="detail-buy-now" disabled={!product.stock} onClick={buyNow}>Buy Now</button><button className={saved?'detail-save saved':'detail-save'} onClick={toggleSave}>{saved?'♥ Saved':'♡ Save'}</button><button className="detail-share" onClick={share}>↗ Share</button></div><div className="detail-trust"><span>🚚 Local fulfilment</span><span>↩ Support for eligible issues</span><span>🔒 Secure account checkout</span></div></div>
    </section>

    {(hasPublicReviews||canReview)&&<section className={`review-section ${!canReview?'public-only':''}`}>
      {hasPublicReviews?<div className="review-overview"><span>VERIFIED CUSTOMER FEEDBACK</span><h2>{reviews.average}/5 from {reviews.count} review{reviews.count===1?'':'s'}</h2><div className="review-stars-large">{stars(reviews.average)}</div><p>Only feedback approved by SBN Kirana admin is shown publicly. Customers can submit feedback only after a delivered purchase.</p></div>:<div className="review-overview delivered-review-ready"><span>DELIVERED PURCHASE</span><h2>Your order is delivered</h2><div className="review-stars-large">★★★★★</div><p>You can now rate this product and share a suggestion. Your feedback will be reviewed by admin before it becomes public.</p></div>}
      {canReview&&<form id="rate-product" className="review-form" onSubmit={submitReview}><h3>{existing?'Update your rating & suggestion':'Rate product & share a suggestion'}</h3><div className="review-eligibility-note review-purchase-ok">✓ Delivered purchase verified</div>{existing&&<div className={`review-moderation-state ${existing.approved?'approved':'pending'}`}>{existing.approved?'Your current feedback is live. Editing it will send it for admin approval again.':'Your current feedback is waiting for admin approval. You can edit it before approval.'}</div>}<label>Rating<select value={reviewForm.rating} onChange={e=>setReviewForm({...reviewForm,rating:Number(e.target.value)})}><option value="5">5 - Excellent</option><option value="4">4 - Good</option><option value="3">3 - Average</option><option value="2">2 - Poor</option><option value="1">1 - Very poor</option></select></label><label>Short title<input maxLength="100" value={reviewForm.title} onChange={e=>setReviewForm({...reviewForm,title:e.target.value})} placeholder="Example: Good quality and value"/></label><label>Review / Suggestion<textarea maxLength="1000" value={reviewForm.comment} onChange={e=>setReviewForm({...reviewForm,comment:e.target.value})} placeholder="Tell us what was good or what could improve..."/></label><button>{existing?'Update Feedback':'Submit for Admin Approval'}</button>{reviewMsg&&<small className="review-submit-message">{reviewMsg}</small>}</form>}
    </section>}
    {hasPublicReviews&&<section className="review-list">{reviews.reviews.map(r=><article key={r._id}><div className="review-head"><div><b>{r.user?.name||'Customer'}</b>{r.verifiedPurchase&&<span>✓ Verified delivered purchase</span>}</div><strong>{stars(r.rating)}</strong></div>{r.title&&<h3>{r.title}</h3>}<p>{r.comment||'Rated this product.'}</p><small>{new Date(r.createdAt).toLocaleDateString('en-IN')}</small></article>)}</section>}
    {related.length>0&&<section className="related-products"><div><span>YOU MAY ALSO LIKE</span><h2>More from {product.category}</h2></div><div className="product-grid">{related.map(p=><ProductCard key={p._id} product={p}/>)}</div></section>}
    {zoomOpen&&<div className="product-zoom-backdrop" onClick={()=>setZoomOpen(false)}><div className="product-zoom-modal" onClick={e=>e.stopPropagation()}><button type="button" className="zoom-close" onClick={()=>setZoomOpen(false)}>×</button><img src={active.src} alt={active.alt||product.name}/>{gallery.length>1&&<div className="zoom-controls"><button type="button" onClick={()=>moveImage(-1)}>‹ Previous</button><span>{activeImage+1} / {gallery.length}</span><button type="button" onClick={()=>moveImage(1)}>Next ›</button></div>}</div></div>}
  </main>
}
