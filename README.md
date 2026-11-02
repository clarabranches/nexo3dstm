# Nexo 3D - Sistema de Gestão

Sistema de gerenciamento para loja de impressão 3D.

## Tecnologias

- HTML5
- CSS3
- JavaScript
- Firebase Authentication
- Firebase Realtime Database
- GitHub Pages

## Funcionalidades

### Autenticação

Acesso através de e-mail e senha utilizando Firebase Authentication.

### Produtos

- Cadastro
- Edição
- Pesquisa
- Filtro por categoria
- Ordenação
- Referência automática
- Cálculo de custo
- Cálculo de preço
- Cálculo de lucro
- Controle de produção
- Controle de estoque

### Precificação

O sistema considera:

- Energia elétrica
- Consumo da impressora
- Horas de impressão
- Mão de obra
- Embalagem
- Filamentos
- Margem de lucro

## Estrutura

```text
nexo-3d/
│
├── index.html
│
├── css/
│   └── style.css
│
├── js/
│   ├── firebase-config.js
│   ├── auth.js
│   ├── utils.js
│   ├── produtos.js
│   ├── precificacao.js
│   └── app.js
│
├── img/
│   └── .gitkeep
│
└── README.md