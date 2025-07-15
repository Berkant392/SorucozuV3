// Firebase SDK'sından gerekli fonksiyonları içe aktar
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- GÜVENLİ YAPI ---
// API anahtarları doğrudan koda yazılmaz.
// Bunun yerine, Netlify'de tanımlayacağımız ve Vite'ın 'import.meta.env'
// aracılığıyla güvenli bir şekilde okuyacağı ortam değişkenleri kullanılır.
// 'VITE_' öneki, Vite'ın bu değişkenleri istemci tarafı koduna
// güvenli bir şekilde dahil etmesi için zorunludur.

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);

// Firebase servislerini başlat ve diğer dosyalarda kullanmak üzere dışa aktar
export const auth = getAuth(app);
export const db = getFirestore(app);
