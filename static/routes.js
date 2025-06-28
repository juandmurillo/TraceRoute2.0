class MapboxRouteVisualizer {
    constructor(mapboxToken) {
        this.mapboxToken = mapboxToken;
        this.map = null;
        this.markers = [];
        this.lines = [];
    }

    initializeMap(routeData) {
        // Si el mapa ya existe, limpiarlo antes de volver a pintar
        if (this.map) {
            this.clearMap();
        }

        mapboxgl.accessToken = this.mapboxToken;

        // Obtener las coordenadas del primer salto válido
        const firstValidHop = routeData.route_data.find(hop => hop.ip_info && hop.ip_info.lat !== 0 && hop.ip_info.lon !== 0);
        const defaultCenter = firstValidHop
            ? [firstValidHop.ip_info.lon, firstValidHop.ip_info.lat] // Usar el primer salto válido
            : [-74.072092, 4.710989]; // Bogotá, Colombia como valor predeterminado

        // Crear el mapa si no existe
        if (!this.map) {
            this.map = new mapboxgl.Map({
                container: 'map', // ID del contenedor del mapa
                style: 'mapbox://styles/mapbox/streets-v11', // Estilo del mapa
                center: defaultCenter, // Centrar el mapa en el primer salto válido o Bogotá
                zoom: 2 // Nivel de zoom inicial
            });

            // Añadir la ruta cuando el mapa esté listo
            this.map.on('load', () => {
                this.addRouteToMap(routeData);
            });
        } else {
            // Si el mapa ya existe, simplemente añadir la ruta
            this.addRouteToMap(routeData);
        }
    }

    addRouteToMap(routeData) {
        const coordinates = routeData.route_data
            .filter(hop => hop.ip_info) // Filtra los saltos que tienen información de ubicación
            .map(hop => {
                // Si la latitud o longitud es cero, usar Bogotá, Colombia
                const lat = hop.ip_info.lat === 0 ? 4.710989 : hop.ip_info.lat;
                const lon = hop.ip_info.lon === 0 ? -74.072092 : hop.ip_info.lon;
                return [lon, lat];
            });

        // Añadir o actualizar la línea curva que conecta los saltos
        if (this.map.getSource('route')) {
            this.map.getSource('route').setData({
                'type': 'Feature',
                'properties': {},
                'geometry': {
                    'type': 'LineString',
                    'coordinates': coordinates
                }
            });
        } else {
            this.map.addSource('route', {
                'type': 'geojson',
                'data': {
                    'type': 'Feature',
                    'properties': {},
                    'geometry': {
                        'type': 'LineString',
                        'coordinates': coordinates
                    }
                }
            });

            this.map.addLayer({
                'id': 'route',
                'type': 'line',
                'source': 'route',
                'layout': {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                'paint': {
                    'line-color': '#ff9900',
                    'line-width': 2
                }
            });
        }

        // Añadir marcadores numerados para cada salto
        routeData.route_data.forEach((hop, index) => {
            if (hop.ip_info) {
                const el = document.createElement('div');
                el.className = 'marker';
                el.textContent = hop.hop;

                // Si la latitud o longitud es cero, usar Bogotá, Colombia
                const lat = hop.ip_info.lat === 0 ? 4.710989 : hop.ip_info.lat;
                const lon = hop.ip_info.lon === 0 ? -74.072092 : hop.ip_info.lon;

                const marker = new mapboxgl.Marker(el)
                    .setLngLat([lon, lat])
                    .addTo(this.map);

                this.markers.push(marker); // Guardar el marcador para poder eliminarlo después
            }
        });
    }

    clearMap() {
        // Eliminar la capa de la ruta si existe
        if (this.map.getLayer('route')) {
            this.map.removeLayer('route');
        }

        // Eliminar la fuente de la ruta si existe
        if (this.map.getSource('route')) {
            this.map.removeSource('route');
        }

        // Eliminar todos los marcadores
        this.markers.forEach(marker => marker.remove());
        this.markers = []; // Reiniciar la lista de marcadores
    }
}

// Variable global para la ruta actual
let route = 'api/Local_Amz';

// Instancia del visualizador de mapas
const token = 'pk.eyJ1IjoianVhbmRtc3RyIiwiYSI6ImNtNnIzZWQwNjF5MXcya3B4Mm91aXY5cjAifQ.axPrN5IHnXYHlvaXDRGVXg';
const visualizer = new MapboxRouteVisualizer(token);

// Función para cargar los datos y actualizar el mapa
function loadDataAndUpdateMap(newRoute) {
    fetch(newRoute)
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la solicitud: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            // Actualizar la tabla
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

// Función para actualizar la tabla con los datos de la ruta
function updateTable(data) {
    const tableBody = document.querySelector('.dataTable tbody');
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
    });
}

// Función para manejar la selección del menú
function handleMenuSelection(button, newRoute) {
    // Remover la clase 'selected' de todos los botones
    document.querySelectorAll('.menu-button').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Añadir la clase 'selected' al botón actual
    button.classList.add('selected');

    // Actualizar la ruta y cargar los nuevos datos
    route = newRoute;
    loadDataAndUpdateMap(route);
    console.log(route)
}

// Cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function () {
    // Cargar los datos iniciales
    loadDataAndUpdateMap(route);


    // Configurar los event listeners para los botones del menú
    document.querySelectorAll('.menu_button').forEach(button => {
        button.addEventListener('click', function () {
            // Eliminar la selección anterior
            document.querySelectorAll('.menu_button.selected').forEach(btn => {
                btn.classList.remove('selected');
            });
            document.querySelectorAll('.icon-container a.selec').forEach(btn => {
                btn.classList.remove('selec');
                unSelecButton(btn);
            });
            initButton();

            // Obtener la nueva ruta y manejar la selección
            const newRoute = this.dataset.route;
            handleMenuSelection(this, newRoute);
            console.log(route)
        });
    });

    // Configurar los event listeners para los botones del icon-container
    document.querySelectorAll('.icon-container a').forEach(button => {
        button.addEventListener('click', function () {
            // Remover 'selected' de todos los botones en icon-container
            document.querySelectorAll('.icon-container a.selec').forEach(btn => {
                btn.classList.remove('selec');
                unSelecButton(btn);
            });

            // Añadir 'selected' al botón actual
            this.classList.add('selec');
            selecButton();

            // Modificar la ruta: mantener todo hasta el último '_' y concatenar el nuevo valor
            route = route.substring(0, route.lastIndexOf('_') + 1) + this.dataset.route;
            console.log(route)

            // Cargar los datos con la nueva ruta
            loadDataAndUpdateMap(route);
        });
    });

    // Inicializar los botones
    selecButton();
});

// Funciones para manejar los estilos de los botones
function initButton() {
    document.querySelectorAll('.icon-container a').forEach(btn => {
        if (btn.dataset.route == 'Amz') {
            btn.querySelector('i').classList.add('amz');
            btn.classList.add('selec');
        }
        if (btn.dataset.route == 'Ig') {
            btn.querySelector('i').classList.remove('ig');
        }
        if (btn.dataset.route == 'Pin') {
            btn.querySelector('i').classList.remove('pin');
        }
    });
}

function selecButton() {
    document.querySelectorAll('.icon-container a.selec').forEach(btn => {
        if (btn.dataset.route == 'Amz') {
            btn.querySelector('i').classList.add('amz');
        }
        if (btn.dataset.route == 'Ig') {
            btn.querySelector('i').classList.add('ig');
        }
        if (btn.dataset.route == 'Pin') {
            btn.querySelector('i').classList.add('pin');
        }
    });
}

function unSelecButton(btn) {
    if (btn.dataset.route == 'Amz') {
        btn.querySelector('i').classList.remove('amz');
    }
    if (btn.dataset.route == 'Ig') {
        btn.querySelector('i').classList.remove('ig');
    }
    if (btn.dataset.route == 'Pin') {
        btn.querySelector('i').classList.remove('pin');
    }
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