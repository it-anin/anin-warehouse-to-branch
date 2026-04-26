import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// กรอก config จาก Firebase Console → Project Settings → Your apps → Web app
const firebaseConfig = {
  apiKey:            "AIzaSyDCr_uwjiwfYtFEnLONAwts5m8jAFlqtZI",
  authDomain:        "warehousetobranch.firebaseapp.com",
  projectId:         "warehousetobranch",
  storageBucket:     "warehousetobranch.firebasestorage.app",
  messagingSenderId: "123700097409",
  appId:             "1:123700097409:web:5a0b63c9f06582cd803880",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
