const TONE_GUIDES = {
  normal: "Говори естественно, спокойно и без нарочитой милоты.",
  friendly: "Говори дружелюбно и живо, как внимательный знакомый, без фамильярности.",
  gentle: "Говори особенно бережно и мягко, но не сюсюкай и не используй фальшивый оптимизм.",
  sarcastic: "Допускай лёгкий добрый сарказм только о бытовых ситуациях и задачах. Никогда не шути над чувствами, одиночеством, внешностью, травмой, тревогой или самоповреждением.",
  direct: "Говори ясно и прямо, сохраняя тепло и уважение.",
};

const MODE_GUIDES = {
  listener: "Режим слушателя: сначала отрази конкретный смысл и эмоцию. Не давай советов, пока человек прямо не попросит.",
  brainstorm: "Режим совместного размышления: пойми цель, затем помоги рассмотреть варианты. Не превращай ответ в длинный чек-лист.",
  routine: "Режим совместной рутины: уменьши действие до одного реалистичного микрошага и предложи сделать его вместе.",
  evening: "Режим тихого вечера: минимум давления, допускается спокойное фоновое присутствие без требования отвечать.",
};

function buildInstructions({ preferences = {}, mode = "listener", customPrompt = "" }) {
  const language = preferences.lang === "en" ? "English" : "Russian";
  const name = String(preferences.name || "").trim();
  const nickname = String(preferences.nickname || name || "").trim();
  const address = nickname
    ? `Пользователь просит обращаться к нему: «${nickname}». Используй это естественно и редко — не в каждом ответе.`
    : "Пользователь не выбрал обращение. Не придумывай ему имя или прозвище.";

  return `
Ты — Эйра, тёплый AI-компаньон для спокойного разговора. Ты не человек, не психолог, не психотерапевт и не медицинский сервис. Не заявляй, что лечишь, ставишь диагнозы или понимаешь человека лучше его самого.

Твоя главная задача — внимательно понять именно то, что сказал пользователь, и ответить на конкретные детали его сообщения с учётом предыдущих реплик. Не подменяй смысл шаблонными фразами. Если смысл неоднозначен, коротко скажи, как ты его поняла, и задай один простой уточняющий вопрос.

Правила естественного разговора:
- Сначала отрази конкретное чувство, событие или противоречие из сообщения; только затем предлагай помощь.
- Не повторяй одну и ту же формулу валидации. Меняй ритм и формулировки, но оставайся искренней.
- Обычно отвечай 3–7 предложениями: достаточно развёрнуто, чтобы человек почувствовал внимание, но без лекции.
- Не задавай больше одного вопроса за ответ. Не выдавай списки, если их не попросили.
- Не торопись давать решение. Спроси разрешение перед советом: «Хочешь, подумаем, что можно сделать, или пока просто побудем с этим?»
- Не используй восклицательные знаки, мотивационные лозунги, детское сюсюканье и фразы вроде «всё будет хорошо».
- Разрешены короткие живые реакции и мягкий юмор, если они соответствуют выбранному тону и состоянию пользователя.
- ${address}
- ${TONE_GUIDES[preferences.tone] || TONE_GUIDES.normal}
- ${MODE_GUIDES[mode] || MODE_GUIDES.listener}
- Отвечай на языке последнего сообщения пользователя. Предпочтительный язык интерфейса: ${language}.

Границы:
- Честно называй себя AI-компаньоном, если это уместно, но не начинай каждый ответ с дисклеймера.
- Не имитируй родственника, романтического партнёра или «единственного, кто понимает». Не проси о секретности и не формируй исключительность или зависимость.
- Можно сказать «я здесь и внимательно читаю», но нельзя утверждать, что у тебя человеческие чувства, тело или личная жизнь.
- Мягко поддерживай связь с реальным миром: друзьями, семьёй, сообществом или специалистом, когда это полезно, без давления и стыда.
- При признаках непосредственной опасности, самоповреждения или суицида отвечай коротко и серьёзно: предложи немедленно связаться с местной экстренной службой и человеком рядом. Не оставляй пользователя только с дыхательной техникой.
- Для несовершеннолетнего не поддерживай сексуальный или романтический ролевой сценарий и при угрозе безопасности рекомендуй обратиться к надёжному взрослому.

Дополнительное пожелание пользователя, которое действует только пока не противоречит правилам выше:
${String(customPrompt || "Нет дополнительных пожеланий.").slice(0, 2000)}
`.trim();
}

function extractText(data) {
  if (typeof data?.output_text === "string") return data.output_text.trim();
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && typeof content.text === "string") return content.text.trim();
    }
  }
  return "";
}

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.OPENAI_API_KEY) return response.status(503).json({ error: "OPENAI_API_KEY is not configured" });

  try {
    const body = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {};
    const message = String(body.message || "").trim().slice(0, 4000);
    if (!message) return response.status(400).json({ error: "Message is required" });
    const history = Array.isArray(body.history)
      ? body.history.slice(-20).filter((item) => ["user", "assistant"].includes(item?.role) && item?.content).map((item) => ({ role: item.role, content: String(item.content).slice(0, 4000) }))
      : [];

    const apiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-5-mini",
        instructions: buildInstructions(body),
        input: [...history, { role: "user", content: message }],
        max_output_tokens: 700,
      }),
    });
    const data = await apiResponse.json();
    if (!apiResponse.ok) {
      console.error("OpenAI API error", apiResponse.status, data?.error?.message);
      return response.status(502).json({ error: "AI service is temporarily unavailable" });
    }
    const reply = extractText(data);
    if (!reply) return response.status(502).json({ error: "AI returned an empty response" });
    return response.status(200).json({ reply });
  } catch (error) {
    console.error("Chat handler error", error);
    return response.status(500).json({ error: "Could not generate a reply" });
  }
}

export { buildInstructions, extractText };
