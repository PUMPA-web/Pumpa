import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Button, Input, Card, CardContent } from "../components/ui";
import { auth, db } from "../firebase/config";
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from "firebase/firestore";
import { signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";

export default function PumpaApp() {
  const [user, setUser] = useState(null);
  const [pumps, setPumps] = useState([]);
  const [newPump, setNewPump] = useState({ title: "", description: "", category: "", location: [41.9981, 21.4254], expiration: 24 });
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function fetchPumps() {
      const q = query(collection(db, "pumps"), where("expiration", ">", new Date().getTime()));
      const querySnapshot = await getDocs(q);
      setPumps(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    }
    fetchPumps();
  }, []);

  const handleCreatePump = async () => {
    if (!newPump.title) return;
    const docRef = await addDoc(collection(db, "pumps"), { ...newPump, expiration: new Date().getTime() + newPump.expiration * 3600000, likes: 0, comments: [] });
    setPumps([...pumps, { id: docRef.id, ...newPump, likes: 0, comments: [] }]);
  };

  const handleLikePump = async (pumpId) => {
    const pumpRef = doc(db, "pumps", pumpId);
    const pump = pumps.find(p => p.id === pumpId);
    if (!pump) return;
    await updateDoc(pumpRef, { likes: (pump.likes || 0) + 1 });
    setPumps(pumps.map(p => p.id === pumpId ? { ...p, likes: (pump.likes || 0) + 1 } : p));
  };

  const handleCommentPump = async (pumpId, comment) => {
    if (!comment.trim()) return;
    const pumpRef = doc(db, "pumps", pumpId);
    const pump = pumps.find(p => p.id === pumpId);
    if (!pump) return;
    await updateDoc(pumpRef, { comments: [...(pump.comments || []), comment] });
    setPumps(pumps.map(p => p.id === pumpId ? { ...p, comments: [...(pump.comments || []), comment] } : p));
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    setUser(result.user);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Пумпа - Локална Бизнис Платформа</h1>
      {user ? (
        <Button onClick={handleLogout}>Одјави се</Button>
      ) : (
        <Button onClick={handleLogin}>Најави се со Google</Button>
      )}
      <MapContainer center={[41.9981, 21.4254]} zoom={13} className="h-80 w-full">
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {pumps.map((pump) => (
          <Marker key={pump.id} position={pump.location}>
            <Popup>
              <strong>{pump.title}</strong>
              <p>{pump.description}</p>
              <p>Категорија: {pump.category}</p>
              <p>Истекува за: {Math.round((pump.expiration - new Date().getTime()) / 3600000)} часа</p>
              <Button onClick={() => handleLikePump(pump.id)}>Лајк ({pump.likes || 0})</Button>
              <Input placeholder="Коментирај..." onKeyDown={(e) => { if (e.key === 'Enter') handleCommentPump(pump.id, e.target.value); }} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <Card className="mt-4 p-4">
        <CardContent>
          <Input placeholder="Наслов на пумпата" value={newPump.title} onChange={(e) => setNewPump({ ...newPump, title: e.target.value })} />
          <Input placeholder="Опис" value={newPump.description} onChange={(e) => setNewPump({ ...newPump, description: e.target.value })} />
          <Input placeholder="Категорија (Итно, Соработка, Понуда)" value={newPump.category} onChange={(e) => setNewPump({ ...newPump, category: e.target.value })} />
          <Input type="number" placeholder="Времетраење (часови)" value={newPump.expiration} onChange={(e) => setNewPump({ ...newPump, expiration: Number(e.target.value) })} />
          <Button className="mt-2" onClick={handleCreatePump}>Објави Пумпа</Button>
        </CardContent>
      </Card>
      <div className="mt-4">
        <h2 className="text-xl font-bold">Додадени функционалности:</h2>
        <ul>
          <li>🚀 Гео-локациски „Пумпа“ радар</li>
          <li>📊 Аналитика за „пумпи“</li>
          <li>⭐ Систем за репутација</li>
          <li>🎉 „Пумпа“ настани</li>
          <li>🔗 Интеграција со локални сервиси</li>
        </ul>
      </div>
    </div>
  );
}
// Firebase + React проект за корисникот

import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { useState } from "react";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function Home() {
  const [text, setText] = useState("");

  const addData = async () => {
    try {
      await addDoc(collection(db, "pumps"), { text });
      alert("Data added successfully!");
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  return (
    <div>
      <h1>React + Firebase App</h1>
      <input
        type="text"
        placeholder="Enter text"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button onClick={addData}>Add to Firestore</button>
    </div>
  );
}
