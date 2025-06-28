// Códigos de sitios web 
const serviceCodes = {
    'Yt': 'YouTube',
    'Fb': 'Facebook',
    'Ig': 'Instagram',
    'Pin': 'Pinterest',
    'Amz': 'Amazon',
    'Gpt': 'ChatGPT',
    'Nf': 'Netflix',
    'Wh': 'Whatsapp',
    'Ud': 'Udistrital'
};

// Estructura de datos de continentes y ciudades
const continentsData = {
    'NA': {
        name: 'Norte América',
        cities: ['Guadalajara', 'Honolulu', 'Montreal', 'Nueva York', 'San Diego', 'Seattle', 'Tampa', 'Vancouver']
    },
    'SA': {
        name: 'Sur América',
        cities: ['Buenos Aires', 'Sao Paulo', 'Bogotá']
    },
    'EU': {
        name: 'Europa',
        cities: ['Amsterdam', 'Berlin', 'Bruselas', 'Dublin', 'Edimburgo', 'Eindhoven', 'Frankfurt',
            'Gotemburgo', 'Groninga', 'Hamburgo', 'Leipzig', 'London', 'Milan', 'Paris', 'Roma']
    },
    'OC': {
        name: 'Oceanía',
        cities: ['Sídney', 'Auckland']
    },
    'AS': {
        name: 'Asia',
        cities: ['Beijing', 'Hong Kong', 'Jakarta', 'Nueva Delhi', 'Seul', 'Singapur', 'Tel Aviv', 'Tokyo']
    },
    'AF': {
        name: 'África',
        cities: ['Cairo', 'Johannesburgo', 'Nairobi', 'Cape Town', 'Lagos']
    }
};

// Función para normalizar nombres de ciudades para URLs
function normalizeCity(city) {
    return city.replace(/\s+/g, '')
        .replace('ú', 'u')
        .replace('í', 'i')
        .replace('ó', 'o')
        .replace('á', 'a')
        .replace('é', 'e');
}

// Función para generar la lista dinámica
function generateServerList(selectedService = 'Yt') {
    const container = document.getElementById('serverContainer');

    let html = '<div class="server_container"><ul class="server_list">';

    // Generar cada continente
    Object.keys(continentsData).forEach((continentCode, index) => {
        const continent = continentsData[continentCode];
        const isFirstOpen = index === 0; // Solo el primer continente abierto por defecto

        html += `
                    <li class="super_server" onclick="ListaExpandible('${continentCode}')" id="server_${continentCode}">
                        <span class="flecha ${isFirstOpen ? 'rotate' : ''}" id="flecha_${continentCode}">›</span> ${continent.name}
                    </li>
                    <ul class="sub_server_list" id="lista_${continentCode}" style="display: ${isFirstOpen ? 'block' : 'none'};">
                `;

        // Generar ciudades del continente
        continent.cities.forEach((city, cityIndex) => {
            const normalizedCity = normalizeCity(city);
            const isSelected = isFirstOpen && cityIndex === 0 ? 'selected_web' : '';
            const route = `/api/${continentCode}_${normalizedCity}_${selectedService}`;

            html += `
                        <li data-route="${route}" class="menu_button ${isSelected}">
                            ${city}
                        </li>
                    `;
        });

        html += '</ul>';
    });

    html += '</ul></div>';

    container.innerHTML = html;
}

// Función para regenerar la lista con el servicio seleccionado
function regenerateList() {
    const selectedService = document.getElementById('serviceSelector').value;
    generateServerList(selectedService);
}

// Generar la lista inicial al cargar la página
document.addEventListener('DOMContentLoaded', function () {
    generateServerList();
});