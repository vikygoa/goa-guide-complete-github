let categories=[];
let datasets={};
let currentKey='';
let currentItems=[];
let pageHistory=['homePage'];

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

const ICONS={
  beaches:'🏖️',places:'📍',temples:'🛕',churches:'⛪',forts:'🏰',
  nature:'🌿',museums:'🏛️',hotels:'🏨',food:'🍛',transport:'🚌',
  restaurants:'🍽️',rentals:'🏍️',emergency:'🚨',rules:'⚠️',
  scams:'🛡️',nightlife:'🌙',shopping:'🛍️',money:'💳'
};

function esc(v){
  return String(v??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function showPage(id,addHistory=true){
  const current=$$('.page').find(p=>p.classList.contains('active'))?.id||'homePage';

  if(addHistory && current!==id){
    pageHistory.push(id);
  }

  $$('.page').forEach(p=>p.classList.remove('active'));

  const p=$('#'+id);
  if(p)p.classList.add('active');

  window.scrollTo({top:0,behavior:'smooth'});
}

function goBack(){
  if(pageHistory.length<=1){
    showPage('homePage',false);
    return;
  }

  pageHistory.pop();

  const previous=pageHistory[pageHistory.length-1]||'homePage';

  showPage(previous,false);
}

function maps(q){
  return 'https://www.google.com/maps/search/?api=1&query='+
    encodeURIComponent(q||'Goa');
}

/*
  Accept all common JSON formats:
  []
  {items:[]}
  {data:[]}
  {rules:[]}
  {scams:[]}
  {beaches:[]}
  {places:[]}
  etc.
*/
function normalize(raw){
  if(Array.isArray(raw)) return raw;

  if(!raw || typeof raw!=='object') return [];

  for(const key of Object.keys(raw)){
    if(Array.isArray(raw[key])) return raw[key];
  }

  return [];
}

function getImage(item,key){
  if(item?.image && String(item.image).trim())
    return String(item.image);

  if(item?.imageUrl && String(item.imageUrl).trim())
    return String(item.imageUrl);

  if(item?.photo && String(item.photo).trim())
    return String(item.photo);

  return '';
}

function categoryIcon(key){
  return ICONS[key]||'🌴';
}

function renderHome(){
  const grid=$('#categoryGrid');
  if(!grid)return;

  grid.innerHTML=categories.map(c=>`
    <button class="category-card" data-key="${esc(c.id)}">
      <span class="cat-icon"><img src="${esc(c.icon)}" alt="" onerror="this.style.display='none';this.parentElement.textContent='${categoryIcon(c.id)}'"></span>
      <strong>${esc(c.name)}</strong>
      <small>${esc(c.description||'Explore Goa')}</small>
    </button>
  `).join('');

  $$('.category-card').forEach(b=>{
    b.onclick=()=>openListingFast(b.dataset.key);
  });
}

function renderSpecialCard(item,key){
  const type=key;

  if(type==='rules'){
    const img=getImage(item,key);
    return `
      <article class="info-card rule-card">
        <div class="special-icon">
          ${img
            ? `<img src="${esc(img)}" alt="" onerror="this.style.display='none';this.parentElement.textContent='⚠️'">`
            : '⚠️'}
        </div>
        <div class="info-content">
          <div class="place-name">${esc(item.title||item.name||'Tourist Rule')}</div>
          <p class="place-desc">
            ${esc(item.description||item.explanation||item.summary||'Important information for visitors to Goa.')}
          </p>
          <button class="mini-btn primary" data-open="${esc(item.id||item.name)}">
            Read Rule
          </button>
        </div>
      </article>`;
  }

  if(type==='scams'){
    const img=getImage(item,key);
    return `
      <article class="info-card scam-card">
        <div class="special-icon">
          ${img
            ? `<img src="${esc(img)}" alt="" onerror="this.style.display='none';this.parentElement.textContent='🛡️'">`
            : '🛡️'}
        </div>
        <div class="info-content">
          <div class="place-name">${esc(item.title||item.name||'Tourist Scam Alert')}</div>
          <p class="place-desc">
            ${esc(item.description||item.summary||item.how_it_works||'Learn how to recognise and avoid this scam.')}
          </p>
          <button class="mini-btn primary" data-open="${esc(item.id||item.name)}">
            Safety Details
          </button>
        </div>
      </article>`;
  }

  if(type==='emergency'){
    const phone=item.phone||item.number||'';
    const callPhone=phone.split('/')[0].trim();
    return `
      <article class="service-row emergency-service-card">
        <div class="service-info">
          <div class="service-name">${esc(item.name||item.title||'Emergency Service')}</div>
          <div class="service-number">${esc(phone||'Number unavailable')}</div>
        </div>
        ${
          phone
          ? `<a class="call-btn emergency-call" href="tel:${esc(callPhone.replace(/[^0-9+]/g,''))}">☎ CALL</a>`
          : ''
        }
      </article>`;
  }

  const img=getImage(item,key);

  return `
    <article class="place-row">
      ${img
        ? `<img class="place-thumb"
                src="${esc(img)}"
                alt=""
                loading="lazy"
                onerror="this.style.display='none'">`
        : `<div class="visual-placeholder">${categoryIcon(key)}</div>`}

      <div class="place-main">
        <div class="place-name">
          ${esc(item.name||item.title||'Goa')}
        </div>

        <div class="place-location">
          ${esc(item.location||item.region||item.area||'Goa')}
        </div>

        ${
          item.rating
          ? `<div class="rating">★ ${esc(item.rating)}</div>`
          : ''
        }

        <p class="place-desc">
          ${esc(item.description||item.summary||'Explore this Goa destination.')}
        </p>

        <div class="row-actions">
          <button class="mini-btn primary"
                  data-open="${esc(item.id||item.name)}">
            View Details
          </button>

          <a class="mini-btn"
             target="_blank"
             rel="noopener"
             href="${esc(item.maps_url||item.googleMaps||maps(item.maps_query||item.name))}">
            Directions
          </a>
        </div>
      </div>
    </article>`;
}

function renderItems(items){
  const box=$('#listItems');
  if(!box)return;

  if(!items.length){
    box.innerHTML=`
      <div class="empty-state">
        <div style="font-size:42px;margin-bottom:10px">
          ${categoryIcon(currentKey)}
        </div>
        <strong>No information available yet</strong>
        <p>This section is ready for more Goa content.</p>
      </div>`;
    return;
  }

  box.innerHTML=items.map(i=>renderSpecialCard(i,currentKey)).join('');

  $$('[data-open]').forEach(btn=>{
    btn.onclick=()=>{
      const id=btn.dataset.open;
      const item=currentItems.find(x=>
        String(x.id||x.name)===String(id)
      );
      openDetail(item);
    };
  });
}

function renderChips(){
  const box=$('#chips');
  if(!box)return;

  const tags=[];

  currentItems.forEach(i=>{
    if(Array.isArray(i.tags)){
      i.tags.forEach(t=>{
        if(!tags.includes(t))tags.push(t);
      });
    }
  });

  box.innerHTML=[
    '<button class="chip active" data-chip="All">All</button>',
    ...tags.slice(0,8).map(t=>
      `<button class="chip" data-chip="${esc(t)}">${esc(t)}</button>`
    )
  ].join('');

  $$('.chip').forEach(btn=>{
    btn.onclick=()=>{
      $$('.chip').forEach(x=>x.classList.remove('active'));
      btn.classList.add('active');
      filterList(btn.dataset.chip);
    };
  });
}

function filterList(chip='All'){
  let items=[...currentItems];

  const q=($('#listSearch')?.value||'').trim().toLowerCase();

  if(chip!=='All'){
    items=items.filter(i=>
      JSON.stringify(i).toLowerCase().includes(
        chip.toLowerCase()
      )
    );
  }

  if(q){
    items=items.filter(i=>
      JSON.stringify(i).toLowerCase().includes(q)
    );
  }

  renderItems(items);
}

function openListing(key){
  const c=categories.find(x=>x.id===key);
  if(!c)return;

  currentKey=key;
  currentItems=datasets[key]||[];

  $('#listingIcon').textContent=categoryIcon(key);
  $('#listingTitle').textContent=c.name;
  $('#listingSubtitle').textContent=
    `${currentItems.length} ${currentItems.length===1?'place':'items'}`;

  renderChips();
  renderItems(currentItems);
  showPage('listingPage');
}


function smartDetail(item,key){

  const name=item?.name||item?.title||'This Goa destination';
  const location=item?.location||item?.region||item?.area||'Goa';
  const description=item?.description||item?.summary||'';

  const sections=[];

  function add(title,text){
    if(text) sections.push([title,text]);
  }

  /* ================= SCAMS ================= */

  if(key==='scams'){

    add(
      'How this scam works',
      item.how_it_works ||
      `${name} can involve a person presenting a believable offer, service or problem and then trying to make the visitor pay quickly. The safest approach is to slow down, check the information independently and never make a payment simply because someone is creating pressure.`
    );

    add(
      'Warning signs',
      item.warning_signs ||
      'Be careful when someone creates urgency, offers an unusually cheap deal, refuses to give written details, asks for an unexplained deposit, requests an OTP or UPI PIN, asks you to scan a QR code to receive money, or refuses to provide a receipt.'
    );

    add(
      'How to protect yourself',
      item.protect_yourself ||
      'Confirm the business, price and terms before paying. Use official websites or established businesses, keep screenshots and receipts, avoid sharing OTPs or UPI PINs, and never install remote-access software because a stranger tells you to.'
    );

    add(
      'If someone targets you',
      item.what_to_do ||
      'Stay calm and do not hand over cash, cards or personal information under pressure. Save messages, receipts, phone numbers, booking details and payment information. If money was transferred electronically, contact your bank or payment provider immediately and report suspected cyber fraud through the appropriate official channel.'
    );

    add(
      'Remember',
      'A genuine service should allow you time to check the price and details. If a person says you must pay immediately or threatens you for refusing, stop the transaction and seek help.'
    );
  }

  /* ================= RULES ================= */

  else if(key==='rules'){

    add(
      'Why this rule matters',
      item.why ||
      `${name} is important because visitors share Goa with local communities, wildlife, religious sites, public spaces and other travellers. Following the rule reduces accidents, protects the environment and helps visitors avoid legal or administrative problems.`
    );

    add(
      'What tourists should do',
      item.what_to_do ||
      'Follow official signs, instructions from authorities and lifeguards. Use designated facilities, keep receipts where relevant, respect local customs and leave public places clean.'
    );

    add(
      'What to avoid',
      item.what_to_avoid ||
      'Do not ignore warning signs, enter restricted areas, damage property, disturb other people, create unsafe conditions or assume that a rule does not apply because other visitors are breaking it.'
    );

    add(
      'Safety / legal note',
      item.safety ||
      'Rules and restrictions can change. Check current Goa Tourism or government guidance when a situation involves beaches, traffic, alcohol, public events, wildlife or protected heritage sites.'
    );

    if(name.toLowerCase().includes('swimming')){
      add(
        'Beach safety',
        'Swim only in areas considered safe and follow lifeguard instructions. Never ignore red flags or enter rough water because other people are swimming.'
      );
    }

    if(name.toLowerCase().includes('drive') ||
       name.toLowerCase().includes('helmet') ||
       name.toLowerCase().includes('seatbelt')){
      add(
        'Before travelling',
        'Make sure the vehicle and required documents are in order. Use a helmet on two-wheelers and a seatbelt in cars, and never drive after drinking alcohol.'
      );
    }
  }

  /* ================= TEMPLES ================= */

  else if(key==='temples'){

    const known={
      'Manguesh Temple':
        'Manguesh Temple at Mardol is one of Goa’s well-known Shaiva temples and is dedicated to Lord Shiva. Its present setting is associated with the movement of the deity’s worship tradition away from the original area during the Portuguese period.',

      'Shantadurga Temple':
        'Shantadurga Temple at Kavlem is dedicated to Goddess Shantadurga and is one of the important Hindu pilgrimage sites in Goa. The temple is known for its distinctive Goan temple architecture and active religious traditions.',

      'Mahadev Temple (Tambdi Surla)':
        'The Mahadev Temple at Tambdi Surla is an important medieval Shiva temple set in Goa’s forested interior. Its stone architecture and remote setting make the journey part of the experience.',

      'Saptakoteshwar Temple':
        'Saptakoteshwar Temple at Narve is an important Shiva temple with deep connections to Goa’s history. The shrine was associated with the Kadamba period and was later restored under Chhatrapati Shivaji Maharaj. It remains an important religious and cultural site.',

      'Mahalsa Temple (Mardol)':
        'Mahalsa Temple at Mardol is dedicated to Goddess Mahalsa Narayani and is an important temple in Goa’s religious heritage. Visitors can observe traditional architecture, rituals and a living place of worship.'
    };

    add('About this temple',
      known[name] ||
      `${name} is part of Goa’s living Hindu religious and cultural heritage. Its importance is not only architectural but also connected with local traditions, worship and community life.`
    );

    add(
      'What you may see',
      'Depending on the time of your visit, you may see prayer areas, traditional Goan temple architecture, ceremonial spaces and festival preparations. Religious activity can be particularly busy during important festivals.'
    );

    add(
      'Visitor etiquette',
      'Dress respectfully, remove footwear where requested, follow temple instructions and avoid disturbing worshippers. Ask before taking photographs during ceremonies or in restricted areas.'
    );

    add(
      'Before you visit',
      'Opening arrangements, ceremonies and access to particular areas can vary. If you are travelling specifically for a ritual or festival, check the temple’s current local arrangements before travelling.'
    );
  }

  /* ================= CHURCHES ================= */

  else if(key==='churches'){

    const known={
      'Basilica of Bom Jesus':
        'The Basilica of Bom Jesus in Old Goa is one of Goa’s best-known historic churches and forms part of the UNESCO-listed Churches and Convents of Goa. It is especially significant for its Baroque architecture and religious heritage.',

      'Se Cathedral':
        'Se Cathedral in Old Goa is one of the major historic churches of Goa and part of the UNESCO World Heritage complex. Its large scale and Portuguese-era architecture make it one of the most important heritage landmarks in Old Goa.',

      'Church of St. Francis of Assisi':
        'The Church of St. Francis of Assisi is part of the historic Old Goa church complex and is known for its religious art, architecture and connection with Goa’s Portuguese-era heritage.',

      "St. Cajetan's Church":
        "St. Cajetan’s Church in Old Goa is a notable historic church whose architecture reflects European influences and the religious history of Portuguese Goa."
    };

    add('About this church',
      known[name] ||
      `${name} forms part of Goa’s distinctive Christian and Indo-Portuguese heritage. Historic churches in Goa preserve architecture, religious traditions, artwork and important chapters of the region’s history.`
    );

    add(
      'What to expect',
      'Many churches are active places of worship as well as heritage sites. Visitors may encounter Mass, prayer, religious ceremonies, memorials and heritage architecture.'
    );

    add(
      'Visitor etiquette',
      'Dress respectfully, keep your voice low, do not interrupt services and follow photography restrictions. Remember that an active church is a place of worship, not only a tourist attraction.'
    );

    add(
      'Heritage tip',
      'Take time to observe architectural details, paintings and surrounding heritage structures without touching or climbing historic features.'
    );
  }

  /* ================= FORTS ================= */

  else if(key==='forts'){

    const known={
      'Fort Aguada':
        'Fort Aguada is a major Portuguese-era fortification on the Sinquerim/Candolim peninsula. Built as part of Goa’s coastal defence system, it is known for its strategic position, fort walls and historic water-storage system.',

      'Chapora Fort':
        'Chapora Fort stands above the Chapora River and is known for its elevated coastal setting and wide views. The present fortification reflects the strategic importance of the area in Goa’s changing political and military history.',

      'Reis Magos Fort':
        'Reis Magos Fort overlooks the Mandovi River and formed part of Goa’s defensive network. Its position allowed it to help control approaches along the river and toward the old capital area.',

      'Cabo de Rama Fort':
        'Cabo de Rama Fort occupies a dramatic coastal headland in South Goa. Its location gives visitors views across the coast while also showing why headlands were strategically important for coastal defence.'
    };

    add('About this fort',
      known[name] ||
      `${name} is part of Goa’s military and coastal heritage. Goa’s forts were connected with defence, trade routes, political control and strategically important coastal or river positions.`
    );

    add(
      'What to expect',
      'Expect uneven ground, exposed sun and wind, steps and partially ruined structures at some sites. Some viewpoints are close to steep edges or cliffs.'
    );

    add(
      'Visitor safety',
      'Stay on safe paths, do not climb unstable walls, be careful near cliff edges and carry water during hot weather. Follow any restricted-area signs.'
    );

    add(
      'History tip',
      'Look at the fort’s position as well as its walls. Many Goan forts were deliberately placed to control rivers, harbours, sea approaches and movement through important areas.'
    );
  }

  /* ================= BEACHES ================= */

  else if(key==='beaches'){

    add('About this beach',
      description ||
      `${name} is one of Goa’s coastal destinations in ${location}.`
    );

    add(
      'Beach safety',
      'Follow lifeguard instructions and warning flags. Swim only where conditions are considered safe and never enter the sea simply because other people are doing so.'
    );

    add(
      'Before swimming',
      'Avoid swimming after consuming alcohol. Be especially careful during rough weather, strong currents and red-flag conditions.'
    );

    add(
      'Keep Goa clean',
      'Do not leave plastic, glass or other waste behind. Respect environmentally sensitive areas and local restrictions.'
    );
  }

  /* ================= FOOD ================= */

  else if(key==='food'){

    add('About this food',
      description ||
      `${name} is associated with Goa’s distinctive culinary traditions and local ingredients.`
    );

    add(
      'What to know',
      'Recipes vary between homes and restaurants. If you have allergies or dietary restrictions, ask about ingredients before ordering.'
    );

    add(
      'Where to try',
      'Look for established local restaurants and traditional eateries. Check current opening hours and prices before travelling.'
    );
  }

  /* ================= GENERIC ================= */

  else {

    add(
      'About this place',
      description ||
      `${name} is a destination in Goa worth exploring.`
    );

    add(
      'What to expect',
      `This destination is located in ${location}. Conditions, opening arrangements, access and visitor facilities can change, so check current local information before travelling.`
    );

    add(
      'Visitor tip',
      'Respect local people and property, keep the area clean, follow signs and instructions, and take extra care around roads, water, cliffs and restricted areas.'
    );
  }

  return {
    intro:description,
    sections
  };
}

function openDetail(item){
  if(!item)return;

  const key=item.__key||currentKey;

  $('#detailName').textContent=
    item.name||item.title||'Goa';

  $('#detailMeta').textContent=
    item.location||
    item.region||
    item.area||
    'Goa';

  const info=smartDetail(item,key);

  $('#detailDescription').textContent=
    info.intro||
    item.description||
    'Information about this Goa destination.';

  const photo=$('#detailPhoto');
  const photoBox=photo?.parentElement;
  const image=getImage(item,key);

  if(photoBox){
    photoBox.classList.remove('no-detail-image');
  }

  if(image){
    photo.src=image;
    photo.style.display='block';
  }else{
    photo.removeAttribute('src');
    photo.style.display='none';

    if(photoBox){
      photoBox.classList.add('no-detail-image');
      photoBox.dataset.icon=categoryIcon(key);
    }
  }

  const facts=[];

  if(item.location)
    facts.push(['📍','Location',item.location]);

  if(item.region)
    facts.push(['🧭','Area',item.region]);

  if(item.category)
    facts.push(['▣','Category',item.category]);

  if(item.rating)
    facts.push(['★','Rating',item.rating]);

  if(item.hours)
    facts.push(['🕐','Opening Hours',item.hours]);

  if(item.entry_fee)
    facts.push(['🎟️','Entry Fee',item.entry_fee]);

  let html=facts.map(f=>`
    <div class="fact">
      <div class="fact-icon">${f[0]}</div>
      <div>
        <strong>${esc(f[1])}</strong>
        <span>${esc(f[2])}</span>
      </div>
    </div>
  `).join('');

  html+=info.sections.map(section=>`
    <section class="detail-info-card">
      <h3>${esc(section[0])}</h3>
      <p>${esc(section[1])}</p>
    </section>
  `).join('');

  $('#detailFacts').innerHTML=html;

  const mapButton=$('#detailDirections');

  const noMap=
    key==='scams' ||
    key==='rules' ||
    key==='emergency';

  if(mapButton){

    if(noMap){
      mapButton.style.display='none';
      mapButton.removeAttribute('href');
    }else{
      const mapUrl=
        item.maps_url||
        item.googleMaps||
        maps(item.maps_query||item.name||'Goa');

      mapButton.href=mapUrl;
      mapButton.textContent='⌖  Open in Google Maps';
      mapButton.style.display='flex';
    }
  }

  showPage('detailPage');
}

async function load(){
  try{
    const response=await fetch('data/categories.json');
    categories=await response.json();

    /*
      Important performance improvement:
      Load category JSON only when the user opens it.
      Home no longer downloads every category at startup.
    */

    renderHome();

  }catch(e){
    console.error('categories.json failed',e);
  }
}

async function loadCategory(key){
  const c=categories.find(x=>x.id===key);
  if(!c)return [];

  if(datasets[key])return datasets[key];

  try{
    const response=await fetch(c.dataPath,{
      cache:'no-store'
    });

    if(!response.ok)throw new Error(
      `HTTP ${response.status}`
    );

    const raw=await response.json();
    datasets[key]=normalize(raw);

    return datasets[key];

  }catch(e){
    console.error(`Failed loading ${key}`,e);
    datasets[key]=[];
    return [];
  }
}

async function openListingFast(key){
  const c=categories.find(x=>x.id===key);
  if(!c)return;

  currentKey=key;

  $('#listingIcon').textContent=categoryIcon(key);
  $('#listingTitle').textContent=c.name;
  $('#listingSubtitle').textContent='Loading…';

  $('#chips').innerHTML=
    '<button class="chip active">All</button>';

  $('#listItems').innerHTML=`
    <div class="loading-card">
      <div class="loading-icon">${categoryIcon(key)}</div>
      <strong>Loading ${esc(c.name)}…</strong>
    </div>`;

  showPage('listingPage');

  currentItems=await loadCategory(key);

  $('#listingSubtitle').textContent=
    `${currentItems.length} ${currentItems.length===1?'item':'items'}`;

  renderChips();
  renderItems(currentItems);
}

$$('.nav-item').forEach(btn=>{
  btn.onclick=()=>{
    const nav=btn.dataset.nav;

    if(nav==='back'){
      goBack();
      return;
    }

    $$('.nav-item').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');

    if(nav==='home'){
      pageHistory=['homePage'];
      showPage('homePage',false);
    }

    if(nav==='explore'){
      pageHistory=['homePage'];
      showPage('homePage',false);
      setTimeout(()=>{
        $('#globalSearch')?.focus();
      },100);
    }

    if(nav==='near'){
      showPage('nearPage');
    }
  };
});

$('#listingBack')?.addEventListener(
  'click',
  ()=>showPage('homePage')
);

$('#detailBack')?.addEventListener(
  'click',
  ()=>showPage('listingPage')
);

$('#emergencyBack')?.addEventListener(
  'click',
  ()=>showPage('homePage')
);

$('#listSearch')?.addEventListener(
  'input',
  ()=>filterList(
    $('.chip.active')?.dataset.chip||'All'
  )
);

$('#globalSearch')?.addEventListener('input',async e=>{
  const q=e.target.value.trim().toLowerCase();

  if(q.length<2)return;

  const found=[];

  for(const c of categories){
    const items=await loadCategory(c.id);

    items.forEach(item=>{
      if(JSON.stringify(item).toLowerCase().includes(q)){
        found.push({...item,__key:c.id});
      }
    });
  }

  currentKey='places';
  currentItems=found;

  $('#listingIcon').textContent='🔎';
  $('#listingTitle').textContent='Search Results';
  $('#listingSubtitle').textContent=
    `${found.length} results`;

  $('#chips').innerHTML=
    '<button class="chip active">All</button>';

  renderItems(found);
  showPage('listingPage');
});

load();

window.openListing=openListingFast;
