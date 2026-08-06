# Shelby Seguros — Site front-end

Projeto estático completo em HTML, CSS e JavaScript, montado a partir do wireflow e dos arquivos zipados enviados.

## Estrutura

```txt
shelby-site/
├── index.html              # Página inicial
├── produto.html            # Página dinâmica de produto: produto.html?produto=auto
├── quem-somos.html         # Página institucional
├── confirmacao.html        # Confirmação de contato/cotação
├── css/styles.css          # Estilos globais e responsivos
├── js/config.js            # URLs externas e configurações
├── js/data.js              # Produtos, categorias, slides, parceiros e coberturas
├── js/main.js              # Sliders, tabs, modal, formulários e renderização
└── assets/                 # Arquivos vindos dos ZIPs, renomeados para web
```

## Como editar produtos

Abra `js/data.js`. Cada produto tem:

- `slug`: identificador usado na URL;
- `name`: nome exibido;
- `category`: categoria principal;
- `card`: card da home;
- `heroImage`: imagem do topo da página de produto;
- `description`: chamada do produto;
- `hasMulticalculo`: define se pode usar URL externa de multicálculo;
- `coverages`: ícones de cobertura com versão normal e hover.

Exemplo de URL de produto:

```txt
produto.html?produto=auto
produto.html?produto=bike
produto.html?produto=empresarial
```

## Configurações importantes

Abra `js/config.js` para alterar:

```js
window.SHELBY_CONFIG = {
  whatsappUrl: "...",
  multicalculoUrl: "",
  confirmationContactUrl: "confirmacao.html?tipo=contato",
  confirmationQuoteUrl: "confirmacao.html?tipo=renovacao",
  termsUrl: "https://www.shelbyseguros.com.br/termo-e-condicoes/",
  privacyUrl: "https://www.shelbyseguros.com.br/politica-de-privacidade/",
  susepUrl: "https://www.gov.br/susep/pt-br"
};
```

Se `multicalculoUrl` ficar vazio, o botão “Cotar agora” abre o formulário modal. Se preencher uma URL, os produtos com `hasMulticalculo: true` abrem essa URL em nova janela.

## Formulários

Os formulários estão funcionais visualmente e redirecionam para `confirmacao.html`. Para produção, conecte o envio a um formulário do WordPress, CRM ou endpoint próprio. O ponto mais fácil é trocar os listeners de submit em `js/main.js`:

- `#contact-form`
- `#quote-form`

## Como rodar localmente

Opção simples:

```bash
cd shelby-site
python -m http.server 8080
```

Depois acesse:

```txt
http://localhost:8080
```

## Como aplicar no WordPress

Caminho mais simples:

1. Suba a pasta `assets`, `css` e `js` para a biblioteca/tema do WordPress ou via FTP.
2. Crie páginas no WordPress: Início, Produto, Quem Somos e Confirmação.
3. Cole o HTML correspondente de cada arquivo nas páginas, ajustando os caminhos `css/`, `js/` e `assets/` para a URL final do WordPress.
4. No `js/config.js`, mantenha os links oficiais e preencha a URL do multicálculo real, se existir.
5. Substitua os submits de formulário por Contact Form 7, Elementor Forms, WPForms ou endpoint do CRM.

## Observações de manutenção

- Os nomes dos arquivos de imagem foram normalizados para evitar espaços, acentos e `#` nas URLs.
- O botão flutuante de WhatsApp permanece fixo na lateral inferior e abre em nova janela.
- Os sliders usam JavaScript puro, sem dependências.
- O layout é responsivo para desktop, tablet e mobile.
