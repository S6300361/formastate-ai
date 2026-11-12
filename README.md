# FormaState AI — Automated U.S. Business Formation System

Production-ready multi-agent architecture for automated LLC structural guidance, Secretary of State (SOS) data verification, IRS compliance, and FinCEN BOI reporting.

## Project Structure
```
forma_state_project/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI Web API
│   ├── agent_graph.py          # LangGraph Multi-Agent Orchestrator
│   ├── schema.py               # Pydantic Schemas
│   ├── state_sos_service.py    # SOS Data Scraper & Retrieval Service
│   └── cached_checkpointer.py  # Redis + PostgreSQL State Saver
├── Dockerfile                  # Container instructions
├── requirements.txt            # Python dependencies
└── README.md                   # Deployment guide
```

## Quick Start (Local)
1. Install dependencies: `pip install -r requirements.txt`
2. Set API keys: `export OPENAI_API_KEY="your-key"`
3. Start API: `uvicorn app.main:app --reload --port 8080`
4. Access interactive docs: `http://localhost:8080/docs`

## Deploy to Cloud Run
```bash
gcloud run deploy forma-state-ai \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars OPENAI_API_KEY="your-key"
```
