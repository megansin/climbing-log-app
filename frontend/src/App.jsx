import React, { useState } from 'react';

function App() {
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [selectedGym, setSelectedGym] = useState(null);
  const [climbs, setClimbs] = useState([]);

  // 1. START SESSION
  const handleStartSession = async (gym) => {
    // In a real app, you'd fetch the ID from your FastAPI POST /sessions/start
    // For now, let's simulate the UI transition
    setSelectedGym(gym);
    setActiveSessionId("temp-id-123"); 
    console.log(`Starting session at ${gym.name}`);
  };

  // 2. LOG A CLIMB
  const addClimb = (grade) => {
    const newClimb = { grade, time: new Date().toLocaleTimeString() };
    setClimbs([newClimb, ...climbs]);
    // Here you would call: await fetch(`http://localhost:8000/sessions/${activeSessionId}/climb`, ...)
  };

  // 3. END SESSION
  const handleEndSession = () => {
    const fatigue = prompt("Rate your fatigue (1-10):");
    console.log("Ending session with fatigue:", fatigue);
    setActiveSessionId(null);
    setClimbs([]);
    alert("Session saved to database!");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 font-sans">
      {!activeSessionId ? (
        <section>
          <h2 className="text-2xl font-bold mb-4">Select a Gym</h2>
          <div className="grid gap-4">
            {[{name: "The Cliffs", style: "Powerful"}, {name: "Central Rock", style: "Technical"}].map(gym => (
              <button 
                key={gym.name}
                onClick={() => handleStartSession(gym)}
                className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-blue-500 text-left"
              >
                <div className="font-bold">{gym.name}</div>
                <div className="text-sm text-slate-400">{gym.style} setting</div>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-blue-400">{selectedGym.name}</h2>
            <button onClick={handleEndSession} className="bg-red-500/20 text-red-400 px-4 py-2 rounded-lg border border-red-500/50">
              End Session
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {['V1', 'V2', 'V3', 'V4', 'V5', 'V6'].map(grade => (
              <button 
                key={grade} 
                onClick={() => addClimb(grade)}
                className="bg-slate-800 py-4 rounded-lg border border-slate-700 active:bg-blue-600"
              >
                {grade}
              </button>
            ))}
          </div>

          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase">Live Log</h3>
            <div className="space-y-2">
              {climbs.map((c, i) => (
                <div key={i} className="flex justify-between text-sm border-b border-slate-700 pb-1">
                  <span>{c.grade}</span>
                  <span className="text-slate-500">{c.time}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default App;