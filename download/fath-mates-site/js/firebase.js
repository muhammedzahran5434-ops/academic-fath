import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore, doc, setDoc, deleteDoc, getDocs, collection, onSnapshot, writeBatch, runTransaction } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
const cfg={apiKey:"AIzaSyBK5_divrm4f7RD64ed0hpet5W9Z8lnG5c",authDomain:"academic-fath-portal.firebaseapp.com",projectId:"academic-fath-portal",storageBucket:"academic-fath-portal.firebasestorage.app",messagingSenderId:"257445343023",appId:"1:257445343023:web:d24f122a2b21e18723fbda"};
try{
  const app=initializeApp(cfg);
  const db=getFirestore(app);
  window.FBS={db,doc,setDoc,deleteDoc,getDocs,collection,onSnapshot,writeBatch,runTransaction};
  window.dispatchEvent(new Event('fbs-ready'));
}catch(e){}
