const firebaseConfig = {
    apiKey: "AIzaSyCueN8ljuq855hxvYBgH-Odu1nc_1DBvj0",
    authDomain: "recsend-9d190.firebaseapp.com",
    projectId: "recsend-9d190",
    storageBucket: "recsend-9d190.firebasestorage.app",
    messagingSenderId: "155357247380",
    appId: "1:155357247380:web:3b5aca103e7f53a9328181",
    measurementId: "G-Q5BEN64PTX"
  };

firebase.initializeApp(firebaseConfig);

document.getElementById('googleLogin')?.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            // Redirect to dashboard
            window.location.href = 'dashboard.html';
        })
        .catch((error) => {
            console.error(error);
            document.getElementById('loginStatus').textContent = 
                `Login failed: ${error.message}`;
        });
});

firebase.auth().onAuthStateChanged((user) => {
    if (!user && !window.location.pathname.includes('index.html')) {
        window.location.href = 'index.html';
    }
});