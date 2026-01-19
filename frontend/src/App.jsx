import React, { useState , useEffect} from "react";

const API = "http://127.0.0.1:8000";

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [session, setSession] = useState(null); // Stores { id, gymName }
  const [climbs, setClimbs] = useState([]);
  const [gyms, setGyms] = useState([]);
  // placeholder
  const [newClimb, setNewClimb] = useState({
    grade: "V0",
    result: "Flash",
    hold_type: "Jug",
    angle: "Slab",
    attempts: 1,
    style: "Technical"
  });


  useEffect(() => {
    async function fetchGyms() {
      try {
        const res = await fetch(`${API}/gyms/`);
        const data = await res.json();
        setGyms(data); // <--- This saves the data so you can use it below
      } catch (err) {
        console.error("Failed to load gyms:", err);
      }
    }
    fetchGyms();
  }, []);

  // --- 1. LOGIN ---
  async function login(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const loginData = Object.fromEntries(formData);

    const res = await fetch(`${API}/auth/login`, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loginData) 
    });

    const data = await res.json();

    if (res.ok) {
      // Check if the token exists in the data object
      if (data.access_token) {
        localStorage.setItem("token", data.access_token);
        setToken(data.access_token);
        console.log("Success! Token received.");
      }
    } else {
      // If the backend returns an error (like 400 Bad Request), 
      // FastAPI sends it in a 'detail' field.
      alert("Error: " + (data.detail || "Unknown error"));
      console.log("Full error data:", data); 
    }
  }

  // --- 2. START SESSION ---
  async function startSession(gymId, gymName) {
    try {
      const res = await fetch(`${API}/sessions/start?gym_id=${gymId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setSession({ id: data.session_id, gymName: gymName });
      }
    } catch (err) {
      alert("Could not start session.");
    }
  }

  // --- 3. LOG CLIMB  ---
    async function logClimb() {
      try {
        const res = await fetch(`${API}/sessions/${session.id}/climb`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json", 
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify(newClimb)
        });

        if (res.ok) {
          setClimbs([newClimb, ...climbs]);
          setNewClimb({ ...newClimb, attempts: 1 }); 
        }
      } catch (err) {
        console.error("Error logging climb:", err);
      }
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

  // If not in a session: Show Gym List from Backend
  if (!session) return (
    <div className="p-10 space-y-4 max-w-2xl mx-auto">
      <div className="flex justify-between items-end mb-6">
        <h1 className="text-3xl font-black text-blue-500">Pick a Gym</h1>
        <button 
          onClick={() => {localStorage.clear(); setToken(null);}} 
          className="text-slate-500 hover:text-red-500 text-sm underline pb-1"
        >
          Logout
        </button>
      </div>

      <div className="grid gap-3">
        {gyms.length > 0 ? (
          gyms.map((gym, index) => (
            <button 
              key={index} 
              // We pass gym.location to the backend, but show gym.name to the user
              onClick={() => startSession(gym.location, gym.name)} 
              className="block border border-slate-700 bg-white-800 p-5 w-full text-left rounded-2xl hover:border-blue-500 hover:bg-slate-750 transition-all group"
            >
              <div className="font-bold text-xl group-hover:text-blue-400">
                {gym.name || "Unnamed Gym"}
              </div>
              <div className="text-slate-400 text-sm flex items-center gap-1 mt-1">
                <span>📍</span> {gym.location}
              </div>
            </button>
          ))
        ) : (
          <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-2xl text-slate-600">
            No gyms found. Make sure your backend is running!
          </div>
        )}
      </div>
    </div>
  );

  // If in a session: Show the Logger
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 bg-slate-50 min-h-screen">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">{session.gymName}</h2>
            <button onClick={() => setSession(null)} className="text-slate-400 text-sm hover:text-red-500">End</button>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Grade</label>
              <select 
                className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none text-slate-700 font-bold"
                value={newClimb.grade}
                onChange={(e) => setNewClimb({...newClimb, grade: e.target.value})}
              >
                {["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10", "V11", "V12", "V13+"].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            </div>

            {/* Result & Angle */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Result</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none text-slate-700 font-medium"
                  // value={newClimb.result}
                  // onChange={(e) => setNewClimb({...newClimb, result: e.target.value}    
                  // )}
                  value={newClimb.result}
                  onChange={(e) => {
                  const result = e.target.value;
                  setNewClimb((prev) => ({
                    ...prev,
                    result,
                    attempts: result === "Flash" ? 1 : prev.attempts,
                  }));
                  }}
                >
                  <option>Flash</option>
                  <option>Send</option>
                  <option>Attempt</option>
                  <option>Fail</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Angle</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none text-slate-700 font-medium"
                  value={newClimb.angle}
                  onChange={(e) => setNewClimb({...newClimb, angle: e.target.value})}
                >
                  <option>Slab</option>
                  <option>Vertical</option>
                  <option>Overhang</option>
                  <option>Roof</option>
                </select>
              </div>
            </div>

            {/* Holds & Style */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Hold Type</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none text-slate-700 font-medium"
                  value={newClimb.hold_type}
                  onChange={(e) => setNewClimb({...newClimb, hold_type: e.target.value})}
                >
                  <option>Jug</option>
                  <option>Crimp</option>
                  <option>Sloper</option>
                  <option>Pinch</option>
                  <option>Pocket</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Style</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl outline-none text-slate-700 font-medium"
                  value={newClimb.style}
                  onChange={(e) => setNewClimb({...newClimb, style: e.target.value})}
                >
                  <option>Technical</option>
                  <option>Powerful</option>
                  <option>Dynamic</option>
                  <option>Balance</option>
                </select>
              </div>
            </div>

            {/* Attempts */}
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Attempts</label>
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                  <button 
                    onClick={() => setNewClimb({...newClimb, attempts: Math.max(1, newClimb.attempts - 1)})}
                    className="w-10 h-10 bg-white rounded-lg shadow-sm font-bold text-slate-600"
                  >-</button>
                  <span className="flex-1 text-center font-bold text-slate-700">{newClimb.attempts}</span>
                  <button 
                    onClick={() => setNewClimb({...newClimb, attempts: newClimb.attempts + 1})}
                    className="w-10 h-10 bg-white rounded-lg shadow-sm font-bold text-slate-600"
                  >+</button>
                </div>
            </div>

            <button 
              onClick={logClimb}
              className="w-full bg-blue-600 text-white font-black py-4 rounded-2xl">
              Save Climb
            </button>
          </div>
        </div>

        <div className="space-y-3 pb-10">
          <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] px-2">Session History</h3>
          {climbs.length === 0 && <p className="text-slate-300 text-sm italic px-2">No climbs logged yet...</p>}
          {climbs.map((c, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-4">
                <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg">
                    {c.grade}
                </div>
                <div>
                  <span className="text-slate-900 font-bold block leading-tight">{c.result}</span>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tight">
                    {c.angle} • {c.hold_type} • {c.style}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-slate-300 uppercase block leading-none mb-1">Tries</span>
                <span className="font-bold text-slate-700">{c.attempts}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
  );
}