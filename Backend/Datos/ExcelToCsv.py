import pandas as pd
import re
import os 

ruta_carpetas = "Version2.0/Backend/Datos"
cod_continente = "AF"
pais = "Nairobi"

# Diccionario de códigos de sitios
sitios = {
    "Yt": "YouTube",
    "Fb": "Facebook",
    "Ig": "Instagram", 
    "Pin": "Pinterest",
    "Amz": "Amazon",
    "Gpt": "ChatGPT",
    "Nf": "Netflix",
    "Wh": "Whatsapp",
    "Ud": "Udistrital"
}

# Leer archivo CSV
file = "Version2.0/Backend/Datos/CurrentCity.csv"
with open(file, "r", encoding="utf-8") as f:
    data = f.read()

# Crear directorio si no existe
os.makedirs(ruta_carpetas + "/" + cod_continente, exist_ok=True)

# Dividir el contenido por bloques usando los códigos de sitios
bloques_data = {}
lineas = data.strip().split('\n')

sitio_actual = None
contenido_actual = []

for linea in lineas:
    linea = linea.strip()
    
    # Verificar si la línea contiene un código de sitio (formato: "Yt;;;;")
    if linea.endswith(";;;;"):
        codigo_sitio = linea.replace(";;;;", "")
        if codigo_sitio in sitios.keys():
            # Si ya teníamos un sitio anterior, guardarlo
            if sitio_actual:
                bloques_data[sitio_actual] = contenido_actual
            
            # Comenzar nuevo sitio
            sitio_actual = codigo_sitio
            contenido_actual = []
    
    # Si no es un código de sitio ni header, y tenemos un sitio actual, agregar al contenido
    elif sitio_actual and linea and not linea.startswith("Hop;Time;Time;Time;IP address"):
        contenido_actual.append(linea)

# Guardar el último sitio
if sitio_actual:
    bloques_data[sitio_actual] = contenido_actual

print("Sitios encontrados:", list(bloques_data.keys()))
print("Ejemplo de contenido para Yt:", bloques_data.get("Yt", [])[:3])

# Procesar cada bloque
for cod_sitio, contenido in bloques_data.items():
    print(f"\nProcesando sitio: {cod_sitio}")
    
    rows = []
    
    for linea in contenido:
        if not linea or linea.startswith(";;;;"):  # Saltar líneas vacías o separadores
            continue
            
        # Dividir por punto y coma
        partes = linea.split(';')
        
        if len(partes) < 5:
            continue
            
        hop = partes[0]
        tiempo1 = partes[1]
        tiempo2 = partes[2] 
        tiempo3 = partes[3]
        ip = partes[4]
        
        # Normalizar los tiempos
        tiempo1 = "1" if tiempo1 == "<1" else tiempo1
        tiempo2 = "1" if tiempo2 == "<1" else tiempo2
        tiempo3 = "1" if tiempo3 == "<1" else tiempo3
        
        rows.append([hop, tiempo1, tiempo2, tiempo3, ip])
    
    # Completar hasta 30 filas si es necesario
    while len(rows) < 30:
        rows.append([str(len(rows) + 1), "*", "*", "*", "*"])
    
    # Crear DataFrame y guardar
    df = pd.DataFrame(rows, columns=["#", "Tiempo de respuesta", "", "", "Direccion ip"])
    file_name = f"{cod_continente}_{pais}_{cod_sitio}.csv"
    ruta_csv = os.path.join(ruta_carpetas + "/" + cod_continente, file_name)
    
    # Escribir manualmente el archivo para incluir la primera fila con el nombre del sitio
    with open(ruta_csv, 'w', encoding='utf-8') as f:
        # Primera fila: nombre del sitio seguido de ;;;;
        nombre_sitio = sitios[cod_sitio]
        f.write(f"{nombre_sitio};;;;\n")
        
        # Segunda fila: headers
        f.write("#;Tiempo de respuesta;;;Direccion ip\n")
        
        # Datos
        for row in rows:
            f.write(";".join(row) + "\n")
    print(f"Archivo guardado con éxito: {ruta_csv}")
    print(f"Filas procesadas: {len([r for r in rows if r[1] != '*'])}")

print(f"\nProcesamiento completado. Archivos guardados en la carpeta '{cod_continente}'")