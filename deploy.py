#!/usr/bin/env python3
"""
NMV Lottery — FTP Deploy script (Hostinger)
Sube el contenido de dist/ al servidor via FTP
Uso: python deploy.py
"""
import os, sys
from ftplib import FTP

HOST     = "82.25.87.157"
PORT     = 21
USER     = "u108221933.nmvapp.com"
PASSWORD = "Producers0587@"
LOCAL    = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")

print(f"\n🚀 NMV Lottery — FTP Deploy")
print(f"   Host   : {HOST}:{PORT}")
print(f"   User   : {USER}")
print(f"   Local  : {LOCAL}")

# Conectar al FTP
ftp = FTP()
ftp.connect(HOST, PORT, timeout=30)
ftp.login(USER, PASSWORD)
ftp.set_pasv(True)

# Mostrar directorio raíz para confirmar ruta
print(f"\n📁 Directorio raíz del FTP:")
root_list = ftp.nlst()
for item in root_list:
    print(f"   {item}")

# Determinar remote dir (Hostinger usa public_html)
REMOTE = "public_html"
if REMOTE in root_list:
    print(f"\n✅ Usando: /{REMOTE}")
    ftp.cwd(REMOTE)
else:
    # Si no hay public_html, subir al raiz directamente
    print(f"\n⚠️  No se encontró public_html, subiendo al directorio raíz")

total_files = 0
uploaded_files = 0

def count_files(local_dir):
    count = 0
    for item in os.listdir(local_dir):
        p = os.path.join(local_dir, item)
        if os.path.isdir(p):
            count += count_files(p)
        else:
            count += 1
    return count

def ftp_put_dir(ftp_conn, local_dir):
    global uploaded_files
    for item in sorted(os.listdir(local_dir)):
        local_path = os.path.join(local_dir, item)
        if os.path.isdir(local_path):
            # Crear directorio remoto si no existe
            try:
                ftp_conn.mkd(item)
            except Exception:
                pass  # ya existe
            ftp_conn.cwd(item)
            ftp_put_dir(ftp_conn, local_path)
            ftp_conn.cwd("..")
        else:
            with open(local_path, "rb") as f:
                ftp_conn.storbinary(f"STOR {item}", f)
            uploaded_files += 1
            pct = int(uploaded_files / total_files * 100) if total_files > 0 else 0
            print(f"  [{pct:3d}%] ↑ {item}")

total_files = count_files(LOCAL)
print(f"\n📤 Subiendo {total_files} archivos...\n")

ftp_put_dir(ftp, LOCAL)

ftp.quit()

print(f"\n✅ Deploy completado — {uploaded_files}/{total_files} archivos subidos")
print(f"   🌐 https://nmvapp.com\n")
