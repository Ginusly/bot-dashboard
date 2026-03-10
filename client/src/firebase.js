import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, onSnapshot, getDoc, query, orderBy, limit } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCGhsF-nlCsK2FFtcxccUdlezUSOxBVnxU",
    authDomain: "umbralbot-734bd.firebaseapp.com",
    projectId: "umbralbot-734bd",
    storageBucket: "umbralbot-734bd.firebasestorage.app",
    messagingSenderId: "303425465602",
    appId: "1:303425465602:web:d4bbdd818e14e60c87661b",
    measurementId: "G-KSNV16NTFR"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, doc, onSnapshot, getDoc, query, orderBy, limit };
