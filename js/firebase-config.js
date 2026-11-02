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
  apiKey: "AIzaSyB78tR4k9cvxMphp7zRxgqhyXYumHc9Ets",
  authDomain: "nexo3dstm-b42d2.firebaseapp.com",
  databaseURL: "https://nexo3dstm-b42d2-default-rtdb.firebaseio.com",
  projectId: "nexo3dstm-b42d2",
  storageBucket: "nexo3dstm-b42d2.firebasestorage.app",
  messagingSenderId: "834864378318",
  appId: "1:834864378318:web:e854b68c6be1d146ddbb9f"

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
