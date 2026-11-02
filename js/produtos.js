import {
    database
} from "./firebase-config.js";


import {
    ref,
    push,
    set,
    update,
    remove,
    onValue
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

const produtosRef =
    ref(
        database,
        "produtos"
    );


/*
 * ============================================================
 * ESTADO LOCAL
 * ============================================================
 */

let produtos = {};


/*
 * ============================================================
 * OBSERVAR PRODUTOS
 * ============================================================
 */

export function observarProdutos(
    callback
) {

    onValue(
        produtosRef,
        (snapshot) => {

            produtos =
                snapshot.val() || {};


            callback(
                produtos
            );

        },
        (error) => {

            console.error(
                "Erro ao carregar produtos:",
                error
            );

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
 * SALVAR
 * ============================================================
 */

export async function salvarProduto(
    produto,
    id = null
) {

    try {

        if (id) {

            await update(
                ref(
                    database,
                    `produtos/${id}`
                ),
                {
                    ...produto,
                    atualizadoEm:
                        agora()
                }
            );

        } else {

            const novaReferencia =
                push(produtosRef);


            await set(
                novaReferencia,
                {
                    ...produto,
                    criadoEm:
                        agora(),
                    atualizadoEm:
                        agora()
                }
            );

        }


        mostrarToast(
            id
                ? "Produto atualizado!"
                : "Produto cadastrado!"
        );


        return true;

    } catch (error) {

        console.error(
            "Erro ao salvar produto:",
            error
        );


        mostrarToast(
            "Não foi possível salvar o produto."
        );


        return false;

    }

}


/*
 * ============================================================
 * EXCLUIR
 * ============================================================
 */

export async function excluirProduto(
    id
) {

    try {

        await remove(
            ref(
                database,
                `produtos/${id}`
            )
        );


        mostrarToast(
            "Produto excluído."
        );


        return true;

    } catch (error) {

        console.error(error);


        mostrarToast(
            "Não foi possível excluir."
        );


        return false;

    }

}


/*
 * ============================================================
 * RENDERIZAR PRODUTOS
 * ============================================================
 */

export function renderizarProdutos(
    lista,
    container
) {

    if (!container) {

        return;

    }


    const array =
        Object.entries(lista || {});


    if (!array.length) {

        container.innerHTML = `
            <div class="empty-state">
                Nenhum produto encontrado.
            </div>
        `;

        return;

    }


    container.innerHTML =
        array.map(
            ([id, produto]) => {

                const imagem =
                    produto.fotoUrl
                        ? `
                            <img
                                src="${escaparHTML(
                                    produto.fotoUrl
                                )}"
                                alt="${escaparHTML(
                                    produto.nome
                                )}"
                            >
                        `
                        : `
                            <span
                                class="product-image-placeholder">
                                3D
                            </span>
                        `;


                return `

                    <article
                        class="product-card"
                        data-product-id="${id}">

                        <div
                            class="product-image">

                            ${imagem}

                        </div>


                        <div class="product-body">

                            <span
                                class="product-reference">

                                ${escaparHTML(
                                    produto.referencia ||
                                    "SEM REFERÊNCIA"
                                )}

                            </span>


                            <h3>

                                ${escaparHTML(
                                    produto.nome ||
                                    "Produto sem nome"
                                )}

                            </h3>


                            <div
                                class="product-category">

                                ${escaparHTML(
                                    produto.categoriaNome ||
                                    produto.categoria ||
                                    "Sem categoria"
                                )}

                            </div>


                            <div
                                class="product-footer">

                                <div
                                    class="product-price">

                                    <span>
                                        Preço de venda
                                    </span>

                                    <strong>
                                        ${formatarMoeda(
                                            produto.precoVenda
                                        )}
                                    </strong>

                                </div>


                                <div
                                    class="product-profit">

                                    Lucro:
                                    ${formatarMoeda(
                                        produto.lucro
                                    )}

                                </div>

                            </div>

                        </div>

                    </article>

                `;

            }
        )
        .join("");

}


/*
 * ============================================================
 * RENDERIZAR RECENTES
 * ============================================================
 */

export function renderizarRecentes(
    produtosObj,
    container
) {

    if (!container) {

        return;

    }


    const lista =
        Object.entries(
            produtosObj || {}
        )
        .sort(
            ([, a], [, b]) =>
                (b.criadoEm || 0) -
                (a.criadoEm || 0)
        )
        .slice(
            0,
            5
        );


    if (!lista.length) {

        container.innerHTML = `
            <div class="empty-state">
                Nenhum produto cadastrado.
            </div>
        `;

        return;

    }


    container.innerHTML =
        lista.map(
            ([id, produto]) => {

                const imagem =
                    produto.fotoUrl
                        ? `
                            <img
                                src="${escaparHTML(
                                    produto.fotoUrl
                                )}"
                                alt=""
                            >
                        `
                        : "3D";


                return `

                    <div
                        class="recent-item"
                        data-product-id="${id}">

                        <div class="recent-image">

                            ${imagem}

                        </div>


                        <div class="recent-info">

                            <strong>

                                ${escaparHTML(
                                    produto.nome ||
                                    "Produto"
                                )}

                            </strong>

                            <small>

                                ${escaparHTML(
                                    produto.referencia ||
                                    ""
                                )}

                            </small>

                        </div>

                    </div>

                `;

            }
        )
        .join("");

}


/*
 * ============================================================
 * BAIXA DE ESTOQUE
 * ============================================================
 */

export async function registrarVenda(
    produtoId,
    quantidade
) {

    const produto =
        produtos[produtoId];


    if (!produto) {

        throw new Error(
            "Produto não encontrado."
        );

    }


    const qtd =
        Number(quantidade);


    if (
        !Number.isFinite(qtd) ||
        qtd <= 0
    ) {

        throw new Error(
            "Quantidade inválida."
        );

    }


    const estoqueAtual =
        Number(
            produto.estoque || 0
        );


    if (qtd > estoqueAtual) {

        throw new Error(
            "Quantidade maior que o estoque."
        );

    }


    const novoEstoque =
        estoqueAtual - qtd;


    await update(
        ref(
            database,
            `produtos/${produtoId}`
        ),
        {
            estoque:
                novoEstoque,

            atualizadoEm:
                agora()
        }
    );


    const vendaRef =
        push(
            ref(
                database,
                "vendas"
            )
        );


    await set(
        vendaRef,
        {

            produtoId:
                produtoId,

            quantidade:
                qtd,

            valorUnitario:
                Number(
                    produto.precoVenda || 0
                ),

            valorTotal:
                qtd *
                Number(
                    produto.precoVenda || 0
                ),

            data:
                agora()

        }
    );


    mostrarToast(
        "Venda registrada e estoque atualizado."
    );

}