import { useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function Stat({ title, value }) {
  return <div className="rounded-xl border border-white/10 bg-[#131b2c] p-5">
    <p className="text-sm text-slate-400">{title}</p>
    <p className="mt-2 text-3xl font-black text-violet-300">{value}</p>
  </div>;
}

export default function App() {
  const [page, setPage] = useState("home");
  const [premise, setPremise] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [game, setGame] = useState(null);
  const [result, setResult] = useState(null);
  const [hint, setHint] = useState("");
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const discoveredCount = game?.discoveredClues?.length || 0;

  function showError(err, fallback) {
    setError(err.response?.data?.message || err.message || fallback);
  }

  async function createMystery(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(`${API}/cases`, {
        premise: premise.trim(),
        difficulty
      });
      setGame(data.game);
      setHint("");
      setSelected("");
      setResult(null);
      setPage("investigation");
    } catch (err) {
      showError(err, "Unable to generate mystery. Check the server and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function discoverClue(clueId) {
    setError("");
    try {
      const { data } = await axios.post(
        `${API}/cases/${game._id}/clues/${clueId}/discover`
      );
      setGame((current) => ({
        ...current,
        discoveredClues: [...new Set([...current.discoveredClues, clueId])],
        clues: current.clues.map((clue) =>
          clue.id === clueId ? { ...clue, ...data.clue, discovered: true } : clue
        )
      }));
    } catch (err) {
      showError(err, "Unable to discover clue.");
    }
  }

  async function requestHint() {
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(`${API}/cases/${game._id}/hints`);
      setHint(data.hint);
      setGame((current) => ({
        ...current,
        hintsUsed: data.hintsUsed,
        remainingHints: data.remainingHints
      }));
    } catch (err) {
      showError(err, "Unable to get hint.");
    } finally {
      setLoading(false);
    }
  }

  async function accuseSuspect() {
    if (!selected) return setError("Please select a suspect first.");
    setLoading(true);
    setError("");
    try {
      const { data } = await axios.post(`${API}/cases/${game._id}/accuse`, {
        suspectId: selected
      });
      setResult(data.result);
      setPage("results");
    } catch (err) {
      showError(err, "Accusation failed.");
    } finally {
      setLoading(false);
    }
  }

  function resetGame() {
    setGame(null);
    setResult(null);
    setPremise("");
    setHint("");
    setSelected("");
    setError("");
    setPage("home");
  }

  return <div className="min-h-screen bg-[#090d18] text-white">
    <header className="border-b border-white/10 px-5 py-5">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <button onClick={resetGame} className="text-xl font-black">
          <span className="text-violet-400">✦</span> MYSTERY ROOM
        </button>
        <span className="text-sm text-slate-400">AI Detective Experience</span>
      </div>
    </header>

    <main className="mx-auto max-w-6xl px-5 py-12">
      {error && <div role="alert" className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
        {error}
        <button onClick={() => setError("")} className="float-right ml-4">✕</button>
      </div>}

      {page === "home" && <section className="flex min-h-[65vh] flex-col items-center justify-center text-center">
        <div className="mb-6 rounded-full border border-violet-400/30 bg-violet-500/10 px-5 py-2 text-sm text-violet-300">✦ POWERED BY GEMINI AI</div>
        <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">
          Every Mystery Has <span className="block text-violet-400">A Hidden Truth.</span>
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-400">
          Enter the world of investigation. Discover hidden clues, examine suspects,
          solve mysterious cases, and find the real culprit.
        </p>
        <button onClick={() => { setError(""); setPage("create"); }}
          className="mt-10 rounded-xl bg-violet-600 px-10 py-4 font-bold transition hover:bg-violet-500">
          Start Your Investigation →
        </button>
        <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-5 md:grid-cols-3">
          {["🔍|Discover Clues", "🕵️|Investigate Suspects", "⚖️|Solve The Mystery"].map((item) => {
            const [emoji, label] = item.split("|");
            return <div key={label} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="text-3xl">{emoji}</div><h3 className="mt-3 font-bold">{label}</h3>
            </div>;
          })}
        </div>
      </section>}

      {page === "create" && <section className="mx-auto max-w-2xl">
        <button onClick={() => setPage("home")} className="mb-8 text-slate-400">← Back</button>
        <h1 className="text-4xl font-black">Create Your Mystery</h1>
        <p className="mt-3 text-slate-400">Give Gemini AI an idea to turn into a detective case.</p>
        <form onSubmit={createMystery} className="mt-9 space-y-7">
          <div>
            <label htmlFor="premise" className="mb-3 block font-semibold">Mystery Premise</label>
            <textarea id="premise" value={premise} onChange={(e) => setPremise(e.target.value)}
              required minLength={10} maxLength={500}
              placeholder="Example: A famous diamond disappears from a locked museum at midnight. Three people had access to the room..."
              className="min-h-40 w-full rounded-xl border border-white/10 bg-[#131b2c] p-5 outline-none focus:border-violet-500" />
            <p className="mt-2 text-right text-xs text-slate-500">{premise.length}/500</p>
          </div>
          <fieldset>
            <legend className="mb-4 font-semibold">Select Difficulty</legend>
            <div className="grid grid-cols-3 gap-3">
              {[["easy", "Easy", "🟢", "3 suspects"], ["medium", "Medium", "🟡", "4 suspects"], ["hard", "Hard", "🔴", "5 suspects"]].map(([value, label, emoji, detail]) =>
                <button type="button" key={value} onClick={() => setDifficulty(value)}
                  aria-pressed={difficulty === value}
                  className={`rounded-xl border p-4 text-center ${difficulty === value ? "border-violet-500 bg-violet-500/20" : "border-white/10 bg-[#131b2c]"}`}>
                  <div>{emoji}</div><div className="mt-2 font-bold">{label}</div><div className="mt-1 text-xs text-slate-400">{detail}</div>
                </button>
              )}
            </div>
          </fieldset>
          <button disabled={loading || premise.trim().length < 10}
            className="w-full rounded-xl bg-violet-600 p-4 font-bold disabled:opacity-50">
            {loading ? "Generating Mystery..." : "✦ Generate Mystery"}
          </button>
        </form>
      </section>}

      {page === "investigation" && game && <section>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm text-violet-400">CASE INVESTIGATION</p><h1 className="mt-2 text-3xl font-black">{game.title}</h1></div>
          <span className="rounded-full bg-violet-500/20 px-4 py-2 text-sm capitalize text-violet-300">{game.difficulty} Mode</span>
        </div>
        <div className="mt-7 rounded-2xl border border-white/10 bg-[#131b2c] p-6">
          <h2 className="text-xl font-bold">📖 Case Story</h2><p className="mt-4 whitespace-pre-line leading-8 text-slate-300">{game.story}</p>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <Stat title="Suspects" value={game.suspects.length} />
          <Stat title="Clues Discovered" value={`${discoveredCount}/${game.clues.length}`} />
          <Stat title="Hints Used" value={game.hintsUsed || 0} />
        </div>

        <h2 className="mb-5 mt-12 text-2xl font-bold">🕵️ Suspects</h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {game.suspects.map((suspect) => <article key={suspect.id} className="rounded-2xl border border-white/10 bg-[#131b2c] p-6">
            <div className="text-3xl">👤</div><h3 className="mt-4 text-lg font-bold">{suspect.name}</h3>
            <p className="mt-2 text-sm text-slate-400">{suspect.occupation} · Age {suspect.age}</p>
            <p className="mt-4 text-sm leading-6 text-slate-300">{suspect.description}</p>
            <p className="mt-4 text-sm text-violet-300">Possible motive: {suspect.motive}</p>
          </article>)}
        </div>

        <h2 className="mb-5 mt-12 text-2xl font-bold">🔍 Hidden Evidence</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {game.clues.map((clue, index) => <article key={clue.id} className="rounded-xl border border-white/10 bg-[#131b2c] p-5">
            <h3 className="font-bold">Evidence {index + 1}: {clue.title}</h3>
            <p className="mt-2 text-sm text-slate-400">Location: {clue.location}</p>
            {clue.discovered
              ? <p className="mt-4 leading-7 text-green-300">{clue.description}</p>
              : <button onClick={() => discoverClue(clue.id)} className="mt-5 rounded-lg bg-violet-600 px-5 py-2 text-sm font-bold">Discover Clue +5</button>}
          </article>)}
        </div>

        <div className="mt-10 rounded-2xl border border-yellow-500/20 bg-yellow-500/5 p-6">
          <h2 className="text-xl font-bold">💡 Need a Hint?</h2>
          <p className="mt-2 text-sm text-slate-400">Each hint reduces your score by 10 points.</p>
          {hint && <p className="mt-5 rounded-xl bg-yellow-500/10 p-4 leading-7 text-yellow-200">{hint}</p>}
          <button onClick={requestHint} disabled={loading || game.remainingHints <= 0}
            className="mt-5 rounded-lg bg-yellow-500 px-6 py-3 font-bold text-black disabled:opacity-40">
            {loading ? "Loading..." : "Request Hint (-10)"}
          </button>
          <p className="mt-3 text-xs text-slate-400">{game.remainingHints} hints remaining</p>
        </div>

        <div className="mt-12 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-7 text-center">
          <h2 className="text-2xl font-black">Who Is The Culprit?</h2>
          <p className="mt-3 text-slate-400">Review your evidence and make your final accusation.</p>
          <button onClick={() => { setSelected(""); setPage("accusation"); }}
            className="mt-6 rounded-xl bg-violet-600 px-10 py-4 font-bold">Make Accusation →</button>
        </div>
      </section>}

      {page === "accusation" && game && <section className="mx-auto max-w-2xl">
        <h1 className="text-4xl font-black">Final Accusation</h1>
        <p className="mt-4 text-slate-400">Choose carefully. You cannot change your accusation afterward.</p>
        <div className="mt-8 space-y-4">
          {game.suspects.map((suspect) => <button key={suspect.id} onClick={() => setSelected(suspect.id)}
            aria-pressed={selected === suspect.id}
            className={`w-full rounded-xl border p-5 text-left ${selected === suspect.id ? "border-violet-500 bg-violet-500/20" : "border-white/10 bg-[#131b2c]"}`}>
            <span className="font-bold">{suspect.name}</span><span className="mt-1 block text-sm text-slate-400">{suspect.occupation}</span>
            {selected === suspect.id && <span className="mt-2 block text-sm text-violet-300">✓ Selected</span>}
          </button>)}
        </div>
        <button onClick={accuseSuspect} disabled={loading || !selected}
          className="mt-8 w-full rounded-xl bg-red-600 p-4 font-bold disabled:opacity-50">
          {loading ? "Submitting..." : "⚖️ Submit Final Accusation"}
        </button>
        <button onClick={() => setPage("investigation")} className="mt-5 w-full text-slate-400">← Return to Investigation</button>
      </section>}

      {page === "results" && result && <section className="mx-auto max-w-3xl text-center">
        <div className="text-6xl">{result.correct ? "🏆" : "🔎"}</div>
        <h1 className="mt-5 text-4xl font-black">{result.correct ? "Case Solved!" : "Wrong Accusation!"}</h1>
        <p className="mt-4 text-slate-400">{result.correct ? "Excellent detective work. You identified the culprit." : "The evidence reveals that you accused the wrong person."}</p>
        <div className="mt-10 rounded-2xl border border-violet-500/30 bg-violet-500/10 p-9">
          <p className="text-sm uppercase tracking-widest text-violet-300">Your Final Score</p>
          <div className="mt-4 text-7xl font-black">{result.score}</div><p className="mt-3 text-slate-400">Points</p>
        </div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-[#131b2c] p-7 text-left">
          <h2 className="text-xl font-bold">🕵️ The Real Culprit</h2>
          <h3 className="mt-4 text-2xl font-black text-violet-300">{result.culprit.name}</h3>
          <p className="mt-2 text-slate-400">{result.culprit.occupation}</p>
          <h3 className="mt-8 font-bold">Case Explanation</h3>
          <p className="mt-3 leading-8 text-slate-300">{result.explanation}</p>
          <div className="mt-8 space-y-2 border-t border-white/10 pt-5 text-sm">
            <p>Base score: {result.baseScore}</p>
            <p>Clue bonus: +{result.clueBonus}</p>
            <p>Hint penalty: -{result.hintPenalty}</p>
            <p className="mt-3 font-bold text-green-300">Final score: {result.score}</p>
          </div>
        </div>
        <button onClick={resetGame} className="mt-9 rounded-xl bg-violet-600 px-12 py-4 font-bold">Play Another Mystery →</button>
      </section>}
    </main>

    <footer className="border-t border-white/10 py-7 text-center text-sm text-slate-500">
      AI Mystery Room · Powered by Gemini AI
    </footer>
  </div>;
}
