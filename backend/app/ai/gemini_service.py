import json
import logging
from typing import Dict, Any, List
import google.generativeai as genai
from app.config import settings

logger = logging.getLogger("skillswap")

# Configure Gemini API if key is present
gemini_available = False
if settings.GEMINI_API_KEY:
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        gemini_available = True
    except Exception as e:
        logger.error(f"Failed to configure Gemini SDK: {e}")

class GeminiService:
    @staticmethod
    def _call_gemini(prompt: str, system_instruction: str = None) -> str:
        """Helper to execute call to Gemini model (gemini-1.5-flash)."""
        if not gemini_available:
            raise ValueError("Gemini API key is not configured.")
        
        try:
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                generation_config={"response_mime_type": "application/json"},
                system_instruction=system_instruction
            )
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API execution error: {e}")
            raise e

    @classmethod
    async def match_profiles(cls, user_1: Dict[str, Any], user_2: Dict[str, Any]) -> Dict[str, Any]:
        """AI Matching Engine comparing two user profiles and outputting compatibility report."""
        prompt = f"""
        Analyze these two user profiles and generate an intelligent skill exchange matching report.
        
        User 1 Profile:
        {json.dumps(user_1.get('profile', {}), indent=2)}
        
        User 2 Profile:
        {json.dumps(user_2.get('profile', {}), indent=2)}
        
        You must return a JSON object with the following schema:
        {{
            "compatibility_score": int (0 to 100),
            "reason": "String explaining why they match",
            "strengths": ["list of matching strengths"],
            "weaknesses": ["list of matching challenges or schedule misalignments"],
            "suggestions": ["list of topics they should cover first"]
        }}
        """
        
        system_instruction = "You are a professional recruiting coordinator and technical matching agent."
        
        if gemini_available:
            try:
                res_text = cls._call_gemini(prompt, system_instruction)
                return json.loads(res_text)
            except Exception:
                logger.warning("Gemini failed, falling back to mock matching report.")
        
        # High fidelity mock fallback
        teach_1 = set(user_1.get("profile", {}).get("skills_teach", []))
        learn_1 = set(user_1.get("profile", {}).get("skills_learn", []))
        teach_2 = set(user_2.get("profile", {}).get("skills_teach", []))
        learn_2 = set(user_2.get("profile", {}).get("skills_learn", []))
        
        common_matches = (teach_1 & learn_2) | (teach_2 & learn_1)
        score = 65
        if common_matches:
            score += 25
        if user_1.get("profile", {}).get("availability") == user_2.get("profile", {}).get("availability"):
            score += 10
        score = min(score, 98)
        
        match_str = ", ".join(common_matches) if common_matches else "complementary skill domains"
        
        return {
            "compatibility_score": score,
            "reason": f"Excellent swap potential! Both users have matching goals regarding {match_str} and complementary schedules.",
            "strengths": [
                f"User 1 can teach {', '.join(teach_1 & learn_2) or 'desired skills'}",
                f"User 2 can teach {', '.join(teach_2 & learn_1) or 'desired skills'}"
            ],
            "weaknesses": [
                "Minor timezone offset might require asynchronous progress updates."
            ],
            "suggestions": [
                "Establish a weekly 1-hour pairing session over Jitsi",
                "Start with concrete pair programming exercises"
            ]
        }

    @classmethod
    async def generate_roadmap(cls, goal: str, timeframe_weeks: int = 8) -> List[Dict[str, Any]]:
        """Generate custom weekly learning roadmap for a technical goal."""
        prompt = f"""
        Generate a comprehensive weekly training roadmap for learning '{goal}' in {timeframe_weeks} weeks.
        
        You must return a JSON array containing week details with the following schema:
        [
            {{
                "week_number": 1,
                "topic": "Week Title",
                "objectives": ["obj1", "obj2"],
                "resources": ["resource link/desc 1", "resource link/desc 2"],
                "completed": false
            }}
        ]
        """
        
        system_instruction = "You are a professional senior staff curriculum developer and learning designer."
        
        if gemini_available:
            try:
                res_text = cls._call_gemini(prompt, system_instruction)
                return json.loads(res_text)
            except Exception:
                logger.warning("Gemini failed, falling back to mock roadmap generator.")
                
        # Mock Roadmap Fallback
        mock_weeks = []
        topics = [
            ("Fundamentals & Setup", ["Understand core concepts", "Set up development workspace"], ["Official Getting Started Guide", "Introductory Video Tutorial"]),
            ("Deep Dive & Syntax", ["Learn basic syntax rules", "Write simple scripts/programs"], ["Language Cheatsheet", "Interactive Exercises"]),
            ("Intermediate Architecture", ["Understand design patterns", "Implement structures and lists"], ["Architecture Reference Docs", "Project Setup Guide"]),
            ("API Integration & Testing", ["Connect external data feeds", "Add standard unit tests"], ["Rest Client Tutorial", "Unit Testing Handbook"]),
            ("State Management & Design", ["Manage complex application state", "Implement premium layout design"], ["State Libraries", "Component Design System"]),
            ("Database Connectivity", ["Store records inside database", "Perform queries and schemas"], ["Database CRUD Video", "Data Access Patterns"]),
            ("Deployment Readiness", ["Build production artifacts", "Configure CI/CD deployment flow"], ["Vercel/Render Deploy Guide", "Production Optimizations"]),
            ("Capstone Project", ["Combine all learnings into capstone", "Deploy portfolio link publicly"], ["Github Project Board Template", "Portfolio Builder Tool"])
        ]
        
        for idx in range(min(timeframe_weeks, len(topics))):
            w_idx = idx
            topic_title, objs, res = topics[w_idx]
            mock_weeks.append({
                "week_number": idx + 1,
                "topic": f"Introduction to {goal}: {topic_title}",
                "objectives": objs,
                "resources": res,
                "completed": False
            })
            
        return mock_weeks

    @classmethod
    async def generate_quiz(cls, topic: str, difficulty: str = "Medium") -> Dict[str, Any]:
        """Generate dynamic quiz questions (MCQs, Coding, T/F, Fill in blanks)."""
        prompt = f"""
        Generate a high-fidelity quiz about '{topic}' with difficulty '{difficulty}'.
        Include exactly 5 questions.
        Mix MCQs, Coding Questions, True/False, and Fill in the Blanks.
        
        You must return a JSON object with this exact schema:
        {{
            "title": "Quiz Title",
            "topic": "{topic}",
            "difficulty": "{difficulty}",
            "questions": [
                {{
                    "id": 1,
                    "type": "mcq" | "coding" | "boolean" | "fill_blank",
                    "question": "The question text",
                    "options": ["Option A", "Option B", "Option C", "Option D"] (only for MCQ/boolean),
                    "answer": "The exact correct answer value"
                }}
            ]
        }}
        """
        
        system_instruction = "You are a senior software engineering examiner and technical interviewer."
        
        if gemini_available:
            try:
                res_text = cls._call_gemini(prompt, system_instruction)
                return json.loads(res_text)
            except Exception:
                logger.warning("Gemini failed, falling back to mock quiz.")
                
        # Mock Quiz Fallback
        return {
            "title": f"{topic} Mastery Assessment",
            "topic": topic,
            "difficulty": difficulty,
            "questions": [
                {
                    "id": 1,
                    "type": "mcq",
                    "question": f"Which of the following describes the primary purpose of {topic}?",
                    "options": [
                        "A layout management tool.",
                        "A core concept for building scalable modules.",
                        "A performance bottleneck optimizer.",
                        "A secure JWT hashing method."
                    ],
                    "answer": "A core concept for building scalable modules."
                },
                {
                    "id": 2,
                    "type": "boolean",
                    "question": f"Is {topic} best suited for asynchronous network operations in modern software architectures?",
                    "options": ["True", "False"],
                    "answer": "True"
                },
                {
                    "id": 3,
                    "type": "fill_blank",
                    "question": f"The primary software driver or package used to interface with {topic} is called ________.",
                    "answer": "driver"
                },
                {
                    "id": 4,
                    "type": "coding",
                    "question": f"Write a one-line syntax expression to initialize a default variable for {topic}.",
                    "answer": "val = init()"
                },
                {
                    "id": 5,
                    "type": "mcq",
                    "question": f"What is the time complexity of a standard lookup function in {topic}?",
                    "options": ["O(1)", "O(log n)", "O(n)", "O(n^2)"],
                    "answer": "O(1)"
                }
            ]
        }

    @classmethod
    async def grade_quiz(cls, quiz: Dict[str, Any], user_answers: Dict[str, str]) -> Dict[str, Any]:
        """Grade a quiz and return feedback, score, and certificates."""
        # Simple local grader
        correct = 0
        total = len(quiz["questions"])
        weak_areas = []
        
        for q in quiz["questions"]:
            qid = str(q["id"])
            correct_ans = q["answer"].strip().lower()
            user_ans = user_answers.get(qid, "").strip().lower()
            
            if correct_ans == user_ans:
                correct += 1
            else:
                # Add question topic area to weak areas
                weak_areas.append(f"Question {qid}: {q['question'][:40]}...")
                
        score_percent = int((correct / total) * 100) if total > 0 else 0
        certificate_issued = score_percent >= 80
        
        # Formulate feedback prompt
        prompt = f"""
        Provide constructive learning review feedback for a student who finished a '{quiz['topic']}' quiz.
        Score: {score_percent}% ({correct}/{total} correct answers).
        Weak Areas details: {json.dumps(weak_areas)}
        
        You must return a JSON object with this exact schema:
        {{
            "feedback": "Short encouraging feedback text",
            "weak_areas": ["List of overall skill growth recommendations"],
            "suggested_next_steps": ["Step 1", "Step 2"]
        }}
        """
        
        if gemini_available:
            try:
                res_text = cls._call_gemini(prompt, "You are a supportive learning coach.")
                res_json = json.loads(res_text)
                res_json["score"] = score_percent
                res_json["certificate_issued"] = certificate_issued
                return res_json
            except Exception:
                pass
                
        # Grader Fallback feedback
        return {
            "score": score_percent,
            "feedback": f"Great effort! You got {correct} out of {total} correct." if score_percent >= 60 else "Keep studying! Review the documentation and try again.",
            "weak_areas": weak_areas or ["None! Excellent performance."],
            "suggested_next_steps": [
                f"Review the basics of {quiz['topic']}",
                "Work on practical exercises in your capstone project"
            ],
            "certificate_issued": certificate_issued
        }

    @classmethod
    async def review_resume(cls, resume_text: str) -> Dict[str, Any]:
        """AI Resume Reviewer analyzing skill gaps and suggesting enhancements."""
        prompt = f"""
        Analyze this professional resume text. Identify skill gaps, project improvements, and provide a layout rating.
        
        Resume text:
        {resume_text}
        
        You must return a JSON object with this schema:
        {{
            "rating": int (1 to 10),
            "strengths": ["List of strong points"],
            "skill_gaps": ["List of missing in-demand skills"],
            "suggestions": ["List of concrete ways to improve the CV"]
        }}
        """
        
        if gemini_available:
            try:
                res_text = cls._call_gemini(prompt, "You are an expert technical recruiter.")
                return json.loads(res_text)
            except Exception:
                pass
                
        return {
            "rating": 7,
            "strengths": ["Clear display of academic projects", "Proper contact information"],
            "skill_gaps": ["Missing cloud deployment technologies", "No mention of automated testing systems"],
            "suggestions": [
                "Quantify your accomplishments (e.g. 'improved efficiency by 20%')",
                "Include a clean links summary for GitHub and LinkedIn",
                "Add automated testing, Docker, or AWS if applicable"
            ]
        }
