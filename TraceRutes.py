from Backend.ProcessRutes import *
import json
import os 

_ruta = "Version2.0/Backend/Datos/"

def getFullTraces():
    # Ruta del archivo donde se guardarán los datos procesados
    cache_file = "Version2.0/datos_procesados.json"

    # Verificar si el archivo de caché ya existe
    if os.path.exists(cache_file):
        print("Cargando datos desde el archivo de caché...")
        with open(cache_file, "r") as file:
            return json.load(file)
    else:
        print("Procesando datos y guardando en caché...")
        # Diccionario para almacenar los resultados
        resultados = {}

        # Mapeo de códigos de continentes
        continentes = {
            'NA': 'Norte America',
            'SA': 'Sur America', 
            'EU': 'Europa',
            'OC': 'Oceania',
            'AS': 'Asia',
            'AF': 'Africa'
        }

        # Mapeo de códigos de sitios web
        sitios_web = {
            'Yt': 'YouTube',
            'Fb': 'Facebook',
            'Ig': 'Instagram',
            'Pin': 'Pinterest',
            'Amz': 'Amazon',
            'Gpt': 'ChatGPT',
            'Nf': 'Netflix',
            'Wh': 'Whatsapp',
            'Ud': 'Udistrital'
        }

        # Recorrer carpetas
        for cod_continente in continentes.keys():
            carpeta_cont = os.path.join(_ruta, cod_continente)

            # Verificar si la carpeta existe 
            if os.path.exists(carpeta_cont) and os.path.isdir(carpeta_cont):
                print(f"procesando carpeta: {cod_continente}")

                # Recorrer todos los archivos CSV en la carpeta   

                for archivo in os.listdir(carpeta_cont):
                    if archivo.endswith('.csv'):

                        # Extraer información del nombre del arichivo

                        nom_archivo = archivo.replace('.csv','')
                        partes = nom_archivo.split('_')

                        if len(partes) >= 3:
                            cod_cont = partes[0]
                            nom_pais = partes[1]
                            cod_sitio = partes[2]

                            # Verificar que el codigo del sitio 
                            if cod_sitio in sitios_web:

                                clave = f"{cod_cont}_{nom_pais}_{cod_sitio}"
                                ruta_archivo = os.path.join(carpeta_cont, archivo)

                                try:
                                    # Procesar archivo
                                    print(f" Procesando {archivo}")
                                    resultados[clave] = process_traceroute(
                                        nom_pais,
                                        sitios_web[cod_sitio],
                                        ruta_archivo
                                    )
                                except Exception as e:
                                    print(f" Error procesando {archivo}: {str(e)}")
                            else:
                                 print(f"  Código de sitio no reconocido: {cod_sitio} en {archivo}")
                        else:
                              print(f"  Formato de archivo no válido: {archivo}")
                else:
                    print(f"Carpeta no encontrada: {carpeta_cont}")

        # Guardar los datos procesados en un archivo JSON
        with open(cache_file, "w") as file: 
            json.dump(resultados, file, indent=4)
        
        return resultados