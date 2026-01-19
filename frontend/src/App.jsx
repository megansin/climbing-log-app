import React, { useState, useEffect } from "react";

const API = "http://127.0.0.1:8000";

// --- DATA HELPERS ---
const calculateHoldStats = (sessions) => {
  const stats = {};
  sessions.forEach(s => {
    s.climbs?.forEach(c => {
      if (!stats[c.hold_type]) stats[c.hold_type] = { sends: 0, total: 0 };
      stats[c.hold_type].total += 1;
      if (c.result === "Send" || c.result === "Flash") stats[c.hold_type].sends += 1;
    });
  });
  return Object.keys(stats).map(hold => ({
    name: hold,
    percentage: Math.round((stats[hold].sends / stats[hold].total) * 100),
    count: stats[hold].total
  })).sort((a, b) => b.percentage - a.percentage);
};

export default function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [session, setSession] = useState(null); 
  const [climbs, setClimbs] = useState([]);
  const [gyms, setGyms] = useState([]);
  const [view, setView] = useState("logger");
  const [allSessions, setAllSessions] = useState([]);
  const [newClimb, setNewClimb] = useState({
    grade: "V0",
    result: "Flash",
    hold_type: "Jug",
    angle: "Overhang",
    attempts: 1,
    style: "Technical"
  });
  const [showEndModal, setShowEndModal] = useState(false);
  const [fatigue, setFatigue] = useState(1);

  useEffect(() => {
    if (token) {
      async function fetchGyms() {
        try {
          const res = await fetch(`${API}/gyms/`);
          const data = await res.json();
          setGyms(data);
        } catch (err) { console.error("Failed to load gyms:", err); }
      }
      fetchGyms();
    }
  }, [token]);

  // --- ACTIONS ---
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
    if (res.ok && data.access_token) {
      localStorage.setItem("token", data.access_token);
      setToken(data.access_token);
    } else { alert("Error: " + (data.detail || "Login failed")); }
  }

  async function startSession(gymId, gymName) {
    try {
      const res = await fetch(`${API}/sessions/start?gym_id=${gymId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSession({ id: data.session_id, gymName: gymName });
        setClimbs([]); // Reset session history for the new session
      }
    } catch (err) { alert("Could not start session."); }
  }

  async function logClimb() {
    try {
      const res = await fetch(`${API}/sessions/${session.id}/climb`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(newClimb)
      });
      if (res.ok) {
        setClimbs([newClimb, ...climbs]);
        setNewClimb({ ...newClimb, attempts: 1 }); 
      }
    } catch (err) { console.error("Error logging climb:", err); }
  }

  async function fetchHistory() {
    try {
      const res = await fetch(`${API}/sessions/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setAllSessions(data);
      setView("history");
    } catch (err) { console.error("Could not load history", err); }
  }

  async function endSession() {
  try {
    const res = await fetch(`${API}/sessions/${session.id}/end?fatigue=${fatigue}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      setSession(null);
      setShowEndModal(false);
      setClimbs([]);
      // Optional: Refresh history so the new session shows up there immediately
      fetchHistory(); 
    }
  } catch (err) {
    console.error("Failed to end session:", err);
  }
}

async function cancelSession() {
  if (!session) return;
  
  try {
    const res = await fetch(`${API}/sessions/${session.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    if (res.ok) {
      setSession(null);
      setClimbs([]);
    }
  } catch (err) {
    // If delete fails, at least reset the UI
    setSession(null);
  }
}

  // --- UI SCREENS ---

  if (!token) return (
    <form onSubmit={login} className="p-10 max-w-md mx-auto space-y-4">
      <h1 className="text-3xl font-black text-blue-600 mb-8">Climb Log</h1>
      <input name="username" placeholder="Username" className="block border p-3 w-full rounded-xl" />
      <input name="password" type="password" placeholder="Password" className="block border p-3 w-full rounded-xl" />
      <button type="submit" className="bg-blue-600 text-white p-3 w-full rounded-xl font-bold shadow-lg shadow-blue-100">Sign In</button>
    </form>
  );

  if (!session && view === "logger") return (
    <div className="p-10 space-y-8 max-w-2xl mx-auto bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-black text-slate-900">Gyms</h1>
        <div className="space-x-4">
          <button onClick={fetchHistory} className="text-sm font-bold text-blue-600 bg-blue-50 px-4 py-2 rounded-xl">📊 History</button>
          <button onClick={() => {localStorage.clear(); setToken(null);}} className="text-sm font-bold text-slate-400">Logout</button>
        </div>
      </div>

      <div className="grid gap-4">
        {gyms.map((gym, index) => (
          <button key={index} onClick={() => startSession(gym.location, gym.name)} 
            className="block bg-white border border-slate-200 p-6 w-full text-left rounded-3xl shadow-sm hover:shadow-md hover:border-blue-300 transition-all">
            <div className="font-bold text-xl text-slate-900">{gym.name || "Unnamed Gym"}</div>
            <div className="text-slate-400 text-sm mt-1">📍 {gym.location}</div>
          </button>
        ))}
      </div>
    </div>
  );

  if (view === "history") {
    const holdStats = calculateHoldStats(allSessions);
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-6 bg-slate-50 min-h-screen">
        <div className="flex justify-between items-center">
          <button onClick={() => setView("logger")} className="text-blue-500 font-bold">← Back</button>
          <h2 className="text-2xl font-black uppercase tracking-tight">Analytics</h2>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hold Proficiency</h3>
          {holdStats.map(stat => (
            <div key={stat.name} className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-600">{stat.name}</span>
                <span className="text-blue-600">{stat.percentage}%</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-full transition-all" style={{ width: `${stat.percentage}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Recent Sessions</h3>
          {allSessions.map((s, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex justify-between font-bold text-slate-900">
                <span>{s.gymName || s.gym_id}</span>
                <span className="text-slate-400 text-xs">{new Date(s.start_time).toLocaleDateString()}</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {s.climbs?.map((c, ci) => (
                  <span key={ci} className="bg-blue-50 text-blue-600 text-[10px] px-2 py-1 rounded font-black">{c.grade}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- LOGGER VIEW ---
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 bg-slate-50 min-h-screen">
      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-8">

          <div className="flex items-center gap-3">
            {/* New Back Button */}
            <button 
              onClick={cancelSession} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"> ←
            </button>
            <h2 className="text-2xl font-black text-slate-900">{session.gymName}</h2>
          </div>
          
          <button 
            onClick={() => setShowEndModal(true)} 
            className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-bold uppercase"
          >
            End Session
          </button>

          {/* <h2 className="text-2xl font-black text-slate-900">{session.gymName}</h2>
          <button onClick={() => setShowEndModal(true)} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-bold uppercase">
            End Session
          </button> */}
        </div>

        
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Grade</label>
              <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none text-slate-700 font-bold"
                value={newClimb.grade} onChange={(e) => setNewClimb({...newClimb, grade: e.target.value})}>
                {["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10"].map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Result</label>
              <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none text-slate-700 font-bold"
                value={newClimb.result} onChange={(e) => setNewClimb({...newClimb, result: e.target.value, attempts: e.target.value === "Flash" ? 1 : newClimb.attempts})}>
                <option>Flash</option><option>Send</option><option>Attempt</option><option>Fail</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Hold Type</label>
              <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none text-slate-700 font-bold"
                value={newClimb.hold_type} onChange={(e) => setNewClimb({...newClimb, hold_type: e.target.value})}>
                <option>Jug</option><option>Crimp</option><option>Sloper</option><option>Pinch</option><option>Pocket</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Angle</label>
              <select className="w-full bg-slate-50 border border-slate-200 p-4 rounded-2xl outline-none text-slate-700 font-bold"
                value={newClimb.angle} onChange={(e) => setNewClimb({...newClimb, angle: e.target.value})}>
                <option>Slab</option><option>Vertical</option><option>Overhang</option><option>Roof</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Attempts</label>
            <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-2 rounded-2xl">
              <button onClick={() => setNewClimb({...newClimb, attempts: Math.max(1, newClimb.attempts - 1)})} className="w-12 h-12 bg-white rounded-xl shadow-sm font-bold text-slate-600">-</button>
              <span className="flex-1 text-center font-black text-lg text-slate-700">{newClimb.attempts}</span>
              <button onClick={() => setNewClimb({...newClimb, attempts: newClimb.attempts + 1})} className="w-12 h-12 bg-white rounded-xl shadow-sm font-bold text-slate-600">+</button>
            </div>
          </div>

          <button onClick={logClimb} className="w-full bg-blue-600 text-white font-black py-5 rounded-3xl shadow-lg shadow-blue-200 uppercase tracking-widest hover:bg-blue-700 transition-all">Save Climb</button>
        </div>
      </div>

      <div className="space-y-3 pb-10">
        <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-widest px-4">This Session</h3>
        {climbs.map((c, i) => (
          <div key={i} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-blue-50 text-blue-600 w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg">{c.grade}</div>
              <div>
                <span className="text-slate-900 font-bold block">{c.result}</span>
                <span className="text-[10px] text-slate-400 uppercase font-black">{c.angle} • {c.hold_type}</span>
              </div>
            </div>
            <div className="text-right px-2">
              <span className="text-[10px] font-black text-slate-300 uppercase block">Tries</span>
              <span className="font-bold text-slate-700">{c.attempts}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Fatigue Modal */}
      {showEndModal && (
        <div className="fixed inset-0 bg-slate-900/pb-80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-slate-900 mb-2">Session Over?</h3>
            <p className="text-slate-500 text-sm mb-6">How trashed are your arms right now?</p>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setFatigue(num)}
                    className={`w-10 h-10 rounded-xl font-bold transition-all ${
                      fatigue === num 
                      ? 'bg-blue-600 text-white scale-110 shadow-lg' 
                      : 'bg-white text-slate-400 border border-slate-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase px-2">
                <span>Fresh</span>
                <span>Wrecked</span>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowEndModal(false)}
                  className="flex-1 py-4 text-slate-400 font-bold"
                >
                  Cancel
                </button>
                <button 
                  onClick={endSession}
                  className="flex-[2] bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg"
                >
                  Finish & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    
  );
}