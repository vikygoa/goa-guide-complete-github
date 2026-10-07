let categories=[];
let datasets={};
let currentKey='';
let currentItems=[];

const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];

function showPage(id){
  $$('.page').forEach(p=>p.classList.remove('active'));
  const page=$('#'+id);
  if(page) page.classList.add('active');
  window.scrollTo(0,0);
}

function maps(q){
  return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(q||'Goa');
}

function esc(s){
  return String(s??'').replace(/[&<>"']/g,c=>({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function iconFor(c){
  const icons={
    beaches:'🏖️',places:'📍',temples:'🛕',churches:'⛪',forts:'🏰',
    nature:'🌿',museums:'🏛️',hotels:'🏨',food:'🍛',transport:'🚌',
    restaurants:'🍽️',rentals:'🏍️',emergency:'🚨',rules:'⚠️',
    scams:'🛡️',nightlife:'🌙',shopping:'🛍️',money:'💳'
  };
  return icons[c.id]||'🌴';
}

function normalize(data){
  if(Array.isArray(data)) return {items:data};
  if(data && Array.isArray(data.items)) return data;
  return {items:[]};
}

function imageFor(item,key){
  if(item.image && String(item.image).trim()) return item.image;
  return `assets/images/${key}/${item.id||'default'}.jpg`;
}

function renderHome(){
  const grid=$('#categoryGrid');
  if(!grid)return;

  grid.innerHTML=categories.map(c=>`
    <button class="category-card" data-key="${esc(c.id)}">
      <span class="cat-icon">
        ${iconFor(c)}
        ${c.icon ? `<img src="${esc(c.icon)}" alt="" onerror="this.remove()">` : ''}
      </span>
      <strong>${esc(c.name)}</strong>
      <small>${esc(c.description||'Explore Goa')}</small>
    </button>
  `).join('');

  $$('.category-card').forEach(b=>{
    b.onclick=()=>openListing(b.dataset.key);
  });
}

async function openListing(key){
  const category=categories.find(c=>c.id===key);
  if(!category)return;

  currentKey=key;
  const data=datasets[key]||{items:[]};
  currentItems=data.items||[];

  $('#listingIcon').textContent=iconFor(category);
  $('#listingTitle').textContent=category.name;
  $('#listingSubtitle').textContent=category.description||'Explore Goa';
  renderChips();
  renderList();
  showPage('listingPage');
}

function renderChips(){
  const tags=[];
  currentItems.forEach(item=>{
    (item.tags||[]).forEach(tag=>{
      if(!tags.includes(tag))tags.push(tag);
    });
  });

  const chips=['All',...tags.slice(0,8)];

  $('#chips').innerHTML=chips.map((x,i)=>
    `<button class="chip ${i===0?'active':''}" data-chip="${esc(x)}">${esc(x)}</button>`
  ).join('');

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
      (i.region||'').toLowerCase().includes(chip.toLowerCase()) ||
      (i.tags||[]).some(t=>String(t).toLowerCase().includes(chip.toLowerCase()))
    );
  }

  if(q){
    items=items.filter(i=>JSON.stringify(i).toLowerCase().includes(q));
  }

  renderItems(items);
}

function renderList(){
  filterList($('.chip.active')?.dataset.chip||'All');
}

function renderItems(items){
  const box=$('#listItems');
  if(!box)return;

  if(!items.length){
    box.innerHTML='<div class="empty-state">No matching information found.</div>';
    return;
  }

  box.innerHTML=items.map(item=>`
    <article class="place-row">
      <img class="thumb"
           src="${esc(imageFor(item,currentKey))}"
           alt="${esc(item.name)}"
           loading="lazy"
           onerror="this.style.display='none'">

      <div class="place-main">
        <div class="place-name">${esc(item.name)}</div>

        <div class="place-location">
          ${esc(item.location||item.region||'Goa')}
        </div>

        ${item.rating ? `<div class="rating">★ ${esc(item.rating)}</div>`:''}

        <p class="place-desc">
          ${esc(item.description||'Goa travel information.')}
        </p>

        <div class="row-actions">
          <button class="mini-btn primary" data-open="${esc(item.id)}">
            View Details
          </button>

          <a class="mini-btn"
             href="${esc(item.maps_url||maps(item.maps_query||item.name))}"
             target="_blank"
             rel="noopener">
            Directions
          </a>
        </div>
      </div>
    </article>
  `).join('');

  $$('[data-open]').forEach(btn=>{
    btn.onclick=()=>{
      const item=currentItems.find(x=>String(x.id)===String(btn.dataset.open));
      openDetail(item);
    };
  });
}

function openDetail(item){
  if(!item)return;

  $('#detailName').textContent=item.name||'Goa';
  $('#detailMeta').textContent=
    (item.rating?`★ ${item.rating} · `:'')+
    (item.location||item.region||'Goa');

  $('#detailDescription').textContent=
    item.description||'Information about this place in Goa.';

  const photo=$('#detailPhoto');
  photo.src=imageFor(item,currentKey);
  photo.alt=item.name||'Goa';

  photo.onerror=()=>{
    photo.style.display='none';
  };

  const facts=[];

  if(item.location)
    facts.push(['📍','Location',item.location]);

  if(item.region)
    facts.push(['🧭','Area',item.region]);

  if(item.category)
    facts.push(['▣','Category',item.category]);

  if(item.phone)
    facts.push(['☎','Phone',item.phone]);

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
    item.maps_url||maps(item.maps_query||item.name);

  showPage('detailPage');
}

function renderEmergency(){
  const data=datasets.emergency||{items:[]};
  const items=data.items||[];

  const priority=[
    ['Police','100'],
    ['Ambulance','108'],
    ['Fire Brigade','101'],
    ['Tourist Helpline','1364']
  ];

  $('#emergencyGrid').innerHTML=priority.map(x=>`
    <div class="em-card">
      <a href="tel:${x[1]}">
        <div class="em-label">${x[0]}</div>
        <div class="em-number">${x[1]}</div>
      </a>
    </div>
  `).join('');

  $('#emergencyList').innerHTML=items.map(i=>`
    <div class="service-row">
      <div class="service-icon">✚</div>
      <div class="service-info">
        <div class="service-name">${esc(i.name)}</div>
        <div class="service-loc">
          ${esc(i.description||i.location||'Goa')}
        </div>
      </div>
      ${i.phone?`
        <a class="call-btn" href="tel:${esc(i.phone)}">Call</a>
      `:''}
    </div>
  `).join('');
}

async function loadNear(){
  try{
    const r=await fetch('data/places/near_me.json');
    datasets.near_me=normalize(await r.json());
  }catch(e){
    datasets.near_me={items:[]};
  }

  const items=datasets.near_me.items||[];

  $('#nearGrid').innerHTML=items.map(i=>`
    <div class="near-card">
      <div class="near-card-icon">📍</div>
      <strong>${esc(i.name)}</strong>
      <a href="${esc(i.maps_url||maps(i.maps_query||i.name))}"
         target="_blank" rel="noopener">
        Find near me →
      </a>
    </div>
  `).join('');
}

async function load(){
  try{
    categories=await fetch('data/categories.json').then(r=>r.json());

    for(const category of categories){
      try{
        const data=await fetch(category.dataPath).then(r=>r.json());
        datasets[category.id]=normalize(data);
      }catch(e){
        datasets[category.id]={items:[]};
      }
    }

    renderHome();
    renderEmergency();
    await loadNear();

  }catch(e){
    console.error('Goa Guide loading error:',e);
  }
}

$('#listingBack')?.addEventListener('click',()=>showPage('homePage'));
$('#detailBack')?.addEventListener('click',()=>showPage('listingPage'));
$('#emergencyBack')?.addEventListener('click',()=>showPage('homePage'));

$('#listingMap')?.addEventListener('click',()=>{
  window.open(maps($('#listingTitle').textContent+' Goa'),'_blank');
});

$('#listSearch')?.addEventListener('input',()=>{
  filterList($('.chip.active')?.dataset.chip||'All');
});

$('#globalSearch')?.addEventListener('input',e=>{
  const q=e.target.value.trim().toLowerCase();
  if(q.length<2)return;

  const found=[];

  Object.entries(datasets).forEach(([key,data])=>{
    (data.items||[]).forEach(item=>{
      if(JSON.stringify(item).toLowerCase().includes(q)){
        found.push({...item,__key:key});
      }
    });
  });

  if(found.length){
    currentKey=found[0].__key;
    currentItems=found;
    $('#listingIcon').textContent='🔎';
    $('#listingTitle').textContent='Search Results';
    $('#listingSubtitle').textContent=`${found.length} results found`;
    $('#chips').innerHTML='<button class="chip active">All</button>';
    renderItems(found);
    showPage('listingPage');
  }
});

$$('.nav-item').forEach(btn=>{
  btn.onclick=()=>{
    const nav=btn.dataset.nav;

    $$('.nav-item').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');

    if(nav==='home'){
      showPage('homePage');
    }else if(nav==='explore'){
      showPage('homePage');
      $('#globalSearch')?.focus();
    }else if(nav==='near'){
      showPage('nearPage');
    }else{
      showPage('homePage');
    }
  };
});

$('#searchBtn')?.addEventListener('click',()=>{
  showPage('homePage');
  setTimeout(()=>$('#globalSearch')?.focus(),100);
});

$('#menuBtn')?.addEventListener('click',()=>{
  showPage('homePage');
});

load();
