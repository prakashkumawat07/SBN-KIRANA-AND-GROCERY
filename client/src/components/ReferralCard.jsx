import {useState} from 'react';
import {useAuth} from '../context/AuthContext';
export default function ReferralCard(){
  const {user}=useAuth();const [msg,setMsg]=useState('');
  if(!user?.referralCode)return null;
  const link=`${window.location.origin}/register?ref=${encodeURIComponent(user.referralCode)}`;
  async function copy(){try{await navigator.clipboard.writeText(link);setMsg('Invite link copied')}catch{setMsg('Copy the link manually')}}
  function share(){const text=encodeURIComponent(`Join SBN Kirana for groceries and daily essentials. Use my invite code ${user.referralCode}: ${link}`);window.open(`https://wa.me/?text=${text}`,'_blank','noopener,noreferrer')}
  return <section className="account-card referral-card"><span>INVITE & GROW</span><h2>Refer SBN Kirana</h2><p>Share your personal invite link. New accounts created from it are counted in your referral total.</p><div className="referral-code"><small>YOUR CODE</small><b>{user.referralCode}</b><span>{user.referralCount||0} successful referral{user.referralCount===1?'':'s'}</span></div><div className="referral-actions"><button onClick={share}>💬 Share on WhatsApp</button><button className="secondary" onClick={copy}>⧉ Copy Link</button></div>{msg&&<small className="referral-copy-msg">{msg}</small>}<small className="referral-terms">Referral tracking does not automatically promise cash, credit or discounts. Any reward campaign will be announced separately by store management.</small></section>
}
