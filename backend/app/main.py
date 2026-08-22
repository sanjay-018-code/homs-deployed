import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import connect_to_mongo, close_mongo_connection
from app.routes import auth, outpass, admin, reports, warden
from app.services.scheduler import start_scheduler, shutdown_scheduler

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("homs_main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing system...")
    await connect_to_mongo()
    start_scheduler()
    yield
    logger.info("Shutting down system...")
    await close_mongo_connection()
    shutdown_scheduler()

app = FastAPI(
    title="Hostel Outpass Management System (H.O.M.S) API",
    description="Commercial-grade secure multi-tier workflow REST API with RBAC, Excel logging, and Audit Trails",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled Server Exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )

# Register Routers
app.include_router(auth.router)
app.include_router(outpass.router)
app.include_router(admin.router)
app.include_router(reports.router)
app.include_router(warden.router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "system": "Hostel Outpass Management System (H.O.M.S)",
        "message": "Welcome to H.O.M.S API. Access Swagger documentation at /docs"
    }
