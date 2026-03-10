// Use Firebase from CDN (window.firebase)
const firebaseConfig = {
    apiKey: "AIzaSyCGhsF-nlCsK2FFtcxccUdlezUSOxBVnxU",
    authDomain: "umbralbot-734bd.firebaseapp.com",
    projectId: "umbralbot-734bd",
    storageBucket: "umbralbot-734bd.firebasestorage.app",
    messagingSenderId: "303425465602",
    appId: "1:303425465602:web:d4bbdd818e14e60c87661b",
    measurementId: "G-KSNV16NTFR"
};

// Initialize Firebase from CDN
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

export { db, firebase };
