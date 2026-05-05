// ═══════════════════════════════════════════ ADMIN

async function ldAdmin(st) {
  var r = await sb.from('profiles').select('*').eq('status', st).order('created_at',{ascending:false});
  var d = r.data || [];
  var adE = document.getElementById('adEmpty'); if (adE) adE.style.display = d.length ? 'none' : 'block';
  var l   = document.getElementById('adList');  if (!l) return; l.innerHTML = '';

  d.forEach(function(p) {
    var f      = faithByKey(p.religion||'Other');
    var photos = [p.photo_url,p.photo_2_url,p.photo_3_url,p.photo_4_url,p.photo_5_url].filter(Boolean);

    var photoHtml = photos.length
      ? '<div style="margin:10px 0;"><p style="font-size:10px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:6px;">Profile Photos</p><div style="display:flex;gap:6px;flex-wrap:wrap;">' +
        photos.map(function(u){ return '<a href="'+u+'" target="_blank"><img src="'+u+'" style="width:72px;height:72px;border-radius:10px;object-fit:cover;border:2px solid var(--gold);"/></a>'; }).join('') +
        '</div></div>'
      : '<p style="font-size:11px;color:#ff6b6b;margin:8px 0;">⚠️ No photos uploaded</p>';

    var idHtml = p.id_proof_url
      ? '<div style="margin:10px 0;background:rgba(212,160,23,.06);border:1px solid rgba(212,160,23,.25);border-radius:12px;padding:12px;">'+
          '<p style="font-size:10px;color:var(--gold);text-transform:uppercase;letter-spacing:1px;font-weight:700;margin-bottom:8px;">🪪 Government ID — '+(p.id_proof_type||'Proof')+'</p>'+
          '<a href="'+p.id_proof_url+'" target="_blank" style="display:block;">'+
            '<img src="'+p.id_proof_url+'" style="width:100%;max-width:340px;border-radius:10px;border:2px solid var(--gold);display:block;"/>'+
          '</a>'+
          '<a href="'+p.id_proof_url+'" target="_blank" style="font-size:12px;color:var(--gold2);font-weight:700;display:inline-block;margin-top:8px;">⬆ Open full size in new tab</a>'+
        '</div>'
      : '<p style="font-size:11px;color:#ff6b6b;background:rgba(231,76,60,.1);padding:8px 12px;border-radius:8px;margin:8px 0;">⚠️ No ID uploaded</p>';

    var details =
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin:10px 0;font-size:11px;color:var(--w60);background:var(--w05);border-radius:10px;padding:10px;">'+
      '<span><strong style="color:var(--w80);">Email:</strong> '+p.email+'</span>'+
      '<span><strong style="color:var(--w80);">Phone:</strong> '+(p.phone||'—')+'</span>'+
      '<span><strong style="color:var(--w80);">Age:</strong> '+p.age+'</span>'+
      '<span><strong style="color:var(--w80);">Gender:</strong> '+(p.gender||'—')+'</span>'+
      '<span><strong style="color:var(--w80);">Religion:</strong> '+(p.religion||'—')+'</span>'+
      '<span><strong style="color:var(--w80);">Denom:</strong> '+(p.denomination||'—')+'</span>'+
      '<span><strong style="color:var(--w80);">City:</strong> '+p.city+', '+p.state+'</span>'+
      '<span><strong style="color:var(--w80);">Marital:</strong> '+(p.marital_status||'—')+'</span>'+
      '</div>';

    var act = st === 'pending'
      ? '<div style="display:flex;gap:8px;margin-top:12px;">'+
          '<button class="btn btn-grn btn-sm" style="flex:1;padding:12px;font-size:13px;" onclick="adAct(\''+p.id+'\',\'approved\',\''+p.full_name+'\',\''+p.email+'\')">✅ Approve</button>'+
          '<button class="btn btn-red btn-sm" style="flex:1;padding:12px;font-size:13px;" onclick="openRejectModal(\''+p.id+'\',\''+p.full_name+'\',\''+p.email+'\')">❌ Reject</button>'+
        '</div>'
      : st === 'approved'
        ? '<button class="btn btn-dark btn-sm" style="margin-top:10px;width:100%;opacity:.7;" onclick="adAct(\''+p.id+'\',\'pending\',\''+p.full_name+'\',\''+p.email+'\')">↩ Move back to Pending</button>'
        : '';

    var statusColor = st==='pending'?'rgba(232,184,48,.15)':st==='approved'?'rgba(39,174,96,.15)':'rgba(231,76,60,.15)';
    var textColor   = st==='pending'?'#FFD54F':st==='approved'?'#4ade80':'#ff6b6b';

    l.innerHTML +=
      '<div class="card" style="margin-bottom:16px;border:1px solid rgba(212,160,23,.1);">'+
        '<div style="display:flex;gap:10px;align-items:center;margin-bottom:4px;">'+
          '<div class="avatar" style="'+(p.photo_url?'background-image:url('+p.photo_url+');background-size:cover;background-position:center':'')+';border-color:'+f.color+';">'+
            (!p.photo_url?'<span style="font-size:18px;opacity:.3">👤</span>':'')+
          '</div>'+
          '<div style="flex:1;">'+
            '<h3 style="font-size:15px;margin:0;font-weight:700;color:#fff;">'+p.full_name+', '+p.age+'</h3>'+
            '<p style="font-size:12px;color:'+f.color+';margin:2px 0;">'+f.icon+' '+(p.denomination||p.religion||'')+'</p>'+
            '<p style="font-size:10px;color:var(--w40);margin:0;">'+p.city+', '+p.state+'</p>'+
          '</div>'+
          '<span style="font-size:10px;padding:4px 10px;border-radius:20px;font-weight:700;background:'+statusColor+';color:'+textColor+';">'+st.toUpperCase()+'</span>'+
        '</div>'+
        details + photoHtml + idHtml + act +
      '</div>';
  });
}

async function adAct(id, st, name, email) {
  await sb.from('profiles').update({status:st, approved_at:st==='approved'?new Date().toISOString():null}).eq('id', id);
  if (st === 'approved' && email) {
    try {
      await fetch(SB_URL+'/functions/v1/smart-function', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({type:'approved', full_name:name, email:email})
      });
    } catch(x) {}
  }
  ldAdmin('pending');
}

// ═══════════════════════════════════════════ REJECT MODAL
var _rejectId = '', _rejectName = '', _rejectEmail = '';

function openRejectModal(id, name, email) {
  _rejectId = id; _rejectName = name; _rejectEmail = email;
  document.getElementById('rejectModalName').textContent = name;
  document.getElementById('rejectReason').value = '';
  document.getElementById('rejectReasonErr').style.display = 'none';
  document.getElementById('rejectModal').classList.add('show');
}
function closeRejectModal() { document.getElementById('rejectModal').classList.remove('show'); }
function setRejectReason(text) { document.getElementById('rejectReason').value = text; }

async function submitReject() {
  var reason = document.getElementById('rejectReason').value.trim();
  var errEl  = document.getElementById('rejectReasonErr');
  if (!reason) { errEl.textContent = 'Please enter a reason before rejecting.'; errEl.style.display = 'block'; return; }
  var btn = document.getElementById('rejectSubmitBtn');
  btn.disabled = true; btn.textContent = 'Rejecting...';
  await sb.from('profiles').update({status:'rejected', rejection_reason:reason}).eq('id', _rejectId);
  try {
    await fetch(SB_URL+'/functions/v1/smart-function', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({type:'rejected', full_name:_rejectName, email:_rejectEmail, rejection_reason:reason})
    });
  } catch(x) {}
  btn.disabled = false; btn.textContent = 'Confirm Rejection';
  closeRejectModal();
  ldAdmin('pending');
}
