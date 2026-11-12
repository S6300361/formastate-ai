import os
from typing import TypedDict, Optional, Sequence
from dotenv import load_dotenv
from langchain_core.messages import BaseMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from app.schema import ClientProfile, StateRecommendation, NameAvailabilityResult
from app.state_sos_service import StateSOSService

load_dotenv()

# Initialize Gemini models via Google GenAI SDK
fast_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    google_api_key=os.getenv("GEMINI_API_KEY")
)

advisor_llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-pro",
    temperature=0.1,
    google_api_key=os.getenv("GEMINI_API_KEY")
)

class AgentState(TypedDict):
    messages: Sequence[BaseMessage]
    client_profile: Optional[ClientProfile]
    recommendation: Optional[StateRecommendation]
    name_check: Optional[NameAvailabilityResult]
    filing_approved: bool

def advisor_agent_node(state: AgentState):
    profile = state["client_profile"]
    if profile.physical_us_presence and profile.home_state:
        rec_state = profile.home_state
        reason = [f"Physical operations detected in {profile.home_state}. Registering in Home State avoids double registration and foreign qualification fees."]
    elif profile.seeking_investment:
        rec_state = "DE"
        reason = ["Delaware preferred by venture capital firms due to established Chancery Court precedent."]
    else:
        rec_state = "WY"
        reason = ["Wyoming offers zero state income tax, low annual report fees ($60), and robust privacy."]

    fees = {"WY": 100.0, "DE": 110.0, "FL": 125.0, "CA": 70.0}
    annual = {"WY": 60.0, "DE": 300.0, "FL": 138.75, "CA": 800.0}
    
    rec = StateRecommendation(
        recommended_state=rec_state,
        state_filing_fee=fees.get(rec_state, 100.0),
        annual_fee=annual.get(rec_state, 100.0),
        reasoning=reason,
        compliance_notes=[
            "Must maintain a US Registered Agent with physical address.",
            "FinCEN Beneficial Ownership Information (BOI) Report must be filed within designated statutory deadline."
        ]
    )
    return {"recommendation": rec}

async def sos_agent_node(state: AgentState):
    profile = state["client_profile"]
    rec = state["recommendation"]
    res = await StateSOSService.check_name_availability(profile.business_name, rec.recommended_state)
    name_result = NameAvailabilityResult(**res)
    return {"name_check": name_result}

def compliance_agent_node(state: AgentState):
    profile = state["client_profile"]
    notes = []
    if profile.residency == "Foreign_Non_Resident":
        notes.append("IRS EIN application requires Form SS-4 submitted via Fax or Mail (No SSN required online).")
        notes.append("Must submit Form 5472 + Form 1120 annually for foreign-owned single-member LLCs even if 0 US tax is owed.")
    notes.append("Strict compliance with FinCEN CTA rules: Identify ultimate beneficial owners owning >= 25% direct/indirect control.")
    return {"messages": [SystemMessage(content="\n".join(notes))]}

workflow = StateGraph(AgentState)
workflow.add_node("advisor", advisor_agent_node)
workflow.add_node("sos_verifier", sos_agent_node)
workflow.add_node("compliance", compliance_agent_node)

workflow.set_entry_point("advisor")
workflow.add_edge("advisor", "sos_verifier")
workflow.add_edge("sos_verifier", "compliance")
workflow.add_edge("compliance", END)

app = workflow.compile()