let categories=[];
let datasets={};
let currentKey='';
let currentItems=[];

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

function showPage(id){
  $$('.page').forEach(p=>p.classList.remove('active'));
  const p=$('#'+id);
  if(p)p.classList.add('active');
  window.scrollTo({top:0,behavior:'smooth'});
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
    return `
      <article class="service-row emergency-service-card">
        <div class="service-info">
          <div class="service-name">${esc(item.name||item.title||'Emergency Service')}</div>
          <div class="service-number">${esc(phone||'Number unavailable')}</div>
        </div>
        ${
          phone
          ? `<a class="call-btn emergency-call" href="tel:${esc(phone)}">☎ CALL</a>`
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
  const location=item?.location||item?.region||'Goa';
  const description=item?.description||item?.summary||'';

  let intro=description;
  let sections=[];

  if(key==='scams'){
    sections=[
      ['How this scam works',
       item.how_it_works||
       `${name} can involve misleading offers, pressure to make a quick payment, or information that is difficult to verify. Always slow down and verify the person, business, price and payment request before proceeding.`],

      ['Warning signs',
       item.warning_signs||
       'Be cautious if someone creates urgency, refuses to provide written details, asks for unusual deposits, requests OTP/UPI PIN information, or gives you information that cannot be independently verified.']],

      ['How to protect yourself',
       item.protect_yourself||
       'Use established businesses, confirm prices before paying, keep receipts, avoid sharing OTPs or PINs, and verify important information using an official source.']],

      ['If you are targeted',
       item.what_to_do||
       'Do not argue or escalate the situation. Keep evidence such as messages, receipts, phone numbers and payment details. If money has been transferred electronically, contact your bank/payment provider immediately and report suspected fraud to the appropriate authorities.']
    ];
  }

  else if(key==='rules'){
    sections=[
      ['Why this matters',
       item.why||
       'Following local rules protects visitors, residents, wildlife, heritage sites and Goa’s environment. Some violations can also result in fines or other legal consequences.']],

      ['What visitors should do',
       item.what_to_do||
       'Follow signs, instructions from authorities and lifeguards, use authorised services, respect local customs and dispose of waste responsibly.']],

      ['What to avoid',
       item.what_to_avoid||
       'Avoid behaviour that puts yourself or others at risk, damages public property or the environment, or violates local laws and restrictions.']],

      ['Important',
       item.safety||
       'Rules and restrictions can change. When in doubt, check the latest official Goa Tourism or government guidance.']
    ];
  }

  else if(key==='temples'){
    sections=[
      ['About this temple',
       `${name} is part of Goa’s rich Hindu religious and cultural heritage. Visitors can experience the architecture, traditions, rituals and community life associated with the temple.`],

      ['What to expect',
       'Temple visits may involve prayer areas, ceremonial spaces, festivals and traditional customs. Opening arrangements and ceremonies can vary by day and occasion.']],

      ['Visitor etiquette',
       'Dress respectfully, follow signs and instructions, remove footwear where required, avoid disturbing worshippers and ask before photographing ceremonies or restricted areas.']
    ];
  }

  else if(key==='churches'){
    sections=[
      ['About this church',
       `${name} is part of Goa’s distinctive Christian and Indo-Portuguese heritage. Historic churches across Goa preserve important architecture, religious traditions and cultural history.`],

      ['What to expect',
       'Visitors may encounter active worship, heritage architecture, religious artwork and memorial spaces. Some churches may have separate arrangements for visitors and worshippers.']],

      ['Visitor etiquette',
       'Dress respectfully, keep noise low, avoid disturbing services and follow photography restrictions or instructions from church authorities.']
    ];
  }

  else if(key==='forts'){
    sections=[
      ['About this fort',
       `${name} represents an important part of Goa’s coastal and military history. Goa’s forts were associated with defence, trade routes, political control and strategic coastal positions.`],

      ['What to expect',
       'Many Goan forts are exposed to sun, wind and uneven terrain. Some structures are partially ruined, so visitors should remain on safe paths and respect restricted areas.']],

      ['Visitor tips',
       'Wear suitable footwear, carry water, avoid climbing unsafe walls and follow signs. Be especially careful near cliffs and exposed coastal edges.']
    ];
  }

  else if(key==='beaches'){
    sections=[
      ['Beach safety',
       'Check warning signs and consult lifeguards before entering the sea. Goa Tourism advises visitors to swim only in designated safe areas and to follow lifeguard instructions.']],

      ['Before swimming',
       'Never ignore red-flag warnings. Avoid entering the sea after consuming alcohol and be particularly careful during rough weather or strong currents.']],

      ['Keep Goa clean',
       'Do not leave plastic, glass or other waste behind. Keep personal belongings secure and respect turtle nesting and environmentally sensitive areas.']
    ];
  }

  else if(key==='food'){
    sections=[
      ['About this food',
       `${name} is associated with Goa’s distinctive culinary culture, influenced by local ingredients and generations of Goan cooking traditions.`],

      ['What to know',
       'Recipes can vary between homes and restaurants. Ask about ingredients if you have allergies or dietary restrictions.'],

      ['Where to try',
       'Look for established local restaurants, traditional eateries and trusted food establishments. Check current opening hours before travelling.']
    ];
  }

  else if(key==='museums'){
    sections=[
      ['About this museum',
       `${name} offers visitors an opportunity to learn about Goa’s history, art, culture and heritage.`],

      ['What to expect',
       'Collections, displays and visiting arrangements can change. Allow enough time to explore the exhibits and follow photography or visitor rules.']
    ];
  }

  else {
    sections=[
      ['About this place',
       intro||`${name} is a place worth exploring in Goa.`],

      ['Visitor information',
       `Located in ${location}, this destination can be explored as part of a Goa trip. Check current local conditions, opening arrangements and access information before visiting.`],

      ['Travel tip',
       'Respect the local community, keep the area clean and follow signs and instructions from the responsible authorities.']
    ];
  }

  return {intro,sections};
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

  const mapUrl=
    item.maps_url||
    item.googleMaps||
    maps(item.maps_query||item.name||'Goa');

  $('#detailDirections').href=mapUrl;
  $('#detailDirections').textContent='⌖  Open in Google Maps';

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
      const detail=$('#detailPage')?.classList.contains('active');
      const listing=$('#listingPage')?.classList.contains('active');
      const near=$('#nearPage')?.classList.contains('active');

      if(detail){
        showPage('listingPage');
        return;
      }

      if(listing||near){
        showPage('homePage');
        return;
      }

      return;
    }

    $$('.nav-item').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');

    if(nav==='home'){
      showPage('homePage');
    }

    if(nav==='explore'){
      showPage('homePage');
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
