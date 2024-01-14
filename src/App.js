// App.js

import './App.css';
import React, { useState, useEffect } from 'react';
import {
  initializeApp,
  getApps,
  getApp,
} from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  getDoc,
  updateDoc,
  getDocs,
  setDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from 'firebase/storage';

// Your existing Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDqAi2THEvSZOgHnPHWguxlGiiXCw_bb5g",
  authDomain: "home-61587.firebaseapp.com",
  projectId: "home-61587",
  storageBucket: "home-61587.appspot.com",
  messagingSenderId: "758458323128",
  appId: "1:758458323128:web:dceed4d47ef69030eba44d",
  measurementId: "G-Y92RGXHZH3"
};

// Check if Firebase app is already initialized
const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);
const firestore = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

const activities = [
  'Varrer Casa',
  'Lavar Pratos',
  'Secar Roupas',
  'Arrumar a Cama',
  'Lavar a Casa de Banho',
  'Cortar a Grama',
  'notamaiorque9', // New task
  'Guardar Roupas', // New task
];

const App = () => {
  const [user, setUser] = useState(null);
  const [totalEuros, setTotalEuros] = useState(0);
  const [allUsersData, setAllUsersData] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [comments, setComments] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);

  const loadRanking = async () => {
    try {
      const snapshot = await getDocs(collection(firestore, 'users'));
      const users = snapshot.docs.map((doc) => ({ email: doc.id, ...doc.data() }));

      // Sort users by points
      users.sort((a, b) => b.points - a.points);

      // Set the state with all user data
      setAllUsersData(users);
    } catch (error) {
      console.error('Error loading ranking:', error);
    }
  };

  const loadTasks = async () => {
    try {
      const taskSnapshot = await getDocs(collection(firestore, 'tasks'));
      const tasks = taskSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      // Implement the logic to update the state or perform other actions with tasks
      console.log('Tasks:', tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadUserImages = async () => {
    try {
      if (!user) {
        console.log('User not logged in');
        return;
      }

      const userImagesSnapshot = await getDocs(collection(firestore, 'images'));
      const userImages = userImagesSnapshot.docs
        .filter((doc) => doc.data().userEmail === user.email)
        .map((doc) => ({ id: doc.id, ...doc.data() }));

      setUploadedImages(userImages);
    } catch (error) {
      console.error('Error loading user images:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      // After signing in or out, load the ranking and images immediately
      if (user) {
        loadRanking();
        loadTasks(); // Load tasks after signing in
        loadUserImages();
      }
    });

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const signIn = async () => {
    try {
      await signInWithEmailAndPassword(auth, emailInput, passwordInput);
      // Load tasks and images after signing in
      loadTasks();
      loadUserImages();
    } catch (error) {
      console.error('Error signing in:', error);
    }
  };

  const signOutHandler = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleActivity = async (activity) => {
    if (!user) {
      console.log('User not logged in');
      return;
    }

    try {
      if (activity === 'notamaiorque9') {
        await handleNotamaiorque9();
      } else if (activity === 'Guardar Roupas') {
        await handleGuardarRoupas();
      } else {
        // Handle other activities as before
        const userDocRef = doc(collection(firestore, 'users'), user.email);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          // User exists, update points in Firestore
          const newPoints = userDoc.data().points + 1;
          await updateDoc(userDocRef, { points: newPoints });

          // Update state
          setTotalEuros((prevTotalEuros) => prevTotalEuros + 0.3);
          console.log(`${user.email} added 1 point for ${activity}.`);
        } else {
          // If the user is not found, create a new document for the user
          await setDoc(userDocRef, { points: 1 });
        }

        // Reload the ranking after handling the activity
        loadRanking();
      }
    } catch (error) {
      console.error('Error handling activity:', error);
    }
  };

  const handleNotamaiorque9 = async () => {
    if (!user) {
      console.log('User not logged in');
      return;
    }

    try {
      const userDocRef = doc(collection(firestore, 'users'), user.email);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // User exists, update points in Firestore
        const newPoints = userDoc.data().points + 3; // 3 points for "notamaiorque9"
        await updateDoc(userDocRef, { points: newPoints });

        // Update state
        setTotalEuros((prevTotalEuros) => prevTotalEuros + 1); // 1 euro per "notamaiorque9" point
        console.log(`${user.email} added 3 points for notamaiorque9.`);
      } else {
        // If the user is not found, create a new document
        // If the user is not found, create a new document for the user
        await setDoc(userDocRef, { points: 3 }); // Initial 3 points for "notamaiorque9"
      }

      // Reload the ranking after handling the task
      loadRanking();
    } catch (error) {
      console.error('Error handling task:', error);
    }
  };

  const handleGuardarRoupas = async () => {
    if (!user) {
      console.log('User not logged in');
      return;
    }

    try {
      const userDocRef = doc(collection(firestore, 'users'), user.email);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // User exists, update points in Firestore
        const newPoints = userDoc.data().points + 1; // 1 point for "guardar roupas"
        await updateDoc(userDocRef, { points: newPoints });

        // Update state
        setTotalEuros((prevTotalEuros) => prevTotalEuros + 0.3); // 0.30 euros per "guardar roupas" point
        console.log(`${user.email} added 1 point for guardar roupas.`);
      } else {
        // If the user is not found, create a new document for the user
        await setDoc(userDocRef, { points: 1 }); // Initial 1 point for "guardar roupas"
      }

      // Reload the ranking after handling the task
      loadRanking();
    } catch (error) {
      console.error('Error handling task:', error);
    }
  };

  const handleImageUpload = async () => {
    if (!user || !imageFile) {
      console.log('Invalid upload');
      return;
    }
    try {
      // Create a new document in 'images' collection (modify it based on your structure)
      const newImageRef = await addDoc(collection(firestore, 'images'), {
        userEmail: user.email,
        timestamp: serverTimestamp(),
        comments,
      });

      // Get the newly created image ID
      const imageId = newImageRef.id;

      // Upload the image to storage
      const storageRef = ref(storage, `images/${imageId}`);
      await uploadBytes(storageRef, imageFile);

      // Clear comments and imageFile
      setComments('');
      setImageFile(null);

      // Reload the user's images after uploading
      loadUserImages();
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const handleImageChange = (e) => {
    // Update the state with the selected image file
    setImageFile(e.target.files[0]);
  };

  return (
    <div className="app">
      <center><h1>Joguinho das atividades de casa</h1></center>
  
      {/* Render total euros for logged-in user */}
      {user && (
        <div>
          <h2>Total em Euros: € {totalEuros.toFixed(2)}</h2>
        </div>
      )}
  
      {/* Render login form for non-logged-in users */}
      {!user && (
        <div>
          <p>Parabéns por ter ajudado! Faça o login para marcar seus pontos:</p>
          <div className="login-form">
            <input
              type="text"
              placeholder="Email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
            />
            <button onClick={signIn}>Log In</button>
          </div>
        </div>
      )}
  
      {/* Render activities for logged-in users */}
      {user && (
        <div>
          <center><h2>Atividades</h2></center>
          <div className="activities-container">
            {activities.map((activity) => (
              <button key={activity} onClick={() => handleActivity(activity)}>
                {activity}
              </button>
            ))}
          </div>
          <button onClick={signOutHandler}>Sair</button>
        </div>
      )}
  
      {/* Render image upload and uploaded images for logged-in users */}
      {user && (
        <div>
          <div>
            <textarea
              placeholder="Leave comments..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            ></textarea>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
            />
            <button onClick={handleImageUpload}>Upload Image</button>
          </div>
  
          <h2>Uploaded Images</h2>
          <div className="image-container">
            {uploadedImages.map((imageData) => (
              <div key={imageData.id}>
                <img
                  src={imageData.imageUrl}
                  alt={`Uploaded by ${imageData.userEmail}`}
                  style={{ maxWidth: '100%', maxHeight: '200px' }}
                />
                <p>{imageData.comments}</p>
              </div>
            ))}
          </div>
  
          {/* Render task ranking */}
          <h2>Ranking</h2>
          <ul>
            {allUsersData.map((userData, index) => (
              <li key={userData.email}>
                {index + 1}. {userData.email}: {userData.points} points
              </li>
            ))}
          </ul>
        </div>
      )}
  
      {/* Render footer */}
      <footer style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: '#f8f8f8', padding: '10px', textAlign: 'center' }}>
        &copy; 2024 Diego
      </footer>
    </div>
  );
  };
  
  export default App;
  