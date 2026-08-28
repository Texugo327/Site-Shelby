(function(){
  const DATA = window.SHELBY_DATA;
  const CONFIG = window.SHELBY_CONFIG;
  const $ = (selector, ctx=document) => ctx.querySelector(selector);
  const $$ = (selector, ctx=document) => Array.from(ctx.querySelectorAll(selector));

  function productBySlug(slug){ return DATA.products.find(p => p.slug === slug) || DATA.products[0]; }
  function categoryByName(name){ return DATA.categories.find(c => c.name === name); }
  function createEl(tag, className, html){
    const el = document.createElement(tag);
    if(className) el.className = className;
    if(html !== undefined) el.innerHTML = html;
    return el;
  }

  function fillConfigLinks(){
    $$('[data-config-link]').forEach(a => {
      const key = a.dataset.configLink;
      if(CONFIG[key]) a.href = CONFIG[key];
    });
  }

  function initHeader(){
    const toggle = $('.menu-toggle');
    if(toggle){
      toggle.addEventListener('click', () => document.body.classList.toggle('menu-open'));
      $$('.nav a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));
    }
  }

  function populateQuoteProducts(select){
    if(!select || select.dataset.populated === 'true') return;
    DATA.products.forEach(p => select.appendChild(new Option(p.name, p.name)));
    select.dataset.populated = 'true';
  }

  async function submitFormAjax(form, successUrl, fallbackMessage){
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton ? submitButton.textContent : '';
    if(submitButton){
      submitButton.disabled = true;
      submitButton.textContent = 'Enviando...';
    }
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      });
      if(!response.ok) throw new Error('Erro ao enviar formulário.');
      window.location.href = successUrl || 'confirmacao.html';
    } catch (error) {
      alert(fallbackMessage || 'Não foi possível enviar o formulário agora. Tente novamente em alguns instantes ou fale conosco pelo WhatsApp.');
    } finally {
      if(submitButton){
        submitButton.disabled = false;
        submitButton.textContent = originalText;
      }
    }
  }

  function setupQuoteModal(){
    const modal = $('#quote-modal');
    if(!modal) return;
    const productInput = $('#quote-product');
    populateQuoteProducts(productInput?.tagName === 'SELECT' ? productInput : null);

    const close = () => {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    };

    const open = (productName='') => {
      if(productInput){
        if(productInput.tagName === 'SELECT') populateQuoteProducts(productInput);
        productInput.value = productName || '';
      }
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      setTimeout(() => $('#quote-name')?.focus(), 80);
    };

    window.ShelbyOpenQuote = open;
    window.ShelbyCloseQuote = close;

    modal.addEventListener('click', e => {
      if(e.target.matches('[data-close-modal], .modal-backdrop')) close();
    });
    document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });

    const form = $('#quote-form');
    form?.addEventListener('submit', e => {
      e.preventDefault();
      submitFormAjax(form, CONFIG.confirmationQuoteUrl || 'confirmacao.html?tipo=renovacao', 'Não foi possível enviar a cotação agora. Tente novamente em alguns instantes ou fale conosco pelo WhatsApp.');
    });
  }

  function handleQuote(product){
    if(product?.hasMulticalculo && CONFIG.multicalculoUrl){
      const url = new URL(CONFIG.multicalculoUrl, window.location.href);
      url.searchParams.set('produto', product.slug);
      window.open(url.toString(), '_blank', 'noopener');
      return;
    }
    window.ShelbyOpenQuote?.(product?.name || '');
  }
  window.ShelbyQuote = handleQuote;

  function productCard(product, mini=false){
    const card = createEl('article', mini ? 'mini-card' : 'product-card');
    const img = createEl('img');
    img.src = product.card;
    img.alt = product.name;
    img.loading = 'lazy';
    card.appendChild(img);

    if(mini){
      card.addEventListener('click', () => window.location.href = `produto.html?produto=${product.slug}`);
      card.tabIndex = 0;
      card.setAttribute('role','link');
      card.addEventListener('keydown', e => { if(e.key === 'Enter') window.location.href = `produto.html?produto=${product.slug}`; });
      return card;
    }

    const info = createEl('a','card-info-zone');
    info.href = `produto.html?produto=${product.slug}`;
    info.setAttribute('aria-label', `Saiba mais sobre ${product.name}`);

    const quote = createEl('button','card-quote-zone');
    quote.type = 'button';
    quote.setAttribute('aria-label', `Cotar ${product.name}`);
    quote.addEventListener('click', () => handleQuote(product));

    card.append(info, quote);
    return card;
  }

  function initHomeSlider(){
    const root = $('#hero-slider');
    if(!root) return;
    const viewport = $('.hero-viewport', root);

    DATA.homeSlides.forEach((slide, i) => {
      const product = productBySlug(slide.slug);
      const s = createEl('div', `hero-slide ${i===0?'is-active':''}`);
      s.innerHTML = `
        <img src="${slide.image}" alt="${slide.title}" ${i===0?'fetchpriority="high"':'loading="lazy"'}>
        <div class="hero-content">
          <div class="container hero-content-inner">
            <div class="hero-main-copy">
              <h1>O Seguro que você precisa.<br>Rápido e fácil.<br>Faça uma cotação agora!</h1>
            </div>
            <div class="hero-product-copy">
              <h2>${product.name}</h2>
              <p>${product.description}</p>
              <a class="hero-more-link" href="produto.html?produto=${product.slug}">Saiba mais</a>
            </div>
            <button class="btn btn-white hero-quote-button" type="button" aria-label="Cotar ${product.name}">Cotar agora</button>
          </div>
        </div>
      `;
      $('.hero-quote-button', s)?.addEventListener('click', () => handleQuote(product));
      viewport.appendChild(s);
    });

    const dots = $('.hero-dots', root);
    DATA.homeSlides.forEach((_, i) => {
      const dot = createEl('button', `hero-dot ${i===0?'is-active':''}`);
      dot.setAttribute('aria-label', `Ir para slide ${i+1}`);
      dot.addEventListener('click', () => go(i));
      dots.appendChild(dot);
    });

    let current = 0;
    const slides = $$('.hero-slide', root);
    const dotEls = $$('.hero-dot', root);
    function go(index){
      current = (index + slides.length) % slides.length;
      slides.forEach((s,i)=>s.classList.toggle('is-active', i===current));
      dotEls.forEach((d,i)=>d.classList.toggle('is-active', i===current));
    }
    $('.slider-arrow.prev', root)?.addEventListener('click', () => go(current-1));
    $('.slider-arrow.next', root)?.addEventListener('click', () => go(current+1));
    let timer = setInterval(() => go(current+1), 5400);
    root.addEventListener('mouseenter', () => clearInterval(timer));
    root.addEventListener('mouseleave', () => timer = setInterval(() => go(current+1), 5400));
  }

  function productsInCategory(category){
    return category.products.map(productBySlug).filter(Boolean);
  }

  function initProductsSection(){
    const root = $('#products-root');
    if(!root) return;
    const tabs = $('.category-tabs', root);
    const track = $('.cards-track', root);
    const carousel = $('.carousel-wrap', root);
    const all = $('.all-products', root);
    const categories = DATA.categories;
    let selected = categories[0];

    categories.forEach((cat, index) => {
      const tab = createEl('button', `tab ${index===0?'is-active':''}`, `<span>${cat.icon}</span>${cat.name}`);
      tab.addEventListener('click', () => select(cat));
      tabs.appendChild(tab);
    });

    const allTab = createEl('button', 'tab tab-all', '<span>✦</span>Ver todos');
    allTab.addEventListener('click', () => selectAll());
    tabs.appendChild(allTab);

    function setActive(slug){
      $$('.tab', tabs).forEach(t => t.classList.remove('is-active'));
      const idx = categories.findIndex(c => c.slug === slug);
      if(idx >= 0) $$('.tab', tabs)[idx]?.classList.add('is-active');
      if(slug === 'todos') allTab.classList.add('is-active');
    }

    function select(cat){
      selected = cat;
      setActive(cat.slug);
      carousel?.classList.remove('hidden');
      all?.classList.remove('is-visible');
      renderTrack(productsInCategory(cat));
    }

    function selectAll(){
      setActive('todos');
      carousel?.classList.add('hidden');
      renderAll();
      all?.classList.add('is-visible');
    }

    function renderTrack(products){
      track.innerHTML = '';
      products.forEach(p => track.appendChild(productCard(p)));
      root.querySelector('[data-carousel-prev]')?.classList.toggle('hidden', products.length <= 3);
      root.querySelector('[data-carousel-next]')?.classList.toggle('hidden', products.length <= 3);
    }

    function renderAll(){
      if(!all) return;
      all.innerHTML = '';
      categories.forEach(cat => {
        const group = createEl('section','category-group');
        group.innerHTML = `<h3 class="category-chip"><span>${cat.icon}</span>${cat.name}</h3>`;
        const grid = createEl('div','mini-grid');
        productsInCategory(cat).forEach(p => grid.appendChild(productCard(p, true)));
        group.appendChild(grid);
        all.appendChild(group);
      });
    }

    root.querySelector('[data-carousel-prev]')?.addEventListener('click',()=>track.scrollBy({left:-track.clientWidth, behavior:'smooth'}));
    root.querySelector('[data-carousel-next]')?.addEventListener('click',()=>track.scrollBy({left:track.clientWidth, behavior:'smooth'}));
    renderTrack(productsInCategory(selected));
  }

  function initPartners(){
    const root = $('#partners-marquee');
    if(!root) return;
    function partnerLogo(partner){
      const name = typeof partner === 'string' ? partner : partner.name;
      const logo = typeof partner === 'string' ? null : partner.logo;
      const pill = createEl('span', 'logo-pill');
      if(logo){
        const img = createEl('img', 'logo-img');
        img.src = logo;
        img.alt = name;
        img.loading = 'lazy';
        img.decoding = 'async';
        img.onerror = () => { pill.innerHTML = ''; pill.textContent = name; pill.classList.add('logo-pill-text'); };
        pill.appendChild(img);
      } else {
        pill.textContent = name;
        pill.classList.add('logo-pill-text');
      }
      return pill;
    }
    const buildRow = () => {
      const row = createEl('div', 'logo-row');
      DATA.partners.forEach(partner => row.appendChild(partnerLogo(partner)));
      return row;
    };
    root.innerHTML = '';
    root.append(buildRow(), buildRow());
  }

  function initContactForm(){
    const form = $('#contact-form');
    if(!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault();
      submitFormAjax(form, CONFIG.confirmationContactUrl || 'confirmacao.html', 'Não foi possível enviar o formulário agora. Tente novamente em alguns instantes ou fale conosco pelo WhatsApp.');
    });
  }

  function initProductPage(){
    const root = $('#product-page');
    if(!root) return;
    const params = new URLSearchParams(location.search);
    const product = productBySlug(params.get('produto') || 'auto');
    document.title = `${product.pageTitle || product.name} | Shelby Seguros`;
    $('#product-title').textContent = product.pageTitle || `Seguro ${product.name}`;
    $('#product-description').textContent = product.description;
    const hero = $('#product-hero-image');
    hero.src = product.heroImage || product.card;
    hero.alt = `Imagem de ${product.name}`;
    $$('[data-product-quote]').forEach(btn => btn.addEventListener('click', () => handleQuote(product)));

    const eyebrow = $('#coverage-eyebrow');
    const title = $('#coverage-title');
    if(eyebrow) eyebrow.textContent = product.detailsEyebrow || 'Coberturas';
    if(title) title.textContent = product.detailsTitle || 'Confira as principais coberturas.';

    const coverageTrack = $('#coverage-track');
    if(product.coverages && product.coverages.length){
      coverageTrack.innerHTML = '';
      product.coverages.forEach(c => {
        const card = createEl('article','coverage-card');
        card.tabIndex = 0;
        if(c.icon){
          const img = createEl('img');
          img.src = c.icon;
          img.alt = c.title;
          img.loading = 'lazy';
          card.appendChild(img);
        } else {
          card.innerHTML = `<h3>${c.title}</h3>${c.text ? `<p>${c.text}</p>` : ''}`;
        }
        coverageTrack.appendChild(card);
      });
    } else {
      $('.coverage-section')?.classList.add('hidden');
    }

    const coverageNote = $('#coverage-note');
    if(coverageNote) coverageNote.textContent = product.detailsNote || coverageNote.textContent;
    const assistanceEyebrow = $('#assistance-eyebrow');
    const assistanceTitle = $('#assistance-title');
    if(assistanceEyebrow) assistanceEyebrow.textContent = product.assistanceEyebrow || 'Assistências';
    if(assistanceTitle) assistanceTitle.textContent = product.assistanceTitle || 'Suporte para cada etapa.';
    const assistanceNote = $('#assistance-note');
    if(assistanceNote) assistanceNote.textContent = product.assistanceNote || assistanceNote.textContent;

    const assist = $('#assist-grid');
    if(assist){
      assist.innerHTML = '';
      product.assistances.forEach(item => {
        assist.appendChild(createEl('article','assist-card',`<h3>${item.title}</h3><p>${item.text}</p>`));
      });
    }

    const related = $('#related-grid');
    if(related){
      const cat = categoryByName(product.category) || DATA.categories[0];
      productsInCategory(cat).filter(p => p.slug !== product.slug).slice(0,4).forEach(p => related.appendChild(productCard(p, true)));
    }
  }

  function initConfirmPage(){
    const root = $('#confirm-page');
    if(!root) return;
    const tipo = new URLSearchParams(location.search).get('tipo');
    const title = $('#confirm-title');
    const text = $('#confirm-text');
    title.textContent = 'Obrigado';
    text.textContent = tipo === 'renovacao'
      ? 'Recebemos sua solicitação de cotação. Em breve retornaremos o contato para encontrar as melhores opções para você.'
      : 'Recebemos o seu contato. Em breve retornaremos para atendermos, se necessário.';
  }

  function initGlobalQuoteButtons(){
    $$('[data-open-quote]').forEach(btn => {
      btn.addEventListener('click', () => window.ShelbyOpenQuote?.(btn.dataset.openQuote || ''));
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    fillConfigLinks();
    initHeader();
    setupQuoteModal();
    initHomeSlider();
    initProductsSection();
    initPartners();
    initContactForm();
    initProductPage();
    initConfirmPage();
    initGlobalQuoteButtons();
  });
})();
