import {useEffect} from 'react';
import {useLocation} from 'react-router-dom';

export default function ProductGallerySwipeEnhancer(){
  const {pathname}=useLocation();

  useEffect(()=>{
    if(!pathname.startsWith('/product/'))return;

    let detach=()=>{};
    const observer=new MutationObserver(()=>{
      const cleanup=attach();
      if(cleanup){detach=cleanup;observer.disconnect()}
    });

    function attach(){
      const stage=document.querySelector('.product-gallery-stage');
      const gallery=stage?.closest('.product-gallery');
      if(!stage||!gallery||stage.dataset.sbnSwipe==='1')return null;
      const initialButtons=[...gallery.querySelectorAll('.product-gallery-thumbs button')];
      if(initialButtons.length<2)return null;

      stage.dataset.sbnSwipe='1';
      stage.classList.add('sbn-swipe-enabled');
      let gesture=null;
      let overlay=null;
      let track=null;
      let settleTimer=null;
      let suppressClickUntil=0;

      const buttons=()=>[...gallery.querySelectorAll('.product-gallery-thumbs button')];
      const activeIndex=()=>Math.max(0,buttons().findIndex(button=>button.classList.contains('active')));
      const removeOverlay=()=>{
        if(settleTimer){clearTimeout(settleTimer);settleTimer=null}
        overlay?.remove();overlay=null;track=null;
        stage.classList.remove('sbn-swipe-dragging');
      };
      const imageSources=index=>{
        const rows=buttons().map(button=>{
          const img=button.querySelector('img');
          return img?.currentSrc||img?.src||'';
        });
        const full=stage.querySelector('.gallery-main-image img');
        if(rows[index]&&full)rows[index]=full.currentSrc||full.src||rows[index];
        return rows.filter(Boolean);
      };
      const buildOverlay=index=>{
        if(overlay)return;
        const sources=imageSources(index);
        if(sources.length<2)return;
        overlay=document.createElement('div');
        overlay.className='sbn-product-swipe-overlay';
        track=document.createElement('div');
        track.className='sbn-product-swipe-track';
        sources.forEach((src,i)=>{
          const slide=document.createElement('div');
          slide.className='sbn-product-swipe-slide';
          const img=document.createElement('img');
          img.src=src;img.alt='';img.draggable=false;img.decoding='async';
          if(i===index)img.fetchPriority='high';
          slide.appendChild(img);track.appendChild(slide);
        });
        track.style.transform=`translate3d(${-index*100}%,0,0)`;
        overlay.appendChild(track);stage.appendChild(overlay);
        stage.classList.add('sbn-swipe-dragging');
      };
      const setTrack=(index,dx,animate=false)=>{
        if(!track)return;
        track.style.transition=animate?'transform .32s cubic-bezier(.22,.72,.25,1)':'none';
        track.style.transform=`translate3d(calc(${-index*100}% + ${dx}px),0,0)`;
      };
      const settle=(fromIndex,targetIndex,moved)=>{
        if(!track){gesture=null;return}
        if(moved)suppressClickUntil=Date.now()+450;
        setTrack(targetIndex,0,true);
        settleTimer=setTimeout(()=>{
          if(targetIndex!==fromIndex){
            const current=buttons();
            current[targetIndex]?.click();
          }
          removeOverlay();gesture=null;
        },325);
      };
      const onPointerDown=e=>{
        if(e.pointerType==='mouse'&&e.button!==0)return;
        if(!e.target.closest('.gallery-main-image'))return;
        const current=buttons();
        if(current.length<2)return;
        gesture={pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,lastX:e.clientX,lastY:e.clientY,index:activeIndex(),width:Math.max(stage.getBoundingClientRect().width,1),dragging:false};
      };
      const onPointerMove=e=>{
        if(!gesture||gesture.pointerId!==e.pointerId)return;
        gesture.lastX=e.clientX;gesture.lastY=e.clientY;
        let dx=e.clientX-gesture.startX;const dy=e.clientY-gesture.startY;
        if(!gesture.dragging){
          if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){gesture=null;return}
          if(Math.abs(dx)<6||Math.abs(dx)<Math.abs(dy)*1.08)return;
          gesture.dragging=true;buildOverlay(gesture.index);
          try{stage.setPointerCapture(e.pointerId)}catch{}
        }
        if(!track)return;
        const last=buttons().length-1;
        if((gesture.index===0&&dx>0)||(gesture.index===last&&dx<0))dx*=.3;
        setTrack(gesture.index,dx,false);
      };
      const finish=e=>{
        if(!gesture||gesture.pointerId!==e.pointerId)return;
        const dx=(Number.isFinite(e.clientX)?e.clientX:gesture.lastX)-gesture.startX;
        if(!gesture.dragging){gesture=null;return}
        const count=buttons().length;
        const threshold=Math.min(100,Math.max(42,gesture.width*.13));
        let target=gesture.index;
        if(Math.abs(dx)>threshold)target=dx<0?Math.min(gesture.index+1,count-1):Math.max(gesture.index-1,0);
        try{stage.releasePointerCapture(e.pointerId)}catch{}
        settle(gesture.index,target,Math.abs(dx)>8);
      };
      const cancel=e=>{
        if(!gesture||gesture.pointerId!==e.pointerId)return;
        const from=gesture.index;
        try{stage.releasePointerCapture(e.pointerId)}catch{}
        if(gesture.dragging&&track)settle(from,from,true);else gesture=null;
      };
      const blockDraggedClick=e=>{
        if(Date.now()<suppressClickUntil&&e.target.closest('.gallery-main-image')){
          e.preventDefault();e.stopPropagation();
          if(typeof e.stopImmediatePropagation==='function')e.stopImmediatePropagation();
        }
      };

      stage.addEventListener('pointerdown',onPointerDown);
      stage.addEventListener('pointermove',onPointerMove);
      stage.addEventListener('pointerup',finish);
      stage.addEventListener('pointercancel',cancel);
      stage.addEventListener('click',blockDraggedClick,true);

      return()=>{
        removeOverlay();gesture=null;
        stage.removeEventListener('pointerdown',onPointerDown);
        stage.removeEventListener('pointermove',onPointerMove);
        stage.removeEventListener('pointerup',finish);
        stage.removeEventListener('pointercancel',cancel);
        stage.removeEventListener('click',blockDraggedClick,true);
        stage.classList.remove('sbn-swipe-enabled','sbn-swipe-dragging');
        delete stage.dataset.sbnSwipe;
      };
    }

    const cleanup=attach();
    if(cleanup)detach=cleanup;
    else observer.observe(document.body,{childList:true,subtree:true});

    return()=>{observer.disconnect();detach()};
  },[pathname]);

  return null;
}
