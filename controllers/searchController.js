import Course from "../model/courseModel.js";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

export const searchwithAi = async (req, res) => {
  try {
    const { input } = req.body;
    if (!input) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Normalize input
    const q = String(input || "")
      .toLowerCase()
      .trim();

    // Categories available in the app
    const categories = [
      "App Development",
      "AI/ML",
      "AI Tools",
      "Data Science",
      "Data Analytics",
      "Ethical Hacking",
      "UI/Ux Designing",
      "Web Development",
      "Others",
    ];

    const synonyms = {
      webdevelopment: "Web Development",
      "web development": "Web Development",
      "web dev": "Web Development",
      webdev: "Web Development",
      webdevlopement: "Web Development",
      webdevelopement: "Web Development",
      "ai ml": "AI/ML",
      "ai/ml": "AI/ML",
      "ai tools": "AI Tools",
      "data science": "Data Science",
      datascience: "Data Science",
      "data analytics": "Data Analytics",
      "ethical hacking": "Ethical Hacking",
      "ui ux": "UI/Ux Designing",
      "ui/ux": "UI/Ux Designing",
      "app development": "App Development",
    };

    function detectCategory(text) {
      if (!text) return null;
      let t = text.replace(
        /\b(complete|full|course|courses|tutorial|tutorials|seekhna|seekh|mujhe|seekhni)\b/g,
        " "
      );
      t = t
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      for (const key of Object.keys(synonyms)) {
        if (t.indexOf(key) !== -1) return synonyms[key];
      }
      for (const cat of categories) {
        const ck = cat.toLowerCase().replace(/\s+/g, " ");
        if (t.indexOf(ck) !== -1) return cat;
      }
      return null;
    }

    function isQuestionIntent(text) {
      if (!text) return false;
      if (text.trim().endsWith("?")) return true;
      const qWords = [
        "what",
        "how",
        "why",
        "explain",
        "tell",
        "kaise",
        "kya",
        "kahan",
        "kab",
        "kyun",
        "bata",
        "btao",
        "samjhao",
      ];
      for (const w of qWords) if (text.indexOf(w) !== -1) return true;
      return false;
    }

    const categoryDetected = detectCategory(q);

    // prepare course search
    const coursesPromise = (async () => {
      if (categoryDetected) {
        return await Course.find({
          isPublished: true,
          category: { $regex: `^${categoryDetected}$`, $options: "i" },
        });
      }
      return await Course.find({
        isPublished: true,
        $or: [
          { title: { $regex: input, $options: "i" } },
          { subTitle: { $regex: input, $options: "i" } },
          { description: { $regex: input, $options: "i" } },
          { category: { $regex: input, $options: "i" } },
          { level: { $regex: input, $options: "i" } },
        ],
      });
    })();

    // prepare AI answer (if API key present)
    const aiPromise = (async () => {
      if (!process.env.GEMINI_API_KEY) return null;
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: String(input || q),
        });
        // robust extraction
        let answer = null;
        try {
          if (!response) answer = null;
          if (
            !answer &&
            response.outputText &&
            typeof response.outputText === "string"
          )
            answer = response.outputText;
          if (!answer && response.output && Array.isArray(response.output)) {
            for (const out of response.output) {
              if (!out) continue;
              const content = out.content || out.contents || out.data || null;
              if (content && Array.isArray(content)) {
                for (const c of content) {
                  if (!c) continue;
                  if (typeof c === "string") {
                    answer = c;
                    break;
                  }
                  if (c.text && typeof c.text === "string") {
                    answer = c.text;
                    break;
                  }
                  if (c.message && typeof c.message === "string") {
                    answer = c.message;
                    break;
                  }
                  if (c.parts && Array.isArray(c.parts)) {
                    const partsText = c.parts
                      .map((p) => (p && p.text ? p.text : ""))
                      .filter(Boolean)
                      .join("\n");
                    if (partsText) {
                      answer = partsText;
                      break;
                    }
                  }
                }
                if (answer) break;
              }
            }
          }
          if (
            !answer &&
            response.candidates &&
            Array.isArray(response.candidates)
          ) {
            for (const cand of response.candidates) {
              if (!cand) continue;
              if (cand.outputText && typeof cand.outputText === "string") {
                answer = cand.outputText;
                break;
              }
              if (cand.content) {
                if (Array.isArray(cand.content)) {
                  for (const c of cand.content) {
                    if (!c) continue;
                    if (typeof c === "string") {
                      answer = c;
                      break;
                    }
                    if (c.text && typeof c.text === "string") {
                      answer = c.text;
                      break;
                    }
                    if (c.parts && Array.isArray(c.parts)) {
                      const partsText = c.parts
                        .map((p) => (p && p.text ? p.text : ""))
                        .filter(Boolean)
                        .join("\n");
                      if (partsText) {
                        answer = partsText;
                        break;
                      }
                    }
                    if (c.content && Array.isArray(c.content)) {
                      for (const cc of c.content) {
                        if (!cc) continue;
                        if (typeof cc === "string") {
                          answer = cc;
                          break;
                        }
                        if (cc.text && typeof cc.text === "string") {
                          answer = cc.text;
                          break;
                        }
                        if (cc.parts && Array.isArray(cc.parts)) {
                          const pText = cc.parts
                            .map((p) => (p && p.text ? p.text : ""))
                            .filter(Boolean)
                            .join("\n");
                          if (pText) {
                            answer = pText;
                            break;
                          }
                        }
                      }
                      if (answer) break;
                    }
                  }
                  if (answer) break;
                } else if (
                  typeof cand.content === "object" &&
                  cand.content.parts &&
                  Array.isArray(cand.content.parts)
                ) {
                  const partsText = cand.content.parts
                    .map((p) => (p && p.text ? p.text : ""))
                    .filter(Boolean)
                    .join("\n");
                  if (partsText) {
                    answer = partsText;
                    break;
                  }
                }
              }
            }
          }
          if (
            !answer &&
            response.result &&
            (response.result.output_text || response.result.outputText)
          ) {
            answer = response.result.output_text || response.result.outputText;
          }
          if (!answer)
            answer =
              typeof response === "string"
                ? response
                : JSON.stringify(response);
        } catch (ex) {
          console.error("Failed to parse AI response", ex, response);
          answer = JSON.stringify(response || "");
        }
        return answer;
      } catch (aiErr) {
        console.error("AI generation failed", aiErr);
        return null;
      }
    })();

    const [courses, answer] = await Promise.all([coursesPromise, aiPromise]);

    // debug info
    console.log(
      "searchwithAi: query=",
      q,
      "categoryDetected=",
      categoryDetected,
      "isQuestion=",
      isQuestionIntent(q),
      "aiReturned=",
      !!answer
    );

    // If user asked a question and AI did not return an answer, try a lightweight Wikipedia fallback
    let finalAnswer = answer;
    if (isQuestionIntent(q) && !finalAnswer) {
      try {
        // try to extract a simple topic from common question patterns
        let topic = null;
        const m1 = q.match(/^what is\s+(.+)$/i);
        const m2 = q.match(/^what are\s+(.+)$/i);
        const m3 = q.match(/^define\s+(.+)$/i);
        if (m1) topic = m1[1];
        else if (m2) topic = m2[1];
        else if (m3) topic = m3[1];
        else topic = q;
        topic = topic
          .replace(/\b(please|please tell me|please explain)\b/gi, "")
          .trim();
        if (topic) {
          const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
            topic
          )}`;
          const wikiResp = await fetch(wikiUrl);
          if (wikiResp && wikiResp.ok) {
            const wikiJson = await wikiResp.json();
            if (wikiJson && wikiJson.extract) {
              finalAnswer = wikiJson.extract;
              console.log("searchwithAi: wiki fallback used for topic=", topic);
            }
          }
        }
      } catch (wf) {
        console.error("searchwithAi: wiki fallback failed", wf);
      }
    }

    return res
      .status(200)
      .json({ courses: courses || [], answer: finalAnswer || null });
  } catch (error) {
    return res.status(500).json({ message: `Failed to search ${error}` });
  }
};
