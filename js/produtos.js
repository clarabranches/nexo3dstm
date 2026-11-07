import {
    database
} from "./firebase-config.js";

import {
    ref,
    push,
    set,
    update,
    remove,
    onValue,
    get,
    runTransaction
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js";

import {
    escaparHTML,
    formatarMoeda,
    agora,
    mostrarToast
} from "./utils.js";


/*
 * ============================================================
 * REFERÊNCIAS
 * ============================================================
 */

const produtosRef = ref(database, "produtos");


/*
 * ============================================================
 * ESTADO LOCAL
 * ============================================================
 */

let produtos = {};


/*
 * ============================================================
 * NORMALIZAR CORES DO PRODUTO
 * ============================================================
 */

function normalizarCores(cores) {
    if (!Array.isArray(cores)) {
        return [];
    }

    return [...new Set(
        cores
            .map(cor => String(cor).trim())
            .filter(Boolean)
    )];
}


/*
 * ============================================================
 * OBSERVAR PRODUTOS
 * ============================================================
 */

export function observarProdutos(callback) {
    onValue(
        produtosRef,
        snapshot => {
            produtos = snapshot.val() || {};

            callback(produtos);
        },
        error => {
            console.error("Erro ao carregar produtos:", error);
            mostrarToast("Não foi possível carregar os produtos.");
        }
    );
}


/*
 * ============================================================
 * RETORNAR PRODUTOS
 * ============================================================
 */

export function obterProdutos() {
    return produtos;
}


/*
 * ============================================================
 * SALVAR OU ATUALIZAR PRODUTO
 * ============================================================
 */

export async function salvarProduto(produto, id = null) {
    try {
        if (!produto || typeof produto !== "object") {
            throw new Error("Dados do produto inválidos.");
        }

        const dadosProduto = {
            ...produto,

            cores: normalizarCores(produto.cores),

            atualizadoEm: agora()
        };

        if (id) {
            await update(
                ref(database, `produtos/${id}`),
                dadosProduto
            );
        } else {
            const novaReferencia = push(produtosRef);

            await set(novaReferencia, {
                ...dadosProduto,
                criadoEm: agora()
            });
        }

        mostrarToast(
            id
                ? "Produto atualizado!"
                : "Produto cadastrado!"
        );

        return true;

    } catch (error) {
        console.error("Erro ao salvar produto:", error);

        mostrarToast(
            "Não foi possível salvar o produto."
        );

        return false;
    }
}


/*
 * ============================================================
 * EXCLUIR PRODUTO
 * ============================================================
 */

export async function excluirProduto(id) {
    try {
        if (!id) {
            throw new Error("Identificador do produto não informado.");
        }

        await remove(
            ref(database, `produtos/${id}`)
        );

        mostrarToast("Produto excluído.");

        return true;

    } catch (error) {
        console.error("Erro ao excluir produto:", error);

        mostrarToast("Não foi possível excluir.");

        return false;
    }
}


/*
 * ============================================================
 * RENDERIZAR PRODUTOS
 * ============================================================
 */

export function renderizarProdutos(lista, container) {
    if (!container) {
        return;
    }

    const array = Object.entries(lista || {});

    if (!array.length) {
        container.innerHTML = `
            <div class="empty-state">
                Nenhum produto encontrado.
            </div>
        `;

        return;
    }

    container.innerHTML = array.map(([id, produto]) => {
        const imagem = produto.fotoUrl
            ? `
                <img
                    src="${escaparHTML(produto.fotoUrl)}"
                    alt="${escaparHTML(produto.nome || "Produto")}"
                >
            `
            : `
                <span class="product-image-placeholder">
                    3D
                </span>
            `;

        const referencia = escaparHTML(
            produto.referencia || "SEM REFERÊNCIA"
        );

        const nome = escaparHTML(
            produto.nome || "Produto sem nome"
        );

        const categoria = escaparHTML(
            produto.categoriaNome ||
            produto.categoria ||
            "Sem categoria"
        );

        const preco = formatarMoeda(
            produto.precoVenda || 0
        );

        const lucro = formatarMoeda(
            produto.lucro || 0
        );

        return `
            <article
                class="product-card"
                data-product-id="${escaparHTML(id)}"
                tabindex="0"
                role="button"
                aria-label="Editar ${nome}"
            >
                <div class="product-image">
                    ${imagem}
                </div>

                <div class="product-body">
                    <span class="product-reference">
                        ${referencia}
                    </span>

                    <h3>${nome}</h3>

                    <div class="product-category">
                        ${categoria}
                    </div>

                    <div class="product-footer">
                        <div class="product-price">
                            <span>Preço de venda</span>
                            <strong>${preco}</strong>
                        </div>

                        <div class="product-profit">
                            Lucro: ${lucro}
                        </div>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}


/*
 * ============================================================
 * RENDERIZAR PRODUTOS RECENTES
 * ============================================================
 */

export function renderizarRecentes(produtosObj, container) {
    if (!container) {
        return;
    }

    const lista = Object.entries(produtosObj || {})
        .sort(([, a], [, b]) => {
            return (b.criadoEm || 0) - (a.criadoEm || 0);
        })
        .slice(0, 5);

    if (!lista.length) {
        container.innerHTML = `
            <div class="empty-state">
                Nenhum produto cadastrado.
            </div>
        `;

        return;
    }

    container.innerHTML = lista.map(([id, produto]) => {
        const imagem = produto.fotoUrl
            ? `
                <img
                    src="${escaparHTML(produto.fotoUrl)}"
                    alt="${escaparHTML(produto.nome || "Produto")}"
                >
            `
            : "3D";

        return `
            <div
                class="recent-item"
                data-product-id="${escaparHTML(id)}"
                tabindex="0"
                role="button"
                aria-label="Editar ${escaparHTML(produto.nome || "Produto")}"
            >
                <div class="recent-image">
                    ${imagem}
                </div>

                <div class="recent-info">
                    <strong>
                        ${escaparHTML(produto.nome || "Produto")}
                    </strong>

                    <small>
                        ${escaparHTML(produto.referencia || "")}
                    </small>
                </div>
            </div>
        `;
    }).join("");
}


/*
 * ============================================================
 * FUNÇÕES AUXILIARES DO ESTOQUE POR LOCAL E COR
 * ============================================================
 */

function chaveCorEstoque(cor) {
    if (!cor) {
        return "__sem_cor";
    }

    return encodeURIComponent(
        String(cor).trim().toLowerCase()
    );
}


/*
 * ============================================================
 * CONSULTAR ESTOQUE DE UM PRODUTO
 *
 * Estrutura:
 * estoque/{produtoId}/{corCodificada}/{localId}
 * ============================================================
 */

export async function obterEstoqueProduto(produtoId) {
    try {
        if (!produtoId) {
            throw new Error("Produto não informado.");
        }

        const snapshot = await get(
            ref(database, `estoque/${produtoId}`)
        );

        return snapshot.val() || {};

    } catch (error) {
        console.error("Erro ao consultar estoque:", error);

        throw error;
    }
}


/*
 * ============================================================
 * CONSULTAR QUANTIDADE DE UMA COR EM UM LOCAL
 * ============================================================
 */

export async function obterQuantidadeEstoque(
    produtoId,
    cor,
    localId
) {
    try {
        if (!produtoId || !localId) {
            return 0;
        }

        const corKey = chaveCorEstoque(cor);

        const snapshot = await get(
            ref(
                database,
                `estoque/${produtoId}/${corKey}/${localId}`
            )
        );

        return Number(snapshot.val()) || 0;

    } catch (error) {
        console.error("Erro ao consultar quantidade:", error);

        throw error;
    }
}


/*
 * ============================================================
 * MOVIMENTAR ESTOQUE
 *
 * tipo:
 * "entrada" = adicionar unidades
 * "venda"   = retirar unidades
 * ============================================================
 */

export async function movimentarEstoque(
    produtoId,
    cor,
    localId,
    quantidade,
    tipo = "entrada"
) {
    try {
        const produto = produtos[produtoId];

        if (!produto) {
            throw new Error("Produto não encontrado.");
        }

        if (!localId) {
            throw new Error("Selecione um local de estoque.");
        }

        const qtd = Number(quantidade);

        if (
            !Number.isFinite(qtd) ||
            !Number.isInteger(qtd) ||
            qtd <= 0
        ) {
            throw new Error("Informe uma quantidade inteira válida.");
        }

        if (!["entrada", "venda"].includes(tipo)) {
            throw new Error("Tipo de movimentação inválido.");
        }

        const cores = normalizarCores(produto.cores);

        const corInformada = String(cor || "").trim();

        const corKey = corInformada
            ? chaveCorEstoque(corInformada)
            : "__sem_cor";

        if (cores.length === 0 && corKey !== "__sem_cor") {
            throw new Error("Este produto não possui variações de cor.");
        }

        if (
            cores.length > 0 &&
            !cores.some(item => chaveCorEstoque(item) === corKey)
        ) {
            throw new Error("A cor selecionada não pertence ao produto.");
        }

        const caminho = `estoque/${produtoId}/${corKey}/${localId}`;

        const resultado = await runTransaction(
            ref(database, caminho),
            atual => {
                const disponivel = Number(atual) || 0;

                if (tipo === "venda") {
                    if (disponivel < qtd) {
                        return;
                    }

                    return disponivel - qtd;
                }

                return disponivel + qtd;
            }
        );

        if (!resultado.committed) {
            throw new Error("Estoque insuficiente para essa venda.");
        }

        const inventario = await obterEstoqueProduto(produtoId);

        const totalEstoque = Object.values(inventario).reduce(
            (total, porLocal) => {
                return total + Object.values(porLocal || {}).reduce(
                    (soma, valor) => soma + (Number(valor) || 0),
                    0
                );
            },
            0
        );

        await update(
            ref(database, `produtos/${produtoId}`),
            {
                estoque: totalEstoque,
                estoqueAtualizadoEm: agora()
            }
        );

        const movimentacaoRef = push(
            ref(database, "movimentacoesEstoque")
        );

        await set(movimentacaoRef, {
            produtoId,
            produtoNome: produto.nome || "",
            cor: corInformada,
            corKey,
            localId,
            tipo,
            quantidade: qtd,
            valorUnitario: Number(produto.precoVenda) || 0,
            valorTotal:
                tipo === "venda"
                    ? qtd * (Number(produto.precoVenda) || 0)
                    : 0,
            criadoEm: agora()
        });

        mostrarToast(
            tipo === "venda"
                ? "Venda registrada e estoque atualizado."
                : "Estoque atualizado com sucesso."
        );

        return {
            sucesso: true,
            estoque: totalEstoque,
            movimentacaoId: movimentacaoRef.key
        };

    } catch (error) {
        console.error("Erro ao movimentar estoque:", error);

        mostrarToast(
            error.message || "Não foi possível atualizar o estoque."
        );

        throw error;
    }
}


/*
 * ============================================================
 * REGISTRAR VENDA
 *
 * Use esta função para baixar estoque por cor e local:
 *
 * registrarVenda(produtoId, cor, localId, quantidade)
 *
 * Para produtos sem variações, informe cor como "".
 * ============================================================
 */

export async function registrarVenda(
    produtoId,
    cor,
    localId,
    quantidade
) {
    return movimentarEstoque(
        produtoId,
        cor,
        localId,
        quantidade,
        "venda"
    );
}
