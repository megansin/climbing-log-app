import React, { useState } from "react";

const API = "http://127.0.0.1:8000";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [session, setSession] = useState(null); // Stores { id, gymName }
  const [climbs, setClimbs] = useState([]);

  // --- 1. LOGIN ---
  async function login(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const res = await fetch(`${API}/auth/token`, { method: "POST", body: formData });
    const data = await res.json();
    if (data.access_token) {
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
    } else { alert("Login Failed"); }
  }

  // --- 2. START SESSION ---
  async function startSession(gymName) {
    const res = await fetch(`${API}/sessions/start?gym_id=${gymName}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setSession({ id: data.session_id, gymName: gymName });
  }

  // --- 3. LOG CLIMB ---
  async function logClimb(grade) {
    await fetch(`${API}/sessions/${session.id}/climb`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json", 
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ grade, hold_type: "Jug", angle: "Slab", result: "Send" })
    });
    setClimbs([grade, ...climbs]);
  }

  // --- UI LOGIC ---

  // If not logged in: Show Login Form
  if (!token) return (
    <form onSubmit={login} className="p-10 space-y-4">
      <h1 className="text-2xl font-bold">Climb Log Login</h1>
      <input name="username" placeholder="Username" className="block border p-2 w-full" />
      <input name="password" type="password" placeholder="Password" className="block border p-2 w-full" />
      <button type="submit" className="bg-blue-500 text-white p-2 w-full">Sign In</button>
    </form>
  );

  // If not in a session: Show Gym List
  if (!session) return (
    <div className="p-10 space-y-4">
      <h1 className="text-2xl font-bold">Pick a Gym</h1>
      {["The Grotto", "The Cliffs", "Central Rock"].map(gym => (
        <button key={gym} onClick={() => startSession(gym)} className="block border p-4 w-full text-left hover:bg-gray-100">
          {gym}
        </button>
      ))}
      <button onClick={() => {localStorage.clear(); setToken(null);}} className="text-red-500 underline">Logout</button>
    </div>
  );

  // If in a session: Show the Logger
  return (
    <div className="p-10 space-y-4">
      <h1 className="text-2xl font-bold">{session.gymName}</h1>
      <div className="grid grid-cols-3 gap-2">
        {["V1", "V2", "V3", "V4"].map(v => (
          <button key={v} onClick={() => logClimb(v)} className="bg-slate-800 text-white p-4 rounded">
            {v}
          </button>
        ))}
      </div>
      <div className="mt-4">
        <h2 className="font-bold border-b">Session History</h2>
        {climbs.map((c, i) => <div key={i}>{c} logged</div>)}
      </div>
      <button onClick={() => setSession(null)} className="bg-gray-200 p-2 w-full mt-4">End Session</button>
    </div>
  );
}