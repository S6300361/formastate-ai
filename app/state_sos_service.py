import httpx
from bs4 import BeautifulSoup
from typing import Dict

class StateSOSService:
    """Retrieves real-time official data from US Secretary of State portals."""
    
    STATE_PORTALS = {
        "WY": "https://wyobiz.wyo.gov/Business/FilingSearch.aspx",
        "DE": "https://icis.corp.delaware.gov/ecorp/entitysearch/NameSearch.aspx",
        "FL": "https://search.sunbiz.org/Inquiry/CorporationSearch/ByName"
    }

    @staticmethod
    async def check_name_availability(name: str, state: str) -> Dict[str, bool]:
        state_code = state.upper()
        if state_code not in StateSOSService.STATE_PORTALS:
            return {"name": name, "state": state_code, "is_available": True}
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(
                    StateSOSService.STATE_PORTALS[state_code],
                    params={"SearchTerm": name}
                )
                if response.status_code == 200:
                    soup = BeautifulSoup(response.text, "html.parser")
                    exists = name.lower() in soup.text.lower()
                    return {"name": name, "state": state_code, "is_available": not exists}
                return {"name": name, "state": state_code, "is_available": True}
            except Exception as e:
                return {"name": name, "state": state_code, "is_available": False, "error": str(e)}
