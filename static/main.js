// Funcionalidad

function ListaExpandible(codigo) {
    const list = document.getElementById('lista_' + codigo);
    const arrow = document.getElementById('flecha_' + codigo);

    if (list.style.display === 'block') {
        list.style.display = 'none';
        arrow.classList.remove('rotate');
        arrow.textContent = '›';
    } else {
        list.style.display = 'block';
        arrow.classList.add('rotate');
        arrow.textContent = '‹';
    }
}

// Clase control mapa

class MapboxRouteVisualizer {
    constructor(mapboxToken) {
        this.mapboxToken = mapboxToken;
        this.map = null;
        this.markers = [];
        this.animationFrameId = null;
        this.currentStep = 0;
    }

    initializeMap(routeData) {
        // Si el mapa ya existe, limpiarlo antes de volver a pintar
        if (this.map) {
            this.clearMap();
        }

        mapboxgl.accessToken = this.mapboxToken;

        // Obtener las coordenadas del primer salto válido
        const firstValidHop = routeData.route_data.find(hop => 
            hop.ip_info && hop.ip_info.lat && hop.ip_info.lon && 
            hop.ip_info.lat !== 0 && hop.ip_info.lon !== 0
        );
        
        // Si no se encuentra un salto válido, usar coordenadas por defecto
        const defaultCenter = firstValidHop ? 
            [firstValidHop.ip_info.lon, firstValidHop.ip_info.lat] : 
            [0, 0];

        // Crear el mapa si no existe
        if (!this.map) {
            this.map = new mapboxgl.Map({
                container: 'map',
                style: 'mapbox://styles/mapbox/streets-v11', 
                center: defaultCenter,
                zoom: 1
            });

            // Añadir controles de navegación
            this.map.addControl(new mapboxgl.NavigationControl(), 'top-right');

            // Añadir la ruta cuando el mapa esté listo
            this.map.on('load', () => {
                this.prepareAndAddRoute(routeData);
            });
        } else {
            // Si el mapa ya existe, simplemente añadir la ruta
            this.prepareAndAddRoute(routeData);
        }
    }

    prepareAndAddRoute(routeData) {
        // Filtrar y validar los datos de los saltos
        const validHops = routeData.route_data.filter(hop => 
            hop.ip_info && 
            hop.ip_info.lat && hop.ip_info.lon && 
            hop.ip_info.lat !== 0 && hop.ip_info.lon !== 0
        );

        // Generar coordenadas para la ruta
        const coordinates = validHops.map(hop => [
            hop.ip_info.lon || hop.lon,
            hop.ip_info.lat || hop.lat
        ]);

        // Si no hay suficientes coordenadas, no continuar
        if (coordinates.length < 2) {
            console.error('No hay suficientes coordenadas válidas para crear una ruta');
            return;
        }

        // Añadir marcadores estilizados con sombra
        this.addCustomMarkers(validHops);

        // Crear puntos de control para la curva de Bézier
        const curvedCoordinates = this.createCurvedLine(coordinates);

        // Preparar las fuentes y capas para la animación
        this.setupRouteLayers(curvedCoordinates);
        
        // Ajustar la vista para que se vean todos los puntos
        this.fitMapToRoute(coordinates);
        
        // Iniciar la animación de la línea
        this.animateRoute(curvedCoordinates);
    }

    fitMapToRoute(coordinates) {
    if (coordinates.length > 1) {
        // Crear un bounds que contenga todos los puntos
        const bounds = new mapboxgl.LngLatBounds();
        
        // Añadir todos los puntos al bounds
        coordinates.forEach(coord => {
            bounds.extend(coord);
        });
        
        // Comprobar si la ruta cruza el meridiano (línea de fecha internacional)
        let crossesAntimeridian = false;
        for (let i = 0; i < coordinates.length - 1; i++) {
            const lngDiff = Math.abs(coordinates[i][0] - coordinates[i+1][0]);
            if (lngDiff > 180) {
                crossesAntimeridian = true;
                break;
            }
        }
        
        // Si cruza el meridiano o es una ruta muy extensa, usar un enfoque alternativo
        if (crossesAntimeridian || bounds.getEast() - bounds.getWest() > 180) {
            // Ajustar a una vista global
            this.map.setCenter([0, 0]);
            this.map.setZoom(1); // Zoom out para ver todo el mundo
        } else {
            // Para rutas normales, ajustar vista con padding
            this.map.fitBounds(bounds, {
                padding: {
                    top: 70,
                    bottom: 70,
                    left: 70,
                    right: 70
                },
                duration: 800,  // Duración de la transición
                maxZoom: 3      // Limitar el zoom máximo
            });
        }
    }
}

    createCurvedLine(coordinates) {
        const curvedCoordinates = [];
        
        // Para cada par de puntos consecutivos, generar una curva suave
        for (let i = 0; i < coordinates.length - 1; i++) {
            const start = coordinates[i];
            const end = coordinates[i + 1];
            
            // Determinar la ruta más corta para el cruce del meridiano
            const adjustedEnd = this.getShortestPathPoint(start, end);
            
            // Calcular punto de control para la curva
            const controlPoint = this.getControlPoint(start, adjustedEnd);
            
            // Generar puntos para la curva cuadrática de Bézier
            const curvePoints = this.quadraticBezierCurve(start, controlPoint, adjustedEnd, 50);
            
            // Añadir todos los puntos, evitando duplicar el punto de conexión
            curvedCoordinates.push(...(i === 0 ? curvePoints : curvePoints.slice(1)));
        }
        
        return curvedCoordinates;
    }

    getShortestPathPoint(start, end) {
        const adjustedEnd = [...end];
        let diffLng = end[0] - start[0];
        
        // Si la diferencia es mayor a 180 grados, es más corto ir por el otro lado
        if (Math.abs(diffLng) > 180) {
            if (diffLng > 0) {
                adjustedEnd[0] = end[0] - 360;
            } else {
                adjustedEnd[0] = end[0] + 360;
            }
        }
        
        return adjustedEnd;
    }

    getControlPoint(start, end) {
        // Calcular punto medio
        const mid = [
            (start[0] + end[0]) / 2,
            (start[1] + end[1]) / 2
        ];
        
        // Calcular vector perpendicular para dar curvatura
        const dx = end[0] - start[0];
        const dy = end[1] - start[1];
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // La curvatura es proporcional a la distancia
        const curveFactor = Math.min(distance / 10, 2);
        
        // Crear punto de control elevado
        return [
            mid[0] - dy * curveFactor / 5, 
            mid[1] + dx * curveFactor / 5
        ];
    }

    quadraticBezierCurve(p0, p1, p2, segments) {
        const points = [];
        
        // Generar puntos a lo largo de la curva de Bézier
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const x = Math.pow(1-t, 2) * p0[0] + 2 * (1-t) * t * p1[0] + Math.pow(t, 2) * p2[0];
            const y = Math.pow(1-t, 2) * p0[1] + 2 * (1-t) * t * p1[1] + Math.pow(t, 2) * p2[1];
            points.push([x, y]);
        }
        
        // Asegurar que el último punto es exactamente el punto final
        if (points.length > 0) {
            points[points.length - 1] = [p2[0], p2[1]];
        }
        
        return points;
    }

    setupRouteLayers(coordinates) {
        // Eliminar capas y fuentes existentes
        ['route-animation', 'route-line', 'route-shadow'].forEach(id => {
            if (this.map.getLayer(id)) this.map.removeLayer(id);
            if (this.map.getSource(id)) this.map.removeSource(id);
        });

        // Procesar coordenadas para evitar problemas con el meridiano
        const wrappedCoordinates = this.wrapCoordinates(coordinates);

        // Añadir fuente para la sombra de la línea
        this.map.addSource('route-shadow', {
            'type': 'geojson',
            'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': wrappedCoordinates
                }
            }
        });

        // Añadir fuente para la línea completa
        this.map.addSource('route-line', {
            'type': 'geojson',
            'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': wrappedCoordinates
                }
            }
        });

        // Añadir capa para la línea completa (fondo)
        this.map.addLayer({
            'id': 'route-line',
            'type': 'line',
            'source': 'route-line',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#ff9900',
                'line-width': 3,
                'line-opacity': 0.6
            }
        });

        // Añadir fuente para la animación
        this.map.addSource('route-animation', {
            'type': 'geojson',
            'data': {
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': [wrappedCoordinates[0]] // Comenzar con el primer punto
                }
            }
        });

        // Añadir capa para la línea animada (más brillante)
        this.map.addLayer({
            'id': 'route-animation',
            'type': 'line',
            'source': 'route-animation',
            'layout': {
                'line-join': 'round',
                'line-cap': 'round'
            },
            'paint': {
                'line-color': '#ffaa00',
                'line-width': 5,
                'line-opacity': 1
            }
        });
    }

    wrapCoordinates(coordinates) {
        if (coordinates.length <= 1) return coordinates;
        
        const wrappedCoords = [coordinates[0]];
        
        for (let i = 1; i < coordinates.length; i++) {
            const prevPoint = wrappedCoords[wrappedCoords.length - 1];
            const currentPoint = coordinates[i];
            const wrappedPoint = this.getShortestPathPoint(prevPoint, currentPoint);
            wrappedCoords.push(wrappedPoint);
        }
        
        return wrappedCoords;
    }

    addCustomMarkers(hops) {
        // Eliminar marcadores existentes
        this.markers.forEach(marker => marker.remove());
        this.markers = [];

        hops.forEach((hop, index) => {
            // Crear elemento personalizado para el pin con sombra
            const el = document.createElement('div');
            el.className = 'custom-marker';
            el.innerHTML = `
                <div style="position: relative;">
                    <!-- Sombra del pin -->
                    <div style="
                        position: absolute;
                        top: 3px;
                        left: 3px;
                        width: 30px;
                        height: 45px;
                        background-image: url(data:image/svg+xml;base64,${btoa(`
                            <svg width="30" height="45" viewBox="0 0 30 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 0C6.75 0 0 6.75 0 15C0 26.25 15 45 15 45C15 45 30 26.25 30 15C30 6.75 23.25 0 15 0Z" fill="#000000" opacity="0.3"/>
                            </svg>
                        `)});
                        background-size: contain;
                        background-repeat: no-repeat;
                        filter: blur(2px);
                        z-index: 1;
                    "></div>
                    <!-- Pin principal -->
                    <div style="
                        position: relative;
                        width: 30px;
                        height: 45px;
                        background-image: url(data:image/svg+xml;base64,${btoa(`
                            <svg width="30" height="45" viewBox="0 0 30 45" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M15 0C6.75 0 0 6.75 0 15C0 26.25 15 45 15 45C15 45 30 26.25 30 15C30 6.75 23.25 0 15 0Z" fill="#FF9900"/>
                                <circle cx="15" cy="15" r="7.5" fill="white"/>
                                <text x="15" y="18" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle" fill="#000">${hop.hop}</text>
                            </svg>
                        `)});
                        background-size: contain;
                        background-repeat: no-repeat;
                        cursor: pointer;
                        z-index: 2;
                    "></div>
                </div>
            `;

            // Obtener las coordenadas
            const lat = hop.ip_info.lat || 0;
            const lon = hop.ip_info.lon || 0;

            // Crear y añadir el marcador
            const marker = new mapboxgl.Marker(el)
                .setLngLat([lon, lat])
                .setPopup(new mapboxgl.Popup({ offset: 25 })
                    .setHTML(`
                        <h3>Hop ${hop.hop}</h3>
                        <p>IP: ${hop.ip || 'N/A'}</p>
                        <p>Ubicación: ${hop.ip_info.city || ''} ${hop.ip_info.country_name || 'Desconocida'}</p>
                    `))
                .addTo(this.map);

            this.markers.push(marker);
        });
    }

    animateRoute(curvedCoordinates) {
        // Cancelar animación anterior si existe
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        // Procesar las coordenadas para el mapa
        const wrappedCoordinates = this.wrapCoordinates(curvedCoordinates);
        
        // Configuración de la animación
        const totalDuration = 8000; // Duración total en milisegundos
        const startTime = Date.now();
        
        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / totalDuration, 1);
            
            // Calcular el índice actual basado en el progreso
            const targetStep = Math.floor(progress * (wrappedCoordinates.length - 1)) + 1;
            this.currentStep = Math.min(targetStep, wrappedCoordinates.length - 1);
            
            // Actualizar la línea de animación
            this.map.getSource('route-animation').setData({
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': wrappedCoordinates.slice(0, this.currentStep + 1)
                }
            });
            
            // Continuar animación si no ha terminado
            if (progress < 1) {
                this.animationFrameId = requestAnimationFrame(animate);
            }
        };

        // Iniciar la animación
        this.animationFrameId = requestAnimationFrame(animate);
    }

    clearMap() {
        // Cancelar animación si existe
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Eliminar capas y fuentes
        if (this.map) {
            const layers = ['route-animation', 'route-line', 'route-shadow'];
            const sources = ['route-animation', 'route-line', 'route-shadow'];
            
            layers.forEach(layer => {
                if (this.map.getLayer(layer)) {
                    this.map.removeLayer(layer);
                }
            });
            
            sources.forEach(source => {
                if (this.map.getSource(source)) {
                    this.map.removeSource(source);
                }
            });
        }

        // Eliminar todos los marcadores
        this.markers.forEach(marker => marker.remove());
        this.markers = [];
        
        // Reiniciar variables de estado
        this.currentStep = 0;
    }
}

// Control de rutas 

// Variable global para la ruta actual 
let route = 'api/NA_Guadalajara_Yt'

// Instancia del visualizador de mapas
const token = 'pk.eyJ1IjoianVhbmRtc3RyIiwiYSI6ImNtNnIzZWQwNjF5MXcya3B4Mm91aXY5cjAifQ.axPrN5IHnXYHlvaXDRGVXg';
const visualizer = new MapboxRouteVisualizer(token);

// Cargar los datos
function loadData(newRoute) {
    fetch(newRoute)
        .then(Response => {
            if (!Response.ok) {
                throw new Error('Error en la solucitud: ' + Response.statusText);
            }
            return Response.json();
        })
        .then(data => {
            //Actualizar la tabla 
            updateTable(data);
            // Actualizar el mapa
            visualizer.initializeMap(data);
        })
        .catch(error => {
            console.error('Error al obtener los datos:', error);
            const container = document.getElementById('data-container');
            if (container) {
                container.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            }
        });
}

// Actualizar tabla con nueva ruta 
function updateTable(data) {
    document.getElementById('tableTitle').textContent = `Ruta desde ${data.stats.server_name} a ${data.stats.site_name} `
    const tableBody = document.querySelector('.dataTable tbody')
    tableBody.innerHTML = '';

    data.route_data.forEach(hop => {
        const row = document.createElement('tr');

        const cellHop = document.createElement('td');
        cellHop.textContent = hop.hop;
        row.appendChild(cellHop);

        const cellIp = document.createElement('td');
        cellIp.textContent = hop.ip;
        row.appendChild(cellIp);

        const cellAvgTime = document.createElement('td');
        cellAvgTime.textContent = hop.avg_time.toFixed(2) + ' ms';
        row.appendChild(cellAvgTime);

        const cellOrg = document.createElement('td');
        cellOrg.textContent = hop.ip_info ? hop.ip_info.org : 'N/A';
        row.appendChild(cellOrg);

        tableBody.appendChild(row);
    })
}

// Servidor seleccionado
function serverSelection(button, newRoute) {
    document.querySelectorAll('.menu_button').forEach(btn => {
        btn.classList.remove('selected_web');
    })

    button.classList.add('selected_web');

    // Obtener el sitio web actualmente seleccionado
    const currentWebsite = getCurrentSelectedWebsite();
    
    // Construir la nueva ruta manteniendo el sitio web actual
    const routeParts = newRoute.split('_');
    route = `${routeParts[0]}_${routeParts[1]}_${currentWebsite}`;
    
    loadData(route);
    console.log(route);
}

// Inicializar sitio web 
function initWebBtn() {
     document.querySelectorAll('.web_site_card a').forEach(btn => {
        if (btn.dataset.route == 'Yt') {
            btn.classList.add('web_selected');
        }else{
            btn.classList.remove('web_selected');
        }
     })
}

// Sitio web seleccionado 
function webSelection(button){
    document.querySelectorAll('.web_site_card a').forEach(btn => {
        btn.classList.remove('web_selected')
    })
    button.classList.add('web_selected');

    route = route.substring(0, route.lastIndexOf('_') + 1) + button.dataset.route;
    console.log(route)

    loadData(route)
}


// Cuando el Dom esté listo 
document.addEventListener('DOMContentLoaded', function() {

    // Cargar los datos iniciales 
    loadData(route);

    initWebBtn();

    // Listeners de los servidores 
    document.querySelectorAll('.menu_button').forEach(button => {
        button.addEventListener('click', function() {
            console.log('click')
            // Eliminar seleccion anterior 
            document.querySelectorAll('.menu_button.selected_web').forEach(btn => {
                btn.classList.remove('selected_web');
            })
            
            // Obtener la nueva ruta y manejar la selección
            const newRoute = this.dataset.route;
            serverSelection(this, newRoute);
            console.log(route)
        })
    })

    // Listeners de los sitios web 
    document.querySelectorAll('.web_site_card a').forEach(button => {
        button.addEventListener('click', function() {
            webSelection(button);
        })
    })
})

function getCurrentSelectedWebsite() {
    const selectedBtn = document.querySelector('.web_site_card a.web_selected');
    return selectedBtn ? selectedBtn.dataset.route : 'Yt'; // Por defecto YouTube
}



// Logica para descargar los datos en un txt 


// Formatea el TXT
function formatRouteData(data) {
    let formattedText = '';

    // Función para manejar valores null
    const handleNull = (value) => value === null ? 'null' : value;

    // Información general

    formattedText += `Nombre del sitio: ${handleNull(data.stats.site_name)}\n`;
    formattedText += `Nombre del servidor: ${handleNull(data.stats.server_name)}\n`;
    formattedText += `Total saltos: ${handleNull(data.stats.total_hops)}\n`;
    formattedText += `Tiempo promedio de respuesta: ${handleNull(data.stats.avg_response_time)} ms\n\n`;

    // Información del primer y último hop
    formattedText += `Primer salto:\n`;
    formattedText += `  IP: ${handleNull(data.stats.first_hop.ip)}\n`;
    if (data.stats.first_hop.location != null) {
        formattedText += `  Ubicación: ${handleNull(data.stats.first_hop.location.city)}, ${handleNull(data.stats.first_hop.location.country)}\n`;
    }
    formattedText += `  Tiempo: ${handleNull(data.stats.first_hop.time)} ms\n\n`;

    formattedText += `Último salto:\n`;
    formattedText += `  IP: ${handleNull(data.stats.last_hop.ip)}\n`;
    formattedText += `  Ubicación: ${handleNull(data.stats.last_hop.location.city)}, ${handleNull(data.stats.last_hop.location.country)}\n`;
    formattedText += `  Tiempo: ${handleNull(data.stats.last_hop.time)} ms\n\n`;

    // Detalles de cada hop
    formattedText += `Detalles de la ruta:\n`;
    data.route_data.forEach(hop => {
        if (hop.ip_info != null) {
            formattedText += `Salto ${handleNull(hop.hop)}:\n`;
            formattedText += `  IP: ${handleNull(hop.ip)}\n`;
            formattedText += `  Ubicación: ${handleNull(hop.ip_info.city)}, ${handleNull(hop.ip_info.country)}\n`;
            formattedText += `  Organización: ${handleNull(hop.ip_info.org)}\n`;
            formattedText += `  Tiempo promedio: ${handleNull(hop.avg_time)} ms\n`;
            formattedText += `  Tiempos: ${handleNull(hop.time1)} ms, ${handleNull(hop.time2)} ms, ${handleNull(hop.time3)} ms\n\n`;
        }

    });

    return formattedText;
}

function downloadTextFile(filename, text) {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function convertirNombreRuta(ruta) {
    ruta = ruta.slice(5);
    return 'informe-' + ruta;
}

function generateAndDownloadRouteData() {
    routeData = route;
    formattedText = '';

    fetch(routeData)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la solicitud: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            formattedText = formatRouteData(data);
            downloadTextFile(convertirNombreRuta(routeData) + '.txt', formattedText);
        })
        .catch(error => {
            console.error('Error al obtener los datos:', error);
            const container = document.getElementById('data-container');
            if (container) {
                container.innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            }
        });


}

document.getElementById('downloadButton').addEventListener('click', generateAndDownloadRouteData);


