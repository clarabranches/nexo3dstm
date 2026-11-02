// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB78tR4k9cvxMphp7zRxgqhyXYumHc9Ets",
  authDomain: "nexo3dstm-b42d2.firebaseapp.com",
  projectId: "nexo3dstm-b42d2",
  storageBucket: "nexo3dstm-b42d2.firebasestorage.app",
  messagingSenderId: "834864378318",
  appId: "1:834864378318:web:e854b68c6be1d146ddbb9f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


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
