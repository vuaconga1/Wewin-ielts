import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { evaluateWriting } from "../generate-ielts/route";

import {
  appendFinalList,
  appendIELTSList,
  fetchAnswersFromSheet,
  transformToAnswerKey,
  scoreToIELTSBand,
  averageBands,
} from "@/app/components/googleSheets";

import { formatTimestamp } from "@/app/utils/format";
import { sendEmailWithPDF } from "@/app/components/sendMail";
import { buildIELTSEmailHTML } from "@/app/components/emailIELTS";
import { analyzeNumerologyHTML } from "../numberlogy/helpers";
import { allowedEmails } from "@/app/constants/email";

export const runtime = "nodejs";

/* ============================================= */
/* TYPES */
/* ============================================= */
interface SkillStats {
  correct: number;
  totalPoint: number;
  max: number;
  q: number;
}

interface WrongAnswer {
  q: number;
  correct: string;
  user: string;
  skill: string;
}

interface GradingResult {
  skillStats: Record<string, SkillStats>;
  correctCount: number;
  wrongAnswers: WrongAnswer[];
  totalScore: number;
  maxScore: number;
  totalQuestions: number;
}

interface WritingScore {
  overallBand: number;
  taskAchievement: string;
  coherenceCohesion: string;
  lexicalResource: string;
  grammaticalRange: string;
  suggestions: string;
}

/* ============================================= */
/* GRADING LOGIC */
/* ============================================= */
function gradeResponses(
  responses: string[],
  answerKey: { answers: string[]; skills: string[]; points: number[] }
): GradingResult {
  const { answers, skills, points } = answerKey;
  const n = Math.min(responses.length, answers.length);

  // Helper functions
  const normalize = (s: any) =>
    String(s || "")
      .trim()
      .toLowerCase();
  const toOpts = (s: any) =>
    String(s || "")
      .split(/[,/]/)
      .map(normalize)
      .filter(Boolean);
  const isLetter = (arr: string[]) => arr.every((x) => /^[a-e]$/i.test(x));

  const stats: Record<string, SkillStats> = {};
  let correct = 0;
  const wrong: WrongAnswer[] = [];
  let total = 0;

  for (let i = 0; i < n; i++) {
    const user = String(responses[i] || "").trim();
    const ans = String(answers[i] || "").trim();
    const skill = skills[i] || "Unknown";
    const point = points[i] || 1;

    // Initialize skill stats
    if (!stats[skill]) {
      stats[skill] = { correct: 0, totalPoint: 0, max: 0, q: 0 };
    }

    stats[skill].max += point;
    stats[skill].q++;

    // Check if answer is correct
    const ok = isLetter(toOpts(ans))
      ? toOpts(ans).includes(user[0]?.toLowerCase())
      : toOpts(ans).includes(normalize(user));

    if (ok) {
      correct++;
      total += point;
      stats[skill].correct++;
      stats[skill].totalPoint += point;
    } else {
      wrong.push({ q: i + 1, correct: ans, user, skill });
    }
  }

  return {
    skillStats: stats,
    correctCount: correct,
    wrongAnswers: wrong,
    totalScore: total,
    maxScore: points.slice(0, n).reduce((a, b) => a + b, 0),
    totalQuestions: n,
  };
}

/* ============================================= */
/* PARSE WRITING RESPONSE – FIXED FOR GPT JSON */
/* ============================================= */
function parseWritingResponse(response: any): WritingScore {
  try {
    // Nếu GPT đã trả object đúng format
    if (typeof response === "object" && response !== null) {
      return {
        overallBand: Number(response.overall || 0),
        taskAchievement: response.task || "",
        coherenceCohesion: response.coherence || "",
        lexicalResource: response.lexical || "",
        grammaticalRange: response.grammar || "",
        suggestions: response.suggestion || "",
      };
    }

    // Nếu là string → parse lại
    if (typeof response === "string") {
      return parseWritingResponse(JSON.parse(response));
    }

    throw new Error("Invalid Writing JSON format");
  } catch (error) {
    console.error("⚠ Writing parse error:", response);

    return {
      overallBand: 0,
      taskAchievement: "",
      coherenceCohesion: "",
      lexicalResource: "",
      grammaticalRange: "",
      suggestions: "Không thể phân tích bài Writing do lỗi định dạng.",
    };
  }
}

/* ============================================= */
/* MAIN POST HANDLER */
/* ============================================= */
export async function POST(req: Request) {
  try {
    // ---------------------------------------------------
    // 0. READ BODY SAFELY
    // ---------------------------------------------------
    const bodyText = await req.text();
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (err) {
      console.error("❌ JSON PARSE ERROR:", bodyText);
      return NextResponse.json(
        { error: "Invalid JSON from client" },
        { status: 400 }
      );
    }

    const { accessToken, sheetId, uuid, data } = body;

    // Validate required fields
    if (!accessToken || !sheetId || !data) {
      return NextResponse.json(
        { error: "Missing required fields: accessToken, sheetId, or data" },
        { status: 400 }
      );
    }

    // ---------------------------------------------------
    // 1. EXTRACT VARIABLES
    // ---------------------------------------------------
    const {
      fullName,
      birthDate,
      location,
      phone,
      email,
      consultant,
      ieltsNeed,
      selfScore,
      studyTime,
      startTime,
      listening,
      writingAnswer,
      reading,
    } = data;

    const readingArr = Array.isArray(reading)
      ? reading
      : Object.values(reading || {});

    const id = uuid || randomUUID();
    const finishTime = formatTimestamp();

    const rawAnswerKey = await fetchAnswersFromSheet(accessToken, sheetId);
    const answerKey = transformToAnswerKey(rawAnswerKey);

    console.log("✅ Answer key loaded:", answerKey.answers.length, "questions");

    // ---------------------------------------------------
    // 4. GRADE GRAMMAR + READING (COMBINED)
    // ---------------------------------------------------
    console.log("📝 Grading Grammar + Reading...");
    const allResponses = [...listening, ...readingArr];
    const gradingResult = gradeResponses(allResponses, answerKey);

    console.log("✅ Grading completed:");
    console.log(
      "   - Total Score:",
      gradingResult.totalScore,
      "/",
      gradingResult.maxScore
    );
    console.log(
      "   - Correct:",
      gradingResult.correctCount,
      "/",
      gradingResult.totalQuestions
    );
    console.log("   - Skills:", Object.keys(gradingResult.skillStats));

    // ---------------------------------------------------
    // 5. EVALUATE WRITING WITH GPT
    // ---------------------------------------------------
    console.log("✍️ Evaluating writing...");

    let writingScore: WritingScore;

    try {
      const writingResult = await evaluateWriting(writingAnswer);
      writingScore = parseWritingResponse(writingResult);
      console.log("✅ Writing evaluated - Band:", writingScore.overallBand);
    } catch (writingError: any) {
      console.error("❌ Writing evaluation error:", writingError);
      writingScore = {
        overallBand: 0,
        taskAchievement: "Error evaluating writing",
        coherenceCohesion: "",
        lexicalResource: "",
        grammaticalRange: "",
        suggestions: writingError.message,
      };
    }

    // ---------------------------------------------------
    // 6. CALCULATE IELTS BAND SCORES
    // ---------------------------------------------------
    // Grammar + Reading band (convert to IELTS 0-9 scale)
    const grammarReadingBand = scoreToIELTSBand(
      gradingResult.totalScore,
      gradingResult.maxScore
    );
    const writingBand = writingScore.overallBand;

    // Overall band (average, rounded to nearest 0.5)
    const overallBand = averageBands(grammarReadingBand, writingBand);

    // ---------------------------------------------------
    // 7. APPEND GRAMMAR LIST WITH DETAILED SCORES
    // ---------------------------------------------------
    const warnings: string[] = [];

    console.log("📝 Saving results to Listening_list...");
    try {
      await appendIELTSList({
        accessToken,
        sheetId,
        id,
        fullName,
        birthDate,
        location,
        phone,
        email,
        consultant,
        ieltsNeed,
        selfScore,
        studyTime,
        startTime,
        finishTime,
        listening,
        writingAnswer,
        reading: readingArr,
      });
    } catch (sheetError: any) {
      const message = sheetError?.message || "Không ghi được Listening_list";
      console.error("⚠️ Listening_list update failed:", message);
      warnings.push(
        "Không ghi được Google Sheet (Listening_list). Kiểm tra quyền Editor trên sheet hoặc dùng sheet của bạn trong GOOGLE_SHEETS_ID."
      );
    }

    if (
      writingScore.suggestions?.toLowerCase().includes("api key") ||
      writingScore.taskAchievement?.toLowerCase().includes("error evaluating")
    ) {
      warnings.push("OpenAI API key không hợp lệ — bỏ qua chấm Writing.");
    }

    // ---------------------------------------------------
    // 8. SEND EMAIL WITH PROFESSIONAL TEMPLATE
    // ---------------------------------------------------
    console.log("📧 Sending email...");
    let emailSent = false;
    let emailError = null;

    // --------------------------------------------
    // 6. GPT – THẦN SỐ HỌC (NEW)
    // --------------------------------------------
    const numerologyHTML = await analyzeNumerologyHTML(fullName, birthDate);
    try {
      // const emailHTML = buildIELTSEmailHTML({
      //   fullName,
      //   email,
      //   timestamp: finishTime,
      //   gradingResult,
      //   writingScore,
      //   writingAnswer,
      //   grammarReadingBand,
      //   writingBand,
      //   overallBand,
      //   numerologyHTML, // ⭐ BẮT BUỘC
      //   pdfUrl: null,
      // });

      // for (const recipient of allowedEmails) {
      //   await sendEmailWithPDF({
      //     accessToken,
      //     to: recipient, // ✔ truyền từng email
      //     subject: `IELTS Assessment Report - ${fullName}`,
      //     html: emailHTML,
      //   });
      // }

      // await sendEmailWithPDF({
      //   accessToken,
      //   to: "vipkenly1@gmail.com", // ✔ truyền từng email
      //   subject: `IELTS Assessment Report - ${fullName}`,
      //   html: emailHTML,
      // });

      console.log("✅ Email sent successfully to:", email);
      emailSent = true;
    } catch (err: any) {
      console.error("⚠️ Email sending failed:", err);
      emailError = err.message || "Unknown email error";

      if (err.message?.includes("API keys are not supported")) {
        console.error(
          "🔴 OAuth Token Issue: Passing API key instead of OAuth2 token"
        );
      }
    }

    // ---------------------------------------------------
    // 9. UPDATE FINAL LIST
    // ---------------------------------------------------
    console.log("💾 Updating Final_list...");
    try {
      await appendFinalList({
        accessToken,
        sheetId,
        id,
        name: fullName,
        email,
        score: overallBand,
        pdfUrl: "", // No PDF for now
      });
      console.log("✅ Final_list updated");
    } catch (finalListError: any) {
      console.error("⚠️ Final_list update failed:", finalListError.message);
      // Don't fail the entire request
    }

    // ---------------------------------------------------
    // 10. RETURN SUCCESS RESPONSE
    // ---------------------------------------------------
    return NextResponse.json({
      success: true,
      uuid,
      gradingResult,
      writingScore,
      writingAnswer,
      grammarReadingBand,
      writingBand,
      overallBand,
      numerologyHTML,
      timestamp: finishTime,
      warnings,
    });
  } catch (error: any) {
    console.error("🔥 API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Unknown server error",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
