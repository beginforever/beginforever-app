// ═══════════════════════════════════════════ CONFIG
var SB_URL = 'https://neftjxvovxocqabxjvme.supabase.co';
var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZnRqeHZvdnhvY3FhYnhqdm1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTgyMjksImV4cCI6MjA5MDM3NDIyOX0.qWIVda-i5MsCy1OinW4JLLciI1B4ArBWviWIuGcOPBc';
var sb = supabase.createClient(SB_URL, SB_KEY);

// Launch date: 7 June 2026 00:00 IST
var LAUNCH = new Date('2026-06-06T18:30:00Z');

function isPreLaunch() { return new Date() < LAUNCH; }

// Global state
var U = null, P = null;
var photos = [null,null,null,null,null];
var idFile = null;
var editPhotos = [null,null,null,null,null];
var fpBrowse = [], fpReceive = [];
var setupBrowse = [], setupReceive = [];
var step = 1;

var FAITHS = [
  {key:'Christian', icon:'✝️', color:'#9B59B6', bg:'rgba(155,89,182,0.15)'},
  {key:'Hindu',     icon:'🕉️', color:'#E07020', bg:'rgba(224,112,32,0.15)'},
  {key:'Muslim',    icon:'☪️',  color:'#2E8B57', bg:'rgba(46,139,87,0.15)'},
  {key:'Sikh',      icon:'☬',  color:'#C8960C', bg:'rgba(200,150,12,0.15)'},
  {key:'Jain',      icon:'🕊️', color:'#4A90D9', bg:'rgba(74,144,217,0.15)'},
  {key:'Buddhist',  icon:'☸️', color:'#D4700A', bg:'rgba(212,112,10,0.15)'},
  {key:'Parsi',     icon:'🔥', color:'#C0392B', bg:'rgba(192,57,43,0.15)'},
  {key:'Jewish',    icon:'✡️', color:'#2980B9', bg:'rgba(41,128,185,0.15)'},
  {key:'Bahai',     icon:'⭐', color:'#8E44AD', bg:'rgba(142,68,173,0.15)'},
  {key:'Spiritual', icon:'🌱', color:'#27AE60', bg:'rgba(39,174,96,0.15)'},
  {key:'Other',     icon:'🌐', color:'#888',    bg:'rgba(136,136,136,0.15)'}
];

var FAITH_CARDS = [
  {key:'Christian', icon:'✝️', color:'#9B59B6', denoms:'Catholic · Protestant · Pentecostal · Orthodox · Baptist · Brethren'},
  {key:'Hindu',     icon:'🕉️', color:'#E07020', denoms:'Shaivism · Vaishnavism · Shaktism · ISKCON · Arya Samaj'},
  {key:'Muslim',    icon:'☪️',  color:'#2E8B57', denoms:'Sunni · Shia · Sufi · Ahmadiyya · Ismaili'},
  {key:'Sikh',      icon:'☬',  color:'#C8960C', denoms:'Amritdhari · Sahajdhari · Nanakpanthi'},
  {key:'Jain',      icon:'🕊️', color:'#4A90D9', denoms:'Digambara · Shvetambara'},
  {key:'Buddhist',  icon:'☸️', color:'#D4700A', denoms:'Theravada · Mahayana · Vajrayana · Zen'},
  {key:'Parsi',     icon:'🔥', color:'#C0392B', denoms:'Zoroastrian'},
  {key:'Jewish',    icon:'✡️', color:'#2980B9', denoms:'Orthodox · Conservative · Reform'},
  {key:'Bahai',     icon:'⭐', color:'#8E44AD', denoms:''},
  {key:'Spiritual', icon:'🌱', color:'#27AE60', denoms:'No Religion · Agnostic · Spiritual'},
  {key:'Other',     icon:'🌐', color:'#888',    denoms:'Any other faith or background'}
];

var DENOM_MAP = {
  Christian:['Catholic','Protestant','Pentecostal','Baptist','CSI / CNI','Methodist','Seventh-day Adventist','Church of God','Assemblies of God','Orthodox','Mar Thoma','Brethren','Lutheran','Presbyterian','Anglican','Non-Denominational','Other'],
  Hindu:    ['Shaivism','Vaishnavism','Shaktism','Smartism','ISKCON','Arya Samaj','Other'],
  Muslim:   ['Sunni','Shia','Sufi','Ahmadiyya','Ismaili','Other'],
  Sikh:     ['Amritdhari','Sahajdhari','Nanakpanthi','Other'],
  Jain:     ['Digambara','Shvetambara','Other'],
  Buddhist: ['Theravada','Mahayana','Vajrayana','Zen','Other'],
  Jewish:   ['Orthodox','Conservative','Reform','Other']
};

var CT = {
  'Andhra Pradesh':['Visakhapatnam','Vijayawada','Guntur','Tirupati','Other'],
  'Assam':['Guwahati','Silchar','Other'],
  'Bihar':['Patna','Gaya','Other'],
  'Chhattisgarh':['Raipur','Other'],
  'Delhi':['New Delhi','South Delhi','North Delhi','East Delhi','West Delhi','Other'],
  'Goa':['Panaji','Margao','Other'],
  'Gujarat':['Ahmedabad','Surat','Vadodara','Rajkot','Other'],
  'Haryana':['Gurugram','Faridabad','Other'],
  'Himachal Pradesh':['Shimla','Dharamshala','Other'],
  'Jharkhand':['Ranchi','Jamshedpur','Other'],
  'Karnataka':['Bengaluru','Mysuru','Mangalore','Hubli','Other'],
  'Kerala':['Kochi','Thiruvananthapuram','Kozhikode','Thrissur','Kottayam','Other'],
  'Madhya Pradesh':['Bhopal','Indore','Jabalpur','Other'],
  'Maharashtra':['Mumbai','Pune','Nagpur','Nashik','Thane','Navi Mumbai','Other'],
  'Manipur':['Imphal','Other'],
  'Meghalaya':['Shillong','Other'],
  'Mizoram':['Aizawl','Other'],
  'Nagaland':['Kohima','Dimapur','Other'],
  'Odisha':['Bhubaneswar','Cuttack','Other'],
  'Punjab':['Ludhiana','Amritsar','Chandigarh','Other'],
  'Rajasthan':['Jaipur','Jodhpur','Udaipur','Other'],
  'Tamil Nadu':['Chennai','Coimbatore','Madurai','Salem','Other'],
  'Telangana':['Hyderabad','Warangal','Other'],
  'Tripura':['Agartala','Other'],
  'Uttar Pradesh':['Lucknow','Noida','Agra','Varanasi','Other'],
  'Uttarakhand':['Dehradun','Haridwar','Other'],
  'West Bengal':['Kolkata','Howrah','Siliguri','Other'],
  'Other / Outside India':['Other']
};

// ═══ BATCH 2 CONSTANTS ═══
var LOOKING_FOR_OPTIONS = [
  { v:'marriage_soon',   l:'Marriage — Ready soon (within 6-12 months)' },
  { v:'marriage_intime', l:'Marriage — In time (1-2 years)' },
  { v:'long_term',       l:'Serious long-term relationship' },
  { v:'companionship',   l:'Companionship' },
  { v:'friendship',      l:'Friendship first, see where it goes' },
  { v:'figuring_out',    l:'Still figuring it out' },
  { v:'casual',          l:'Casual' },
  { v:'dating',          l:'Dating' }
];

var PROFILE_FOR_OPTIONS = [
  'Myself', 'My Son', 'My Daughter', 'My Brother', 'My Sister',
  'My Friend', 'My Relative', 'Other'
];

var INCOME_BRACKETS = [
  { v:'under_3l', l:'Under ₹3L per year' },
  { v:'3_7l',     l:'₹3L – ₹7L per year' },
  { v:'7_15l',    l:'₹7L – ₹15L per year' },
  { v:'15_30l',   l:'₹15L – ₹30L per year' },
  { v:'30l_plus', l:'₹30L+ per year' },
  { v:'prefer_not', l:'Prefer not to say' }
];

var MARITAL_STATUSES = [
  'Never Married', 'Divorced', 'Widowed', 'Annulled', 'Awaiting Divorce'
];

// Height options: 5'0" to 6'5" in 1-inch steps (60in = 152cm to 77in = 196cm)
function buildHeightOptions() {
  var arr = [];
  for (var inches = 60; inches <= 77; inches++) {
    var ft = Math.floor(inches / 12);
    var inch = inches % 12;
    var cm = Math.round(inches * 2.54);
    arr.push({ in: inches, cm: cm, label: ft + "'" + inch + '" (' + cm + ' cm)' });
  }
  return arr;
}
var HEIGHT_OPTIONS = buildHeightOptions();

// Age range buckets for partner preferences
var AGE_RANGES = [
  { v:'18-22', min:18, max:22 },
  { v:'22-26', min:22, max:26 },
  { v:'26-30', min:26, max:30 },
  { v:'30-35', min:30, max:35 },
  { v:'35-40', min:35, max:40 },
  { v:'40-45', min:40, max:45 },
  { v:'45-50', min:45, max:50 },
  { v:'50_plus', min:50, max:99 }
];

function faithByKey(k) {
  return FAITHS.find(function(f){return f.key===k;}) || FAITHS[FAITHS.length-1];
}

function lookingForLabel(v) {
  var o = LOOKING_FOR_OPTIONS.find(function(x){return x.v===v;});
  return o ? o.l : '';
}

function incomeBracketLabel(v) {
  var o = INCOME_BRACKETS.find(function(x){return x.v===v;});
  return o ? o.l : '';
}

function cmToFtIn(cm) {
  if (!cm) return '';
  var totalIn = Math.round(cm / 2.54);
  var ft = Math.floor(totalIn / 12);
  var inch = totalIn % 12;
  return ft + "'" + inch + '"';
}
