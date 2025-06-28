import json
from statistics import mean, median, mode, stdev
from collections import defaultdict, Counter
import math

def procesar_estadisticas(datos_procesados):

    print("Iniciando procesamiento de estadísticas...")
    
    # Estructura principal de estadísticas
    estadisticas = {
        "generales": {},
        "por_continente": {},
        "por_sitio_web": {},
        "por_pais": {},
        "comparativas": {},
        "metadata": {}
    }
    
    # Mapeos para organización
    mapeo_continentes = {
        'NA': 'Norte América',
        'SA': 'Sur América', 
        'EU': 'Europa',
        'OC': 'Oceanía',
        'AS': 'Asia',
        'AF': 'África'
    }
    
    mapeo_sitios = {
        'Yt': 'YouTube',
        'Fb': 'Facebook',
        'Ig': 'Instagram',
        'Pin': 'Pinterest',
        'Amz': 'Amazon',
        'Gpt': 'ChatGPT',
        'Nf': 'Netflix',
        'Wh': 'WhatsApp',
        'Ud': 'Udistrital'
    }

    # Recolectar datos para análisis
    todos_los_datos = []
    datos_por_continente = defaultdict(list)
    datos_por_sitio = defaultdict(list)
    datos_por_pais = defaultdict(list)

    for clave, datos in datos_procesados.items():
        if not datos or not isinstance(datos, dict):
            continue

        partes = clave.split('_')
        if len(partes) >= 3:
            cod_continente = partes[0]
            pais = partes[1]
            cod_sitio = partes[2]
            
            # Extraer métricas de cada dataset
            metricas = extraer_metricas(datos)
            metricas['dataset_key'] = clave
            metricas['continente'] = cod_continente
            metricas['pais'] = pais
            metricas['sitio'] = cod_sitio
            
            todos_los_datos.append(metricas)
            datos_por_continente[cod_continente].append(metricas)
            datos_por_sitio[cod_sitio].append(metricas)
            datos_por_pais[pais].append(metricas)
    
    # Procesar estadísticas generales
    estadisticas["generales"] = calcular_estadisticas_generales(todos_los_datos)

    # Procesar estadisticas por continente 
    for cod_cont, datos_cont in datos_por_continente.items():
        nombre_cont = mapeo_continentes.get(cod_cont, cod_cont)
        estadisticas["por_continente"][nombre_cont] = {
            "codigo": cod_cont,
            "total_datasets": len(datos_cont),
            "estadisticas": calcular_estadisticas_grupo(datos_cont),
            "paises": list(set([d['pais'] for d in datos_cont])),
            "sitios": list(set([d['sitio'] for d in datos_cont]))
        }

    # Procesar estadísticas por sitio web
    for cod_sitio, datos_sitio in datos_por_sitio.items():
        nombre_sitio = mapeo_sitios.get(cod_sitio, cod_sitio)
        estadisticas["por_sitio_web"][nombre_sitio] = {
            "codigo": cod_sitio,
            "total_datasets": len(datos_sitio),
            "estadisticas": calcular_estadisticas_grupo(datos_sitio),
            "continentes": list(set([d['continente'] for d in datos_sitio])),
            "paises": list(set([d['pais'] for d in datos_sitio]))
        }
    
    # Procesar estadísticas por país
    for pais, datos_pais in datos_por_pais.items():
        estadisticas["por_pais"][pais] = {
            "total_datasets": len(datos_pais),
            "estadisticas": calcular_estadisticas_grupo(datos_pais),
            "continente": datos_pais[0]['continente'] if datos_pais else None,
            "sitios": list(set([d['sitio'] for d in datos_pais]))
        }

    # Procesar estadísticas comparativas
    estadisticas["comparativas"] = calcular_comparativas(
        datos_por_continente, datos_por_sitio, mapeo_continentes, mapeo_sitios
    )

    # Metadata
    estadisticas["metadata"] = {
        "total_datasets": len(todos_los_datos),
        "continentes_analizados": len(datos_por_continente),
        "sitios_analizados": len(datos_por_sitio),
        "paises_analizados": len(datos_por_pais),
        "fecha_procesamiento": "2025-06-20",  # Podrías usar datetime.now()
        "version": "2.0"
    }

    print(f"Estadísticas procesadas: {len(todos_los_datos)} datasets analizados")
    return estadisticas


def extraer_metricas(datos_dataset):
    """
    Extrae métricas de un dataset de traceroute, incluyendo detección de puntos muertos
    tanto por timeouts como por saltos faltantes en la numeración.
    """
    metricas = {
        "tiempo_promedio": None,
        "tiempo_minimo": None,
        "tiempo_maximo": None,
        "total_saltos": None,
        "saltos_exitosos": None,
        "puntos_muertos": None,
        "saltos_faltantes": None,  # Nueva métrica para saltos faltantes
        "porcentaje_exito": None,
        "latencia_acumulada": None,
        "variabilidad_latencia": None
    }

    try:
        # Nueva lógica para tu estructura
        if "route_data" in datos_dataset:
            hops = datos_dataset["route_data"]
            tiempos = []
            saltos_exitosos = 0
            puntos_muertos_timeout = 0
            saltos_faltantes = 0
            
            # Extraer números de salto para detectar faltantes
            numeros_salto = []
            
            for hop in hops:
                if isinstance(hop, dict):
                    # Obtener número de salto (asumiendo que está en 'hop', 'hop_number', 'num', etc.)
                    num_salto = hop.get("hop") or hop.get("hop_number") or hop.get("num")
                    if num_salto is not None:
                        try:
                            numeros_salto.append(int(num_salto))
                        except (ValueError, TypeError):
                            pass
                    
                    # Procesar tiempo
                    tiempo = hop.get("avg_time")
                    if tiempo is not None:
                        try:
                            tiempo = float(tiempo)
                            if tiempo > 0:
                                tiempos.append(tiempo)
                                saltos_exitosos += 1
                            else:
                                puntos_muertos_timeout += 1
                        except (ValueError, TypeError):
                            puntos_muertos_timeout += 1
                    else:
                        puntos_muertos_timeout += 1

            # Calcular saltos faltantes en la numeración
            if numeros_salto:
                numeros_salto.sort()
                salto_minimo = min(numeros_salto)
                salto_maximo = max(numeros_salto)
                
                # Crear secuencia completa esperada
                secuencia_esperada = set(range(salto_minimo, salto_maximo + 1))
                secuencia_real = set(numeros_salto)
                
                # Calcular saltos faltantes
                saltos_faltantes = len(secuencia_esperada - secuencia_real)
            
            # Calcular métricas de tiempo
            if tiempos:
                metricas["tiempo_promedio"] = round(mean(tiempos), 2)
                metricas["tiempo_minimo"] = round(min(tiempos), 2)
                metricas["tiempo_maximo"] = round(max(tiempos), 2)
                metricas["latencia_acumulada"] = round(sum(tiempos), 2)
                if len(tiempos) > 1:
                    metricas["variabilidad_latencia"] = round(stdev(tiempos), 2)

            # Asignar métricas
            metricas["total_saltos"] = len(hops)
            metricas["saltos_exitosos"] = saltos_exitosos
            metricas["saltos_faltantes"] = saltos_faltantes
            
            # Puntos muertos totales = timeouts + saltos faltantes
            metricas["puntos_muertos"] = puntos_muertos_timeout + saltos_faltantes

            # Calcular porcentaje de éxito considerando saltos faltantes
            if numeros_salto:
                salto_minimo = min(numeros_salto)
                salto_maximo = max(numeros_salto)
                total_saltos_esperados = salto_maximo - salto_minimo + 1
                metricas["porcentaje_exito"] = round((saltos_exitosos / total_saltos_esperados) * 100, 2)
            elif len(hops) > 0:
                metricas["porcentaje_exito"] = round((saltos_exitosos / len(hops)) * 100, 2)

        # Si los datos tienen otras estructuras, agregar más lógica aquí
        elif "hops" in datos_dataset:
            # Estructura alternativa (adaptar según sea necesario)
            hops = datos_dataset["hops"]
            tiempos = []
            saltos_exitosos = 0
            puntos_muertos_timeout = 0
            saltos_faltantes = 0
            
            # Similar lógica para estructura alternativa
            numeros_salto = []
            
            for i, hop in enumerate(hops):
                if isinstance(hop, dict):
                    num_salto = hop.get("hop_number", i + 1)  # Usar índice + 1 si no hay número
                    numeros_salto.append(num_salto)
                    
                    tiempo = hop.get("time") or hop.get("rtt")
                    if tiempo is not None and tiempo != "*":
                        try:
                            tiempo = float(tiempo)
                            if tiempo > 0:
                                tiempos.append(tiempo)
                                saltos_exitosos += 1
                            else:
                                puntos_muertos_timeout += 1
                        except (ValueError, TypeError):
                            puntos_muertos_timeout += 1
                    else:
                        puntos_muertos_timeout += 1
            
            # Calcular saltos faltantes
            if numeros_salto:
                secuencia_esperada = set(range(1, max(numeros_salto) + 1))
                secuencia_real = set(numeros_salto)
                saltos_faltantes = len(secuencia_esperada - secuencia_real)
            
            # Asignar métricas
            if tiempos:
                metricas["tiempo_promedio"] = round(mean(tiempos), 2)
                metricas["tiempo_minimo"] = round(min(tiempos), 2)
                metricas["tiempo_maximo"] = round(max(tiempos), 2)
                metricas["latencia_acumulada"] = round(sum(tiempos), 2)
                if len(tiempos) > 1:
                    metricas["variabilidad_latencia"] = round(stdev(tiempos), 2)
            
            metricas["total_saltos"] = len(hops)
            metricas["saltos_exitosos"] = saltos_exitosos
            metricas["saltos_faltantes"] = saltos_faltantes
            metricas["puntos_muertos"] = puntos_muertos_timeout + saltos_faltantes
            
            if numeros_salto:
                total_esperado = max(numeros_salto)
                metricas["porcentaje_exito"] = round((saltos_exitosos / total_esperado) * 100, 2)

    except Exception as e:
        print(f"Error extrayendo métricas: {e}")

    return metricas
    


def calcular_estadisticas_generales(todos_los_datos):
    if not todos_los_datos:
        return {}
    
    # Recolectar valores válidos
    tiempos_promedio = [d["tiempo_promedio"] for d in todos_los_datos if d["tiempo_promedio"] is not None]
    saltos_totales = [d["total_saltos"] for d in todos_los_datos if d["total_saltos"] is not None]
    porcentajes_exito = [d["porcentaje_exito"] for d in todos_los_datos if d["porcentaje_exito"] is not None]
    puntos_muertos = [d["puntos_muertos"] for d in todos_los_datos if d["puntos_muertos"] is not None]
    
    return {
        "tiempo_respuesta": {
            "promedio_global": round(mean(tiempos_promedio), 2) if tiempos_promedio else None,
            "mediana_global": round(median(tiempos_promedio), 2) if tiempos_promedio else None,
            "minimo_global": round(min(tiempos_promedio), 2) if tiempos_promedio else None,
            "maximo_global": round(max(tiempos_promedio), 2) if tiempos_promedio else None,
            "desviacion_estandar": round(stdev(tiempos_promedio), 2) if len(tiempos_promedio) > 1 else None
        },
        "saltos": {
            "promedio_saltos": round(mean(saltos_totales), 2) if saltos_totales else None,
            "mediana_saltos": median(saltos_totales) if saltos_totales else None,
            "minimo_saltos": min(saltos_totales) if saltos_totales else None,
            "maximo_saltos": max(saltos_totales) if saltos_totales else None
        },
        "confiabilidad": {
            "porcentaje_exito_promedio": round(mean(porcentajes_exito), 2) if porcentajes_exito else None,
            "total_puntos_muertos": sum(puntos_muertos) if puntos_muertos else 0,
            "promedio_puntos_muertos": round(mean(puntos_muertos), 2) if puntos_muertos else None
        },
        "cobertura": {
            "total_mediciones": len(todos_los_datos),
            "mediciones_exitosas": len([d for d in todos_los_datos if d["tiempo_promedio"] is not None])
        }
    }

def calcular_estadisticas_grupo(datos_grupo):
    if not datos_grupo:
        return {}
    
    tiempos = [d["tiempo_promedio"] for d in datos_grupo if d["tiempo_promedio"] is not None]
    saltos = [d["total_saltos"] for d in datos_grupo if d["total_saltos"] is not None]
    porcentajes = [d["porcentaje_exito"] for d in datos_grupo if d["porcentaje_exito"] is not None]
    
    return {
        "rendimiento": {
            "tiempo_promedio": round(mean(tiempos), 2) if tiempos else None,
            "tiempo_mediana": round(median(tiempos), 2) if tiempos else None,
            "mejor_tiempo": round(min(tiempos), 2) if tiempos else None,
            "peor_tiempo": round(max(tiempos), 2) if tiempos else None,
            "variabilidad": round(stdev(tiempos), 2) if len(tiempos) > 1 else None
        },
        "conectividad": {
            "saltos_promedio": round(mean(saltos), 2) if saltos else None,
            "saltos_minimos": min(saltos) if saltos else None,
            "saltos_maximos": max(saltos) if saltos else None,
            "exito_promedio": round(mean(porcentajes), 2) if porcentajes else None
        },
        "volumen": {
            "total_mediciones": len(datos_grupo),
            "mediciones_validas": len(tiempos)
        }
    }


def calcular_comparativas(datos_por_continente, datos_por_sitio, mapeo_continentes, mapeo_sitios):
    comparativas = {
        "ranking_continentes": {},
        "ranking_sitios": {},
        "mejores_conexiones": {},
        "analisis_geografico": {}
    }
    
    # Ranking de continentes por tiempo de respuesta
    ranking_cont = []
    for cod_cont, datos in datos_por_continente.items():
        tiempos = [d["tiempo_promedio"] for d in datos if d["tiempo_promedio"] is not None]
        if tiempos:
            ranking_cont.append({
                "continente": mapeo_continentes.get(cod_cont, cod_cont),
                "codigo": cod_cont,
                "tiempo_promedio": round(mean(tiempos), 2),
                "total_mediciones": len(datos)
            })
    
    ranking_cont.sort(key=lambda x: x["tiempo_promedio"])
    comparativas["ranking_continentes"] = {
        "por_velocidad": ranking_cont,
        "mas_rapido": ranking_cont[0] if ranking_cont else None,
        "mas_lento": ranking_cont[-1] if ranking_cont else None
    }
    
    # Ranking de sitios web por tiempo de respuesta
    ranking_sitios = []
    for cod_sitio, datos in datos_por_sitio.items():
        tiempos = [d["tiempo_promedio"] for d in datos if d["tiempo_promedio"] is not None]
        if tiempos:
            ranking_sitios.append({
                "sitio": mapeo_sitios.get(cod_sitio, cod_sitio),
                "codigo": cod_sitio,
                "tiempo_promedio": round(mean(tiempos), 2),
                "total_mediciones": len(datos)
            })
    
    ranking_sitios.sort(key=lambda x: x["tiempo_promedio"])
    comparativas["ranking_sitios"] = {
        "por_velocidad": ranking_sitios,
        "mas_rapido": ranking_sitios[0] if ranking_sitios else None,
        "mas_lento": ranking_sitios[-1] if ranking_sitios else None
    }
    
    return comparativas

# Función auxiliar para generar reportes
def generar_reporte_estadisticas(estadisticas, formato="resumen"):
    """
    Genera un reporte legible de las estadísticas.
    
    Args:
        estadisticas (dict): Estadísticas procesadas
        formato (str): "resumen" o "completo"
        
    Returns:
        str: Reporte formateado
    """
    if formato == "resumen":
        # Safely extract values with fallbacks
        metadata = estadisticas.get('metadata', {})
        generales = estadisticas.get('generales', {})
        tiempo_respuesta = generales.get('tiempo_respuesta', {})
        comparativas = estadisticas.get('comparativas', {})
        
        # Safe extraction for continent ranking
        ranking_continentes = comparativas.get('ranking_continentes', {})
        mejor_continente = ranking_continentes.get('mas_rapido')
        
        # Safe extraction for site ranking
        ranking_sitios = comparativas.get('ranking_sitios', {})
        mejor_sitio = ranking_sitios.get('mas_rapido')
        
        reporte = f"""
=== REPORTE DE ESTADÍSTICAS DE TRACEROUTE ===

📊 ESTADÍSTICAS GENERALES:
• Total de mediciones: {metadata.get('total_datasets', 'N/A')}
• Continentes analizados: {metadata.get('continentes_analizados', 'N/A')}
• Sitios web analizados: {metadata.get('sitios_analizados', 'N/A')}

⚡ RENDIMIENTO GLOBAL:
• Tiempo promedio: {tiempo_respuesta.get('promedio_global', 'N/A')} ms
• Mejor tiempo: {tiempo_respuesta.get('minimo_global', 'N/A')} ms
• Peor tiempo: {tiempo_respuesta.get('maximo_global', 'N/A')} ms

🌍 MEJOR CONTINENTE: {mejor_continente['continente'] if mejor_continente else 'Sin datos disponibles'} 
   ({mejor_continente['tiempo_promedio'] if mejor_continente else 'N/A'} ms)

🏆 MEJOR SITIO WEB: {mejor_sitio['sitio'] if mejor_sitio else 'Sin datos disponibles'} 
   ({mejor_sitio['tiempo_promedio'] if mejor_sitio else 'N/A'} ms)
"""
        return reporte
    
    return json.dumps(estadisticas, indent=2, ensure_ascii=False)