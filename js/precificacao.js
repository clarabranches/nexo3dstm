import {
    numero,
    formatarMoeda
} from "./utils.js";


/*
 * ============================================================
 * CÁLCULO DO CUSTO DA MÁQUINA
 * ============================================================
 *
 * Fórmula:
 *
 * Energia elétrica × consumo médio da impressora
 *
 */

export function calcularCustoMaquina(
    configuracoes,
    horas
) {

    const energia =
        numero(
            configuracoes?.energiaEletrica
        );


    const consumo =
        numero(
            configuracoes?.consumoImpressora
        );


    const tempo =
        numero(horas);


    const custoHora =
        energia * consumo;


    return custoHora * tempo;

}


/*
 * ============================================================
 * CUSTO DA MÃO DE OBRA
 * ============================================================
 *
 * Mão de obra/hora × horas de impressão
 *
 */

export function calcularMaoDeObra(
    configuracoes,
    horas
) {

    const maoDeObraHora =
        numero(
            configuracoes?.maoDeObraHora
        );


    const tempo =
        numero(horas);


    return (
        maoDeObraHora *
        tempo
    );

}


/*
 * ============================================================
 * CUSTO DOS FILAMENTOS
 * ============================================================
 *
 * Valor por grama × quantidade de gramas
 *
 */

export function calcularFilamentos(
    filamentosUtilizados,
    filamentosCadastrados
) {

    if (
        !Array.isArray(
            filamentosUtilizados
        )
    ) {

        return 0;

    }


    let total = 0;


    filamentosUtilizados.forEach(
        (item) => {

            const filamentId =
                item.filamentoId;


            const quantidade =
                numero(
                    item.gramas
                );


            const cadastrado =
                filamentosCadastrados[
                    filamentId
                ];


            if (!cadastrado) {

                return;

            }


            const valorPorGrama =
                numero(
                    cadastrado.valorPorGrama
                );


            total +=
                valorPorGrama *
                quantidade;

        }
    );


    return total;

}


/*
 * ============================================================
 * CUSTO TOTAL
 * ============================================================
 */

export function calcularCustoProducao(
    custos
) {

    return (

        numero(
            custos.maquina
        ) +

        numero(
            custos.maoDeObra
        ) +

        numero(
            custos.embalagem
        ) +

        numero(
            custos.filamentos
        )

    );

}


/*
 * ============================================================
 * PREÇO DE VENDA
 * ============================================================
 *
 * Aqui a margem é aplicada sobre o custo.
 *
 * Exemplo:
 *
 * Custo = R$ 10
 * Margem = 50%
 *
 * Preço = 10 × 1,50
 *       = R$ 15
 *
 */

export function calcularPrecoVenda(
    custoProducao,
    margem
) {

    const custo =
        numero(custoProducao);


    const percentual =
        numero(margem);


    return (
        custo *
        (1 + percentual / 100)
    );

}


/*
 * ============================================================
 * LUCRO
 * ============================================================
 */

export function calcularLucro(
    precoVenda,
    custoProducao
) {

    return (
        numero(precoVenda) -
        numero(custoProducao)
    );

}


/*
 * ============================================================
 * CÁLCULO COMPLETO
 * ============================================================
 */

export function calcularProduto(
    dados
) {

    const configuracoes =
        dados.configuracoes || {};


    const horas =
        numero(
            dados.horasImpressao
        );


    const custoMaquina =
        calcularCustoMaquina(
            configuracoes,
            horas
        );


    const maoDeObra =
        calcularMaoDeObra(
            configuracoes,
            horas
        );


    const embalagem =
        numero(
            configuracoes.embalagemPorPeca
        );


    const filamentos =
        calcularFilamentos(
            dados.filamentos || [],
            dados.filamentosCadastrados || {}
        );


    const custoProducao =
        calcularCustoProducao({

            maquina:
                custoMaquina,

            maoDeObra:
                maoDeObra,

            embalagem:
                embalagem,

            filamentos:
                filamentos

        });


    const precoVenda =
        calcularPrecoVenda(
            custoProducao,
            configuracoes.margemLucro
        );


    const lucro =
        calcularLucro(
            precoVenda,
            custoProducao
        );


    return {

        maquina:
            custoMaquina,

        maoDeObra:
            maoDeObra,

        embalagem:
            embalagem,

        filamentos:
            filamentos,

        custoProducao:
            custoProducao,

        precoVenda:
            precoVenda,

        lucro:
            lucro

    };

}


/*
 * ============================================================
 * ATUALIZAR VISUAL
 * ============================================================
 */

export function atualizarVisualPrecificacao(
    calculo
) {

    const elementos = {

        machine:
            document.getElementById(
                "machine-cost"
            ),

        labor:
            document.getElementById(
                "labor-cost"
            ),

        filament:
            document.getElementById(
                "filament-cost"
            ),

        packaging:
            document.getElementById(
                "packaging-cost"
            ),

        production:
            document.getElementById(
                "production-cost"
            ),

        sale:
            document.getElementById(
                "sale-price"
            ),

        profit:
            document.getElementById(
                "profit-value"
            )

    };


    if (elementos.machine) {

        elementos.machine.textContent =
            formatarMoeda(
                calculo.maquina
            );

    }


    if (elementos.labor) {

        elementos.labor.textContent =
            formatarMoeda(
                calculo.maoDeObra
            );

    }


    if (elementos.filament) {

        elementos.filament.textContent =
            formatarMoeda(
                calculo.filamentos
            );

    }


    if (elementos.packaging) {

        elementos.packaging.textContent =
            formatarMoeda(
                calculo.embalagem
            );

    }


    if (elementos.production) {

        elementos.production.textContent =
            formatarMoeda(
                calculo.custoProducao
            );

    }


    if (elementos.sale) {

        elementos.sale.textContent =
            formatarMoeda(
                calculo.precoVenda
            );

    }


    if (elementos.profit) {

        elementos.profit.textContent =
            formatarMoeda(
                calculo.lucro
            );

    }

}