// ═══════════════════════════════════════════ CONFIG
const SB_URL = 'https://neftjxvovxocqabxjvme.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5lZnRqeHZvdnhvY3FhYnhqdm1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTgyMjksImV4cCI6MjA5MDM3NDIyOX0.qWIVda-i5MsCy1OinW4JLLciI1B4ArBWviWIuGcOPBc';
const sb = supabase.createClient(SB_URL, SB_KEY);
const OTP_FN = SB_URL + '/functions/v1/send-otp';

// 15 days from tomorrow
const LAUNCH = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);

// Global state
let U = null, P = null;
let photos = [null,null,null,null,null];
let idFile = null;
let editPhotos = [null,null,null,null,null];
let fpBrowse = [], fpReceive = [];
let setupBrowse = [], setupReceive = [];
let otpPhone = '', resendInterval = null, step = 1;

// ═══════════════════════════════════════════ FAITHS
const FAITHS = [
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

const FAITH_CARDS = [
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

const DENOM_MAP = {
  Christian:['Catholic','Protestant','Pentecostal','Baptist','CSI / CNI','Methodist','Seventh-day Adventist','Church of God','Assemblies of God','Orthodox','Mar Thoma','Brethren','Lutheran','Presbyterian','Anglican','Non-Denominational','Other'],
  Hindu:    ['Shaivism','Vaishnavism','Shaktism','Smartism','ISKCON','Arya Samaj','Other'],
  Muslim:   ['Sunni','Shia','Sufi','Ahmadiyya','Ismaili','Other'],
  Sikh:     ['Amritdhari','Sahajdhari','Nanakpanthi','Other'],
  Jain:     ['Digambara','Shvetambara','Other'],
  Buddhist: ['Theravada','Mahayana','Vajrayana','Zen','Other'],
  Jewish:   ['Orthodox','Conservative','Reform','Other']
};

const CT = {
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

function faithByKey(k) {
  return FAITHS.find(f => f.key === k) || FAITHS[FAITHS.length - 1];
}
