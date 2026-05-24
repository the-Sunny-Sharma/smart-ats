"""
Smart ATS — AI Service
======================
FastAPI microservice providing AI-powered ATS features.

Provider strategy:
  - PRIMARY  : Groq  (llama-3.3-70b-versatile) — ultra-fast, generous free tier
  - FALLBACK : OpenRouter (meta-llama/llama-3.3-70b-instruct:free) — free tier

Both providers expose an OpenAI-compatible /v1/chat/completions endpoint,
so we use the openai SDK pointed at different base_urls — zero vendor lock-in.

Endpoints:
  POST /parse-resume       — extract structured profile from resume text
  POST /score-candidate    — score a candidate 0-100 against a job
  POST /match-jobs         — rank jobs by fit for a candidate (LLM-based)
  POST /semantic-match     — rank candidates for a job via embedding cosine similarity
  POST /keywords           — extract skills / keywords from any text
  GET  /health             — liveness check
"""

import os
import json
import re
import logging
from typing import Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI

# ─── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("smart-ats-ai")

# ─── App ─────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Smart ATS — AI Service",
    version="1.0.0",
    description="Resume parsing & candidate scoring powered by Groq + OpenRouter + sentence-transformers",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten via env in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Embedding model (lazy-loaded on first use) ───────────────────────────────
# Uses all-MiniLM-L6-v2 — 22 MB, runs on CPU, no API key needed.
# Downloaded once by Docker on first startup and cached in /root/.cache.
_embedding_model = None

def get_embedding_model():
    """Lazy-load the sentence-transformer model so startup is instant."""
    global _embedding_model
    if _embedding_model is None:
        log.info("Loading sentence-transformer model (all-MiniLM-L6-v2)...")
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
        log.info("Embedding model loaded.")
    return _embedding_model


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Cosine similarity between two 1-D numpy vectors."""
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def _candidate_to_text(profile: dict) -> str:
    """
    Flatten a candidate's parsedProfile dict into a single string
    suitable for embedding.  Prioritises skills + experience titles
    which carry the most semantic signal for job matching.
    """
    parts = []

    summary = profile.get("summary", "")
    if summary:
        parts.append(summary)

    skills = profile.get("skills", [])
    if skills:
        parts.append("Skills: " + ", ".join(skills))

    keywords = profile.get("keywords", [])
    if keywords:
        parts.append("Keywords: " + ", ".join(keywords))

    for exp in profile.get("experience", []):
        title   = exp.get("title", "")
        company = exp.get("company", "")
        desc    = exp.get("description", "")
        if title or company:
            parts.append(f"{title} at {company}. {desc}".strip())

    for edu in profile.get("education", []):
        degree = edu.get("degree", "")
        field  = edu.get("field", "")
        inst   = edu.get("institution", "")
        if degree or field:
            parts.append(f"{degree} in {field} from {inst}".strip())

    return " | ".join(p for p in parts if p)[:2000]


def _job_to_text(job: dict) -> str:
    """
    Flatten a job dict into a single string for embedding.
    Uses title + description + skills + requirements.
    """
    parts = []

    title = job.get("title", "")
    if title:
        parts.append(title)

    dept = job.get("department", "")
    if dept:
        parts.append(f"Department: {dept}")

    skills = job.get("skills", [])
    if skills:
        parts.append("Required skills: " + ", ".join(skills))

    reqs = job.get("requirements", [])
    if reqs:
        parts.append("Requirements: " + "; ".join(reqs[:8]))

    desc = job.get("description", "")
    if desc:
        parts.append(desc[:600])

    return " | ".join(p for p in parts if p)[:2000]


# ─── Provider clients ────────────────────────────────────────────────────────
_groq_key       = os.getenv("GROQ_API_KEY", "")
_openrouter_key = os.getenv("OPENROUTER_API_KEY", "")

groq_client = OpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key=_groq_key or "not-set",
) if _groq_key else None

openrouter_client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=_openrouter_key or "not-set",
    default_headers={
        "HTTP-Referer": os.getenv("APP_URL", "http://localhost:3000"),
        "X-Title": "Smart ATS — TalentFlow AI",
    },
) if _openrouter_key else None

GROQ_MODEL        = "llama-3.3-70b-versatile"
OPENROUTER_MODEL  = "meta-llama/llama-3.3-70b-instruct:free"


# ─── Core LLM caller ─────────────────────────────────────────────────────────

def _chat(system: str, user: str, max_tokens: int = 1500) -> str:
    providers = []
    if groq_client:
        providers.append(("Groq", groq_client, GROQ_MODEL))
    if openrouter_client:
        providers.append(("OpenRouter", openrouter_client, OPENROUTER_MODEL))

    if not providers:
        raise HTTPException(
            500,
            "No AI provider configured. Set GROQ_API_KEY or OPENROUTER_API_KEY.",
        )

    last_error = None
    for name, client, model in providers:
        try:
            log.info(f"Calling {name} ({model})")
            response = client.chat.completions.create(
                model=model,
                max_tokens=max_tokens,
                temperature=0.1,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user",   "content": user},
                ],
            )
            content = response.choices[0].message.content
            log.info(f"{name} responded ({len(content)} chars)")
            return content
        except Exception as exc:
            log.warning(f"{name} failed: {exc}")
            last_error = exc

    raise HTTPException(502, f"All AI providers failed. Last error: {last_error}")


def _parse_json(text: str):
    cleaned = re.sub(r"```(?:json)?\s*", "", text).strip().rstrip("`").strip()
    brace   = cleaned.find("{")
    bracket = cleaned.find("[")
    candidates = [i for i in [brace, bracket] if i != -1]
    if candidates:
        cleaned = cleaned[min(candidates):]
    return json.loads(cleaned)


# ─── Request / Response Models ────────────────────────────────────────────────

class ResumeParseRequest(BaseModel):
    text: str
    filename: Optional[str] = None

class ScoreCandidateRequest(BaseModel):
    candidateProfile: dict
    jobDescription: str
    jobSkills: list[str] = []
    jobRequirements: list[str] = []
    experienceMin: int = 0
    experienceMax: int = 10

class MatchJobsRequest(BaseModel):
    candidateProfile: dict
    jobs: list[dict]

class KeywordsRequest(BaseModel):
    text: str

class SemanticMatchRequest(BaseModel):
    """
    Rank a list of candidates against a job using embedding cosine similarity.

    job:        Full job document (title, description, skills, requirements, …)
    candidates: List of objects, each containing:
                  - candidateId  (string, echoed back in results)
                  - parsedProfile (dict — same shape as Candidate.parsedProfile)
                  - resumeText   (optional raw text, used as fallback if profile is sparse)
    """
    job: dict
    candidates: list[dict]   # [{ candidateId, parsedProfile, resumeText? }]


# ─── Routes ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """Liveness probe — shows active providers and embedding model status."""
    return {
        "status": "ok",
        "service": "smart-ats-ai",
        "providers": {
            "groq":       "active" if groq_client       else "not configured",
            "openrouter": "active" if openrouter_client else "not configured",
        },
        "primary_model": GROQ_MODEL if groq_client else OPENROUTER_MODEL,
        "embedding_model": "all-MiniLM-L6-v2 (local)",
    }


@app.post("/parse-resume")
async def parse_resume(req: ResumeParseRequest):
    if not req.text or len(req.text.strip()) < 50:
        raise HTTPException(400, "Resume text is too short to parse (min 50 chars)")

    system = (
        "You are an expert ATS resume parser. "
        "Your ONLY output is a single valid JSON object — no markdown, no prose, no explanation."
    )

    user = f"""Parse this resume and return ONLY this JSON structure (no extra text):

{{
  "summary": "2-3 sentence professional summary",
  "skills": ["Python", "React", "..."],
  "experience": [
    {{
      "company": "Acme Corp",
      "title": "Software Engineer",
      "duration": "Jan 2021 - Dec 2023",
      "description": "Key responsibilities in 1-2 sentences"
    }}
  ],
  "education": [
    {{
      "institution": "IIT Bombay",
      "degree": "B.Tech",
      "field": "Computer Science",
      "year": "2020"
    }}
  ],
  "totalExperience": 3.5,
  "keywords": ["machine learning", "REST APIs", "..."],
  "contactInfo": {{
    "name": "Full Name or null",
    "email": "email or null",
    "phone": "phone or null",
    "location": "City, Country or null",
    "linkedin": "url or null",
    "github": "url or null"
  }}
}}

RESUME TEXT:
{req.text[:8000]}"""

    try:
        raw     = _chat(system, user, max_tokens=2000)
        profile = _parse_json(raw)
        return {"profile": profile}
    except json.JSONDecodeError as exc:
        log.error(f"JSON parse error in parse_resume: {exc}\nRaw: {raw[:500]}")
        raise HTTPException(500, f"AI returned invalid JSON: {exc}")


@app.post("/score-candidate")
async def score_candidate(req: ScoreCandidateRequest):
    system = (
        "You are a precise ATS scoring engine. "
        "Your ONLY output is a single valid JSON object — no markdown, no prose."
    )

    skills_str   = ", ".join(req.jobSkills)                         if req.jobSkills        else "Not specified"
    req_str      = "\n".join(f"- {r}" for r in req.jobRequirements) if req.jobRequirements else "Not specified"
    profile_json = json.dumps(req.candidateProfile, indent=2)

    user = f"""Score this candidate for the job and return ONLY this JSON (no extra text):

{{
  "overall": 85,
  "skillMatch": 90,
  "experienceMatch": 80,
  "educationMatch": 75,
  "explanation": "2-3 sentence explanation of this score",
  "matchedSkills": ["React", "Node.js"],
  "missingSkills": ["Docker", "Kubernetes"],
  "recommendation": "strong_yes",
  "highlights": ["5 years React experience", "Led team of 8"]
}}

Scoring rules:
- overall = weighted avg: skill 40% + experience 35% + education 25%
- recommendation thresholds: strong_yes > 80 | yes 65-80 | maybe 45-65 | no < 45

JOB DESCRIPTION (first 2000 chars):
{req.jobDescription[:2000]}

REQUIRED SKILLS: {skills_str}
REQUIREMENTS:
{req_str}
Experience needed: {req.experienceMin}-{req.experienceMax} years

CANDIDATE PROFILE:
{profile_json[:2500]}"""

    try:
        raw   = _chat(system, user, max_tokens=800)
        score = _parse_json(raw)
        return {"score": score}
    except json.JSONDecodeError as exc:
        log.error(f"JSON parse error in score_candidate: {exc}\nRaw: {raw[:500]}")
        raise HTTPException(500, f"AI returned invalid JSON: {exc}")


@app.post("/match-jobs")
async def match_jobs(req: MatchJobsRequest):
    system = (
        "You are a recruitment matching engine. "
        "Your ONLY output is a valid JSON array — no markdown, no prose."
    )

    jobs_slim = [
        {"id": j.get("_id"), "title": j.get("title"), "skills": j.get("skills", [])}
        for j in req.jobs
    ]

    user = f"""Rank these jobs for the candidate. Return ONLY a JSON array sorted by matchScore descending:

[
  {{"jobId": "abc123", "matchScore": 87, "reason": "Strong React & Node match, 4 yrs exp fits range"}},
  ...
]

CANDIDATE SKILLS: {req.candidateProfile.get("skills", [])}
CANDIDATE EXPERIENCE: {req.candidateProfile.get("totalExperience", 0)} years

JOBS:
{json.dumps(jobs_slim, indent=2)[:4000]}"""

    try:
        raw     = _chat(system, user, max_tokens=800)
        matches = _parse_json(raw)
        return {"matches": matches}
    except json.JSONDecodeError as exc:
        log.error(f"JSON parse error in match_jobs: {exc}\nRaw: {raw[:500]}")
        raise HTTPException(500, f"AI returned invalid JSON: {exc}")


@app.post("/keywords")
async def extract_keywords(req: KeywordsRequest):
    system = (
        "You extract technical keywords from text. "
        "Your ONLY output is a single valid JSON object."
    )

    user = f"""Extract keywords from the text below. Return ONLY this JSON:

{{
  "skills": ["Python", "React", "SQL"],
  "tools":  ["Docker", "Jira", "Figma"],
  "domains": ["FinTech", "SaaS", "Mobile"]
}}

TEXT:
{req.text[:5000]}"""

    try:
        raw    = _chat(system, user, max_tokens=400)
        result = _parse_json(raw)
        return result
    except json.JSONDecodeError as exc:
        log.error(f"JSON parse error in keywords: {exc}\nRaw: {raw[:500]}")
        raise HTTPException(500, f"AI returned invalid JSON: {exc}")


@app.post("/semantic-match")
async def semantic_match(req: SemanticMatchRequest):
    """
    Rank candidates for a job using true semantic embedding similarity.

    Strategy:
      1. Build a text representation of the job (title + skills + description).
      2. Build a text representation for each candidate (skills + experience + summary).
      3. Encode all texts with all-MiniLM-L6-v2 (local, no API calls).
      4. Compute cosine similarity between job vector and each candidate vector.
      5. Scale to 0-100, attach a qualitative tier, and return sorted by score desc.

    Returns:
      ranked: [
        {
          candidateId,
          semanticScore,      # 0-100 integer
          similarityRaw,      # raw cosine value 0.0-1.0 (4 dp)
          tier,               # "excellent" | "good" | "fair" | "low"
          matchedConcepts,    # skills from candidate that appear semantically in job
          summary             # 1-line human-readable explanation
        },
        ...
      ]
    """
    if not req.candidates:
        raise HTTPException(400, "candidates list is empty")

    model = get_embedding_model()

    # ── Build text representations ─────────────────────────────────────────
    job_text = _job_to_text(req.job)
    log.info(f"Job text ({len(job_text)} chars): {job_text[:120]}...")

    candidate_texts = []
    for c in req.candidates:
        profile = c.get("parsedProfile") or {}
        raw_text = c.get("resumeText", "")

        profile_text = _candidate_to_text(profile)

        # If parsedProfile is sparse (< 50 chars), fall back to raw resume text
        if len(profile_text) < 50 and raw_text:
            profile_text = raw_text[:2000]

        candidate_texts.append(profile_text or "No profile available")

    # ── Encode everything in one batch (fast on CPU) ───────────────────────
    all_texts  = [job_text] + candidate_texts
    log.info(f"Encoding {len(all_texts)} texts with sentence-transformers...")
    embeddings = model.encode(all_texts, batch_size=32, show_progress_bar=False)
    log.info("Encoding complete.")

    job_vec        = embeddings[0]
    candidate_vecs = embeddings[1:]

    # ── Score each candidate ───────────────────────────────────────────────
    results = []
    for i, (c, cand_vec) in enumerate(zip(req.candidates, candidate_vecs)):
        raw_sim = _cosine_similarity(job_vec, cand_vec)

        # Map cosine similarity (typically 0.2–0.9 for real text) to 0-100.
        # We use a linear scale anchored at:  0.2 → 0,  0.9 → 100
        scaled = (raw_sim - 0.2) / (0.9 - 0.2)
        score  = max(0, min(100, round(scaled * 100)))

        # Qualitative tier
        if score >= 75:
            tier = "excellent"
        elif score >= 55:
            tier = "good"
        elif score >= 35:
            tier = "fair"
        else:
            tier = "low"

        # Surface matched concepts: candidate skills that appear (case-insensitive)
        # as substrings in the job text — quick heuristic, no extra inference needed
        profile      = c.get("parsedProfile") or {}
        cand_skills  = [s.lower() for s in profile.get("skills", [])]
        job_text_lc  = job_text.lower()
        matched      = [s for s in profile.get("skills", []) if s.lower() in job_text_lc]

        # One-line summary
        exp_years = profile.get("totalExperience", 0)
        name      = profile.get("contactInfo", {}).get("name", "") if isinstance(profile.get("contactInfo"), dict) else ""
        summary   = (
            f"{tier.capitalize()} semantic match ({score}/100). "
            f"{exp_years} yr(s) experience. "
            f"{len(matched)} skill(s) overlap with job requirements."
        )

        results.append({
            "candidateId":    c.get("candidateId"),
            "semanticScore":  score,
            "similarityRaw":  round(raw_sim, 4),
            "tier":           tier,
            "matchedConcepts": matched[:10],    # cap at 10 for payload size
            "summary":        summary,
        })

    # Sort descending by semanticScore
    results.sort(key=lambda x: x["semanticScore"], reverse=True)

    log.info(
        f"semantic-match: {len(results)} candidates ranked. "
        f"Top score: {results[0]['semanticScore'] if results else 'n/a'}"
    )

    return {"ranked": results}