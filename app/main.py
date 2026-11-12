import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

from app.schema import ClientProfile
from app.agent_graph import app as agent_workflow

# Initialize FastAPI App
app = FastAPI(
    title="FormaState AI - User Query & Formation API",
    description="Production API backing FormaState AI using Google Gemini 2.5 and LangGraph.",
    version="1.0.0"
)

# Enable CORS for Frontend Clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini Chat Model for Direct Queries
def get_gemini_chat():
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500, 
            detail="GEMINI_API_KEY environment variable is not configured."
        )
    return ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        temperature=0.2,
        google_api_key=api_key
    )

# -------------------------------------------------------------------
# Request / Response Schemas
# -------------------------------------------------------------------

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message body text")

class UserQueryRequest(BaseModel):
    session_id: Optional[str] = Field(None, description="Optional conversation tracking ID")
    message: str = Field(..., description="User question or query")
    history: Optional[List[ChatMessage]] = Field(default=[], description="Past conversation history")

class UserQueryResponse(BaseModel):
    session_id: Optional[str]
    answer: str
    suggested_actions: List[str] = []

# System Prompt Guardrails for Legal & Compliance
SYSTEM_COUNSEL_PROMPT = """You are FormaState AI's automated business advisory assistant.
Your goal is to answer client queries regarding US LLC business formation, state filings (Wyoming, Delaware, Florida, etc.), IRS EIN processing, and FinCEN BOI compliance.

Core Directives:
1. Provide accurate, clear administrative guidance based on official US state and federal regulations.
2. Differentiate between US residents (SSN/ITIN holders) and non-resident foreign founders (SS-4 fax/mail filing, Form 5472 + 1120).
3. Always include a short, polite non-attorney legal disclaimer: "FormaState AI provides automated administrative guidance and state factual data, not formal legal or tax advice."
4. Never breach US policy or legal rules, and avoid making unfounded assumptions.
"""

# -------------------------------------------------------------------
# Endpoints
# -------------------------------------------------------------------

@app.get("/")
def health_check():
    return {
        "status": "online",
        "service": "FormaState AI Agent Core",
        "engine": "Google Gemini 2.5 API"
    }

@app.post("/api/v1/chat", response_model=UserQueryResponse)
async def handle_user_query(
    req: UserQueryRequest,
    llm: ChatGoogleGenerativeAI = Depends(get_gemini_chat)
):
    """
    Handles direct client queries regarding business formation, state trade-offs, 
    registered agents, and tax obligations using Gemini 2.5.
    """
    try:
        # Build prompt message chain from history
        messages = [SystemMessage(content=SYSTEM_COUNSEL_PROMPT)]
        
        for msg in req.history:
            if msg.role == "user":
                messages.append(HumanMessage(content=msg.content))
            elif msg.role == "assistant":
                messages.append(AIMessage(content=msg.content))
        
        messages.append(HumanMessage(content=req.message))

        # Invoke Gemini 2.5
        response = await llm.ainvoke(messages)
        
        return UserQueryResponse(
            session_id=req.session_id,
            answer=response.content,
            suggested_actions=[
                "Run full entity multi-agent recommendation",
                "Check Secretary of State business name availability",
                "View foreign founder IRS EIN requirements"
            ]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query handling failed: {str(e)}")

@app.post("/api/v1/llc-advisory")
async def run_llc_advisory(profile: ClientProfile):
    """
    Executes the multi-agent LangGraph pipeline (FormaAdvisor, SOS-Verify, FormaGuard).
    """
    try:
        initial_state = {
            "messages": [],
            "client_profile": profile,
            "recommendation": None,
            "name_check": None,
            "filing_approved": False
        }
        final_state = await agent_workflow.ainvoke(initial_state)
        
        return {
            "client_name": profile.business_name,
            "recommendation": final_state.get("recommendation"),
            "name_availability": final_state.get("name_check"),
            "compliance_notices": [m.content for m in final_state.get("messages", [])]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline execution failed: {str(e)}")