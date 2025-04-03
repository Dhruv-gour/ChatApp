// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBrSm_cxwxaXcffbKwfXdfh55Lyx5GFQ38",
    authDomain: "chat-app-a7f0e.firebaseapp.com",
    databaseURL: "https://chat-app-a7f0e.firebaseio.com",
    projectId: "chat-app-a7f0e",
    storageBucket: "chat-app-a7f0e.firebasestorage.app",
    messagingSenderId: "1008310911088",
    appId: "1:1008310911088:web:38e5a015764096f90af4b5"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database(); 