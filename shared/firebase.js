const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDoc, updateDoc, deleteDoc, getDocs, addDoc, query, where, orderBy, limit, arrayUnion, arrayRemove, increment } = require('firebase/firestore');

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

module.exports = {
    db,
    collection,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    arrayUnion,
    arrayRemove,
    increment
};
