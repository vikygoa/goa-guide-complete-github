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
  if(item.image && String(item.image).trim()){
    return String(item.image);
  }

  if(item.imageUrl && String(item.imageUrl).trim()){
    return String(item.imageUrl);
  }

  if(item.photo && String(item.photo).trim()){
    return String(item.photo);
  }

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
    return `
      <article class="info-card rule-card">
        <div class="special-icon">⚠️</div>
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
    return `
      <article class="info-card scam-card">
        <div class="special-icon">🛡️</div>
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
    return `
      <article class="service-row">
        <div class="service-icon">✚</div>
        <div class="service-info">
          <div class="service-name">${esc(item.name||item.title||'Emergency Service')}</div>
          <div class="service-loc">
            ${esc(item.description||item.location||'Goa')}
          </div>
        </div>
        ${
          item.phone||item.number
          ? `<a class="call-btn" href="tel:${esc(item.phone||item.number)}">Call</a>`
          : ''
        }
      </article>`;
  }

  return `
    <article class="place-row">
      <div class="visual-placeholder">${categoryIcon(key)}</div>

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

function openDetail(item){
  if(!item)return;

  $('#detailName').textContent=
    item.name||item.title||'Goa';

  $('#detailMeta').textContent=
    item.location||
    item.region||
    item.area||
    'Goa';

  $('#detailDescription').textContent=
    item.description||
    item.explanation||
    item.summary||
    item.how_it_works||
    'Information about this Goa attraction.';

  const photo=$('#detailPhoto');
  const image=getImage(item,currentKey);

  if(image){
    photo.src=image;
    photo.style.display='block';
  }else{
    photo.removeAttribute('src');
    photo.style.display='none';
    photo.parentElement.classList.add('no-detail-image');
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

  if(item.phone||item.number)
    facts.push(['☎','Phone',item.phone||item.number]);

  if(item.hours)
    facts.push(['🕐','Opening Hours',item.hours]);

  if(item.entry_fee)
    facts.push(['🎟️','Entry Fee',item.entry_fee]);

  $('#detailFacts').innerHTML=facts.map(f=>`
    <div class="fact">
      <div class="fact-icon">${f[0]}</div>
      <div>
        <strong>${esc(f[1])}</strong>
        <span>${esc(f[2])}</span>
      </div>
    </div>
  `).join('');

  $('#detailDirections').href=
    item.maps_url||
    item.googleMaps||
    maps(item.maps_query||item.name||'Goa');

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
    $$('.nav-item').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');

    const nav=btn.dataset.nav;

    if(nav==='home'||nav==='more'){
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
