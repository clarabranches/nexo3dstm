/*
 * ============================================================
 * FUNÇÕES UTILITÁRIAS
 * ============================================================
 */


/*
 * ============================================================
 * MOEDA
 * ============================================================
 */

export function formatarMoeda(valor) {

    const numero =
        Number(valor) || 0;


    return numero.toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


/*
 * ============================================================
 * NÚMERO
 * ============================================================
 */

export function numero(valor) {

    const resultado =
        Number(valor);


    if (Number.isNaN(resultado)) {

        return 0;

    }


    return resultado;

}


/*
 * ============================================================
 * ESCAPAR HTML
 * ============================================================
 */

export function escaparHTML(texto) {

    if (
        texto === null ||
        texto === undefined
    ) {

        return "";

    }


    return String(texto)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/*
 * ============================================================
 * ID
 * ============================================================
 */

export function gerarId() {

    return Date.now().toString();

}


/*
 * ============================================================
 * DATA
 * ============================================================
 */

export function formatarData(timestamp) {

    if (!timestamp) {

        return "-";

    }


    const data =
        new Date(timestamp);


    return data.toLocaleDateString(
        "pt-BR"
    );

}


/*
 * ============================================================
 * TOAST
 * ============================================================
 */

export function mostrarToast(
    mensagem
) {

    const toast =
        document.getElementById("toast");


    const toastMessage =
        document.getElementById(
            "toast-message"
        );


    if (!toast || !toastMessage) {

        return;

    }


    toastMessage.textContent =
        mensagem;


    toast.classList.add("show");


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        3000
    );

}


/*
 * ============================================================
 * PREFIXO DA CATEGORIA
 * ============================================================
 *
 * Exemplo:
 *
 * Chaveiros -> CH
 * Luminárias -> LU
 * Marvel -> MA
 *
 */

export function gerarPrefixoCategoria(
    categoria
) {

    if (!categoria) {

        return "PR";

    }


    const limpa =
        categoria
            .normalize("NFD")
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .replace(
                /[^a-zA-Z]/g,
                ""
            )
            .toUpperCase();


    if (limpa.length >= 2) {

        return limpa.substring(
            0,
            2
        );

    }


    return (
        limpa + "X"
    ).substring(
        0,
        2
    );

}


/*
 * ============================================================
 * REFERÊNCIA
 * ============================================================
 */

export function gerarReferencia(
    categoria,
    produtos
) {

    const prefixo =
        gerarPrefixoCategoria(
            categoria
        );


    let maiorNumero = 0;


    produtos.forEach(
        (produto) => {

            if (
                !produto.referencia
            ) {

                return;

            }


            const referencia =
                String(
                    produto.referencia
                ).toUpperCase();


            if (
                !referencia.startsWith(
                    prefixo
                )
            ) {

                return;

            }


            const parteNumerica =
                referencia.substring(2);


            const numeroAtual =
                parseInt(
                    parteNumerica,
                    10
                );


            if (
                !Number.isNaN(
                    numeroAtual
                )
            ) {

                maiorNumero =
                    Math.max(
                        maiorNumero,
                        numeroAtual
                    );

            }

        }
    );


    const proximo =
        maiorNumero + 1;


    return (
        prefixo +
        String(proximo)
            .padStart(5, "0")
    );

}


/*
 * ============================================================
 * DATA/HORA ATUAL
 * ============================================================
 */

export function agora() {

    return Date.now();

}