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
# Página principal
# ============================
@app.get("/")
def mostrar_landing():
    return FileResponse("public/pages/landing.html")


# ============================
# LOGIN
# ============================
@app.post("/auth/login")
def login(data: LoginData):
    conn = db_connect()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, hash_contraseña 
        FROM users 
        WHERE correo = %s AND activo = TRUE
    """, (data.correo,))

    user = cur.fetchone()
    if not user:
        raise HTTPException(status_code=400, detail="Usuario o contraseña incorrectos")

    user_id, hash_contraseña = user

    if not pwd_context.verify(data.contraseña, hash_contraseña):
        raise HTTPException(status_code=400, detail="Usuario o contraseña incorrectos")

    # Crear token JWT
    token = jwt.encode(
        {
            "user_id": user_id,
            "exp": datetime.utcnow() + timedelta(hours=8)
        },
        SECRET_KEY,
        algorithm="HS256"
    )

    cur.close()
    conn.close()

    return {"token": token}


# ============================
# VALIDAR TOKEN (NUEVO)
# ============================
@app.get("/auth/validate")
def validar_token(request: Request):
    auth_header = request.headers.get("Authorization")

    if not auth_header:
        raise HTTPException(status_code=401, detail="Token no enviado")

    token = auth_header.replace("Bearer ", "")

    try:
        jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return {"status": "ok"}

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")

    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
