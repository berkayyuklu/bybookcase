import { auth, db, provider, signInWithPopup, collection, addDoc, getDocs } from './firebase-config.js';

const loginBtn = document.getElementById('loginBtn');
const saveBtn = document.getElementById('saveBtn');
const themeToggle = document.getElementById('themeToggle');

// Tema Değiştirme
themeToggle.onclick = () => {
    document.body.classList.toggle('dark');
    document.body.classList.toggle('light');
};

// Google Login
loginBtn.onclick = async () => {
    try {
        await signInWithPopup(auth, provider);
        alert("Giriş Yapıldı!");
        loadBooks();
    } catch (error) {
        console.error(error);
    }
};

// Kitap Kaydetme
saveBtn.onclick = async () => {
    const book = {
        title: document.getElementById('bookTitle').value,
        author: document.getElementById('bookAuthor').value,
        notes: document.getElementById('bookNotes').value,
        rating: document.getElementById('bookRating').value,
        userId: auth.currentUser?.uid
    };

    if(book.userId) {
        await addDoc(collection(db, "books"), book);
        alert("Kitap eklendi!");
        loadBooks();
    } else {
        alert("Önce giriş yapmalısın.");
    }
};

// Kitapları Listeleme
async function loadBooks() {
    const querySnapshot = await getDocs(collection(db, "books"));
    const list = document.getElementById('bookList');
    list.innerHTML = '';
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        list.innerHTML += `
            <div class="border border-custom p-4 hover:invert transition-all">
                <h3 class="font-bold uppercase">${data.title}</h3>
                <p class="text-sm italic">${data.author}</p>
                <p class="my-2 text-sm">${data.notes}</p>
                <div class="text-xs font-mono mt-2">PUAN: ${data.rating}/5</div>
            </div>
        `;
    });
}
