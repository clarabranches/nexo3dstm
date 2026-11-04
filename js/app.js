import {
    database
} from "./firebase-config.js";


import {
    ref,
    get,
    set,
    push,
    update,
    remove
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

let produtos =
    {};

let categorias =
    {};

let filamentos =
    {};

let configuracoes =
    {};


let produtoEditandoId =
    null;


/*
 * ============================================================
 * INICIALIZAÇÃO
 * ============================================================
 */

document.addEventListener("usuarioAutenticado", iniciar);

async function iniciar() {
    configurarMenu();
    configurarAcoes();
    configurarFormularioProduto();
    configurarConfiguracoes();
    configurarFilamentos();
    configurarCategorias();
    configurarFiltros();
    configurarUploadImagem();
    adicionarLinhaFilamento();
    await carregarDados();
    observarProdutos((dados) => {
        produtos = dados || {};
        atualizarInterface();
    });
}

async function carregarDados() {
    try {
        const [categoriasSnapshot, filamentosSnapshot, configuracoesSnapshot] = await Promise.all([
            get(ref(database, "categorias")),
            get(ref(database, "filamentos")),
            get(ref(database, "configuracoes"))
        ]);

        categorias = categoriasSnapshot.val() || {};
        filamentos = filamentosSnapshot.val() || {};
        configuracoes = configuracoesSnapshot.val() || {};

        atualizarCategorias();
        atualizarFilamentos();
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

    document
        .querySelectorAll(
            ".tab-content"
        )
        .forEach(
            (elemento) => {

                elemento.classList.remove(
                    "active"
                );

            }
        );


    const alvo =
        document.getElementById(
            `tab-${tab}`
        );


    if (alvo) {

        alvo.classList.add(
            "active"
        );

    }


    document
        .querySelectorAll(
            ".menu-item"
        )
        .forEach(
            (botao) => {

                botao.classList.toggle(
                    "active",
                    botao.dataset.tab === tab
                );

            }
        );


    const titulos = {

        dashboard:
            [
                "Visão geral",
                "Acompanhe os produtos e a produção."
            ],

        produtos:
            [
                "Produtos",
                "Consulte e gerencie os produtos da loja."
            ],

        cadastro:
            [
                produtoEditandoId
                    ? "Editar produto"
                    : "Novo produto",
                "Cadastre ou edite um produto."
            ],

        configuracoes:
            [
                "Configurações",
                "Gerencie custos, categorias e filamentos."
            ]

    };


    const titulo =
        titulos[tab];


    if (titulo) {

        document.getElementById(
            "page-title"
        ).textContent =
            titulo[0];


        document.getElementById(
            "page-subtitle"
        ).textContent =
            titulo[1];

    }


    const sidebar =
        document.querySelector(
            ".sidebar"
        );


    sidebar?.classList.remove(
        "mobile-open"
    );

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
            abrirEdicaoProduto(card.dataset.productid);
            return;
        }

        const recente = event.target.closest(".recent-item");
        if (recente) {
            abrirEdicaoProduto(recente.dataset.productid);
            return;
        }
    });

    document.getElementById("clear-product-form")?.addEventListener("click", () => {
        limparFormularioProduto();
    });

    document.getElementById("cancel-product")?.addEventListener("click", () => {
        limparFormularioProduto();
        abrirAba("produtos");
    });
}


    document.getElementById(
        "clear-product-form"
    )?.addEventListener(
        "click",
        limparFormularioProduto
    );


    document.getElementById(
        "cancel-product"
    )?.addEventListener(
        "click",
        () => {

            limparFormularioProduto();

            abrirAba("produtos");

        }
    );

}


function executarAcao(
    action
) {

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

}


function atualizarListaProdutos() {

    const container =
        document.getElementById(
            "products-grid"
        );


    const busca =
        (
            document.getElementById(
                "product-search"
            )?.value || ""
        )
        .toLowerCase()
        .trim();


    const categoria =
        document.getElementById(
            "category-filter"
        )?.value || "";


    const ordenacao =
        document.getElementById(
            "sort-products"
        )?.value || "nome";


    let lista =
        Object.entries(
            produtos
        );


    if (busca) {

        lista =
            lista.filter(
                ([, produto]) => {

                    const nome =
                        String(
                            produto.nome || ""
                        )
                        .toLowerCase();


                    return nome.includes(
                        busca
                    );

                }
            );

    }


    if (categoria) {

        lista =
            lista.filter(
                ([, produto]) =>
                    produto.categoriaId ===
                    categoria
            );

    }


    lista.sort(
        ([, a], [, b]) => {

            switch (ordenacao) {

                case "preco-desc":

                    return (
                        numero(
                            b.precoVenda
                        ) -
                        numero(
                            a.precoVenda
                        )
                    );


                case "preco-asc":

                    return (
                        numero(
                            a.precoVenda
                        ) -
                        numero(
                            b.precoVenda
                        )
                    );


                case "lucro-desc":

                    return (
                        numero(
                            b.lucro
                        ) -
                        numero(
                            a.lucro
                        )
                    );


                default:

                    return String(
                        a.nome || ""
                    )
                    .localeCompare(
                        String(
                            b.nome || ""
                        ),
                        "pt-BR"
                    );

            }

        }
    );


    const objetoFiltrado =
        Object.fromEntries(
            lista
        );


    renderizarProdutos(
        objetoFiltrado,
        container
    );

}


function atualizarDashboard() {

    const lista =
        Object.values(
            produtos
        );


    const quantidadeProdutos =
        lista.length;


    const produzido =
        lista.reduce(
            (
                total,
                produto
            ) =>
                total +
                numero(
                    produto.produzido
                ),
            0
        );


    const estoque =
        lista.reduce(
            (
                total,
                produto
            ) =>
                total +
                numero(
                    produto.estoque
                ),
            0
        );


    document.getElementById(
        "stat-produtos"
    ).textContent =
        quantidadeProdutos;


    document.getElementById(
        "stat-produzido"
    ).textContent =
        produzido;


    document.getElementById(
        "stat-estoque"
    ).textContent =
        estoque;


    document.getElementById(
        "stat-categorias"
    ).textContent =
        Object.keys(
            categorias
        ).length;


    renderizarRecentes(
        produtos,
        document.getElementById(
            "recent-products"
        )
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
    ]
    .forEach(
        (id) => {

            document.getElementById(
                id
            )?.addEventListener(
                "input",
                atualizarListaProdutos
            );


            document.getElementById(
                id
            )?.addEventListener(
                "change",
                atualizarListaProdutos
            );

        }
    );

}


/*
 * ============================================================
 * FORMULÁRIO DE PRODUTO
 * ============================================================
 */

function configurarFormularioProduto() {

    document.getElementById(
        "product-form"
    )?.addEventListener(
        "submit",
        salvarFormularioProduto
    );


    [
        "product-category",
        "print-hours",
        "produced-quantity",
        "stock-quantity"
    ]
    .forEach(
        (id) => {

            document.getElementById(
                id
            )?.addEventListener(
                "input",
                atualizarCalculo
            );

            document.getElementById(
                id
            )?.addEventListener(
                "change",
                atualizarCalculo
            );

        }
    );


    document.getElementById(
        "add-filament"
    )?.addEventListener(
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

function adicionarLinhaFilamento(
    dados = null
) {

    const container =
        document.getElementById(
            "filaments-container"
        );


    if (!container) {

        return;

    }


    const row =
        document.createElement(
            "div"
        );


    row.className =
        "filament-row";


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

                ${Object.entries(
                    filamentos
                )
                .map(
                    ([id, filament]) => `

                        <option
                            value="${id}"
                            ${
                                dados?.filamentoId === id
                                    ? "selected"
                                    : ""
                            }>

                            ${escaparHTML(
                                filament.nome
                            )}

                        </option>

                    `
                )
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
                value="${
                    dados?.gramas ?? 0
                }"
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


    container.appendChild(
        row
    );


    row.querySelector(
        ".remove-filament"
    ).addEventListener(
        "click",
        () => {

            row.remove();

            atualizarCalculo();

        }
    );


    row.querySelectorAll(
        "select,input"
    ).forEach(
        (elemento) => {

            elemento.addEventListener(
                "input",
                atualizarCalculo
            );

            elemento.addEventListener(
                "change",
                atualizarCalculo
            );

        }
    );

}


/*
 * ============================================================
 * LER FILAMENTOS DO FORM
 * ============================================================
 */

function obterFilamentosFormulario() {

    const linhas =
        document.querySelectorAll(
            ".filament-row"
        );


    return Array.from(
        linhas
    )
    .map(
        (linha) => {

            const id =
                linha.querySelector(
                    ".product-filament"
                )?.value;


            const gramas =
                numero(
                    linha.querySelector(
                        ".product-filament-grams"
                    )?.value
                );


            if (!id) {

                return null;

            }


            return {

                filamentoId:
                    id,

                gramas:
                    gramas

            };

        }
    )
    .filter(
        Boolean
    );

}


/*
 * ============================================================
 * CALCULAR
 * ============================================================
 */

function atualizarCalculo() {

    const dados = {

        horasImpressao:
            numero(
                document.getElementById(
                    "print-hours"
                )?.value
            ),

        filamentos:
            obterFilamentosFormulario(),

        configuracoes:
            configuracoes,

        filamentosCadastrados:
            filamentos

    };


    const calculo =
        calcularProduto(
            dados
        );


    atualizarVisualPrecificacao(
        calculo
    );

}


/*
 * ============================================================
 * SALVAR PRODUTO
 * ============================================================
 */

async function salvarFormularioProduto(
    event
) {

    event.preventDefault();


    const categoriaId =
        document.getElementById(
            "product-category"
        ).value;


    const categoria =
        categorias[
            categoriaId
        ];


    if (!categoria) {

        mostrarToast(
            "Selecione uma categoria."
        );

        return;

    }


    const nome =
        document.getElementById(
            "product-name"
        ).value.trim();


    if (!nome) {

        mostrarToast(
            "Informe o nome do produto."
        );

        return;

    }


    const dadosCalculo = {

        horasImpressao:
            numero(
                document.getElementById(
                    "print-hours"
                ).value
            ),

        filamentos:
            obterFilamentosFormulario(),

        configuracoes:
            configuracoes,

        filamentosCadastrados:
            filamentos

    };


    const calculo =
        calcularProduto(
            dadosCalculo
        );


    let referencia =
        document.getElementById(
            "product-reference"
        ).value;


    /*
     * Gera referência somente
     * se for um novo produto.
     */

    if (!produtoEditandoId) {

        referencia =
            gerarReferencia(
                categoria.nome,
                Object.values(
                    produtos
                )
            );

    }


    const produto = {

        referencia:

            referencia,

        nome:

            nome,

        categoriaId:

            categoriaId,

        categoriaNome:

            categoria.nome,

        descricao:

            document.getElementById(
                "product-description"
            ).value.trim(),

        fotoUrl:

            window.novaImagemBase64 ||
            document.getElementById(
                "image-preview"
            ).dataset.imageUrl ||
            "",

        horasImpressao:

            dadosCalculo.horasImpressao,

        filamentos:

            dadosCalculo.filamentos,

        produzido:

            numero(
                document.getElementById(
                    "produced-quantity"
                ).value
            ),

        estoque:

            numero(
                document.getElementById(
                    "stock-quantity"
                ).value
            ),

        custoMaquina:

            calculo.maquina,

        custoMaoDeObra:

            calculo.maoDeObra,

        custoFilamentos:

            calculo.filamentos,

        custoEmbalagem:

            calculo.embalagem,

        custoProducao:

            calculo.custoProducao,

        precoVenda:

            calculo.precoVenda,

        lucro:

            calculo.lucro

    };


    const sucesso =
        await salvarProduto(
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

function abrirEdicaoProduto(
    id
) {

    const produto =
        produtos[id];


    if (!produto) {

        return;

    }


    produtoEditandoId =
        id;


    document.getElementById(
        "form-title"
    ).textContent =
        "Editar produto";


    document.getElementById(
        "product-id"
    ).value =
        id;


    document.getElementById(
        "product-reference"
    ).value =
        produto.referencia || "";


    document.getElementById(
        "product-name"
    ).value =
        produto.nome || "";


    document.getElementById(
        "product-category"
    ).value =
        produto.categoriaId || "";


    document.getElementById(
        "product-description"
    ).value =
        produto.descricao || "";


    document.getElementById(
        "print-hours"
    ).value =
        produto.horasImpressao || 0;


    document.getElementById(
        "produced-quantity"
    ).value =
        produto.produzido || 0;


    document.getElementById(
        "stock-quantity"
    ).value =
        produto.estoque || 0;


    const preview =
        document.getElementById(
            "image-preview"
        );


    preview.dataset.imageUrl =
        produto.fotoUrl || "";


    if (produto.fotoUrl) {

        preview.innerHTML = `

            <img
                src="${escaparHTML(
                    produto.fotoUrl
                )}"
                alt=""
            >

        `;

    } else {

        preview.innerHTML =
            "<span>Sem imagem</span>";

    }


    const container =
        document.getElementById(
            "filaments-container"
        );


    container.innerHTML =
        "";


    if (
        Array.isArray(
            produto.filamentos
        ) &&
        produto.filamentos.length
    ) {

        produto.filamentos.forEach(
            (item) => {

                adicionarLinhaFilamento(
                    item
                );

            }
        );

    } else {

        adicionarLinhaFilamento();

    }


    atualizarCalculo();


    abrirAba(
        "cadastro"
    );

}


/*
 * ============================================================
 * LIMPAR FORMULÁRIO
 * ============================================================
 */

function limparFormularioProduto() {

    produtoEditandoId =
        null;


    const form =
        document.getElementById(
            "product-form"
        );


    form?.reset();


    document.getElementById(
        "form-title"
    ).textContent =
        "Novo produto";


    document.getElementById(
        "product-id"
    ).value =
        "";


    document.getElementById(
        "product-reference"
    ).value =
        "";


    document.getElementById(
        "produced-quantity"
    ).value =
        "0";


    document.getElementById(
        "stock-quantity"
    ).value =
        "0";


    const preview =
        document.getElementById(
            "image-preview"
        );


    preview.innerHTML =
        "<span>Sem imagem</span>";


    preview.dataset.imageUrl =
        "";


    window.novaImagemBase64 =
        "";


    document.getElementById(
        "filaments-container"
    ).innerHTML =
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
        document.getElementById(
            "product-image"
        );


    const preview =
        document.getElementById(
            "image-preview"
        );


    input?.addEventListener(
        "change",
        () => {

            const arquivo =
                input.files?.[0];


            if (!arquivo) {

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                () => {

                    const resultado =
                        reader.result;


                    window.novaImagemBase64 =
                        resultado;


                    preview.innerHTML = `

                        <img
                            src="${resultado}"
                            alt="Prévia"
                        >

                    `;

                };


            reader.readAsDataURL(
                arquivo
            );

        }
    );

}


/*
 * ============================================================
 * CATEGORIAS
 * ============================================================
 */

function configurarCategorias() {

    document.getElementById(
        "category-form"
    )?.addEventListener(
        "submit",
        salvarCategoria
    );

}


async function salvarCategoria(
    event
) {

    event.preventDefault();


    const id =
        document.getElementById(
            "category-id"
        ).value;


    const nome =
        document.getElementById(
            "category-name"
        ).value.trim();


    if (!nome) {

        return;

    }


    try {

        if (id) {

            await update(
                ref(
                    database,
                    `categorias/${id}`
                ),
                {
                    nome:
                        nome
                }
            );

        } else {

            const nova =
                push(
                    ref(
                        database,
                        "categorias"
                    )
                );


            await set(
                nova,
                {
                    nome:
                        nome,

                    criadoEm:
                        agora()
                }
            );

        }


        document.getElementById(
            "category-form"
        ).reset();


        document.getElementById(
            "category-id"
        ).value =
            "";


        await recarregarCategorias();


        mostrarToast(
            "Categoria salva."
        );

    } catch (error) {

        console.error(error);

        mostrarToast(
            "Erro ao salvar categoria."
        );

    }

}


async function recarregarCategorias() {

    const snapshot =
        await get(
            ref(
                database,
                "categorias"
            )
        );


    categorias =
        snapshot.val() || {};


    atualizarCategorias();

    atualizarDashboard();

}


function atualizarCategorias() {

    const selectProduto =
        document.getElementById(
            "product-category"
        );


    const selectFiltro =
        document.getElementById(
            "category-filter"
        );


    if (selectProduto) {

        selectProduto.innerHTML = `

            <option value="">
                Selecione uma categoria
            </option>

            ${Object.entries(
                categorias
            )
            .map(
                ([id, categoria]) => `

                    <option value="${id}">

                        ${escaparHTML(
                            categoria.nome
                        )}

                    </option>

                `
            )
            .join("")}

        `;

    }


    if (selectFiltro) {

        const valorAtual =
            selectFiltro.value;


        selectFiltro.innerHTML = `

            <option value="">
                Todas as categorias
            </option>

            ${Object.entries(
                categorias
            )
            .map(
                ([id, categoria]) => `

                    <option value="${id}">

                        ${escaparHTML(
                            categoria.nome
                        )}

                    </option>

                `
            )
            .join("")}

        `;


        selectFiltro.value =
            valorAtual;

    }


    renderizarListaCategorias();

}


function renderizarListaCategorias() {

    const container =
        document.getElementById(
            "categories-list"
        );


    if (!container) {

        return;

    }


    const lista =
        Object.entries(
            categorias
        );


    if (!lista.length) {

        container.innerHTML = `
            <div class="empty-state">
                Nenhuma categoria cadastrada.
            </div>
        `;

        return;

    }


    container.innerHTML =
        lista.map(
            ([id, categoria]) => `

                <div class="settings-item">

                    <div
                        class="settings-item-info">

                        <strong>
                            ${escaparHTML(
                                categoria.nome
                            )}
                        </strong>

                        <small>
                            Prefixo:
                            ${escaparHTML(
                                categoria.nome
                                    .substring(0, 2)
                                    .toUpperCase()
                            )}
                        </small>

                    </div>


                    <div
                        class="settings-item-actions">

                        <button
                            class="icon-button danger"
                            data-delete-category="${id}">

                            ×

                        </button>

                    </div>

                </div>

            `
        )
        .join("");


    container
        .querySelectorAll(
            "[data-delete-category]"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        excluirCategoria(
                            button.dataset
                                .deleteCategory
                        );

                    }
                );

            }
        );

}


async function excluirCategoria(
    id
) {

    const categoria =
        categorias[id];


    if (!categoria) {

        return;

    }


    const confirmar =
        confirm(
            `Excluir a categoria "${categoria.nome}"?`
        );


    if (!confirmar) {

        return;

    }


    await remove(
        ref(
            database,
            `categorias/${id}`
        )
    );


    await recarregarCategorias();


    mostrarToast(
        "Categoria excluída."
    );

}


/*
 * ============================================================
 * FILAMENTOS
 * ============================================================
 */

function configurarFilamentos() {

    document.getElementById(
        "filament-form"
    )?.addEventListener(
        "submit",
        salvarFilamento
    );

}


async function salvarFilamento(
    event
) {

    event.preventDefault();


    const id =
        document.getElementById(
            "filament-id"
        ).value;


    const nome =
        document.getElementById(
            "filament-name"
        ).value.trim();


    const valorPorGrama =
        numero(
            document.getElementById(
                "filament-price"
            ).value
        );


    if (!nome) {

        return;

    }


    try {

        if (id) {

            await update(
                ref(
                    database,
                    `filamentos/${id}`
                ),
                {
                    nome,
                    valorPorGrama
                }
            );

        } else {

            const nova =
                push(
                    ref(
                        database,
                        "filamentos"
                    )
                );


            await set(
                nova,
                {

                    nome,

                    valorPorGrama,

                    criadoEm:
                        agora()

                }
            );

        }


        document.getElementById(
            "filament-form"
        ).reset();


        document.getElementById(
            "filament-id"
        ).value =
            "";


        await recarregarFilamentos();


        mostrarToast(
            "Filamento salvo."
        );

    } catch (error) {

        console.error(error);

        mostrarToast(
            "Erro ao salvar filamento."
        );

    }

}


async function recarregarFilamentos() {

    const snapshot =
        await get(
            ref(
                database,
                "filamentos"
            )
        );


    filamentos =
        snapshot.val() || {};


    atualizarFilamentos();


    const container =
        document.getElementById(
            "filaments-container"
        );


    if (container) {

        container.innerHTML =
            "";


        adicionarLinhaFilamento();

    }


    atualizarCalculo();

}


function atualizarFilamentos() {

    renderizarListaFilamentos();

}


function renderizarListaFilamentos() {

    const container =
        document.getElementById(
            "filaments-list"
        );


    if (!container) {

        return;

    }


    const lista =
        Object.entries(
            filamentos
        );


    if (!lista.length) {

        container.innerHTML = `
            <div class="empty-state">
                Nenhum filamento cadastrado.
            </div>
        `;

        return;

    }


    container.innerHTML =
        lista.map(
            ([id, filament]) => `

                <div class="settings-item">

                    <div
                        class="settings-item-info">

                        <strong>
                            ${escaparHTML(
                                filament.nome
                            )}
                        </strong>

                        <small>
                            ${formatarMoeda(
                                filament.valorPorGrama
                            )}
                                por grama
                        </small>

                    </div>


                    <div
                        class="settings-item-actions">

                        <button
                            class="icon-button danger"
                            data-delete-filament="${id}">

                            ×

                        </button>

                    </div>

                </div>

            `
        )
        .join("");


    container
        .querySelectorAll(
            "[data-delete-filament]"
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        excluirFilamento(
                            button.dataset
                                .deleteFilament
                        );

                    }
                );

            }
        );

}


async function excluirFilamento(
    id
) {

    const filament =
        filamentos[id];


    if (!filament) {

        return;

    }


    const confirmar =
        confirm(
            `Excluir o filamento "${filament.nome}"?`
        );


    if (!confirmar) {

        return;

    }


    await remove(
        ref(
            database,
            `filamentos/${id}`
        )
    );


    await recarregarFilamentos();


    mostrarToast(
        "Filamento excluído."
    );

}


/*
 * ============================================================
 * CONFIGURAÇÕES
 * ============================================================
 */

function configurarConfiguracoes() {

    document.getElementById(
        "settings-form"
    )?.addEventListener(
        "submit",
        salvarConfiguracoes
    );

}


function carregarConfiguracoes() {

    document.getElementById(
        "electricity-cost"
    ).value =
        configuracoes.energiaEletrica ??
        0;


    document.getElementById(
        "printer-consumption"
    ).value =
        configuracoes.consumoImpressora ??
        0;


    document.getElementById(
        "labor-hour"
    ).value =
        configuracoes.maoDeObraHora ??
        0;


    document.getElementById(
        "packaging-cost-setting"
    ).value =
        configuracoes.embalagemPorPeca ??
        0;


    document.getElementById(
        "profit-margin"
    ).value =
        configuracoes.margemLucro ??
        0;

}


async function salvarConfiguracoes(
    event
) {

    event.preventDefault();


    configuracoes = {

        energiaEletrica:

            numero(
                document.getElementById(
                    "electricity-cost"
                ).value
            ),

        consumoImpressora:

            numero(
                document.getElementById(
                    "printer-consumption"
                ).value
            ),

        maoDeObraHora:

            numero(
                document.getElementById(
                    "labor-hour"
                ).value
            ),

        embalagemPorPeca:

            numero(
                document.getElementById(
                    "packaging-cost-setting"
                ).value
            ),

        margemLucro:

            numero(
                document.getElementById(
                    "profit-margin"
                ).value
            ),

        atualizadoEm:
            agora()

    };


    try {

        await set(
            ref(
                database,
                "configuracoes"
            ),
            configuracoes
        );


        atualizarCalculo();


        mostrarToast(
            "Configurações salvas."
        );

    } catch (error) {

        console.error(error);

        mostrarToast(
            "Erro ao salvar configurações."
        );

    }

}
