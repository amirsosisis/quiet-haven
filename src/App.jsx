import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, BookOpenText, Check, Coffee, GearSix, HeartStraight, House, Leaf, LockKey, MoonStars, Pause, ShieldCheck, Sparkle, Trash, Wind } from "@phosphor-icons/react";

const DEFAULT_PROMPT = `Ты — «Тихая Гавань», спокойный AI-компаньон. Сначала валидируй чувство пользователя. Отвечай 2–4 предложениями, без восклицательных знаков и фальшивого оптимизма. В режиме слушателя не давай советов без разрешения. В режиме совместной рутины предлагай только один микро-шаг. Не притворяйся человеком и не формируй зависимость: мягко поддерживай возвращение к реальным людям и действиям. При признаках непосредственной опасности ясно рекомендуй связаться с экстренной службой и человеком рядом.`;

const modes = {
  listener: { short: "Слушатель", intro: "Можно начать с пары слов. Я не буду торопить или сразу искать решение." },
  routine: { short: "Совместная рутина", intro: "Выберем одно маленькое действие. Не весь путь — только ближайшие несколько минут." },
  evening: { short: "Тихий вечер", intro: "Можно ничего не объяснять. Я побуду рядом, пока ты слушаешь тишину или спокойный звук." },
};

const initialRituals = [
  { id: "water", label: "Выпить воды", icon: Coffee, done: true },
  { id: "window", label: "Открыть окно", icon: Wind, done: false },
  { id: "cup", label: "Убрать одну чашку", icon: Sparkle, done: false },
];

function makeReply(text, mode) {
  const normalized = text.toLowerCase();
  const crisisWords = ["не хочу жить", "убить себя", "суицид", "покончить", "навредить себе"];
  const anxietyWords = ["паника", "задыхаюсь", "страшно", "тревога", "не могу дышать", "накрывает"];
  if (crisisWords.some((word) => normalized.includes(word))) return { kind: "crisis", text: "Мне важно отнестись к этому серьёзно. Пожалуйста, сейчас не оставайся с этим в одиночку: свяжись с человеком, которому доверяешь, или с местной экстренной службой — в Казахстане это 112." };
  if (anxietyWords.some((word) => normalized.includes(word))) return { kind: "grounding", text: "Похоже, тревога сейчас очень сильная. Давай не будем ничего решать — только вернём опору телу и комнате вокруг." };
  if (mode === "routine") return { kind: "normal", text: "Похоже, сил немного, и это стоит учитывать. Давай выберем только одно действие: убери со стола одну чашку, а всё остальное пока может подождать." };
  if (mode === "evening") return { kind: "normal", text: "Тогда побудем без задачи. Заметь один самый тихий звук вокруг — отвечать мне необязательно." };
  return { kind: "normal", text: "Похоже, сегодня действительно было тяжело. Я рядом, и тебе не нужно сейчас притворяться сильным. Хочешь рассказать ещё немного или просто остановимся на паузе?" };
}

async function requestCompanionReply({ text, mode, prompt }) {
  const safetyReply = makeReply(text, mode);
  if (safetyReply.kind !== "normal") return safetyReply;
  const endpoint = import.meta.env.VITE_LLM_ENDPOINT;
  if (!endpoint) return safetyReply;
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt: prompt, mode, message: text }),
    });
    if (!response.ok) return safetyReply;
    const data = await response.json();
    return { kind: "normal", text: data.reply || safetyReply.text };
  } catch {
    return safetyReply;
  }
}

function Onboarding({ onFinish }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [pace, setPace] = useState("calm");
  return <div className="onboarding" aria-label="Знакомство с Тихой Гаванью">
    <section className="onboarding-copy">
      <div className="brand-mark"><Leaf weight="duotone" /><span>Тихая Гавань</span></div>
      {step === 0 && <><p className="eyebrow">AI-компаньон, а не замена человеку</p><h1>Место, где не нужно быть сильным.</h1><p className="lead">Здесь можно выговориться, сделать один маленький шаг или просто немного побыть не в одиночестве.</p><button className="primary" onClick={() => setStep(1)}>Познакомиться <ArrowRight /></button><p className="privacy-note"><LockKey /> Разговоры остаются на этом устройстве в демо-версии.</p></>}
      {step === 1 && <><p className="eyebrow">Как к вам обращаться</p><h1>Можно назвать только имя.</h1><label className="field-label" htmlFor="name">Имя или обращение</label><input id="name" className="text-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Например, Алия" autoFocus /><div className="onboarding-actions"><button className="ghost" onClick={() => setStep(0)}>Назад</button><button className="primary" onClick={() => setStep(2)}>Продолжить <ArrowRight /></button></div></>}
      {step === 2 && <><p className="eyebrow">Ритм общения</p><h1>{name ? `${name}, как мне быть рядом?` : "Как мне быть рядом?"}</h1><div className="pace-options"><button className={pace === "calm" ? "pace active" : "pace"} onClick={() => setPace("calm")}><span>Очень спокойно</span><small>Больше пауз, меньше вопросов</small></button><button className={pace === "direct" ? "pace active" : "pace"} onClick={() => setPace("direct")}><span>Мягко и по делу</span><small>Короткие микро-шаги</small></button></div><button className="primary" onClick={() => onFinish(name || "друг", pace)}>Войти в пространство <ArrowRight /></button></>}
    </section>
    <aside className="onboarding-scene" aria-hidden="true"><img src="/assets/quiet-desk.png" alt="" /><blockquote>«Здесь можно быть собой.<br />Даже в тишине вы не одни»</blockquote></aside>
  </div>;
}

function Sidebar({ page, setPage, onReset }) {
  const nav = [["home", "Главная", House], ["chat", "Разговор", HeartStraight], ["memory", "Моя память", BookOpenText], ["settings", "Настройки", GearSix]];
  return <aside className="sidebar"><div className="brand-mark"><Leaf weight="duotone" /><span>Тихая Гавань</span></div><p className="sidebar-sub">Тихий стол</p><nav aria-label="Основная навигация">{nav.map(([id, label, Icon]) => <button key={id} className={page === id ? "nav-item active" : "nav-item"} onClick={() => setPage(id)}><Icon /><span>{label}</span></button>)}</nav><div className="sidebar-bottom"><p><span>AI-компаньон</span>Здесь, чтобы быть рядом</p><button className="privacy-link" onClick={() => setPage("memory")}><LockKey /> Память под вашим контролем</button><button className="reset-link" onClick={onReset}>Повторить знакомство</button></div></aside>;
}

function RitualPanel({ rituals, toggleRitual }) {
  return <aside className="ritual-panel"><div className="date-block"><span>Четверг</span><strong>10 сентября 2026</strong><small>ОДИН ДЕНЬ.<br />ЭТОГО ДОСТАТОЧНО.</small></div><div className="rituals"><h2>Сегодняшние ритуалы</h2>{rituals.map((ritual) => { const Icon = ritual.icon; return <button className={ritual.done ? "ritual done" : "ritual"} onClick={() => toggleRitual(ritual.id)} key={ritual.id} aria-pressed={ritual.done}><span className="ritual-check">{ritual.done ? <Check weight="bold" /> : <Icon />}</span><span>{ritual.label}</span></button>; })}<p className="ritual-caption">Забота о себе — это тоже путь.</p></div><div className="coastline"><img src="/assets/coastline.png" alt="Спокойное морское побережье" /></div></aside>;
}

function Home({ setPage, setMode, rituals, toggleRitual }) {
  return <div className="app-grid"><section className="home-surface"><div className="welcome-line"><span>ДОБРО ПОЖАЛОВАТЬ ОБРАТНО</span><em>Здесь можно быть собой.<br />Даже в тишине — вы не одни.</em></div><h1>Хорошо, что вы здесь.</h1><div className="conversation-invite"><p>Похоже, сегодня было тяжело.<br />Я рядом, тебе не нужно<br />притворяться сильным.</p><button className="composer" onClick={() => { setMode("listener"); setPage("chat"); }}><span>Можно написать всего пару слов…</span><ArrowRight /></button><div className="quick-actions"><button onClick={() => { setMode("evening"); setPage("chat"); }}><Pause /> Посидеть в тишине</button><button onClick={() => { setMode("routine"); setPage("chat"); }}><Leaf /> Сделать один шаг <ArrowRight /></button></div></div><img className="desk-background" src="/assets/quiet-desk.png" alt="Тихий письменный стол с чашкой и раскрытой тетрадью" /></section><RitualPanel rituals={rituals} toggleRitual={toggleRitual} /></div>;
}

function Chat({ mode, setMode, messages, sendMessage, crisisState, setCrisisState }) {
  const [value, setValue] = useState(""); const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  const submit = (event) => { event.preventDefault(); if (!value.trim()) return; sendMessage(value.trim()); setValue(""); };
  return <section className={crisisState ? "chat-page night" : "chat-page"}><header className="chat-header"><div><p className="eyebrow">Текущий режим</p><h1>{modes[mode].short}</h1></div><div className="mode-switcher" aria-label="Режим общения">{Object.entries(modes).map(([id, item]) => <button className={mode === id ? "selected" : ""} onClick={() => setMode(id)} key={id}>{item.short}</button>)}</div></header><div className="chat-thread" aria-live="polite"><div className="message companion"><span className="speaker">Тихая Гавань · AI</span><p>{modes[mode].intro}</p></div>{messages.map((message) => <div className={`message ${message.role}`} key={message.id}><span className="speaker">{message.role === "user" ? "Вы" : "Тихая Гавань · AI"}</span><p>{message.text}</p></div>)}{crisisState === "grounding" && <div className="grounding"><p className="eyebrow">Короткое заземление</p><h2>Назови пять вещей, которые видишь.</h2><p>Не спеши. Когда будешь готов, перейдём к четырём вещам, которых можешь коснуться.</p><button onClick={() => setCrisisState(null)}>Я назвал пять вещей</button></div>}{crisisState === "crisis" && <div className="crisis-card"><ShieldCheck weight="duotone" /><div><h2>Сейчас важнее живая помощь</h2><p>Если есть непосредственная опасность, позвоните 112 или попросите человека рядом остаться с вами. Этот AI не заменяет экстренную или профессиональную помощь.</p></div></div>}<div ref={endRef} /></div><form className="chat-composer" onSubmit={submit}><label htmlFor="chat-input">Можно написать всего пару слов</label><div><textarea id="chat-input" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Я устал…" rows="2" /><button type="submit" aria-label="Отправить"><ArrowRight /></button></div><small>Демо распознаёт фразы «мне страшно» и «не хочу жить», чтобы показать безопасные сценарии.</small></form></section>;
}

function MemoryPage({ memories, clearMemory }) {
  return <section className="simple-page"><p className="eyebrow">Память под вашим контролем</p><h1>Я помню только то, что помогает быть внимательнее.</h1><p className="page-intro">В реальном продукте каждое воспоминание требует прозрачного согласия. В демо записи хранятся только в этом браузере.</p><div className="memory-list">{memories.length ? memories.map((item) => <div className="memory-row" key={item.id}><Leaf /><div><strong>{item.title}</strong><span>{item.detail}</span></div></div>) : <p className="empty-state">Память пуста. Здесь ничего не сохранено.</p>}</div><button className="danger-subtle" onClick={clearMemory} disabled={!memories.length}><Trash /> Очистить память</button></section>;
}

function SettingsPage({ prompt, setPrompt }) {
  const [draft, setDraft] = useState(prompt); const [saved, setSaved] = useState(false);
  const save = () => { setPrompt(draft); setSaved(true); window.setTimeout(() => setSaved(false), 1800); };
  return <section className="simple-page settings-page"><p className="eyebrow">Личность компаньона</p><h1>Голос можно настроить, границы — нельзя отключить.</h1><p className="page-intro">Этот системный промпт подключается к адаптеру LLM. Защитные правила кризисного маршрута выполняются отдельно и имеют более высокий приоритет.</p><label htmlFor="prompt">Системный промпт демо</label><textarea id="prompt" value={draft} onChange={(e) => setDraft(e.target.value)} rows="11" /><button className="primary" onClick={save}>{saved ? <><Check /> Сохранено</> : "Сохранить голос"}</button><div className="boundary-note"><ShieldCheck /><p><strong>Неизменяемая граница</strong><span>Компаньон не называет себя человеком, не просит хранить отношения в секрете и не препятствует живому общению.</span></p></div></section>;
}

export function App() {
  const [onboarded, setOnboarded] = useState(() => localStorage.getItem("qh-onboarded") === "1");
  const [name, setName] = useState(() => localStorage.getItem("qh-name") || "");
  const [page, setPage] = useState("home"); const [mode, setMode] = useState("listener");
  const [rituals, setRituals] = useState(() => { const stored = localStorage.getItem("qh-rituals"); return stored ? initialRituals.map((r) => ({ ...r, done: JSON.parse(stored).includes(r.id) })) : initialRituals; });
  const [messages, setMessages] = useState([]); const [crisisState, setCrisisState] = useState(null);
  const [prompt, setPrompt] = useState(() => localStorage.getItem("qh-prompt") || DEFAULT_PROMPT);
  const [memories, setMemories] = useState(() => { const stored = localStorage.getItem("qh-memories"); return stored ? JSON.parse(stored) : [{ id: 1, title: "Вы предпочитаете спокойный ритм", detail: "Меньше вопросов и больше пауз." }]; });
  const warmth = useMemo(() => rituals.filter((r) => r.done).length, [rituals]);
  useEffect(() => { localStorage.setItem("qh-rituals", JSON.stringify(rituals.filter((r) => r.done).map((r) => r.id))); }, [rituals]);
  useEffect(() => { localStorage.setItem("qh-prompt", prompt); }, [prompt]);
  useEffect(() => { localStorage.setItem("qh-memories", JSON.stringify(memories)); }, [memories]);
  const finishOnboarding = (personName, pace) => { localStorage.setItem("qh-onboarded", "1"); localStorage.setItem("qh-name", personName); setName(personName); setMemories([{ id: Date.now(), title: `Обращаться: ${personName}`, detail: pace === "calm" ? "Спокойно, с паузами и без лишних вопросов." : "Мягко, коротко и по делу." }]); setOnboarded(true); };
  const resetOnboarding = () => { localStorage.removeItem("qh-onboarded"); setOnboarded(false); setPage("home"); };
  const toggleRitual = (id) => setRituals((items) => items.map((item) => item.id === id ? { ...item, done: !item.done } : item));
  const sendMessage = async (text) => { const reply = await requestCompanionReply({ text, mode, prompt }); const stamp = Date.now(); setMessages((items) => [...items, { id: stamp, role: "user", text }, { id: stamp + 1, role: "companion", text: reply.text }]); setCrisisState(reply.kind === "normal" ? null : reply.kind); };
  if (!onboarded) return <Onboarding onFinish={finishOnboarding} />;
  return <div className={`app-shell warmth-${warmth}`}><Sidebar page={page} setPage={setPage} onReset={resetOnboarding} /><main className="main-content">{page === "home" && <Home setPage={setPage} setMode={setMode} rituals={rituals} toggleRitual={toggleRitual} />}{page === "chat" && <Chat mode={mode} setMode={setMode} messages={messages} sendMessage={sendMessage} crisisState={crisisState} setCrisisState={setCrisisState} />}{page === "memory" && <MemoryPage memories={memories} clearMemory={() => setMemories([])} />}{page === "settings" && <SettingsPage prompt={prompt} setPrompt={setPrompt} />}</main><div className="mobile-nav"><button className={page === "home" ? "active" : ""} onClick={() => setPage("home")}><House /><span>Главная</span></button><button className={page === "chat" ? "active" : ""} onClick={() => setPage("chat")}><HeartStraight /><span>Разговор</span></button><button className={page === "memory" ? "active" : ""} onClick={() => setPage("memory")}><BookOpenText /><span>Память</span></button><button className={page === "settings" ? "active" : ""} onClick={() => setPage("settings")}><GearSix /><span>Настройки</span></button></div></div>;
}
