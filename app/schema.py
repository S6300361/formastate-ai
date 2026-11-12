from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class EntityType(str, Enum):
    LLC = "LLC"
    C_CORP = "C_Corp"
    SOLE_PROP = "Sole_Proprietorship"

class ResidencyStatus(str, Enum):
    US_CITIZEN = "US_Citizen"
    US_RESIDENT = "US_Resident"
    FOREIGN_NON_RESIDENT = "Foreign_Non_Resident"

class ClientProfile(BaseModel):
    business_name: str = Field(..., description="Proposed business name")
    industry: str
    residency: ResidencyStatus
    physical_us_presence: bool = Field(False, description="Has physical office/employees in a specific state")
    home_state: Optional[str] = None
    target_budget_usd: float
    seeking_investment: bool = False

class StateRecommendation(BaseModel):
    recommended_state: str
    state_filing_fee: float
    annual_fee: float
    reasoning: List[str]
    compliance_notes: List[str]

class NameAvailabilityResult(BaseModel):
    name: str
    state: str
    is_available: bool
    suggestions: List[str] = []
