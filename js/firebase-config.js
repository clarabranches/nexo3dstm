import { initializeApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB78tR4k9cvxMphp7zRxgqhyXYumHc9Ets",
  authDomain: "nexo3dstm-b42d2.firebaseapp.com",
  databaseURL: "https://nexo3dstm-b42d2-default-rtdb.firebaseio.com",
  projectId: "nexo3dstm-b42d2",
  storageBucket: "nexo3dstm-b42d2.firebasestorage.app",
  messagingSenderId: "834864378318",
  appId: "1:834864378318:web:e854b68c6be1d146ddbb9f"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { app, auth, database };
