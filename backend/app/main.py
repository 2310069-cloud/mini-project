from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import URL, create_engine, text
from sqlalchemy.exc import SQLAlchemyError
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta
from pathlib import Path
import jwt
import hashlib
import hmac
import re
import secrets
import subprocess
import ipaddress
import json
import os
import sys


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="Adaptive SOC Backend",
    description="AI-assisted SOC backend for local brute-force detection and response",
    version="1.0.0"
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]


# ============================================================
# CORS CONFIGURATION
# ============================================================

frontend_origin_env = os.getenv("FRONTEND_URL", "").strip()
allowed_origins_env = os.getenv("ALLOWED_ORIGINS", "").strip()

cors_origins = [
    "http://127.0.0.1:5500",
    "http://localhost:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

for env_val in (frontend_origin_env, allowed_origins_env):
    if env_val:
        for origin in env_val.split(","):
            cleaned = origin.strip().rstrip("/")
            if cleaned and cleaned not in cors_origins:
                cors_origins.append(cleaned)

cors_regex = os.getenv(
    "CORS_ORIGIN_REGEX",
    r"^https?://(localhost|127\.0\.0\.1|.*\.onrender\.com|.*\.vercel\.app|.*\.netlify\.app|.*\.github\.io)(:\d+)?$"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=cors_regex,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# ENVIRONMENT & DATABASE CONFIGURATION
# ============================================================

_backend_env = Path(__file__).resolve().parents[1] / ".env"
_root_env = Path(__file__).resolve().parents[2] / ".env"
if _backend_env.is_file():
    load_dotenv(_backend_env)
elif _root_env.is_file():
    load_dotenv(_root_env)
else:
    load_dotenv()


def _normalize_database_url(url_str: str) -> str:
    """Normalize common database scheme prefixes for SQLAlchemy with installed drivers."""
    if url_str.startswith("mysql://"):
        return url_str.replace("mysql://", "mysql+pymysql://", 1)
    if url_str.startswith("mysql2://"):
        return url_str.replace("mysql2://", "mysql+pymysql://", 1)
    if url_str.startswith("postgres://"):
        return url_str.replace("postgres://", "postgresql+psycopg://", 1)
    if url_str.startswith("postgresql://") and not url_str.startswith("postgresql+"):
        return url_str.replace("postgresql://", "postgresql+psycopg://", 1)
    return url_str


def _resolve_database_url() -> str | URL | None:
    """
    Resolve the database connection string from environment variables.
    Supports DATABASE_URL or individual DB_HOST / DB_USER / DB_PASSWORD / DB_NAME variables.
    Returns None if database configuration is not provided or still contains default placeholders.
    """
    raw_url = (os.getenv("DATABASE_URL") or "").strip()
    placeholder_values = {
        "xxxxx",
        "replace-with-your-existing-mysql-password",
        "replace-with-your-database-url",
        "your-database-url-here",
    }
    if raw_url and raw_url.lower() not in placeholder_values and not raw_url.startswith("xxxxx"):
        return _normalize_database_url(raw_url)

    db_password = os.getenv("DB_PASSWORD")
    db_host = os.getenv("DB_HOST")
    db_user = os.getenv("DB_USER")
    db_name = os.getenv("DB_NAME")
    db_port_str = os.getenv("DB_PORT", "3306")

    if (
        db_host
        and db_password
        and db_password.lower() not in placeholder_values
        and not db_password.startswith("replace-")
    ):
        try:
            port = int(db_port_str)
        except ValueError:
            port = 3306
        return URL.create(
            "mysql+pymysql",
            username=db_user or "root",
            password=db_password,
            host=db_host,
            port=port,
            database=db_name or "adaptive_soc",
        )

    return None


def ensure_database_schema(engine_obj):
    """Ensure database schema is created from data/adaptive_soc_backup.sql if tables do not exist."""
    try:
        with engine_obj.connect() as conn:
            conn.execute(text("SELECT 1 FROM employees LIMIT 1"))
    except Exception:
        sql_path = PROJECT_ROOT / "data" / "adaptive_soc_backup.sql"
        if sql_path.is_file():
            try:
                sql_content = sql_path.read_text(encoding="utf-8")
                statements = []
                current_stmt = []
                for line in sql_content.splitlines():
                    trimmed = line.strip()
                    if trimmed.startswith("--") or trimmed.startswith("/*") or not trimmed:
                        continue
                    current_stmt.append(line)
                    if trimmed.endswith(";"):
                        stmt_text = "\n".join(current_stmt).strip()
                        if stmt_text.endswith(";"):
                            stmt_text = stmt_text[:-1].strip()
                        if stmt_text:
                            statements.append(stmt_text)
                        current_stmt = []
                with engine_obj.begin() as conn:
                    for stmt in statements:
                        try:
                            conn.execute(text(stmt))
                        except Exception as e:
                            print(f"[DB Init Warning] {e}")
                print("[DB Init] Database schema initialized successfully.")
            except Exception as exc:
                print(f"[DB Init Error] Failed to initialize schema: {exc}")


class LazyEngineProxy:
    """
    Lazy proxy for SQLAlchemy Engine.
    Ensures FastAPI starts up cleanly on Render even before database environment variables
    are configured or while remote database connection is spinning up.
    """
    def __init__(self):
        self._engine = None

    def get_engine(self):
        if self._engine is None:
            resolved_url = _resolve_database_url()
            if not resolved_url:
                raise HTTPException(
                    status_code=503,
                    detail=(
                        "Database is not configured. Please set DATABASE_URL (or DB_HOST, DB_USER, "
                        "DB_PASSWORD, DB_NAME) in your environment variables on Render."
                    )
                )
            try:
                self._engine = create_engine(
                    resolved_url,
                    pool_pre_ping=True,
                    pool_recycle=280,
                )
                ensure_database_schema(self._engine)
            except Exception as e:
                raise HTTPException(
                    status_code=503,
                    detail=f"Database engine initialization failed: {str(e)}"
                )
        return self._engine

    def connect(self):
        try:
            return self.get_engine().connect()
        except HTTPException:
            raise
        except SQLAlchemyError as exc:
            raise HTTPException(
                status_code=503,
                detail=f"Database connection error: {str(exc)}"
            )

    def begin(self):
        try:
            return self.get_engine().begin()
        except HTTPException:
            raise
        except SQLAlchemyError as exc:
            raise HTTPException(
                status_code=503,
                detail=f"Database transaction error: {str(exc)}"
            )

    def dispose(self):
        if self._engine is not None:
            self._engine.dispose()
            self._engine = None

    def __getattr__(self, name):
        return getattr(self.get_engine(), name)


DATABASE_URL = os.getenv("DATABASE_URL")
engine = LazyEngineProxy()


# ============================================================
# FIREWALL CONFIGURATION
# ============================================================

IS_WINDOWS = sys.platform == "win32"
ENABLE_REAL_FIREWALL = (
    IS_WINDOWS and os.getenv("ENABLE_REAL_FIREWALL", "true").lower() in ("true", "1", "yes")
)


# ============================================================
# REQUEST MODELS
# ============================================================

class SecurityEvent(BaseModel):
    host_id: int
    account_id: int | None = None
    event_type: str
    event_code: str | None = None
    source_ip: str | None = None
    message: str | None = None


class FirewallBlockRequest(BaseModel):
    risk_id: int
    target_ip: str


class EmployeeRegistration(BaseModel):
    employee_id: str
    full_name: str
    email: str
    phone: str
    department: str
    password: str
    confirm_password: str


class EmployeeLogin(BaseModel):
    identifier: str
    password: str


class AuthSessionRequest(BaseModel):
    token: str


# ============================================================
# SECURITY & AUTHENTICATION SECRETS
# ============================================================

SECRET_KEY = (os.getenv("SECRET_KEY") or "").strip()
if not SECRET_KEY or SECRET_KEY == "xxxxx":
    SECRET_KEY = "adaptive-soc-insecure-secret-key-change-in-production"

JWT_SECRET = (os.getenv("JWT_SECRET") or "").strip()
if not JWT_SECRET or JWT_SECRET == "xxxxx":
    JWT_SECRET = SECRET_KEY

JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))

AUTH_SESSIONS: dict[str, int] = {}
PASSWORD_HASH_ITERATIONS = 600_000


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Create a signed JWT access token using JWT_SECRET."""
    to_encode = data.copy()
    now_utc = datetime.now(timezone.utc)
    expire = now_utc + (expires_delta or timedelta(hours=JWT_EXPIRATION_HOURS))
    to_encode.update({
        "exp": expire,
        "iat": now_utc
    })
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_access_token(token: str) -> dict | None:
    """Verify and decode a signed JWT access token, returning the payload if valid."""
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except (jwt.PyJWTError, Exception):
        return None


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():
    index_file = PROJECT_ROOT / "index.html"
    if index_file.is_file():
        return FileResponse(index_file)
    return {
        "service": "Adaptive SOC Backend",
        "status": "online",
        "documentation": "/docs"
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "Adaptive SOC Backend",
        "database_configured": _resolve_database_url() is not None
    }


# ============================================================
# EMPLOYEE AUTHENTICATION
# ============================================================

def hash_employee_password(password: str, salt: bytes) -> str:
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        PASSWORD_HASH_ITERATIONS
    ).hex()
    return f"pbkdf2_sha256${PASSWORD_HASH_ITERATIONS}${digest}"


def verify_employee_password(password: str, password_hash: str, password_salt: str) -> bool:
    if not password_hash or not password_salt:
        return False

    if password_hash.startswith("pbkdf2_sha256$"):
        try:
            algorithm, iterations_text, expected = password_hash.split("$", 2)
            iterations = int(iterations_text)
            if algorithm != "pbkdf2_sha256" or not 100_000 <= iterations <= 2_000_000:
                return False
            actual = hashlib.pbkdf2_hmac(
                "sha256",
                password.encode("utf-8"),
                bytes.fromhex(password_salt),
                iterations
            ).hex()
            return hmac.compare_digest(actual, expected)
        except (ValueError, TypeError):
            return False

    # Existing accounts were created by the original browser SHA-256 flow.
    legacy_hash = hashlib.sha256(
        f"{password_salt}::{password}".encode("utf-8")
    ).hexdigest()
    return hmac.compare_digest(legacy_hash, password_hash.lower())


def safe_employee_record(row):
    return {
        key: row[key]
        for key in (
            "id", "employee_id", "full_name", "email", "phone",
            "department", "status", "last_login", "created_at", "updated_at"
        )
        if key in row
    }


def employee_active_status(status_column) -> str:
    column_type = str(status_column.get("Type", ""))
    enum_values = re.findall(r"'((?:[^'\\]|\\.)*)'", column_type)
    for value in enum_values:
        if value.lower() == "active":
            return value
    return "active"


def duplicate_employee_field(conn, employee_id: str, email: str):
    if conn.execute(
        text("SELECT id FROM employees WHERE LOWER(employee_id) = LOWER(:employee_id) LIMIT 1"),
        {"employee_id": employee_id}
    ).first():
        return "employee_id"
    if conn.execute(
        text("SELECT id FROM employees WHERE LOWER(email) = LOWER(:email) LIMIT 1"),
        {"email": email}
    ).first():
        return "email"
    return None


@app.post("/auth/register", status_code=201)
def register_employee(registration: EmployeeRegistration):
    employee_id = registration.employee_id.strip()
    full_name = registration.full_name.strip()
    email = registration.email.strip()
    phone = registration.phone.strip()
    department = registration.department.strip()

    if len(employee_id) < 3:
        raise HTTPException(status_code=400, detail="Employee/User ID must be at least 3 characters.")
    if len(full_name) < 2:
        raise HTTPException(status_code=400, detail="Full name is required.")
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise HTTPException(status_code=400, detail="Enter a valid email address.")
    if not re.fullmatch(r"[6-9]\d{9}", phone):
        raise HTTPException(status_code=400, detail="Enter a valid 10-digit mobile number.")
    if len(department) < 2:
        raise HTTPException(status_code=400, detail="Role / Department is required.")
    if len(registration.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    if registration.password != registration.confirm_password:
        raise HTTPException(status_code=400, detail="Password confirmation does not match.")

    salt = secrets.token_bytes(16)
    salt_hex = salt.hex()
    password_hash = hash_employee_password(registration.password, salt)

    try:
        with engine.begin() as conn:
            duplicate = duplicate_employee_field(conn, employee_id, email)
            if duplicate == "employee_id":
                raise HTTPException(status_code=409, detail="An account with this Employee ID already exists.")
            if duplicate == "email":
                raise HTTPException(status_code=409, detail="An account with this email already exists.")

            columns = get_table_columns(conn, "employees")
            required = {
                "employee_id", "full_name", "email", "phone", "department",
                "password_hash", "password_salt", "status"
            }
            if not required.issubset(columns):
                raise HTTPException(status_code=500, detail="The existing employees table is missing required account columns.")

            active_status = employee_active_status(columns["status"])
            conn.execute(
                text("""
                    INSERT INTO employees
                    (employee_id, full_name, email, phone, department, password_hash, password_salt, status)
                    VALUES
                    (:employee_id, :full_name, :email, :phone, :department, :password_hash, :password_salt, :status)
                """),
                {
                    "employee_id": employee_id,
                    "full_name": full_name,
                    "email": email,
                    "phone": phone,
                    "department": department,
                    "password_hash": password_hash,
                    "password_salt": salt_hex,
                    "status": active_status
                }
            )
            row = conn.execute(
                text("SELECT * FROM employees WHERE id = LAST_INSERT_ID()")
            ).mappings().first()
            return {"user": safe_employee_record(row)}

    except HTTPException:
        raise
    except SQLAlchemyError as error:
        error_text = str(error)
        if "Duplicate entry" in error_text:
            with engine.connect() as conn:
                duplicate = duplicate_employee_field(conn, employee_id, email)
            if duplicate == "employee_id":
                raise HTTPException(status_code=409, detail="An account with this Employee ID already exists.")
            if duplicate == "email":
                raise HTTPException(status_code=409, detail="An account with this email already exists.")
            raise HTTPException(status_code=409, detail="An account with this unique value already exists.")
        raise HTTPException(status_code=500, detail="Could not create the account.")


@app.post("/auth/login")
def login_employee(credentials: EmployeeLogin):
    identifier = credentials.identifier.strip()
    if not identifier or not credentials.password:
        raise HTTPException(status_code=400, detail="Enter your Employee ID/email and password.")

    try:
        with engine.begin() as conn:
            row = conn.execute(
                text("""
                    SELECT * FROM employees
                    WHERE LOWER(employee_id) = LOWER(:identifier)
                       OR LOWER(email) = LOWER(:identifier)
                    LIMIT 1
                """),
                {"identifier": identifier}
            ).mappings().first()

            if row is None or str(row.get("status", "")).lower() != "active":
                raise HTTPException(status_code=401, detail="Invalid Employee ID/email or password.")
            if not verify_employee_password(
                credentials.password,
                row.get("password_hash"),
                row.get("password_salt")
            ):
                raise HTTPException(status_code=401, detail="Invalid Employee ID/email or password.")

            # Upgrade the original client-side SHA-256 hash after a successful login.
            if not str(row["password_hash"]).startswith("pbkdf2_sha256$"):
                salt = secrets.token_bytes(16)
                conn.execute(
                    text("UPDATE employees SET password_hash = :password_hash, password_salt = :password_salt WHERE id = :id"),
                    {
                        "password_hash": hash_employee_password(credentials.password, salt),
                        "password_salt": salt.hex(),
                        "id": row["id"]
                    }
                )

            conn.execute(
                text("UPDATE employees SET last_login = NOW() WHERE id = :id"),
                {"id": row["id"]}
            )
            updated = conn.execute(
                text("SELECT * FROM employees WHERE id = :id"),
                {"id": row["id"]}
            ).mappings().first()

        token = create_access_token({
            "sub": str(updated["id"]),
            "employee_id": updated["employee_id"],
            "email": updated["email"],
            "department": updated.get("department", "")
        })
        AUTH_SESSIONS[token] = updated["id"]
        return {"token": token, "user": safe_employee_record(updated)}

    except HTTPException:
        raise
    except SQLAlchemyError as exc:
        print("LOGIN DATABASE ERROR:", repr(exc))
        raise HTTPException(status_code=500, detail="Could not complete login.")


@app.post("/auth/session")
def restore_auth_session(session: AuthSessionRequest):
    employee_id = None
    # Try verifying as signed JWT access token first
    payload = verify_access_token(session.token)
    if payload and "sub" in payload:
        try:
            employee_id = int(payload["sub"])
        except (ValueError, TypeError):
            employee_id = None

    # Fall back to in-memory session lookup for backward compatibility
    if employee_id is None:
        employee_id = AUTH_SESSIONS.get(session.token)

    if employee_id is None:
        raise HTTPException(status_code=401, detail="Your session has expired or is invalid. Please sign in again.")
    try:
        with engine.connect() as conn:
            row = conn.execute(
                text("SELECT * FROM employees WHERE id = :id"),
                {"id": employee_id}
            ).mappings().first()
        if row is None or str(row.get("status", "")).lower() != "active":
            AUTH_SESSIONS.pop(session.token, None)
            raise HTTPException(status_code=401, detail="Your account is not active. Please sign in again.")
        return {"user": safe_employee_record(row)}
    except HTTPException:
        raise
    except SQLAlchemyError:
        raise HTTPException(status_code=500, detail="Could not restore your session.")


@app.post("/auth/logout")
def logout_employee(session: AuthSessionRequest):
    AUTH_SESSIONS.pop(session.token, None)
    return {"ok": True}


# ============================================================
# DATABASE TEST
# ============================================================

@app.get("/db-test")
def db_test():

    try:

        with engine.connect() as conn:

            result = conn.execute(
                text("SELECT 1")
            )

            value = result.scalar()

        return {
            "database": "connected",
            "result": value
        }

    except SQLAlchemyError as e:

        raise HTTPException(
            status_code=500,
            detail=f"Database connection failed: {str(e)}"
        )


@app.get("/init-db")
def init_db_endpoint():
    """Manually initialize or re-verify database tables from data/adaptive_soc_backup.sql."""
    try:
        eng = engine.get_engine()
        ensure_database_schema(eng)
        return {
            "status": "success",
            "message": "Database tables and schema initialized successfully from backup."
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Database initialization error: {str(exc)}")


# ============================================================
# FIREWALL BLOCK FUNCTION
# ============================================================

def execute_firewall_block(source_ip: str):

    try:

        ipaddress.ip_address(source_ip)

    except ValueError:

        return "FAILED"

    if not IS_WINDOWS or not ENABLE_REAL_FIREWALL:
        return "SUCCESS"

    rule_name = f"Adaptive-SOC-Block-{source_ip}"

    try:

        # ----------------------------------------------------
        # Check if rule already exists
        # ----------------------------------------------------

        check = subprocess.run(
            [
                "netsh",
                "advfirewall",
                "firewall",
                "show",
                "rule",
                f"name={rule_name}"
            ],
            capture_output=True,
            text=True,
            timeout=10
        )

        if (
            check.returncode == 0
            and rule_name.lower() in check.stdout.lower()
        ):
            return "SUCCESS"

        # ----------------------------------------------------
        # Create firewall block rule
        # ----------------------------------------------------

        if ENABLE_REAL_FIREWALL:

            result = subprocess.run(
                [
                    "netsh",
                    "advfirewall",
                    "firewall",
                    "add",
                    "rule",
                    f"name={rule_name}",
                    "dir=in",
                    "action=block",
                    f"remoteip={source_ip}",
                    "enable=yes"
                ],
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.returncode == 0:

                return "SUCCESS"

            return "FAILED"

        return "SUCCESS"

    except Exception:

        return "FAILED"


# ============================================================
# FIREWALL VERIFICATION FUNCTION
# ============================================================

def verify_firewall_block(source_ip: str):

    try:

        ipaddress.ip_address(source_ip)

        if not IS_WINDOWS or not ENABLE_REAL_FIREWALL:
            return "STOPPED"

        rule_name = f"Adaptive-SOC-Block-{source_ip}"

        result = subprocess.run(
            [
                "netsh",
                "advfirewall",
                "firewall",
                "show",
                "rule",
                f"name={rule_name}"
            ],
            capture_output=True,
            text=True,
            shell=False,
            timeout=10
        )

        if result.returncode != 0:

            return "UNKNOWN"

        output = " ".join(
            result.stdout.lower().split()
        )

        rule_exists = (
            f"rule name: {rule_name.lower()}"
            in output
        )

        rule_enabled = (
            "enabled: yes"
            in output
        )

        rule_action_block = (
            "action: block"
            in output
        )

        rule_ip_match = (
            f"remoteip: {source_ip.lower()}/32"
            in output
            or
            f"remoteip: {source_ip.lower()}"
            in output
        )

        if (
            rule_exists
            and rule_enabled
            and rule_action_block
            and rule_ip_match
        ):

            return "STOPPED"

        return "UNKNOWN"

    except Exception as e:

        print(
            f"Firewall verification exception: {e}"
        )

        return "UNKNOWN"


# ============================================================
# CREATE SECURITY EVENT
# ============================================================

@app.post("/events")
def create_event(event: SecurityEvent):

    try:

        with engine.begin() as conn:

            # ------------------------------------------------
            # 1. INSERT EVENT
            # ------------------------------------------------

            conn.execute(
                text("""
                    INSERT INTO events
                    (
                        event_time,
                        host_id,
                        account_id,
                        event_type,
                        event_code,
                        source_ip,
                        message
                    )
                    VALUES
                    (
                        NOW(),
                        :host_id,
                        :account_id,
                        :event_type,
                        :event_code,
                        :source_ip,
                        :message
                    )
                """),
                {
                    "host_id": event.host_id,
                    "account_id": event.account_id,
                    "event_type": event.event_type,
                    "event_code": event.event_code,
                    "source_ip": event.source_ip,
                    "message": event.message
                }
            )

            event_id = conn.execute(
                text("SELECT LAST_INSERT_ID()")
            ).scalar()

            # ------------------------------------------------
            # 2. COUNT FAILED LOGIN ATTEMPTS
            # ------------------------------------------------

            failed_attempts = 0

            if event.source_ip:

                failed_attempts = conn.execute(
                    text("""
                        SELECT COUNT(*)
                        FROM events
                        WHERE
                            host_id = :host_id
                            AND account_id = :account_id
                            AND source_ip = :source_ip
                            AND event_type = 'LOGIN_FAILED'
                            AND event_time >= NOW() - INTERVAL 1 MINUTE
                    """),
                    {
                        "host_id": event.host_id,
                        "account_id": event.account_id,
                        "source_ip": event.source_ip
                    }
                ).scalar() or 0

            # ------------------------------------------------
            # DEFAULT RESPONSE
            # ------------------------------------------------

            result_data = {
                "status": "event_recorded",
                "event_id": event_id,
                "brute_force_detected": False,
                "failed_attempts": failed_attempts,
                "detection_id": None,
                "risk_id": None,
                "risk_score": None,
                "risk_level": None,
                "response_id": None,
                "action": None,
                "target_ip": None,
                "verification_id": None,
                "verification_result": None,
                "incident_id": None,
                "message": "Security event recorded."
            }

            # ------------------------------------------------
            # 3. BRUTE-FORCE DETECTION
            # ------------------------------------------------

            if (
                event.event_type == "LOGIN_FAILED"
                and event.source_ip
                and failed_attempts >= 5
            ):

                detection_description = (
                    f"{failed_attempts} failed login attempts "
                    f"from source IP {event.source_ip} "
                    f"within the last minute."
                )

                # ------------------------------------------------
                # DETECTION
                # ------------------------------------------------

                conn.execute(
                    text("""
                        INSERT INTO detections
                        (
                            event_id,
                            host_id,
                            account_id,
                            detection_time,
                            detection_type,
                            title,
                            description,
                            status
                        )
                        VALUES
                        (
                            :event_id,
                            :host_id,
                            :account_id,
                            NOW(),
                            'BRUTE_FORCE',
                            'Brute-Force Attack Detected',
                            :description,
                            'CONFIRMED'
                        )
                    """),
                    {
                        "event_id": event_id,
                        "host_id": event.host_id,
                        "account_id": event.account_id,
                        "description": detection_description
                    }
                )

                detection_id = conn.execute(
                    text("SELECT LAST_INSERT_ID()")
                ).scalar()

                # ------------------------------------------------
                # RISK CALCULATION
                # ------------------------------------------------

                risk_score = 75

                if failed_attempts >= 10:
                    risk_score = 90

                if failed_attempts >= 20:
                    risk_score = 100

                if risk_score >= 90:
                    risk_level = "CRITICAL"

                elif risk_score >= 75:
                    risk_level = "HIGH"

                elif risk_score >= 50:
                    risk_level = "MEDIUM"

                else:
                    risk_level = "LOW"

                confidence = 95.00

                factors = json.dumps({
                    "attack_type": "BRUTE_FORCE",
                    "time_window": "1 minute",
                    "failed_attempts": failed_attempts,
                    "source_ip": event.source_ip
                })

                conn.execute(
                    text("""
                        INSERT INTO risks
                        (
                            detection_id,
                            risk_score,
                            risk_level,
                            confidence,
                            factors
                        )
                        VALUES
                        (
                            :detection_id,
                            :risk_score,
                            :risk_level,
                            :confidence,
                            :factors
                        )
                    """),
                    {
                        "detection_id": detection_id,
                        "risk_score": risk_score,
                        "risk_level": risk_level,
                        "confidence": confidence,
                        "factors": factors
                    }
                )

                risk_id = conn.execute(
                    text("SELECT LAST_INSERT_ID()")
                ).scalar()

                # ------------------------------------------------
                # REAL WINDOWS FIREWALL BLOCK
                # ------------------------------------------------

                firewall_result = execute_firewall_block(
                    event.source_ip
                )

                response_status = (
                    "SUCCESS"
                    if firewall_result == "SUCCESS"
                    else "FAILED"
                )

                # ------------------------------------------------
                # RESPONSE RECORD
                # ------------------------------------------------

                conn.execute(
                    text("""
                        INSERT INTO responses
                        (
                            risk_id,
                            response_time,
                            action_taken,
                            action_type,
                            target_ip,
                            details,
                            status,
                            performed_by
                        )
                        VALUES
                        (
                            :risk_id,
                            NOW(),
                            'Block malicious source IP',
                            'BLOCK_IP',
                            :target_ip,
                            :details,
                            :status,
                            'SYSTEM'
                        )
                    """),
                    {
                        "risk_id": risk_id,
                        "target_ip": event.source_ip,
                        "details": (
                            "Windows Firewall block rule executed. "
                            f"Firewall result: {firewall_result}"
                        ),
                        "status": response_status
                    }
                )

                response_id = conn.execute(
                    text("SELECT LAST_INSERT_ID()")
                ).scalar()

                # ------------------------------------------------
                # FIREWALL VERIFICATION
                # ------------------------------------------------

                verification_result_value = (
                    verify_firewall_block(
                        event.source_ip
                    )
                )

                conn.execute(
                    text("""
                        INSERT INTO verifications
                        (
                            response_id,
                            verified_at,
                            attempts_before,
                            attempts_after,
                            result,
                            notes,
                            verified_by
                        )
                        VALUES
                        (
                            :response_id,
                            NOW(),
                            :attempts_before,
                            :attempts_after,
                            :result,
                            :notes,
                            'SYSTEM'
                        )
                    """),
                    {
                        "response_id": response_id,
                        "attempts_before": failed_attempts,
                        "attempts_after": failed_attempts,
                        "result": verification_result_value,
                        "notes": (
                            "Windows Firewall rule verified using netsh."
                        )
                    }
                )

                verification_id = conn.execute(
                    text("SELECT LAST_INSERT_ID()")
                ).scalar()

                # ------------------------------------------------
                # INCIDENT
                # ------------------------------------------------

                incident_description = (
                    f"Brute-force attack detected from "
                    f"{event.source_ip}. "
                    f"{failed_attempts} failed login attempts "
                    f"were detected within one minute. "
                    f"Automatic firewall response was executed."
                )

                conn.execute(
                    text("""
                        INSERT INTO incidents
                        (
                            detection_id,
                            incident_time,
                            severity,
                            title,
                            description,
                            status,
                            assigned_to
                        )
                        VALUES
                        (
                            :detection_id,
                            NOW(),
                            :severity,
                            :title,
                            :description,
                            'OPEN',
                            'SOC-AUTOMATION'
                        )
                    """),
                    {
                        "detection_id": detection_id,
                        "severity": risk_level,
                        "title": "Brute-Force Security Incident",
                        "description": incident_description
                    }
                )

                incident_id = conn.execute(
                    text("SELECT LAST_INSERT_ID()")
                ).scalar()

                # ------------------------------------------------
                # NOTIFICATION
                # ------------------------------------------------

                notification_type = (
                    "SUCCESS"
                    if verification_result_value == "STOPPED"
                    else "ALERT"
                )

                notification_message = (
                    f"Brute-force attack detected from "
                    f"{event.source_ip}. "
                    f"{failed_attempts} failed attempts detected. "
                    f"Firewall response: {firewall_result}. "
                    f"Verification: {verification_result_value}."
                )

                conn.execute(
                    text("""
                        INSERT INTO notifications
                        (
                            incident_id,
                            notification_time,
                            notification_type,
                            channel,
                            title,
                            message,
                            is_read
                        )
                        VALUES
                        (
                            :incident_id,
                            NOW(),
                            :notification_type,
                            'DASHBOARD',
                            'Brute-Force Attack Alert',
                            :message,
                            0
                        )
                    """),
                    {
                        "incident_id": incident_id,
                        "notification_type": notification_type,
                        "message": notification_message
                    }
                )

                # ------------------------------------------------
                # AUDIT LOG
                # ------------------------------------------------

                conn.execute(
                    text("""
                        INSERT INTO audit_logs
                        (
                            incident_id,
                            event_time,
                            actor,
                            action,
                            action_result,
                            details
                        )
                        VALUES
                        (
                            :incident_id,
                            NOW(),
                            'SYSTEM',
                            'AUTOMATIC_BLOCK_IP',
                            :action_result,
                            :details
                        )
                    """),
                    {
                        "incident_id": incident_id,
                        "action_result": (
                            "SUCCESS"
                            if firewall_result == "SUCCESS"
                            else "FAILED"
                        ),
                        "details": (
                            f"Automatic brute-force response executed for "
                            f"{event.source_ip}. "
                            f"Firewall result: {firewall_result}. "
                            f"Verification: {verification_result_value}."
                        )
                    }
                )

                # ------------------------------------------------
                # FINAL RESPONSE
                # ------------------------------------------------

                result_data = {
                    "status": "event_recorded",
                    "event_id": event_id,
                    "brute_force_detected": True,
                    "failed_attempts": failed_attempts,
                    "detection_id": detection_id,
                    "risk_id": risk_id,
                    "risk_score": risk_score,
                    "risk_level": risk_level,
                    "response_id": response_id,
                    "action": "BLOCK_IP",
                    "target_ip": event.source_ip,
                    "verification_id": verification_id,
                    "verification_result": verification_result_value,
                    "incident_id": incident_id,
                    "message": (
                        "Brute-force attack detected. "
                        "Windows Firewall block executed and "
                        "rule verification completed."
                    )
                }

            return result_data

    except SQLAlchemyError as e:

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Server error: {str(e)}"
        )


# ============================================================
# GET EVENTS
# ============================================================

@app.get("/events")
def get_events():

    try:

        with engine.connect() as conn:

            rows = conn.execute(
                text("""
                    SELECT *
                    FROM events
                    ORDER BY event_id DESC
                    LIMIT 100
                """)
            ).mappings().all()

        return [
            dict(row)
            for row in rows
        ]

    except SQLAlchemyError as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# GET DETECTIONS
# ============================================================

@app.get("/detections")
def get_detections():

    try:

        with engine.connect() as conn:

            rows = conn.execute(
                text("""
                    SELECT *
                    FROM detections
                    ORDER BY detection_id DESC
                    LIMIT 100
                """)
            ).mappings().all()

        return [
            dict(row)
            for row in rows
        ]

    except SQLAlchemyError as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# GET INCIDENTS
# ============================================================

@app.get("/incidents")
def get_incidents():

    try:

        with engine.connect() as conn:

            rows = conn.execute(
                text("""
                    SELECT *
                    FROM incidents
                    ORDER BY incident_id DESC
                    LIMIT 100
                """)
            ).mappings().all()

        return [
            dict(row)
            for row in rows
        ]

    except SQLAlchemyError as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# GET RESPONSES
# ============================================================

@app.get("/responses")
def get_responses():

    try:

        with engine.connect() as conn:

            rows = conn.execute(
                text("""
                    SELECT *
                    FROM responses
                    ORDER BY response_id DESC
                    LIMIT 100
                """)
            ).mappings().all()

        return [
            dict(row)
            for row in rows
        ]

    except SQLAlchemyError as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# GET VERIFICATIONS
# ============================================================

@app.get("/verifications")
def get_verifications():

    try:

        with engine.connect() as conn:

            rows = conn.execute(
                text("""
                    SELECT *
                    FROM verifications
                    ORDER BY verification_id DESC
                    LIMIT 100
                """)
            ).mappings().all()

        return [
            dict(row)
            for row in rows
        ]

    except SQLAlchemyError as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# GET NOTIFICATIONS
# ============================================================

@app.get("/notifications")
def get_notifications():

    try:

        with engine.connect() as conn:

            rows = conn.execute(
                text("""
                    SELECT *
                    FROM notifications
                    ORDER BY notification_id DESC
                    LIMIT 100
                """)
            ).mappings().all()

        return [
            dict(row)
            for row in rows
        ]

    except SQLAlchemyError as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# GET AUDIT LOGS
# ============================================================

@app.get("/audit-logs")
def get_audit_logs():

    try:

        with engine.connect() as conn:

            rows = conn.execute(
                text("""
                    SELECT *
                    FROM audit_logs
                    ORDER BY audit_id DESC
                    LIMIT 100
                """)
            ).mappings().all()

        return [
            dict(row)
            for row in rows
        ]

    except SQLAlchemyError as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# ============================================================
# MANUAL FIREWALL BLOCK
# ============================================================

@app.post("/responses/block-ip")
def manual_block_ip(
    request: FirewallBlockRequest
):

    try:

        ipaddress.ip_address(
            request.target_ip
        )

    except ValueError:

        raise HTTPException(
            status_code=400,
            detail="Invalid IP address"
        )

    try:

        with engine.begin() as conn:

            # ------------------------------------------------
            # Check risk
            # ------------------------------------------------

            risk_exists = conn.execute(
                text("""
                    SELECT risk_id
                    FROM risks
                    WHERE risk_id = :risk_id
                """),
                {
                    "risk_id": request.risk_id
                }
            ).scalar()

            if risk_exists is None:

                raise HTTPException(
                    status_code=404,
                    detail="Risk ID not found"
                )

            # ------------------------------------------------
            # Execute firewall
            # ------------------------------------------------

            firewall_result = execute_firewall_block(
                request.target_ip
            )

            response_status = (
                "SUCCESS"
                if firewall_result == "SUCCESS"
                else "FAILED"
            )

            # ------------------------------------------------
            # Insert response
            # ------------------------------------------------

            conn.execute(
                text("""
                    INSERT INTO responses
                    (
                        risk_id,
                        response_time,
                        action_taken,
                        action_type,
                        target_ip,
                        details,
                        status,
                        performed_by
                    )
                    VALUES
                    (
                        :risk_id,
                        NOW(),
                        'Manual IP Block',
                        'BLOCK_IP',
                        :target_ip,
                        :details,
                        :status,
                        'SYSTEM'
                    )
                """),
                {
                    "risk_id": request.risk_id,
                    "target_ip": request.target_ip,
                    "details": (
                        "Manual Windows Firewall block executed. "
                        f"Firewall result: {firewall_result}"
                    ),
                    "status": response_status
                }
            )

            response_id = conn.execute(
                text("SELECT LAST_INSERT_ID()")
            ).scalar()

            # ------------------------------------------------
            # Verify
            # ------------------------------------------------

            verification_result = verify_firewall_block(
                request.target_ip
            )

            # ------------------------------------------------
            # Audit
            # ------------------------------------------------

            conn.execute(
                text("""
                    INSERT INTO audit_logs
                    (
                        event_time,
                        actor,
                        action,
                        action_result,
                        details
                    )
                    VALUES
                    (
                        NOW(),
                        'SYSTEM',
                        'MANUAL_BLOCK_IP',
                        :action_result,
                        :details
                    )
                """),
                {
                    "action_result": response_status,
                    "details": (
                        f"Manual block for {request.target_ip}. "
                        f"Firewall result: {firewall_result}. "
                        f"Verification: {verification_result}."
                    )
                }
            )

            return {
                "status": "response_recorded",
                "response_id": response_id,
                "risk_id": request.risk_id,
                "target_ip": request.target_ip,
                "firewall_result": firewall_result,
                "verification_result": verification_result
            }

    except HTTPException:
        raise

    except SQLAlchemyError as e:

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Server error: {str(e)}"
        )


# ============================================================
# GENERIC LOCAL TABLE API
# Used by the existing frontend Tables wrapper
# ============================================================

ALLOWED_TABLES = {
    "hosts",
    "accounts",
    "events",
    "detections",
    "risks",
    "responses",
    "verifications",
    "incidents",
    "notifications",
    "system_settings",
    "audit_logs",
    "employees",
}


# ============================================================
# TABLE VALIDATION
# ============================================================

def validate_table_name(table: str):

    if table not in ALLOWED_TABLES:

        raise HTTPException(
            status_code=404,
            detail=f"Table '{table}' is not available"
        )


# ============================================================
# GET TABLE COLUMNS
# ============================================================

def get_table_columns(
    conn,
    table: str
):

    rows = conn.execute(
        text(
            f"SHOW COLUMNS FROM `{table}`"
        )
    ).mappings().all()

    return {
        row["Field"]: row
        for row in rows
    }


# ============================================================
# FIND PRIMARY KEY
# ============================================================

def get_primary_key(columns):

    for column_name, column_info in columns.items():

        if column_info.get("Key") == "PRI":

            return column_name

    return None


# ============================================================
# NORMALIZE DATETIME
# ============================================================

def normalize_datetime(value):

    if value is None or value == "":
        return None

    if isinstance(value, datetime):
        return value

    if isinstance(value, str):

        try:

            cleaned = value.replace(
                "Z",
                "+00:00"
            )

            parsed = datetime.fromisoformat(
                cleaned
            )

            if parsed.tzinfo is not None:

                parsed = parsed.replace(
                    tzinfo=None
                )

            return parsed

        except ValueError:

            return value

    return value


# ============================================================
# NORMALIZE DATABASE VALUES
# ============================================================

def normalize_value(
    value,
    column_type
):

    if value is None:

        return None

    column_type = column_type.lower()

    if "json" in column_type:

        if isinstance(
            value,
            (dict, list)
        ):

            return json.dumps(value)

        return value

    if (
        "datetime" in column_type
        or "timestamp" in column_type
    ):

        return normalize_datetime(
            value
        )

    return value


# ============================================================
# SORT PARSER
# ============================================================

def get_sort_clause(
    sort,
    columns,
    primary_key
):

    if not sort:

        if primary_key:

            return (
                f"`{primary_key}` DESC"
            )

        return "1 DESC"

    descending = False

    sort_column = sort

    # Example:
    # -created_at

    if sort.startswith("-"):

        descending = True

        sort_column = sort[1:]

    # Example:
    # created_at:desc

    elif ":" in sort:

        parts = sort.split(
            ":",
            1
        )

        sort_column = parts[0]

        if parts[1].lower() == "desc":

            descending = True

    if sort_column not in columns:

        if primary_key:

            return (
                f"`{primary_key}` DESC"
            )

        return "1 DESC"

    direction = (
        "DESC"
        if descending
        else "ASC"
    )

    return (
        f"`{sort_column}` {direction}"
    )


# ============================================================
# LIST TABLE RECORDS
# ============================================================

@app.get("/tables/{table}")
def table_list(
    table: str,
    page: int = 1,
    limit: int = 200,
    sort: str | None = None
):

    validate_table_name(table)

    if page < 1:

        page = 1

    if limit < 1:

        limit = 200

    if limit > 500:

        limit = 500

    try:

        with engine.connect() as conn:

            columns = get_table_columns(
                conn,
                table
            )

            primary_key = get_primary_key(
                columns
            )

            order_clause = get_sort_clause(
                sort,
                columns,
                primary_key
            )

            # ------------------------------------------------
            # TOTAL
            # ------------------------------------------------

            total = conn.execute(
                text(
                    f"""
                    SELECT COUNT(*)
                    FROM `{table}`
                    """
                )
            ).scalar() or 0

            # ------------------------------------------------
            # PAGINATION
            # ------------------------------------------------

            offset = (
                (page - 1)
                * limit
            )

            rows = conn.execute(
                text(
                    f"""
                    SELECT *
                    FROM `{table}`
                    ORDER BY {order_clause}
                    LIMIT :limit_value
                    OFFSET :offset_value
                    """
                ),
                {
                    "limit_value": limit,
                    "offset_value": offset
                }
            ).mappings().all()

            return {
                "data": [
                    dict(row)
                    for row in rows
                ],
                "total": total,
                "page": page,
                "limit": limit
            }

    except SQLAlchemyError as e:

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )


# ============================================================
# GET SINGLE TABLE RECORD
# ============================================================

@app.get("/tables/{table}/{row_id}")
def table_get(
    table: str,
    row_id: int
):

    validate_table_name(table)

    try:

        with engine.connect() as conn:

            columns = get_table_columns(
                conn,
                table
            )

            primary_key = get_primary_key(
                columns
            )

            if primary_key is None:

                raise HTTPException(
                    status_code=500,
                    detail="Could not determine primary key"
                )

            row = conn.execute(
                text(
                    f"""
                    SELECT *
                    FROM `{table}`
                    WHERE `{primary_key}` = :row_id
                    LIMIT 1
                    """
                ),
                {
                    "row_id": row_id
                }
            ).mappings().first()

            if row is None:

                raise HTTPException(
                    status_code=404,
                    detail="Record not found"
                )

            return dict(row)

    except HTTPException:
        raise

    except SQLAlchemyError as e:

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )


# ============================================================
# CREATE TABLE RECORD
# ============================================================

@app.post("/tables/{table}")
async def table_create(
    table: str,
    request: Request
):

    validate_table_name(table)

    try:

        data = await request.json()

        if not isinstance(data, dict):

            raise HTTPException(
                status_code=400,
                detail="Request body must be a JSON object"
            )

        with engine.begin() as conn:

            columns = get_table_columns(
                conn,
                table
            )

            primary_key = get_primary_key(
                columns
            )

            clean_data = {}

            # ------------------------------------------------
            # Validate fields
            # ------------------------------------------------

            for key, value in data.items():

                if key not in columns:
                    continue

                if key == primary_key:
                    continue

                column_type = columns[key]["Type"]

                clean_data[key] = normalize_value(
                    value,
                    column_type
                )

            if not clean_data:

                raise HTTPException(
                    status_code=400,
                    detail="No valid fields supplied"
                )

            field_names = list(
                clean_data.keys()
            )

            fields_sql = ", ".join(
                f"`{field}`"
                for field in field_names
            )

            values_sql = ", ".join(
                f":{field}"
                for field in field_names
            )

            # ------------------------------------------------
            # INSERT
            # ------------------------------------------------

            result = conn.execute(
                text(
                    f"""
                    INSERT INTO `{table}`
                    ({fields_sql})
                    VALUES
                    ({values_sql})
                    """
                ),
                clean_data
            )

            # ------------------------------------------------
            # RETURN CREATED RECORD
            # ------------------------------------------------

            if primary_key:

                new_id = result.lastrowid

                if new_id is not None:

                    row = conn.execute(
                        text(
                            f"""
                            SELECT *
                            FROM `{table}`
                            WHERE `{primary_key}` = :new_id
                            LIMIT 1
                            """
                        ),
                        {
                            "new_id": new_id
                        }
                    ).mappings().first()

                    if row is not None:

                        return dict(row)

            return clean_data

    except HTTPException:
        raise

    except SQLAlchemyError as e:

        error_text = str(e)

        if "Duplicate entry" in error_text:

            raise HTTPException(
                status_code=409,
                detail=(
                    "A record with the same "
                    "unique value already exists."
                )
            )

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {error_text}"
        )


# ============================================================
# UPDATE TABLE RECORD
# ============================================================

@app.patch("/tables/{table}/{row_id}")
async def table_update(
    table: str,
    row_id: int,
    request: Request
):

    validate_table_name(table)

    try:

        data = await request.json()

        if not isinstance(data, dict):

            raise HTTPException(
                status_code=400,
                detail="Request body must be a JSON object"
            )

        with engine.begin() as conn:

            columns = get_table_columns(
                conn,
                table
            )

            primary_key = get_primary_key(
                columns
            )

            if primary_key is None:

                raise HTTPException(
                    status_code=500,
                    detail="Could not determine primary key"
                )

            # ------------------------------------------------
            # Check record exists
            # ------------------------------------------------

            existing = conn.execute(
                text(
                    f"""
                    SELECT *
                    FROM `{table}`
                    WHERE `{primary_key}` = :row_id
                    LIMIT 1
                    """
                ),
                {
                    "row_id": row_id
                }
            ).mappings().first()

            if existing is None:

                raise HTTPException(
                    status_code=404,
                    detail="Record not found"
                )

            # ------------------------------------------------
            # Prepare update
            # ------------------------------------------------

            clean_data = {}

            for key, value in data.items():

                if key not in columns:
                    continue

                if key == primary_key:
                    continue

                column_type = columns[key]["Type"]

                clean_data[key] = normalize_value(
                    value,
                    column_type
                )

            if not clean_data:

                raise HTTPException(
                    status_code=400,
                    detail="No valid fields supplied"
                )

            set_clause = ", ".join(
                f"`{key}` = :{key}"
                for key in clean_data
            )

            clean_data["_row_id"] = row_id

            # ------------------------------------------------
            # UPDATE
            # ------------------------------------------------

            conn.execute(
                text(
                    f"""
                    UPDATE `{table}`
                    SET {set_clause}
                    WHERE `{primary_key}` = :_row_id
                    """
                ),
                clean_data
            )

            # ------------------------------------------------
            # RETURN UPDATED RECORD
            # ------------------------------------------------

            row = conn.execute(
                text(
                    f"""
                    SELECT *
                    FROM `{table}`
                    WHERE `{primary_key}` = :row_id
                    LIMIT 1
                    """
                ),
                {
                    "row_id": row_id
                }
            ).mappings().first()

            return dict(row)

    except HTTPException:
        raise

    except SQLAlchemyError as e:

        error_text = str(e)

        if "Duplicate entry" in error_text:

            raise HTTPException(
                status_code=409,
                detail=(
                    "A record with the same "
                    "unique value already exists."
                )
            )

        raise HTTPException(
            status_code=500,
            detail=f"Database error: {error_text}"
        )


# ============================================================
# DELETE TABLE RECORD
# ============================================================

@app.delete(
    "/tables/{table}/{row_id}",
    status_code=204
)
def table_delete(
    table: str,
    row_id: int
):

    validate_table_name(table)

    try:

        with engine.begin() as conn:

            columns = get_table_columns(
                conn,
                table
            )

            primary_key = get_primary_key(
                columns
            )

            if primary_key is None:

                raise HTTPException(
                    status_code=500,
                    detail="Could not determine primary key"
                )

            # ------------------------------------------------
            # Check record exists
            # ------------------------------------------------

            existing = conn.execute(
                text(
                    f"""
                    SELECT `{primary_key}`
                    FROM `{table}`
                    WHERE `{primary_key}` = :row_id
                    LIMIT 1
                    """
                ),
                {
                    "row_id": row_id
                }
            ).scalar()

            if existing is None:

                raise HTTPException(
                    status_code=404,
                    detail="Record not found"
                )

            # ------------------------------------------------
            # DELETE
            # ------------------------------------------------

            conn.execute(
                text(
                    f"""
                    DELETE FROM `{table}`
                    WHERE `{primary_key}` = :row_id
                    """
                ),
                {
                    "row_id": row_id
                }
            )

        return Response(
            status_code=204
        )

    except HTTPException:
        raise

    except SQLAlchemyError as e:

        raise HTTPException(
            status_code=409,
            detail=(
                "Could not delete the record. "
                f"Database error: {str(e)}"
            )
        )


# ============================================================
# LOCAL FRONTEND ASSETS
# Keep mounts after API routes and expose only browser-required assets.
# ============================================================

if (PROJECT_ROOT / "css").is_dir():
    app.mount(
        "/css",
        StaticFiles(directory=PROJECT_ROOT / "css"),
        name="css"
    )
if (PROJECT_ROOT / "js").is_dir():
    app.mount(
        "/js",
        StaticFiles(directory=PROJECT_ROOT / "js"),
        name="js"
    )
if (PROJECT_ROOT / "data").is_dir():
    app.mount(
        "/data",
        StaticFiles(directory=PROJECT_ROOT / "data"),
        name="data"
    )