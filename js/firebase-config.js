/*
 * ============================================================
 * NEXO 3D
 * CONFIGURAÇÃO DO FIREBASE
 * ============================================================
 *
 * IMPORTANTE:
 *
 * Substitua os valores abaixo pelos dados fornecidos
 * pelo Firebase Console.
 *
 * NÃO coloque neste arquivo:
 *
 * - senha de usuário
 * - chave privada
 * - serviceAccountKey.json
 * - tokens administrativos
 *
 * A configuração Web do Firebase pode ficar no código
 * do navegador. A proteção dos dados deve ser feita
 * através das Security Rules.
 *
 * ============================================================
 */


import {
    initializeApp
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";


import {
    getAuth
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";


import {
    getDatabase
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js";


/*
 * ============================================================
 * CONFIGURAÇÃO
 * ============================================================
 */

const firebaseConfig = {

    apiKey: "COLOQUE_SUA_API_KEY_AQUI",

    authDomain:
        "SEU-PROJETO.firebaseapp.com",

    databaseURL:
        "https://SEU-PROJETO-default-rtdb.firebaseio.com",

    projectId:
        "SEU-PROJETO",

    storageBucket:
        "SEU-PROJETO.firebasestorage.app",

    messagingSenderId:
        "SEU_MESSAGING_SENDER_ID",

    appId:
        "SEU_APP_ID"

};


/*
 * ============================================================
 * INICIALIZAÇÃO
 * ============================================================
 */

const app =
    initializeApp(firebaseConfig);


const auth =
    getAuth(app);


const database =
    getDatabase(app);


/*
 * Exportamos os serviços para os outros arquivos.
 */

export {
    app,
    auth,
    database
};