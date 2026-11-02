import {
    auth
} from "./firebase-config.js";


import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";


/*
 * ============================================================
 * ELEMENTOS
 * ============================================================
 */

const loginScreen =
    document.getElementById("login-screen");


const app =
    document.getElementById("app");


const loginForm =
    document.getElementById("login-form");


const loginMessage =
    document.getElementById("login-message");


const logoutButton =
    document.getElementById("logout-button");


const userEmail =
    document.getElementById("user-email");


/*
 * ============================================================
 * LOGIN
 * ============================================================
 */

loginForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const email =
            document
                .getElementById("login-email")
                .value
                .trim();


        const password =
            document
                .getElementById("login-password")
                .value;


        loginMessage.textContent =
            "Entrando...";


        try {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );


            loginMessage.textContent =
                "";

        } catch (error) {

            console.error(error);

            loginMessage.textContent =
                traduzirErroLogin(error);

        }

    }
);


/*
 * ============================================================
 * LOGOUT
 * ============================================================
 */

logoutButton.addEventListener(
    "click",
    async () => {

        try {

            await signOut(auth);

        } catch (error) {

            console.error(
                "Erro ao sair:",
                error
            );

        }

    }
);


/*
 * ============================================================
 * OBSERVADOR DE AUTENTICAÇÃO
 * ============================================================
 */

onAuthStateChanged(
    auth,
    (user) => {

        if (user) {

            loginScreen.classList.add(
                "hidden"
            );

            app.classList.remove(
                "hidden"
            );


            if (userEmail) {

                userEmail.textContent =
                    user.email || "Usuário";

            }

        } else {

            loginScreen.classList.remove(
                "hidden"
            );

            app.classList.add(
                "hidden"
            );

        }

    }
);


/*
 * ============================================================
 * TRADUÇÃO DOS ERROS
 * ============================================================
 */

function traduzirErroLogin(error) {

    const code =
        error?.code || "";


    switch (code) {

        case "auth/invalid-email":

            return "Digite um e-mail válido.";


        case "auth/user-not-found":

            return "Usuário não encontrado.";


        case "auth/wrong-password":

            return "Senha incorreta.";


        case "auth/invalid-credential":

            return "E-mail ou senha incorretos.";


        case "auth/too-many-requests":

            return "Muitas tentativas. Tente novamente mais tarde.";


        case "auth/network-request-failed":

            return "Verifique sua conexão com a internet.";


        default:

            return "Não foi possível realizar o login.";

    }

}