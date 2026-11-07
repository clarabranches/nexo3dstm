import {
    database
} from "./firebase-config.js";

import {
    ref,
    get,
    set,
    push,
    update,
    remove,
    runTransaction
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js";

import {
    observarProdutos,
    salvarProduto,
    excluirProduto,
    renderizarProdutos,
    renderizarRecentes,
    obterProdutos
} from "./produtos.js";

import {
    calcularProduto,
    atualizarVisualPrecificacao
} from "./precificacao.js";

import {
    numero,
    gerarReferencia,
    formatarMoeda,
    mostrarToast,
    escaparHTML,
    agora
} from "./utils.js";

/*
 * ============================================================
 * ESTADO
 * ============================================================
 */

let produtos = {};
let categorias = {};
let filamentos = {};
let configuracoes = {};
let produtoEditandoId = null;
let precoVendaManual = false;
let locais = {};
let estoquePorProduto = {};

/*
 * ============================================================
 * INICIALIZAÇÃO
 * ============================================================
 */

window.addEventListener("usuarioAutenticado", iniciar);

async function iniciar() {
    configurarMenu();
    configurarAcoes();
    configurarFormularioProduto();
    configurarConfiguracoes();
    configurarLocais();
    configurarEstoque();
    configurarFilamentos();
    configurarCategorias();
    configurarFiltros();
    configurarUploadImagem();
    adicionarLinhaFilamento();
    atualizarCalculo();

    await carregarDados();
    atualizarCalculo();

    observarProdutos((dados) => {
        produtos = dados || {};
        atualizarInterface();
    });
}

async function carregarDados() {
    try {
        const [
            categoriasSnapshot,
            filamentosSnapshot,
            configuracoesSnapshot,

            locaisSnapshot,
            estoqueSnapshot
        ] = await Promise.all([
            get(ref(database, "categorias")),
            get(ref(database, "filamentos")),
            get(ref(database, "configuracoes")),
            get(ref(database, "locais")),
            get(ref(database, "estoque"))
        ]);

        categorias = categoriasSnapshot.val() || {};
        filamentos = filamentosSnapshot.val() || {};
        configuracoes = configuracoesSnapshot.val() || {};
        locais = locaisSnapshot.val() || {};
        estoquePorProduto = estoqueSnapshot.val() || {};

        atualizarCategorias();
        atualizarFilamentos();
        atualizarLocais();
        carregarConfiguracoes();
        atualizarInterface();

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
        mostrarToast("Erro ao carregar os dados.");
    }
}

function configurarMenu() {
    const botoes = document.querySelectorAll(".menu-item");

    botoes.forEach((botao) => {
        botao.addEventListener("click", () => {
            const tab = botao.dataset.tab;
            abrirAba(tab);
        });
    });

    const mobileButton = document.getElementById("mobile-menu-button");
    const sidebar = document.querySelector(".sidebar");

    mobileButton?.addEventListener("click", () => {
        sidebar.classList.toggle("mobile-open");
    });
}

function abrirAba(tab) {

    document.querySelectorAll(".tab-content").forEach((elemento) => {
        elemento.classList.remove("active");
    });

    const alvo = document.getElementById(`tab-${tab}`);

    if (alvo) {
        alvo.classList.add("active");
    }

    document.querySelectorAll(".menu-item").forEach((botao) => {
        botao.classList.toggle(

            "active",
            botao.dataset.tab === tab
        );
    });

    const titulos = {
        dashboard: [
            "Visão geral",
            "Acompanhe os produtos e a produção."
        ],

        produtos: [
            "Produtos",
            "Consulte produtos, estoque por local e vendas."
        ],

        cadastro: [
            produtoEditandoId ? "Editar produto" : "Novo produto",
            "Cadastre ou edite um produto."
        ],

        configuracoes: [
            "Configurações",
            "Gerencie custos, categorias, filamentos e locais de estoque."
        ]
    };

    const titulo = titulos[tab];

    if (titulo) {
        document.getElementById("page-title").textContent = titulo[0];

        document.getElementById("page-subtitle").textContent = titulo[1];
    }

    const sidebar = document.querySelector(".sidebar");
    sidebar?.classList.remove("mobile-open");
}

/*
 * ============================================================
 * AÇÕES
 * ============================================================
 */

function configurarAcoes() {

    document.addEventListener("click", (event) => {

        const action = event.target.closest("[data-action]");

        if (action) {
            executarAcao(action.dataset.action);
            return;
        }

        const card = event.target.closest(".product-card");

        if (card) {
            abrirEdicaoProduto(card.dataset.productId);
            return;
        }

        const recente = event.target.closest(".recent-item");

        if (recente) {
            abrirEdicaoProduto(recente.dataset.productId);
        }
    });

    document.getElementById("clear-product-form")?.addEventListener(
        "click",
        limparFormularioProduto
    );

    document.getElementById("cancel-product")?.addEventListener(
        "click",
        () => {
            limparFormularioProduto();
            abrirAba("produtos");
        }
    );
}

function executarAcao(action) {

    switch (action) {

        case "novo-produto":
            limparFormularioProduto();
            abrirAba("cadastro");
            break;

        case "produtos":
            abrirAba("produtos");
            break;

        case "configuracoes":
            abrirAba("configuracoes");
            break;

    }

}

/*
 * ============================================================
 * PRODUTOS
 * ============================================================
 */

function atualizarInterface() {

    atualizarListaProdutos();
    atualizarDashboard();
    atualizarPainelEstoque();

}

function atualizarListaProdutos() {

    const container =
        document.getElementById("products-grid");

    const busca = (
        document.getElementById("product-search")?.value || ""
    )
        .toLowerCase()
        .trim();

    const categoria =
        document.getElementById("category-filter")?.value || "";

    const ordenacao =
        document.getElementById("sort-products")?.value || "nome";

    let lista = Object.entries(produtos);

    if (busca) {
        lista = lista.filter(([, produto]) => {
            const nome = String(produto.nome || "").toLowerCase();
            return nome.includes(busca);
        });
    }

    if (categoria) {
        lista = lista.filter(
            ([, produto]) => produto.categoriaId === categoria
        );
    }

    lista.sort(([, a], [, b]) => {

        switch (ordenacao) {

            case "preco-desc":
                return numero(b.precoVenda) - numero(a.precoVenda);

            case "preco-asc":
                return numero(a.precoVenda) - numero(b.precoVenda);

            case "lucro-desc":
                return numero(b.lucro) - numero(a.lucro);

            default:
                return String(a.nome || "").localeCompare(
                    String(b.nome || ""),
                    "pt-BR"
                );

        }
    });

    const objetoFiltrado = Object.fromEntries(lista);

    renderizarProdutos(
        objetoFiltrado,
        container
    );

}

function atualizarDashboard() {

    const lista = Object.values(produtos);

    const quantidadeProdutos = lista.length;

    const produzido = lista.reduce(
        (total, produto) =>
            total + numero(produto.produzido),
        0
    );

    const estoque = Object.entries(produtos).reduce(
        (total, [id, produto]) => {

            const inventario = estoquePorProduto[id];

            if (!inventario) {
                return total + numero(produto.estoque);
            }

            const quantidade = Object.values(inventario).reduce(
                (subtotal, porLocal) =>
                    subtotal + Object.values(porLocal || {}).reduce(
                        (soma, valor) => soma + numero(valor),
                        0
                    ),
                0
            );

            return total + quantidade;

        },
        0
    );

    document.getElementById("stat-produtos").textContent =
        quantidadeProdutos;

    document.getElementById("stat-produzido").textContent =
        produzido;

    document.getElementById("stat-estoque").textContent =
        estoque;

    document.getElementById("stat-categorias").textContent =
        Object.keys(categorias).length;

    renderizarRecentes(
        produtos,
        document.getElementById("recent-products")
    );

}

/*
 * ============================================================
 * FILTROS
 * ============================================================
 */

function configurarFiltros() {

    [
        "product-search",
        "category-filter",
        "sort-products"
    ].forEach((id) => {

        document.getElementById(id)?.addEventListener(
            "input",
            atualizarListaProdutos
        );

        document.getElementById(id)?.addEventListener(
            "change",
            atualizarListaProdutos
        );

    });

}

/*
 * ============================================================
 * FORMULÁRIO DE PRODUTO
 * ============================================================
 */

function configurarFormularioProduto() {

    document.getElementById("product-form")?.addEventListener(

        "submit",
        salvarFormularioProduto
    );

    const campoPrecoVenda = document.getElementById("sale-price");

    campoPrecoVenda?.addEventListener("input", () => {
        precoVendaManual = true;
        atualizarLucroPrecoManual();
    });

    [
        "product-category",
        "print-hours",
        "produced-quantity",
        "stock-quantity"
    ].forEach((id) => {

        document.getElementById(id)?.addEventListener(
            "input",
            atualizarCalculo
        );

        document.getElementById(id)?.addEventListener(
            "change",
            atualizarCalculo
        );

    });

    document.getElementById("add-filament")?.addEventListener(
        "click",
        () => {
            adicionarLinhaFilamento();
            atualizarCalculo();
        }
    );

}

/*
 * ============================================================
 * LINHA DE FILAMENTO
 * ============================================================
 */

function adicionarLinhaFilamento(dados = null) {

    const container =
        document.getElementById("filaments-container");

    if (!container) {
        return;
    }

    const row = document.createElement("div");

    row.className = "filament-row";

    row.innerHTML = `

        <div class="form-group">

            <label>
                Filamento
            </label>

            <select

                class="product-filament"
                required>

                <option value="">
                    Selecione
                </option>

                ${Object.entries(filamentos)
                    .map(([id, filament]) => `

                        <option
                            value="${id}"
                            ${
                                dados?.filamentoId === id
                                    ? "selected"
                                    : ""
                            }>

                            ${escaparHTML(filament.nome)}

                        </option>

                    `)
                    .join("")}

            </select>

        </div>

        <div class="form-group">

            <label>
                Gramas
            </label>

            <input
                type="number"
                class="product-filament-grams"
                min="0"
                step="0.01"
                value="${dados?.gramas ?? 0}"
                required
            >

        </div>

        <button
            type="button"
            class="icon-button danger remove-filament"
            title="Remover">

            ×

        </button>

    `;

    container.appendChild(row);

    row.querySelector(".remove-filament").addEventListener(

        "click",
        () => {
            row.remove();
            atualizarCalculo();
        }
    );

    row.querySelectorAll("select,input").forEach((elemento) => {

        elemento.addEventListener("input", atualizarCalculo);
        elemento.addEventListener("change", atualizarCalculo);

    });

}

/*
 * ============================================================
 * LER FILAMENTOS DO FORM
 * ============================================================
 */

function obterFilamentosFormulario() {

    const linhas =
        document.querySelectorAll(".filament-row");

    return Array.from(linhas)
        .map((linha) => {

            const id =
                linha.querySelector(".product-filament")?.value;

            const gramas = numero(
                linha.querySelector(".product-filament-grams")?.value
            );

            if (!id) {
                return null;
            }

            return {
                filamentoId: id,
                gramas: gramas
            };

        })
        .filter(Boolean);

}

/*
 * ============================================================
 * CALCULAR
 * ============================================================
 */

function atualizarCalculo() {

    const dados = {

        horasImpressao: numero(
            document.getElementById("print-hours")?.value
        ),

        filamentos: obterFilamentosFormulario(),

        configuracoes: configuracoes,

        filamentosCadastrados: filamentos

    };

    const calculo = calcularProduto(dados);

    const campoPrecoVenda = document.getElementById("sale-price");

    if (precoVendaManual && campoPrecoVenda) {
        calculo.precoVenda = Math.max(0, numero(campoPrecoVenda.value));
        calculo.lucro = calculo.precoVenda - calculo.custoProducao;
    }

    atualizarVisualPrecificacao(calculo);

    if (campoPrecoVenda && !precoVendaManual) {
        campoPrecoVenda.value = numero(calculo.precoVenda).toFixed(2);
    }

}

function atualizarLucroPrecoManual() {

    const campoPrecoVenda = document.getElementById("sale-price");
    const campoLucro = document.getElementById("profit-value");

    if (!campoPrecoVenda || !campoLucro) {
        return;
    }

    const dados = {
        horasImpressao: numero(
            document.getElementById("print-hours")?.value
        ),
        filamentos: obterFilamentosFormulario(),
        configuracoes,
        filamentosCadastrados: filamentos
    };

    const calculo = calcularProduto(dados);
    const preco = Math.max(0, numero(campoPrecoVenda.value));

    campoLucro.textContent = formatarMoeda(
        preco - calculo.custoProducao
    );

}

/*
 * ============================================================
 * SALVAR PRODUTO
 * ============================================================
 */

async function salvarFormularioProduto(event) {

    event.preventDefault();

    const categoriaId =

        document.getElementById("product-category").value;

    const campoCores =
        document.getElementById("product-colors");

    const cores = campoCores
        ? [...new Set(
            campoCores.value
                .split(",")
                .map(cor => cor.trim())
                .filter(Boolean)
        )]
        : [];

    const categoria = categorias[categoriaId];

    if (!categoria) {
        mostrarToast("Selecione uma categoria.");
        return;
    }

    const nome =
        document.getElementById("product-name").value.trim();

    if (!nome) {
        mostrarToast("Informe o nome do produto.");
        return;
    }

    const dadosCalculo = {

        horasImpressao: numero(
            document.getElementById("print-hours").value
        ),

        filamentos: obterFilamentosFormulario(),

        configuracoes: configuracoes,

        filamentosCadastrados: filamentos

    };

    const calculo = calcularProduto(dadosCalculo);

    let referencia =
        document.getElementById("product-reference").value;

    /*
     * Gera referência somente
     * se for um novo produto.
     */

    if (!produtoEditandoId) {

        referencia = gerarReferencia(
            categoria.nome,
            Object.values(produtos)
        );

    }

    const produto = {

        ...(produtoEditandoId && produtos[produtoEditandoId]
            ? produtos[produtoEditandoId]
            : {}),

        referencia: referencia,

        nome: nome,

        categoriaId: categoriaId,

        categoriaNome: categoria.nome,

        descricao: document.getElementById(
            "product-description"
        ).value.trim(),

        fotoUrl:
            window.novaImagemBase64 ||
            document.getElementById("image-preview").dataset.imageUrl ||
            "",

        horasImpressao: dadosCalculo.horasImpressao,

        filamentos: dadosCalculo.filamentos,

        cores: cores,

        produzido: numero(
            document.getElementById("produced-quantity").value

        ),

        estoque: numero(
            document.getElementById("stock-quantity").value
        ),

        custoMaquina: calculo.maquina,

        custoMaoDeObra: calculo.maoDeObra,

        custoFilamentos: calculo.filamentos,

        custoEmbalagem: calculo.embalagem,

        custoProducao: calculo.custoProducao,

        precoVenda: Math.max(
            0,
            numero(document.getElementById("sale-price").value)
        ),

        lucro: numero(document.getElementById("sale-price").value) -
            calculo.custoProducao

    };

    const sucesso = await salvarProduto(
        produto,
        produtoEditandoId
    );

    if (sucesso) {

        limparFormularioProduto();

        abrirAba("produtos");

    }

}

/*
 * ============================================================
 * EDITAR PRODUTO
 * ============================================================
 */

function abrirEdicaoProduto(id) {

    const produto = produtos[id];

    if (!produto) {
        return;
    }

    produtoEditandoId = id;

    document.getElementById("form-title").textContent =
        "Editar produto";

    document.getElementById("product-id").value =
        id;

    document.getElementById("product-reference").value =
        produto.referencia || "";

    document.getElementById("product-name").value =
        produto.nome || "";

    document.getElementById("product-category").value =
        produto.categoriaId || "";

    document.getElementById("product-description").value =
        produto.descricao || "";

    const campoCores =
        document.getElementById("product-colors");

    if (campoCores) {
        campoCores.value = Array.isArray(produto.cores)
            ? produto.cores.join(", ")
            : "";
    }

    document.getElementById("print-hours").value =
        produto.horasImpressao || 0;

    document.getElementById("produced-quantity").value =
        produto.produzido || 0;

    document.getElementById("stock-quantity").value =
        produto.estoque || 0;

    const preview =
        document.getElementById("image-preview");

    preview.dataset.imageUrl =
        produto.fotoUrl || "";

    if (produto.fotoUrl) {

        preview.innerHTML = `
            <img
                src="${escaparHTML(produto.fotoUrl)}"
                alt=""
            >
        `;

    } else {

        preview.innerHTML =
            "<span>Sem imagem</span>";

    }

    const campoPrecoVenda = document.getElementById("sale-price");

    if (campoPrecoVenda) {
        campoPrecoVenda.value = numero(produto.precoVenda).toFixed(2);
        precoVendaManual = produto.precoVenda !== undefined &&
            produto.precoVenda !== null;
    }

    const container =
        document.getElementById("filaments-container");

    container.innerHTML = "";

    if (
        Array.isArray(produto.filamentos) &&
        produto.filamentos.length
    ) {

        produto.filamentos.forEach((item) => {
            adicionarLinhaFilamento(item);

        });

    } else {

        adicionarLinhaFilamento();

    }

    atualizarCalculo();

    abrirAba("cadastro");

}

/*
 * ============================================================
 * LIMPAR FORMULÁRIO
 * ============================================================
 */

function limparFormularioProduto() {

    produtoEditandoId = null;
    precoVendaManual = false;

    const form =
        document.getElementById("product-form");

    form?.reset();

    document.getElementById("form-title").textContent =

        "Novo produto";

    document.getElementById("product-id").value =
        "";

    document.getElementById("product-reference").value =
        "";

    const campoCores =
        document.getElementById("product-colors");

    if (campoCores) {
        campoCores.value = "";
    }

    document.getElementById("produced-quantity").value =
        "0";

    document.getElementById("stock-quantity").value =
        "0";

    const preview =
        document.getElementById("image-preview");

    preview.innerHTML =
        "<span>Sem imagem</span>";

    preview.dataset.imageUrl =
        "";

    window.novaImagemBase64 = "";

    document.getElementById("filaments-container").innerHTML =
        "";

    adicionarLinhaFilamento();

    atualizarCalculo();

}

/*
 * ============================================================
 * IMAGEM
 * ============================================================
 *
 * Nesta primeira versão a imagem é convertida em Base64.
 *
 * Para a versão de produção recomendo migrar esta parte
 * para Firebase Storage.
 *
 */

function configurarUploadImagem() {

    const input =
        document.getElementById("product-image");

    const preview =
        document.getElementById("image-preview");

    input?.addEventListener("change", () => {

        const arquivo = input.files?.[0];

        if (!arquivo) {
            return;
        }

        const reader = new FileReader();

        reader.onload = () => {

            const resultado = reader.result;

            window.novaImagemBase64 = resultado;

            preview.innerHTML = `
                <img
                    src="${resultado}"
                    alt="Prévia"
                >
            `;

        };

        reader.readAsDataURL(arquivo);

    });

}

/*
 * ============================================================
 * CATEGORIAS
 * ============================================================
 */

function configurarCategorias() {

    document.getElementById("category-form")?.addEventListener(
        "submit",
        salvarCategoria
    );

}

async function salvarCategoria(event) {

    event.preventDefault();

    const id =
        document.getElementById("category-id").value;

    const nome =
        document.getElementById("category-name").value.trim();

    if (!nome) {
        return;
    }

    try {

        if (id) {

            await update(
                ref(database, `categorias/${id}`),
                {
                    nome: nome
                }
            );

        } else {

            const nova = push(
                ref(database, "categorias")
            );

            await set(nova, {
                nome: nome,
                criadoEm: agora()
            });

        }

        document.getElementById("category-form").reset();

        document.getElementById("category-id").value =
            "";

        await recarregarCategorias();

        mostrarToast("Categoria salva.");

    } catch (error) {

        console.error(error);

        mostrarToast("Erro ao salvar categoria.");

    }

}

async function recarregarCategorias() {

    const snapshot = await get(
        ref(database, "categorias")
    );

    categorias = snapshot.val() || {};

    atualizarCategorias();

    atualizarDashboard();

}

function atualizarCategorias() {

    const selectProduto =

        document.getElementById("product-category");

    const selectFiltro =
        document.getElementById("category-filter");

    if (selectProduto) {

        const categoriaAtual = selectProduto.value;

        selectProduto.innerHTML = `
            <option value="">
                Selecione uma categoria
            </option>

            ${Object.entries(categorias)
                .map(([id, categoria]) => `
                    <option value="${id}">
                        ${escaparHTML(categoria.nome)}
                    </option>
                `)
                .join("")}
        `;

        selectProduto.value = categoriaAtual;

    }

    if (selectFiltro) {

        const valorAtual = selectFiltro.value;

        selectFiltro.innerHTML = `
            <option value="">
                Todas as categorias
            </option>

            ${Object.entries(categorias)
                .map(([id, categoria]) => `
                    <option value="${id}">
                        ${escaparHTML(categoria.nome)}
                    </option>
                `)
                .join("")}
        `;

        selectFiltro.value = valorAtual;

    }

    renderizarListaCategorias();

}

function renderizarListaCategorias() {

    const container =
        document.getElementById("categories-list");

    if (!container) {
        return;
    }

    const lista = Object.entries(categorias);

    if (!lista.length) {

        container.innerHTML = `
            <div class="empty-state">
                Nenhuma categoria cadastrada.
            </div>
        `;

        return;
    }

    container.innerHTML = lista.map(([id, categoria]) => `

        <div class="settings-item">

            <div class="settings-item-info">

                <strong>
                    ${escaparHTML(categoria.nome)}
                </strong>

                <small>
                    Prefixo:
                    ${escaparHTML(
                        categoria.nome.substring(0, 2).toUpperCase()
                    )}
                </small>

            </div>

            <div class="settings-item-actions">

                <button
                    class="icon-button danger"
                    data-delete-category="${id}">

                    ×

                </button>

            </div>

        </div>

    `).join("");

    container.querySelectorAll("[data-delete-category]").forEach(
        (button) => {

            button.addEventListener("click", () => {
                excluirCategoria(button.dataset.deleteCategory);
            });

        }
    );

}

async function excluirCategoria(id) {

    const categoria = categorias[id];

    if (!categoria) {
        return;
    }

    const confirmar = confirm(
        `Excluir a categoria "${categoria.nome}"?`
    );

    if (!confirmar) {
        return;
    }

    await remove(
        ref(database, `categorias/${id}`)
    );

    await recarregarCategorias();

    mostrarToast("Categoria excluída.");

}

/*
 * ============================================================
 * FILAMENTOS
 * ============================================================
 */

function configurarFilamentos() {

    document.getElementById("filament-form")?.addEventListener(
        "submit",
        salvarFilamento
    );

}

async function salvarFilamento(event) {

    event.preventDefault();

    const id =
        document.getElementById("filament-id").value;

    const nome =
        document.getElementById("filament-name").value.trim();

    const valorPorGrama = numero(
        document.getElementById("filament-price").value
    );

    if (!nome) {
        return;
    }

    try {

        if (id) {

            await update(
                ref(database, `filamentos/${id}`),
                {
                    nome,
                    valorPorGrama
                }
            );

        } else {

            const nova = push(
                ref(database, "filamentos")
            );

            await set(nova, {
                nome,
                valorPorGrama,
                criadoEm: agora()
            });

        }

        document.getElementById("filament-form").reset();

        document.getElementById("filament-id").value =
            "";

        await recarregarFilamentos();

        mostrarToast("Filamento salvo.");

    } catch (error) {

        console.error(error);

        mostrarToast("Erro ao salvar filamento.");

    }

}

async function recarregarFilamentos() {

    const snapshot = await get(
        ref(database, "filamentos")
    );

    filamentos = snapshot.val() || {};

    atualizarFilamentos();

    const container =
        document.getElementById("filaments-container");

    if (container) {
        container.innerHTML = "";
        adicionarLinhaFilamento();
    }

    atualizarCalculo();

}

function atualizarFilamentos() {
    renderizarListaFilamentos();
}

function renderizarListaFilamentos() {

    const container =
        document.getElementById("filaments-list");

    if (!container) {
        return;
    }

    const lista = Object.entries(filamentos);

    if (!lista.length) {

        container.innerHTML = `
            <div class="empty-state">
                Nenhum filamento cadastrado.
            </div>
        `;

        return;

    }

    container.innerHTML = lista.map(([id, filament]) => `

        <div class="settings-item">

            <div class="settings-item-info">

                <strong>
                    ${escaparHTML(filament.nome)}
                </strong>

                <small>
                    ${formatarMoeda(filament.valorPorGrama)}
                    por grama
                </small>

            </div>

            <div class="settings-item-actions">

                <button
                    class="icon-button danger"
                    data-delete-filament="${id}">

                    ×

                </button>

            </div>

        </div>

    `).join("");

    container.querySelectorAll("[data-delete-filament]").forEach(
        (button) => {

            button.addEventListener("click", () => {
                excluirFilamento(button.dataset.deleteFilament);
            });

        }
    );

}

async function excluirFilamento(id) {

    const filament = filamentos[id];

    if (!filament) {
        return;
    }

    const confirmar = confirm(
        `Excluir o filamento "${filament.nome}"?`
    );

    if (!confirmar) {
        return;

    }

    await remove(
        ref(database, `filamentos/${id}`)
    );

    await recarregarFilamentos();

    mostrarToast("Filamento excluído.");

}

/*
 * ============================================================
 * CONFIGURAÇÕES
 * ============================================================
 */

function configurarConfiguracoes() {

    document.getElementById("settings-form")?.addEventListener(
        "submit",
        salvarConfiguracoes
    );

}

function carregarConfiguracoes() {

    document.getElementById("electricity-cost").value =
        configuracoes.energiaEletrica ?? 0;

    document.getElementById("printer-consumption").value =
        configuracoes.consumoImpressora ?? 0;

    document.getElementById("labor-hour").value =
        configuracoes.maoDeObraHora ?? 0;

    document.getElementById("packaging-cost-setting").value =
        configuracoes.embalagemPorPeca ?? 0;

    document.getElementById("profit-margin").value =
        configuracoes.margemLucro ?? 0;

}

async function salvarConfiguracoes(event) {

    event.preventDefault();

    configuracoes = {

        energiaEletrica: numero(
            document.getElementById("electricity-cost").value
        ),

        consumoImpressora: numero(
            document.getElementById("printer-consumption").value
        ),

        maoDeObraHora: numero(
            document.getElementById("labor-hour").value
        ),

        embalagemPorPeca: numero(
            document.getElementById("packaging-cost-setting").value
        ),

        margemLucro: numero(
            document.getElementById("profit-margin").value
        ),

        atualizadoEm: agora()

    };

    try {

        await set(
            ref(database, "configuracoes"),
            configuracoes
        );

        atualizarCalculo();

        mostrarToast("Configurações salvas.");

    } catch (error) {

        console.error(error);

        mostrarToast("Erro ao salvar configurações.");

    }

}

/*
 * ============================================================
 * LOCAIS DE ESTOQUE
 * ============================================================
 */

function configurarLocais() {

    document.getElementById("location-form")?.addEventListener(
        "submit",
        salvarLocal
    );

    document.getElementById("cancel-location-edit")?.addEventListener(
        "click",
        limparFormularioLocal
    );

    document.getElementById("locations-list")?.addEventListener(
        "click",
        async (event) => {

            const botao =

                event.target.closest("[data-location-action]");

            if (!botao) {
                return;
            }

            const id = botao.dataset.id;
            const acao = botao.dataset.locationAction;

            if (acao === "editar") {
                editarLocal(id);
            }

            if (acao === "excluir") {
                await excluirLocal(id);
            }

        }
    );

}

async function salvarLocal(event) {

    event.preventDefault();

    const id =
        document.getElementById("location-id").value;

    const nome =

        document.getElementById("location-name").value.trim();

    if (!nome) {
        mostrarToast("Informe o nome do local.");
        return;
    }

    const nomeDuplicado = Object.entries(locais).some(
        ([localId, local]) =>
            localId !== id &&
            String(local.nome || "").toLowerCase() === nome.toLowerCase()
    );

    if (nomeDuplicado) {
        mostrarToast("Já existe um local com esse nome.");
        return;
    }

    try {

        if (id) {

            await update(
                ref(database, `locais/${id}`),
                {
                    nome,
                    atualizadoEm: agora()
                }
            );

        } else {

            const novoLocal = push(
                ref(database, "locais")
            );

            await set(novoLocal, {
                nome,
                criadoEm: agora()
            });

        }

        limparFormularioLocal();

        await recarregarLocais();

        mostrarToast("Local salvo com sucesso.");

    } catch (error) {

        console.error(error);

        mostrarToast("Erro ao salvar local.");

    }

}

function editarLocal(id) {

    const local = locais[id];

    if (!local) {
        return;
    }

    document.getElementById("location-id").value =
        id;

    document.getElementById("location-name").value =
        local.nome;

    document.getElementById("location-name").focus();

}

function limparFormularioLocal() {

    document.getElementById("location-form").reset();

    document.getElementById("location-id").value =
        "";

}

async function excluirLocal(id) {

    const local = locais[id];

    if (!local) {
        return;
    }

    try {

        const estoqueSnapshot = await get(
            ref(database, "estoque")
        );

        const estoque = estoqueSnapshot.val() || {};

        const possuiEstoque = Object.values(estoque).some(
            produto =>
                Object.values(produto || {}).some(
                    variacao => numero(variacao?.[id]) > 0
                )
        );

        if (possuiEstoque) {

            mostrarToast(
                "Este local possui produtos. Transfira o estoque antes de excluí-lo."
            );

            return;
        }

        if (!confirm(`Deseja excluir o local "${local.nome}"?`)) {
            return;
        }

        await remove(
            ref(database, `locais/${id}`)
        );

        await recarregarLocais();

        mostrarToast("Local excluído.");

    } catch (error) {

        console.error(error);

        mostrarToast("Erro ao excluir local.");

    }

}

async function recarregarLocais() {

    const snapshot = await get(
        ref(database, "locais")
    );

    locais = snapshot.val() || {};

    atualizarLocais();

    atualizarPainelEstoque();

}

function atualizarLocais() {

    const container =
        document.getElementById("locations-list");

    if (!container) {
        return;
    }

    const lista = Object.entries(locais);

    if (!lista.length) {

        container.innerHTML = `
            <div class="empty-state">
                Nenhum local cadastrado.
            </div>
        `;

        atualizarPainelEstoque();

        return;
    }

    container.innerHTML = lista.map(([id, local]) => `

        <div class="settings-item">

            <strong>
                ${escaparHTML(local.nome)}
            </strong>

            <div class="settings-actions">

                <button
                    type="button"
                    class="btn btn-secondary"
                    data-location-action="editar"
                    data-id="${id}">

                    Editar

                </button>

                <button
                    type="button"
                    class="btn btn-danger"
                    data-location-action="excluir"
                    data-id="${id}">

                    Excluir

                </button>

            </div>

        </div>

    `).join("");

    atualizarPainelEstoque();

}

/*
 * ============================================================
 * ESTOQUE POR LOCAL, VARIAÇÕES E BAIXA DE VENDAS
 * ============================================================
 *
 * Estrutura no Firebase:
 *
 * estoque/{produtoId}/{corCodificada}/{localId} = quantidade
 *
 * Produtos sem variações usam a chave "__sem_cor".
 *
 * As movimentações ficam em:
 * movimentacoesEstoque
 *
 */

function configurarEstoque() {
  const form = document.getElementById("product-form");
  if (!form || document.getElementById("inventory-management")) {
    return;
  }

  const painel = document.createElement("div");
  painel.id = "inventory-management";
  painel.className = "panel";
  painel.innerHTML = `
    <div class="panel-header">
      <div>
        <h3>Estoque deste produto</h3>
        <p>Adicione unidades, registre vendas e transfira entre locais.</p>
      </div>
    </div>

    <div id="inventory-empty">
      <p>Salve o produto primeiro para controlar o estoque dele.</p>
    </div>

    <div id="inventory-content">
      <div class="form-grid">
        <div class="form-group">
          <label for="inventory-color">Cor / variação</label>
          <select id="inventory-color">
            <option value="__sem_cor">Sem variação</option>
          </select>
        </div>

        <div class="form-group">
          <label for="inventory-location">Local</label>
          <select id="inventory-location">
            <option value="">Selecione um local</option>
          </select>
        </div>

        <div class="form-group">
          <label for="inventory-quantity">Quantidade</label>
          <input id="inventory-quantity" type="number" min="1" step="1" value="1">
        </div>
      </div>

      <div class="form-actions">
        <button type="button" class="btn btn-primary" id="inventory-add">
          Adicionar ao estoque
        </button>
        <button type="button" class="btn btn-danger" id="inventory-sale">
          Registrar venda / baixar estoque
        </button>
      </div>

      <div id="inventory-summary" class="inventory-summary"></div>

      <div class="transfer-panel" style="margin-top:24px;">
        <h4>Transferência entre locais</h4>
        <p>Move unidades de um local para outro sem alterar o total.</p>

        <div class="form-grid">
          <div class="form-group">
            <label for="transfer-color">Cor / variação</label>
            <select id="transfer-color">
              <option value="__sem_cor">Sem variação</option>
            </select>
          </div>

          <div class="form-group">
            <label for="transfer-from">Local de origem</label>
            <select id="transfer-from">
              <option value="">Selecione a origem</option>
            </select>
          </div>

          <div class="form-group">
            <label for="transfer-to">Local de destino</label>
            <select id="transfer-to">
              <option value="">Selecione o destino</option>
            </select>
          </div>

          <div class="form-group">
            <label for="transfer-quantity">Quantidade</label>
            <input id="transfer-quantity" type="number" min="1" step="1" value="1">
          </div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-primary" id="transfer-submit">
            Transferir estoque
          </button>
        </div>
      </div>
    </div>
  `;

  // Fica logo acima dos botões Cancelar / Salvar produto
  const botoes = document.getElementById("cancel-product")?.closest(".form-actions");
  if (botoes && botoes.parentElement) {
    botoes.parentElement.insertBefore(painel, botoes);
  } else {
    form.appendChild(painel);
  }

  // Enter dentro do painel não pode salvar o produto sem querer
  painel.addEventListener("keydown", (evento) => {
    if (evento.key === "Enter") {
      evento.preventDefault();
    }
  });

  document.getElementById("inventory-color")
    ?.addEventListener("change", renderizarResumoEstoque);
  document.getElementById("inventory-add")
    ?.addEventListener("click", () => movimentarEstoque("entrada"));
  document.getElementById("inventory-sale")
    ?.addEventListener("click", () => movimentarEstoque("venda"));
  document.getElementById("transfer-submit")
    ?.addEventListener("click", transferirEstoque);

  atualizarPainelEstoque();
}

function atualizarPainelEstoque() {
  const painel = document.getElementById("inventory-management");
  if (!painel) {
    return;
  }

  const editando = Boolean(
    produtoEditandoId && produtos[produtoEditandoId]
  );

  document.getElementById("inventory-empty").style.display =
    editando ? "none" : "";
  document.getElementById("inventory-content").style.display =
    editando ? "" : "none";

  if (!editando) {
    return;
  }

  const opcoesLocais = Object.entries(locais).map(([id, local]) => `
    <option value="${escaparHTML(id)}">
      ${escaparHTML(local.nome || "Local")}
    </option>
  `).join("");

  [
    ["inventory-location", "Selecione um local"],
    ["transfer-from", "Selecione a origem"],
    ["transfer-to", "Selecione o destino"]
  ].forEach(([selectId, rotulo]) => {
    const select = document.getElementById(selectId);
    if (!select) {
      return;
    }
    const atual = select.value;
    select.innerHTML = `<option value="">${rotulo}</option>${opcoesLocais}`;
    if (locais[atual]) {
      select.value = atual;
    }
  });

  atualizarOpcoesCoresEstoque();
  atualizarOpcoesCoresTransferencia();
}

function preencherSelectCores(selectId) {
  const select = document.getElementById(selectId);
  if (!select) {
    return;
  }

  const cores = obterCoresProduto(produtos[produtoEditandoId]);
  const atual = select.value;

  if (!cores.length) {
    select.innerHTML = `<option value="__sem_cor">Sem variação</option>`;
    select.value = "__sem_cor";
    return;
  }

  select.innerHTML = cores.map(cor => `
    <option value="${escaparHTML(chaveCorEstoque(cor))}">
      ${escaparHTML(cor)}
    </option>
  `).join("");

  if (cores.some(cor => chaveCorEstoque(cor) === atual)) {
    select.value = atual;
  }
}

function atualizarOpcoesCoresEstoque() {
  preencherSelectCores("inventory-color");
  renderizarResumoEstoque();
}

function atualizarOpcoesCoresTransferencia() {
  preencherSelectCores("transfer-color");
}

async function transferirEstoque() {

    const produtoId = document.getElementById("transfer-product")?.value;
    const corKey = document.getElementById("transfer-color")?.value || "__sem_cor";
    const origemId = document.getElementById("transfer-from")?.value;
    const destinoId = document.getElementById("transfer-to")?.value;
    const quantidade = Math.floor(
        numero(document.getElementById("transfer-quantity")?.value)
    );

    if (!produtoId || !produtos[produtoId]) {
        mostrarToast("Selecione um produto para transferir.");
        return;
    }

    if (!origemId || !locais[origemId]) {
        mostrarToast("Selecione o local de origem.");
        return;
    }

    if (!destinoId || !locais[destinoId]) {
        mostrarToast("Selecione o local de destino.");
        return;
    }

    if (origemId === destinoId) {
        mostrarToast("A origem e o destino precisam ser diferentes.");
        return;
    }

    if (!Number.isFinite(quantidade) || quantidade < 1) {
        mostrarToast("Informe uma quantidade válida.");
        return;
    }

    const produto = produtos[produtoId];
    const cores = obterCoresProduto(produto);
    const corValida = corKey === "__sem_cor"
        ? cores.length === 0
        : cores.some(cor => chaveCorEstoque(cor) === corKey);

    if (!corValida) {
        mostrarToast("A cor selecionada não pertence a esse produto.");
        return;
    }

    try {
        const caminhoCor = `estoque/${produtoId}/${corKey}`;

        // A transação no nível da cor atualiza origem e destino atomicamente.
        const resultado = await runTransaction(
            ref(database, caminhoCor),
            atual => {
                const estoque = atual || {};
                const disponivel = numero(estoque[origemId]);

                if (disponivel < quantidade) {
                    return;
                }

                return {
                    ...estoque,
                    [origemId]: disponivel - quantidade,
                    [destinoId]: numero(estoque[destinoId]) + quantidade
                };
            }
        );

        if (!resultado.committed) {
            mostrarToast("Estoque insuficiente no local de origem.");
            return;
        }

        const corNome = cores.length
            ? cores.find(cor => chaveCorEstoque(cor) === corKey) || ""
            : "";

        await set(
            push(ref(database, "movimentacoesEstoque")),
            {
                produtoId,
                produtoNome: produto.nome || "",
                cor: corNome,
                tipo: "transferencia",
                quantidade,
                localOrigemId: origemId,
                localOrigemNome: locais[origemId].nome || "",
                localDestinoId: destinoId,
                localDestinoNome: locais[destinoId].nome || "",
                criadoEm: agora()
            }
        );

        const snapshot = await get(ref(database, "estoque"));
        estoquePorProduto = snapshot.val() || {};

        atualizarPainelEstoque();
        atualizarDashboard();

        mostrarToast("Estoque transferido com sucesso.");

    } catch (error) {
        console.error("Erro ao transferir estoque:", error);
        mostrarToast("Não foi possível realizar a transferência.");
    }

}

function chaveCorEstoque(cor) {

    if (!cor) {
        return "__sem_cor";
    }

    return encodeURIComponent(
        String(cor).trim().toLowerCase()
    );

}

function obterCoresProduto(produto) {

    return Array.isArray(produto?.cores)
        ? produto.cores
            .map(cor => String(cor).trim())
            .filter(Boolean)
        : [];

}


function quantidadeEstoque(produtoId, corKey, localId) {

    return numero(
        estoquePorProduto?.[produtoId]?.[corKey]?.[localId]
    );

}

function totalEstoqueProduto(produtoId) {

    const inventario =
        estoquePorProduto[produtoId] || {};

    return Object.values(inventario).reduce(
        (total, porLocal) => {

            return total + Object.values(porLocal || {}).reduce(
                (soma, quantidade) =>
                    soma + numero(quantidade),
                0
            );

        },
        0
    );

}

function renderizarResumoEstoque() {

    const container =
        document.getElementById("inventory-summary");

    if (!container) {
        return;
    }

    const produtoId =
        document.getElementById("inventory-product")?.value;

    const produto = produtos[produtoId];

    if (!produto) {

        container.innerHTML = `
            <p>Selecione um produto para consultar o estoque.</p>
        `;

        return;
    }

    const cores = obterCoresProduto(produto);

    const inventario =
        estoquePorProduto[produtoId] || {};

    const linhas = [];

    if (!cores.length) {

        const porLocal =
            inventario["__sem_cor"] || {};

        Object.entries(locais).forEach(([localId, local]) => {

            linhas.push({

                cor: "Sem variação",

                local: local.nome,

                quantidade: numero(porLocal[localId])

            });

        });

    } else {

        cores.forEach(cor => {

            const porLocal =
                inventario[chaveCorEstoque(cor)] || {};

            Object.entries(locais).forEach(([localId, local]) => {

                linhas.push({

                    cor,

                    local: local.nome,

                    quantidade: numero(porLocal[localId])

                });

            });

        });

    }

    container.innerHTML = `

        <h3>
            Estoque de ${escaparHTML(produto.nome || "")}
        </h3>

        <p>
            <strong>Total:</strong>
            ${totalEstoqueProduto(produtoId)} unidade(s)
        </p>

        ${linhas.length ? `

            <div class="inventory-table">

                <table>

                    <thead>

                        <tr>
                            <th>Cor</th>
                            <th>Local</th>
                            <th>Quantidade</th>
                        </tr>

                    </thead>

                    <tbody>

                        ${linhas.map(item => `

                            <tr>

                                <td>
                                    ${escaparHTML(item.cor)}
                                </td>

                                <td>
                                    ${escaparHTML(item.local || "")}
                                </td>

                                <td>
                                    ${item.quantidade}
                                </td>

                            </tr>

                        `).join("")}

                    </tbody>

                </table>

            </div>

        ` : `

            <p>
                Cadastre ao menos um local em Configurações
                para controlar o estoque.
            </p>

        `}

    `;

}

async function movimentarEstoque(tipo) {

    const produtoId =
        document.getElementById("inventory-product")?.value;

    const corKey =
        document.getElementById("inventory-color")?.value || "__sem_cor";

    const localId =
        document.getElementById("inventory-location")?.value;

    const quantidade = Math.floor(

        numero(
            document.getElementById("inventory-quantity")?.value
        )
    );

    if (!produtoId || !produtos[produtoId]) {

        mostrarToast("Selecione um produto.");

        return;

    }

    if (!localId || !locais[localId]) {

        mostrarToast("Selecione um local de estoque.");

        return;

    }

    if (!Number.isFinite(quantidade) || quantidade < 1) {

        mostrarToast("Informe uma quantidade válida.");

        return;

    }

    const produto = produtos[produtoId];

    const cores = obterCoresProduto(produto);

    const corValida = corKey === "__sem_cor"
        ? cores.length === 0
        : cores.some(cor => chaveCorEstoque(cor) === corKey);

    if (!corValida) {

        mostrarToast(
            "A variação selecionada não pertence a este produto."
        );

        return;

    }

    const caminho =
        `estoque/${produtoId}/${corKey}/${localId}`;

    try {

        if (tipo === "venda") {

            const resultado = await runTransaction(
                ref(database, caminho),
                atual => {

                    const disponivel = numero(atual);

                    if (disponivel < quantidade) {
                        return;

                    }

                    return disponivel - quantidade;

                }
            );

            if (!resultado.committed) {

                mostrarToast(
                    "Estoque insuficiente para essa venda."
                );

                return;

            }

        } else {

            await runTransaction(
                ref(database, caminho),
                atual => numero(atual) + quantidade
            );

        }

        const snapshot = await get(
            ref(database, `estoque/${produtoId}`)
        );

        const inventarioAtual =

            snapshot.val() || {};

        const total = Object.values(inventarioAtual).reduce(
            (soma, porLocal) => {

                return soma + Object.values(porLocal || {}).reduce(
                    (subtotal, valor) =>
                        subtotal + numero(valor),
                    0
                );

            },
            0
        );

        await update(
            ref(database, `produtos/${produtoId}`),
            {
                estoque: total,
                estoqueAtualizadoEm: agora()
            }
        );

        await set(
            push(ref(database, "movimentacoesEstoque")),
            {

                produtoId,

                produtoNome: produto.nome || "",

                cor: cores.length
                    ? cores.find(
                        item => chaveCorEstoque(item) === corKey
                    ) || ""
                    : "",

                localId,

                localNome: locais[localId].nome || "",

                tipo,

                quantidade,

                criadoEm: agora()

            }
        );

        const estoqueSnapshot = await get(
            ref(database, "estoque")
        );

        estoquePorProduto =
            estoqueSnapshot.val() || {};

        renderizarResumoEstoque();

        atualizarDashboard();

        mostrarToast(

            tipo === "venda"
                ? "Venda registrada e estoque atualizado."
                : "Estoque atualizado com sucesso."
        );

    } catch (error) {

        console.error(
            "Erro ao movimentar estoque:",
            error
        );

        mostrarToast(
            "Não foi possível atualizar o estoque."
        );

    }

}
