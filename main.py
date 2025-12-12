from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from passlib.context import CryptContext

import psycopg2
import jwt
from datetime import datetime, timedelta

import os
from dotenv import load_dotenv


# ============================
# Cargar variables de entorno
# ============================
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY no está definida en el archivo .env")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ============================
# FastAPI Config
# ============================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================
# Modelos
# ============================
class LoginData(BaseModel):
    correo: str
    contraseña: str


# ============================
# Conexión DB
# ============================
def db_connect():
    try:
        return psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
    except Exception as e:
        print("❌ Error al conectar la base de datos:", e)
        raise HTTPException(status_code=500, detail="Error interno del servidor")


# ============================
# Registrar logs de inicio de sesión
# ============================
def log_login(user_id, request: Request, success: bool):
    try:
        conn = db_connect()
        cur = conn.cursor()

        ip = request.client.host
        user_agent = request.headers.get("User-Agent")

        cur.execute("""
            INSERT INTO login_logs (user_id, ip, user_agent, exito, fecha)
            VALUES (%s, %s, %s, %s, NOW())
        """, (user_id, ip, user_agent, success))

        conn.commit()
        cur.close()
        conn.close()

    except Exception as e:
        print("⚠ Error registrando login:", e)

# ============================
# LOGIN con control de sesiones
# ============================
@app.post("/auth/login")
def login(data: LoginData, request: Request):
    conn = db_connect()
    cur = conn.cursor()

    # Buscar usuario
    cur.execute("""
        SELECT u.id, u.hash_contraseña, u.primer_nombre, u.primer_apellido,
            r.nombre AS rol_nombre
        FROM users u
        LEFT JOIN roles r ON u.rol_id = r.id
        WHERE u.correo = %s AND u.activo = TRUE
    """, (data.correo,))
    user = cur.fetchone()
    print("DEBUG USER →", user)

    if not user:
        log_login(None, request, False)
        raise HTTPException(status_code=400, detail="Usuario o contraseña incorrectos")

    user_id, hash_contraseña, primer_nombre, primer_apellido, rol_nombre = user

    # Validar contraseña
    if not pwd_context.verify(data.contraseña, hash_contraseña):
        log_login(user_id, request, False)
        raise HTTPException(status_code=400, detail="Usuario o contraseña incorrectos")

    # Token con expiración
    expiration = datetime.utcnow() + timedelta(hours=8)
    token = jwt.encode(
        {"user_id": user_id, "exp": expiration},
        SECRET_KEY,
        algorithm="HS256"
    )

    # -------------------------------
    # Limitar sesiones activas a 2
    # -------------------------------
    cur.execute("""
        SELECT id FROM auth_tokens
        WHERE user_id = %s
        ORDER BY creado ASC
    """, (user_id,))
    sessions = cur.fetchall()

    if len(sessions) >= 2:
        oldest_id = sessions[0][0]
        cur.execute("DELETE FROM auth_tokens WHERE id = %s", (oldest_id,))

    # Registrar sesión nueva
    cur.execute("""
        INSERT INTO auth_tokens (user_id, token, expira, creado)
        VALUES (%s, %s, %s, NOW())
    """, (user_id, token, expiration))
    conn.commit()

    log_login(user_id, request, True)

    cur.close()
    conn.close()

    return {
        "token": token,
        "primer_nombre": primer_nombre,
        "primer_apellido": primer_apellido,
        "rol": rol_nombre
    }

# ============================
# VALIDAR TOKEN contra BD
# ============================
@app.get("/auth/validate")
def validar_token(request: Request):
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        raise HTTPException(status_code=401, detail="Token no enviado")

    token = auth_header.replace("Bearer ", "")

    # Validar JWT
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

    user_id = payload["user_id"]

    # Validar token activo en BD
    conn = db_connect()
    cur = conn.cursor()

    cur.execute("""
        SELECT 1 FROM auth_tokens
        WHERE user_id = %s AND token = %s
    """, (user_id, token))

    active = cur.fetchone()

    cur.close()
    conn.close()

    if not active:
        raise HTTPException(status_code=401, detail="Sesión invalidada (otro dispositivo inició sesión)")

    return {"status": "ok"}


# ============================
# LOGOUT (opcional)
# ============================
@app.post("/auth/logout")
def logout(request: Request):
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        raise HTTPException(status_code=401, detail="Token no enviado")

    token = auth_header.replace("Bearer ", "")

    conn = db_connect()
    cur = conn.cursor()

    cur.execute("DELETE FROM auth_tokens WHERE token = %s", (token,))
    conn.commit()

    cur.close()
    conn.close()

    return {"status": "cerrado"}