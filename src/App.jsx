import { useState, useMemo, useCallback, useRef } from "react";
import questionsData from "./questions.json";

const ITEMS_PER_PAGE = 50;

function highlight(text, query) {
  if (!query.trim()) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark>{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

export default function App() {
  const [view, setView] = useState("table");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const searchRef = useRef(null);

  const [quizIndex, setQuizIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [score, setScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);
  const [shuffled, setShuffled] = useState([]);

  const filtered = useMemo(() => {
    if (!search.trim()) return questionsData;
    const s = search.toLowerCase();
    return questionsData.filter(
      (q) =>
        q.question.toLowerCase().includes(s) ||
        q.options.some((o) => o.toLowerCase().includes(s))
    );
  }, [search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSearch = useCallback((e) => {
    setSearch(e.target.value);
    setPage(1);
    if (view !== "table") setView("table");
  }, [view]);

  function clearSearch() {
    setSearch("");
    setPage(1);
    searchRef.current?.focus();
  }

  function startQuiz() {
    const arr = [...questionsData].sort(() => Math.random() - 0.5).slice(0, 20);
    setShuffled(arr);
    setQuizIndex(0);
    setSelected(null);
    setScore(0);
    setQuizDone(false);
    setView("quiz");
  }

  function handleAnswer(option) {
    if (selected) return;
    setSelected(option);
    if (option === shuffled[quizIndex].correct) setScore((s) => s + 1);
  }

  function nextQuestion() {
    if (quizIndex + 1 >= shuffled.length) setQuizDone(true);
    else { setQuizIndex((i) => i + 1); setSelected(null); }
  }

  return (
    <div className="app">
      <header>
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">⚕</span>
            <div>
              <h1>Пропедевтика</h1>
              <p>Внутренние болезни · 3 курс</p>
            </div>
          </div>

          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              ref={searchRef}
              className="search-input"
              type="text"
              placeholder="Поиск по вопросам и ответам..."
              value={search}
              onChange={handleSearch}
              autoComplete="off"
              spellCheck={false}
            />
            {search && (
              <button className="search-clear" onClick={clearSearch} title="Очистить">✕</button>
            )}
            {search && (
              <span className="search-badge">{filtered.length}</span>
            )}
          </div>

          <nav>
            <button className={"nav-btn" + (view === "table" ? " active" : "")} onClick={() => setView("table")}>📋 Таблица</button>
            <button className={"nav-btn" + (view === "quiz" ? " active" : "")} onClick={startQuiz}>🎯 Тест</button>
          </nav>
        </div>

        {search && view === "table" && (
          <div className="search-meta">
            <span>Найдено <b>{filtered.length}</b> из {questionsData.length} по запросу «<em>{search}</em>»</span>
            <button className="search-meta-clear" onClick={clearSearch}>Сбросить</button>
          </div>
        )}
      </header>

      <main>
        {view === "table" && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th style={{width:50}}>№</th>
                    <th>Вопрос</th>
                    <th>Правильный ответ</th>
                    <th>Варианты ответов</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={4} className="empty-row">😕 Ничего не найдено по запросу «{search}»</td></tr>
                  ) : (
                    paginated.map((q, i) => (
                      <tr key={(page-1)*ITEMS_PER_PAGE+i}>
                        <td className="num">{(page-1)*ITEMS_PER_PAGE+i+1}</td>
                        <td className="question-cell">{highlight(q.question, search)}</td>
                        <td className="correct-cell">{highlight(q.correct, search)}</td>
                        <td className="options-cell">
                          {q.options.map((opt, j) => (
                            <span key={j} className={"opt-badge " + (opt === q.correct ? "opt-correct" : "opt-wrong")}>
                              {highlight(opt, search)}
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="pagination">
                <button onClick={() => setPage(1)} disabled={page===1}>«</button>
                <button onClick={() => setPage(p=>Math.max(1,p-1))} disabled={page===1}>‹</button>
                {Array.from({length:Math.min(7,totalPages)},(_,i)=>{
                  let p;
                  if(totalPages<=7) p=i+1;
                  else if(page<=4) p=i+1;
                  else if(page>=totalPages-3) p=totalPages-6+i;
                  else p=page-3+i;
                  return <button key={p} className={page===p?"active":""} onClick={()=>setPage(p)}>{p}</button>;
                })}
                <button onClick={()=>setPage(p=>Math.min(totalPages,p+1))} disabled={page===totalPages}>›</button>
                <button onClick={()=>setPage(totalPages)} disabled={page===totalPages}>»</button>
              </div>
            )}
          </>
        )}

        {view==="quiz" && !quizDone && shuffled.length>0 && (
          <div className="quiz">
            <div className="quiz-header">
              <div className="quiz-progress-bar">
                <div className="quiz-progress-fill" style={{width:`${(quizIndex/shuffled.length)*100}%`}}/>
              </div>
              <span className="quiz-counter">{quizIndex+1} / {shuffled.length}</span>
            </div>
            <div className="quiz-card">
              <h2 className="quiz-question">{shuffled[quizIndex].question}</h2>
              <div className="quiz-options">
                {shuffled[quizIndex].options.map((opt,i)=>{
                  let cls="quiz-option";
                  if(selected){
                    if(opt===shuffled[quizIndex].correct) cls+=" correct";
                    else if(opt===selected) cls+=" wrong";
                    else cls+=" faded";
                  }
                  return (
                    <button key={i} className={cls} onClick={()=>handleAnswer(opt)}>
                      <span className="opt-letter">{String.fromCharCode(65+i)}</span>{opt}
                    </button>
                  );
                })}
              </div>
              {selected && (
                <div className="quiz-feedback">
                  {selected===shuffled[quizIndex].correct
                    ? <span className="feedback-correct">✓ Правильно!</span>
                    : <span className="feedback-wrong">✗ Неверно. Правильный ответ: <b>{shuffled[quizIndex].correct}</b></span>
                  }
                  <button className="next-btn" onClick={nextQuestion}>
                    {quizIndex+1<shuffled.length?"Следующий →":"Завершить тест"}
                  </button>
                </div>
              )}
            </div>
            <div className="quiz-score-live">Счёт: {score} / {quizIndex+(selected?1:0)}</div>
          </div>
        )}

        {view==="quiz" && quizDone && (
          <div className="quiz-done">
            <div className="result-card">
              <div className="result-icon">{score>=16?"🏆":score>=12?"👍":score>=8?"📚":"💪"}</div>
              <h2>Тест завершён!</h2>
              <div className="result-score">{score}<span>/{shuffled.length}</span></div>
              <div className="result-percent">{Math.round((score/shuffled.length)*100)}%</div>
              <p className="result-msg">
                {score>=16?"Отлично! Вы отлично знаете материал!":score>=12?"Хорошо! Продолжайте учиться.":score>=8?"Неплохо, но нужно повторить.":"Нужно больше практики. Не сдавайтесь!"}
              </p>
              <div className="result-btns">
                <button className="quiz-btn-primary" onClick={startQuiz}>🔄 Ещё раз</button>
                <button className="quiz-btn-secondary" onClick={()=>setView("table")}>📋 К таблице</button>
              </div>
            </div>
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root{--bg:#0d1117;--surface:#161b22;--surface2:#21262d;--border:#30363d;--text:#e6edf3;--text-muted:#7d8590;--accent:#2ea043;--accent-hover:#3fb950;--danger:#f85149;--blue:#388bfd;--radius:8px}
        body{background:var(--bg);color:var(--text);font-family:'Onest',sans-serif;min-height:100vh}
        .app{min-height:100vh;display:flex;flex-direction:column}
        header{background:var(--surface);border-bottom:1px solid var(--border);position:sticky;top:0;z-index:100}
        .header-inner{max-width:1400px;margin:0 auto;padding:0 24px;display:flex;align-items:center;gap:16px;height:64px}
        .logo{display:flex;align-items:center;gap:10px;flex-shrink:0}
        .logo-icon{font-size:26px}
        .logo h1{font-size:17px;font-weight:700}
        .logo p{font-size:11px;color:var(--text-muted);margin-top:1px}
        .search-wrap{flex:1;max-width:540px;display:flex;align-items:center;background:var(--bg);border:1.5px solid var(--border);border-radius:10px;padding:0 12px;transition:border-color .2s,box-shadow .2s}
        .search-wrap:focus-within{border-color:var(--blue);box-shadow:0 0 0 3px rgba(56,139,253,.15)}
        .search-icon{color:var(--text-muted);font-size:14px;flex-shrink:0}
        .search-input{flex:1;background:transparent;border:none;outline:none;color:var(--text);padding:10px 10px;font-family:inherit;font-size:14px}
        .search-input::placeholder{color:var(--text-muted)}
        .search-clear{background:none;border:none;color:var(--text-muted);cursor:pointer;padding:4px 6px;border-radius:4px;font-size:12px;transition:all .15s;flex-shrink:0}
        .search-clear:hover{background:var(--surface2);color:var(--text)}
        .search-badge{background:var(--blue);color:#fff;font-size:11px;font-weight:700;padding:2px 7px;border-radius:99px;flex-shrink:0;font-family:'JetBrains Mono',monospace}
        .search-meta{max-width:1400px;margin:0 auto;padding:6px 24px;display:flex;align-items:center;justify-content:space-between;font-size:12px;color:var(--text-muted);border-top:1px solid var(--border);background:rgba(56,139,253,.05)}
        .search-meta b{color:var(--blue)}
        .search-meta em{color:var(--text);font-style:normal}
        .search-meta-clear{background:none;border:none;color:var(--blue);cursor:pointer;font-size:12px;font-family:inherit;padding:2px 6px;border-radius:4px;transition:background .15s}
        .search-meta-clear:hover{background:rgba(56,139,253,.1)}
        nav{display:flex;gap:8px;flex-shrink:0}
        .nav-btn{background:transparent;border:1px solid var(--border);color:var(--text-muted);padding:8px 14px;border-radius:var(--radius);cursor:pointer;font-family:inherit;font-size:13px;transition:all .2s;white-space:nowrap}
        .nav-btn:hover{background:var(--surface2);color:var(--text)}
        .nav-btn.active{background:var(--accent);border-color:var(--accent);color:#fff}
        main{flex:1;max-width:1400px;margin:0 auto;width:100%;padding:20px 24px}
        .table-wrap{background:var(--surface);border:1px solid var(--border);border-radius:12px;overflow:auto}
        table{width:100%;border-collapse:collapse;font-size:13px}
        thead{background:var(--surface2);position:sticky;top:0;z-index:10}
        th{padding:12px 16px;text-align:left;font-weight:600;color:var(--text-muted);border-bottom:1px solid var(--border);font-size:11px;text-transform:uppercase;letter-spacing:.5px}
        tr:hover td{background:rgba(255,255,255,.02)}
        td{padding:11px 16px;border-bottom:1px solid var(--border);vertical-align:top;transition:background .1s}
        tr:last-child td{border-bottom:none}
        .num{color:var(--text-muted);font-family:'JetBrains Mono',monospace;font-size:12px}
        .question-cell{font-weight:500;line-height:1.5;max-width:350px}
        .correct-cell{color:#3fb950;font-weight:500;max-width:250px}
        .options-cell{display:flex;flex-wrap:wrap;gap:5px;max-width:400px}
        .empty-row{text-align:center;padding:48px;color:var(--text-muted);font-size:15px}
        mark{background:rgba(210,153,34,.35);color:#e3b341;border-radius:3px;padding:0 2px}
        .opt-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;line-height:1.5}
        .opt-correct{background:rgba(46,160,67,.15);color:#3fb950;border:1px solid rgba(46,160,67,.3)}
        .opt-wrong{background:rgba(255,255,255,.04);color:var(--text-muted);border:1px solid var(--border)}
        .pagination{display:flex;justify-content:center;align-items:center;gap:4px;margin-top:20px}
        .pagination button{background:var(--surface);border:1px solid var(--border);color:var(--text-muted);padding:8px 12px;border-radius:var(--radius);cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:13px;min-width:38px;transition:all .15s}
        .pagination button:hover:not(:disabled){background:var(--surface2);color:var(--text)}
        .pagination button.active{background:var(--accent);border-color:var(--accent);color:#fff}
        .pagination button:disabled{opacity:.4;cursor:not-allowed}
        .quiz{max-width:720px;margin:0 auto}
        .quiz-header{display:flex;align-items:center;gap:16px;margin-bottom:28px}
        .quiz-progress-bar{flex:1;height:6px;background:var(--surface2);border-radius:99px;overflow:hidden}
        .quiz-progress-fill{height:100%;background:var(--accent);border-radius:99px;transition:width .4s ease}
        .quiz-counter{color:var(--text-muted);font-size:13px;white-space:nowrap;font-family:'JetBrains Mono',monospace}
        .quiz-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:32px}
        .quiz-question{font-size:20px;font-weight:600;line-height:1.5;margin-bottom:28px}
        .quiz-options{display:flex;flex-direction:column;gap:12px}
        .quiz-option{display:flex;align-items:flex-start;gap:14px;background:var(--surface2);border:1.5px solid var(--border);color:var(--text);padding:14px 18px;border-radius:10px;cursor:pointer;font-family:inherit;font-size:15px;text-align:left;transition:all .15s;line-height:1.5}
        .quiz-option:hover:not(.correct):not(.wrong):not(.faded){border-color:var(--blue);background:rgba(56,139,253,.08)}
        .quiz-option.correct{border-color:var(--accent);background:rgba(46,160,67,.12);color:#3fb950}
        .quiz-option.wrong{border-color:var(--danger);background:rgba(248,81,73,.1);color:var(--danger)}
        .quiz-option.faded{opacity:.45}
        .opt-letter{display:flex;align-items:center;justify-content:center;width:28px;height:28px;min-width:28px;border-radius:6px;background:var(--border);font-size:12px;font-weight:700;font-family:'JetBrains Mono',monospace}
        .quiz-feedback{margin-top:20px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;padding-top:20px;border-top:1px solid var(--border)}
        .feedback-correct{color:#3fb950;font-weight:600;font-size:15px}
        .feedback-wrong{color:var(--danger);font-size:14px}
        .feedback-wrong b{color:#3fb950}
        .next-btn{background:var(--accent);color:#fff;border:none;padding:10px 24px;border-radius:var(--radius);cursor:pointer;font-family:inherit;font-size:14px;font-weight:600;transition:background .15s}
        .next-btn:hover{background:var(--accent-hover)}
        .quiz-score-live{text-align:center;margin-top:16px;color:var(--text-muted);font-size:13px;font-family:'JetBrains Mono',monospace}
        .quiz-done{display:flex;justify-content:center;padding-top:40px}
        .result-card{background:var(--surface);border:1px solid var(--border);border-radius:20px;padding:48px 40px;text-align:center;max-width:440px;width:100%}
        .result-icon{font-size:56px;margin-bottom:16px}
        .result-card h2{font-size:24px;margin-bottom:24px}
        .result-score{font-size:64px;font-weight:700;color:#3fb950;font-family:'JetBrains Mono',monospace;line-height:1}
        .result-score span{font-size:32px;color:var(--text-muted)}
        .result-percent{font-size:18px;color:var(--text-muted);margin:8px 0 20px;font-family:'JetBrains Mono',monospace}
        .result-msg{color:var(--text-muted);margin-bottom:32px;line-height:1.6}
        .result-btns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
        .quiz-btn-primary{background:var(--accent);color:#fff;border:none;padding:12px 24px;border-radius:var(--radius);cursor:pointer;font-family:inherit;font-size:15px;font-weight:600;transition:background .15s}
        .quiz-btn-primary:hover{background:var(--accent-hover)}
        .quiz-btn-secondary{background:var(--surface2);color:var(--text);border:1px solid var(--border);padding:12px 24px;border-radius:var(--radius);cursor:pointer;font-family:inherit;font-size:15px;transition:all .15s}
        .quiz-btn-secondary:hover{background:var(--border)}
        @media(max-width:800px){
          .header-inner{flex-wrap:wrap;height:auto;padding:12px 16px;gap:10px}
          .search-wrap{order:3;max-width:100%;flex:1 1 100%}
          main{padding:16px}
          .quiz-card{padding:20px}
          .quiz-question{font-size:16px}
          th,td{padding:8px 10px}
        }
      `}</style>
    </div>
  );
}
