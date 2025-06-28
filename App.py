from flask import Flask, render_template, jsonify, abort
from TraceRutes import getFullTraces
from ProcessStats import procesar_estadisticas, generar_reporte_estadisticas

app = Flask(__name__)


# Procesar datos al iniciar el servidor

print("Cargando datos...")   
datos_procesados = getFullTraces()
# Estadisticas
estadisticas = procesar_estadisticas(datos_procesados)

print(f"Servidor listo con {len(datos_procesados)} datasets cargados")


# Rutas estaticas
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/old')
def before():
    return render_template('old.html')

@app.route('/stats')
def stats():
    return render_template('stats.html')

# Endpoint estadisticas
@app.route('/api/report')
def get_report():
    return generar_reporte_estadisticas(estadisticas, "resumen")
@app.route('/api/estadisticas')
def get_estadisticas():
    return estadisticas

## Rutas dinamicas 
@app.route('/api/<dataset_key>')
def get_dataset(dataset_key):
    if dataset_key in datos_procesados:
        return jsonify(datos_procesados[dataset_key])
    else:
        abort(404, description=f"Dataset '{dataset_key}' no encontrado")


 
# Main
if __name__ == '__main__':
    print("Iniciando servidor Flask...")
    app.run(port = 10000, debug = False)
