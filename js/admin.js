// ═══════════════════════════════════════════ ADMIN
var _currentAdminTab = 'pending';

async function loadAdminCounts() {
  try {
    var [pR,aR,rR,fR] = await Promise.all([
      sb.from('profiles').select('id',{count:'exact',head:true}).eq('status','pending'),
      sb.from('profiles').select('id',{count:'exact',head:true}).eq('status','approved'),
      sb.from('profiles').select('id',{count:'exact',head:true}).eq('status','rejected'),
      sb.from('profiles').select('id',{count:'exact',head:true}).eq('is_founding_member',true)
    ]);
    function set(id,n){var el=document.getElementById(id);if(el)el.textContent=n>0?' ('+n+')'  :'';}
    set('adCountPending',pR.count||0);set('adCountApproved',aR.count||0);
    set('adCountRejected',rR.count||0);set('adCountFounders',fR.count||0);
  }catch(x){}
}

function setAdminTab(st){
  _currentAdminTab=st;
  ['adTabPending','adTabApproved','adTabRejected','adTabFounders'].forEach(function(id){
    var el=document.getElementById(id);if(!el)return;
    var on=(id==='adTabPending'&&st==='pending')||(id==='adTabApproved'&&st==='approved')||
           (id==='adTabRejected'&&st==='rejected')||(id==='adTabFounders'&&st==='founders');
    el.className='btn btn-sm '+(on?'btn-gold':'btn-dark');
  });
}

async function ldAdmin(st){
  setAdminTab(st); loadAdminCounts();
  if(st==='founders'){await ldFounders();return;}
  var r=await sb.from('profiles').select('*').eq('status',st).order('created_at',{ascending:false});
  var d=r.data||[];
  var adE=document.getElementById('adEmpty');if(adE)adE.style.display=d.length?'none':'block';
  var l=document.getElementById('adList');if(!l)return;l.innerHTML='';
  d.forEach(function(p){
    var f=faithByKey(p.religion||'Other');
    var photos=[p.photo_url,p.photo_2_url,p.photo_3_url,p.photo_4_url,p.photo_5_url].filter(Boolean);
    var photoHtml=photos.length
      ?'<div style="margin:10px 0;"><p style="font-size:10px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:6px;">Profile Photos</p><div style="display:flex;gap:6px;flex-wrap:wrap;">'+
        photos.map(function(u){return'<a href="'+u+'" target="_blank"><img src="'+u+'" style="width:72px;height:72px;border-radius:10px;object-fit:cover;border:2px solid var(--gold);"/></a>';}).join('')+'</div></div>'
      :'<p style="font-size:11px;color:#ff6b6b;margin:8px 0;">⚠️ No photos uploaded</p>';
    var idHtml=p.id_proof_url
      ?'<div style="margin:10px 0;background:rgba(212,160,23,.06);border:1px solid rgba(212,160,23,.25);border-radius:12px;padding:12px;">'+
        '<p style="font-size:10px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:8px;">🪪 '+(p.id_proof_type||'ID')+'</p>'+
        '<a href="'+p.id_proof_url+'" target="_blank"><img src="'+p.id_proof_url+'" style="width:100%;max-width:340px;border-radius:10px;border:2px solid var(--gold);display:block;"/></a>'+
        '<a href="'+p.id_proof_url+'" target="_blank" style="font-size:12px;color:var(--gold2);font-weight:700;display:inline-block;margin-top:8px;">⬆ Open full size</a></div>'
      :'<p style="font-size:11px;color:#ff6b6b;background:rgba(231,76,60,.1);padding:8px 12px;border-radius:8px;margin:8px 0;">⚠️ No ID uploaded</p>';
    var founderBadge=p.is_founding_member
      ?'<span style="font-size:9px;padding:2px 7px;border-radius:8px;background:rgba(212,160,23,.15);color:var(--gold2);font-weight:700;margin-left:5px;">✦ Founder #'+p.founding_number+'</span>':'' ;
    var details='<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:10px 0;font-size:11px;color:var(--w60);background:var(--w05);border-radius:10px;padding:10px;">'+
      '<span><strong style="color:var(--w80);">Email:</strong> '+p.email+'</span>'+
      '<span><strong style="color:var(--w80);">Phone:</strong> '+(p.phone||'—')+'</span>'+
      '<span><strong style="color:var(--w80);">Age:</strong> '+p.age+'</span>'+
      '<span><strong style="color:var(--w80);">Gender:</strong> '+(p.gender||'—')+'</span>'+
      '<span><strong style="color:var(--w80);">Religion:</strong> '+(p.religion||'—')+'</span>'+
      '<span><strong style="color:var(--w80);">Denom:</strong> '+(p.denomination||'—')+'</span>'+
      '<span><strong style="color:var(--w80);">City:</strong> '+p.city+', '+p.state+'</span>'+
      '<span><strong style="color:var(--w80);">Marital:</strong> '+(p.marital_status||'—')+'</span>'+
      '</div>';
    var sn=(p.full_name||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    var se=(p.email||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    var sp=(p.phone||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'");
    var act=st==='pending'
      ?'<div style="display:flex;gap:8px;margin-top:12px;">'+
          '<button class="btn btn-grn btn-sm" style="flex:1;padding:12px;font-size:13px;" onclick="adAct(\''+p.id+'\',\'approved\',\''+sn+'\',\''+se+'\',\''+sp+'\')">✅ Approve</button>'+
          '<button class="btn btn-red btn-sm" style="flex:1;padding:12px;font-size:13px;" onclick="openRejectModal(\''+p.id+'\',\''+sn+'\',\''+se+'\')">❌ Reject</button></div>'
      :st==='approved'
        ?'<button class="btn btn-dark btn-sm" style="margin-top:10px;width:100%;opacity:.7;" onclick="adAct(\''+p.id+'\',\'pending\',\''+sn+'\',\''+se+'\',\''+sp+'\')">↩ Move back to Pending</button>'
        :st==='rejected'
          ?'<button class="btn btn-dark btn-sm" style="margin-top:10px;width:100%;opacity:.7;" onclick="adAct(\''+p.id+'\',\'pending\',\''+sn+'\',\''+se+'\',\''+sp+'\')">🔄 Allow Resubmission</button>':'' ;
    var sc=st==='pending'?'rgba(232,184,48,.15)':st==='approved'?'rgba(39,174,96,.15)':'rgba(231,76,60,.15)';
    var tc=st==='pending'?'#FFD54F':st==='approved'?'#4ade80':'#ff6b6b';
    l.innerHTML+=
      '<div class="card" style="margin-bottom:16px;border:1px solid rgba(212,160,23,.1);">'+
        '<div style="display:flex;gap:10px;align-items:center;margin-bottom:4px;">'+
          '<div class="avatar" style="'+(p.photo_url?'background-image:url('+p.photo_url+');background-size:cover;background-position:center':'')+';border-color:'+f.color+';">'+
            (!p.photo_url?'<span style="font-size:18px;opacity:.3">👤</span>':'')+
          '</div>'+
          '<div style="flex:1;">'+
            '<h3 style="font-size:15px;margin:0;font-weight:700;color:#fff;">'+p.full_name+', '+p.age+founderBadge+'</h3>'+
            '<p style="font-size:12px;color:'+f.color+';margin:2px 0;">'+f.icon+' '+(p.denomination||p.religion||'')+'</p>'+
            '<p style="font-size:10px;color:var(--w40);margin:0;">'+p.city+', '+p.state+'</p>'+
          '</div>'+
          '<span style="font-size:10px;padding:4px 10px;border-radius:20px;font-weight:700;background:'+sc+';color:'+tc+';">'+st.toUpperCase()+'</span>'+
        '</div>'+details+photoHtml+idHtml+act+
      '</div>';
  });
}

async function ldFounders(){
  var FOUNDER_CAP = 300;
  var l=document.getElementById('adList');if(!l)return;l.innerHTML='';
  var adE=document.getElementById('adEmpty');if(adE)adE.style.display='none';

  // Fetch ALL founding members for stats, but only show approved in list
  var rAll=await sb.from('profiles').select('id,status').eq('is_founding_member',true);
  var dAll=rAll.data||[];
  var appr=dAll.filter(function(p){return p.status==='approved';}).length;
  var pend=dAll.filter(function(p){return p.status==='pending';}).length;
  var rejc=dAll.filter(function(p){return p.status==='rejected';}).length;
  var spotsLeft=Math.max(0,FOUNDER_CAP-appr);

  // Fetch only approved for the list display
  var r=await sb.from('profiles').select('*').eq('is_founding_member',true).eq('status','approved').order('founding_number',{ascending:true}).limit(FOUNDER_CAP);
  var d=r.data||[];

  if(!d.length&&!pend&&!rejc){if(adE)adE.style.display='block';return;}

  // Progress bar fill %
  var pct=Math.min(100,Math.round((appr/FOUNDER_CAP)*100));

  l.innerHTML+=
    // Stats grid
    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px;">'+
      '<div style="background:rgba(212,160,23,.1);border:1px solid rgba(212,160,23,.3);border-radius:10px;padding:10px;text-align:center;"><p style="font-family:Cinzel,serif;font-size:20px;color:var(--gold2);font-weight:700;margin:0;">'+dAll.length+'</p><p style="font-size:10px;color:var(--w40);margin:3px 0 0;">Registered</p></div>'+
      '<div style="background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.3);border-radius:10px;padding:10px;text-align:center;"><p style="font-family:Cinzel,serif;font-size:20px;color:#4ade80;font-weight:700;margin:0;">'+appr+'</p><p style="font-size:10px;color:var(--w40);margin:3px 0 0;">Approved</p></div>'+
      '<div style="background:rgba(232,184,48,.1);border:1px solid rgba(232,184,48,.3);border-radius:10px;padding:10px;text-align:center;"><p style="font-family:Cinzel,serif;font-size:20px;color:#FFD54F;font-weight:700;margin:0;">'+pend+'</p><p style="font-size:10px;color:var(--w40);margin:3px 0 0;">Pending</p></div>'+
      '<div style="background:rgba(155,89,182,.1);border:1px solid rgba(155,89,182,.3);border-radius:10px;padding:10px;text-align:center;"><p style="font-family:Cinzel,serif;font-size:20px;color:#C39BD3;font-weight:700;margin:0;">'+spotsLeft+'</p><p style="font-size:10px;color:var(--w40);margin:3px 0 0;">Spots Left</p></div>'+
    '</div>'+
    // Progress bar
    '<div style="margin-bottom:14px;">'+
      '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--w40);margin-bottom:4px;">'+
        '<span>Founding Members Progress</span><span>'+appr+' / '+FOUNDER_CAP+'</span>'+
      '</div>'+
      '<div style="height:6px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden;">'+
        '<div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,#D4A017,#F5C842);border-radius:3px;transition:width .4s;"></div>'+
      '</div>'+
    '</div>'+
    '<p style="font-size:11px;color:var(--w40);margin-bottom:12px;">Showing approved founding members only · Each gets 1 week Premium free from 20 May 2026</p>';

  d.forEach(function(p){
    var f=faithByKey(p.religion||'Other');
    l.innerHTML+=
      '<div class="card" style="margin-bottom:8px;border:1px solid rgba(212,160,23,.12);display:flex;gap:10px;align-items:center;">'+
        '<div style="font-family:Cinzel,serif;font-size:15px;font-weight:700;color:var(--gold2);min-width:36px;text-align:center;">#'+(p.founding_number||'?')+'</div>'+
        '<div class="avatar" style="width:42px;height:42px;flex-shrink:0;'+(p.photo_url?'background-image:url('+p.photo_url+');background-size:cover;background-position:center':'')+';border-color:'+f.color+';">'+(!p.photo_url?'<span style="font-size:13px;opacity:.3">👤</span>':'')+'</div>'+
        '<div style="flex:1;min-width:0;">'+
          '<p style="font-size:13px;font-weight:700;color:#fff;margin:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+p.full_name+', '+p.age+'</p>'+
          '<p style="font-size:11px;color:'+f.color+';margin:1px 0;">'+f.icon+' '+(p.religion||'')+(p.denomination?' · '+p.denomination:'')+'</p>'+
          '<p style="font-size:10px;color:var(--w40);margin:0;">'+p.city+', '+p.state+' · '+(p.gender||'')+'</p>'+
        '</div>'+
        '<span style="font-size:9px;padding:3px 8px;border-radius:10px;font-weight:700;background:rgba(39,174,96,.15);color:#4ade80;white-space:nowrap;">APPROVED ✓</span>'+
      '</div>';
  });
}

async function adAct(id,st,name,email,phone){
  await sb.from('profiles').update({status:st,approved_at:st==='approved'?new Date().toISOString():null}).eq('id',id);
  if(st==='approved'){
    try{await fetch(SB_URL+'/functions/v1/smart-function',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'approved',full_name:name||'',email:email||'',phone:phone||''})});}catch(x){}
    try{await markReferralApproved(id);}catch(x){}
  }
  ldAdmin('pending');
}

var _rejectId='',_rejectName='',_rejectEmail='';
function openRejectModal(id,name,email){_rejectId=id;_rejectName=name;_rejectEmail=email;var el=document.getElementById('rejectModalName');if(el)el.textContent=name;var ra=document.getElementById('rejectReason');if(ra)ra.value='';var re=document.getElementById('rejectReasonErr');if(re)re.style.display='none';var m=document.getElementById('rejectModal');if(m)m.classList.add('show');}
function closeRejectModal(){var m=document.getElementById('rejectModal');if(m)m.classList.remove('show');}
function setRejectReason(text){var el=document.getElementById('rejectReason');if(el)el.value=text;}
async function submitReject(){
  var reason=(document.getElementById('rejectReason').value||'').trim();
  var errEl=document.getElementById('rejectReasonErr');
  if(!reason){if(errEl){errEl.textContent='Please enter a reason.';errEl.style.display='block';}return;}
  var btn=document.getElementById('rejectSubmitBtn');btn.disabled=true;btn.textContent='Rejecting…';
  await sb.from('profiles').update({status:'rejected',rejection_reason:reason,approved_at:null}).eq('id',_rejectId);
  try{await fetch(SB_URL+'/functions/v1/smart-function',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'rejected',full_name:_rejectName,email:_rejectEmail,rejection_reason:reason})});}catch(x){}
  btn.disabled=false;btn.textContent='Confirm Rejection & Send Email';
  closeRejectModal();ldAdmin('pending');
}
