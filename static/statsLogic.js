let estadisticas = null;
let charts = {};

// Colores pastel para las gráficas
const colors = {
    primary: ['#FFB3E6', '#B3E6FF', '#B3FFB3', '#FFE6B3', '#E6B3FF', '#B3FFFF', '#FFD1B3', '#D1FFB3', '#FFB3D1'],
    secondary: ['#FF9999', '#99CCFF', '#99FF99', '#FFCC99', '#CC99FF', '#99FFFF', '#FFB399', '#B3FF99', '#FF99CC'],
    gradient: [
        'rgba(255, 179, 230, 0.8)',
        'rgba(179, 230, 255, 0.8)',
        'rgba(179, 255, 179, 0.8)',
        'rgba(255, 230, 179, 0.8)',
        'rgba(230, 179, 255, 0.8)',
        'rgba(179, 255, 255, 0.8)',
        'rgba(255, 209, 179, 0.8)',
        'rgba(209, 255, 179, 0.8)',
        'rgba(255, 179, 209, 0.8)'
    ]
};

// Datos de ejemplo para la demostración
const estadisticasDemo = {
    generales: {
        cobertura: { mediciones_exitosas: 1547 },
        confiabilidad: { porcentaje_exito_promedio: 94.7 },
        tiempo_respuesta: { promedio_global: 127.35 },
        saltos: {
            promedio_saltos: 12.4,
            minimo_saltos: 8,
            mediana_saltos: 12,
            maximo_saltos: 18
        }
    },
    metadata: {
        continentes_analizados: 6,
        paises_analizados: 25,
        sitios_analizados: 8
    },
    comparativas: {
        ranking_sitios: {
            por_velocidad: [
                { sitio: 'google.com', tiempo_promedio: 67.2 },
                { sitio: 'facebook.com', tiempo_promedio: 89.5 },
                { sitio: 'youtube.com', tiempo_promedio: 123.8 },
                { sitio: 'amazon.com', tiempo_promedio: 145.3 },
                { sitio: 'twitter.com', tiempo_promedio: 167.9 }
            ]
        },
        ranking_continentes: {
            por_velocidad: [
                { continente: 'América del Norte', tiempo_promedio: 89.2 },
                { continente: 'Europa', tiempo_promedio: 112.7 },
                { continente: 'Asia', tiempo_promedio: 134.5 },
                { continente: 'América del Sur', tiempo_promedio: 178.3 },
                { continente: 'Oceanía', tiempo_promedio: 201.6 }
            ]
        }
    },
    por_pais: {
        'Estados Unidos': {
            continente: 'América del Norte',
            estadisticas: {
                rendimiento: {
                    tiempo_promedio: 78.4,
                    tiempo_mediana: 72.1
                },
                conectividad: {
                    saltos_promedio: 9.2,
                    exito_promedio: 97
                }
            }
        },
        'Alemania': {
            continente: 'Europa',
            estadisticas: {
                rendimiento: {
                    tiempo_promedio: 95.7,
                    tiempo_mediana: 91.3
                },
                conectividad: {
                    saltos_promedio: 11.5,
                    exito_promedio: 96
                }
            }
        },
        'Japón': {
            continente: 'Asia',
            estadisticas: {
                rendimiento: {
                    tiempo_promedio: 118.9,
                    tiempo_mediana: 115.2
                },
                conectividad: {
                    saltos_promedio: 13.1,
                    exito_promedio: 94
                }
            }
        }
    },
    por_sitio_web: {
        'google.com': {
            estadisticas: {
                rendimiento: {
                    mejor_tiempo: 45.2,
                    peor_tiempo: 89.7,
                    variabilidad: 12.3
                }
            }
        },
        'facebook.com': {
            estadisticas: {
                rendimiento: {
                    mejor_tiempo: 62.1,
                    peor_tiempo: 116.8,
                    variabilidad: 18.7
                }
            }
        }
    }
};

// Cargar datos desde la API o usar datos de demostración
async function cargarEstadisticas() {
    try {
        const response = await fetch('/api/estadisticas');
        if (!response.ok) {
            throw new Error('Error al cargar estadísticas');
        }
        estadisticas = await response.json();
    } catch (error) {
        console.log('Usando datos de demostración');
        estadisticas = estadisticasDemo;
    }
    mostrarContenido();
}

function mostrarContenido() {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('content').style.display = 'block';

    crearResumenGeneral();
    crearGraficas();
    crearTablas();
}

function crearResumenGeneral() {
    const overview = document.getElementById('statsOverview');
    const generales = estadisticas.generales;

    const cards = [
        {
            value: generales.cobertura.mediciones_exitosas,
            label: 'Mediciones Exitosas'
        },
        {
            value: `${generales.confiabilidad.porcentaje_exito_promedio}%`,
            label: 'Éxito Promedio'
        },
        {
            value: `${generales.tiempo_respuesta.promedio_global.toFixed(2)} ms`,
            label: 'Tiempo Promedio Global'
        },
        {
            value: generales.saltos.promedio_saltos.toFixed(1),
            label: 'Saltos Promedio'
        },
        {
            value: estadisticas.metadata.continentes_analizados,
            label: 'Continentes Analizados'
        },
        {
            value: estadisticas.metadata.paises_analizados,
            label: 'Ciudades Analizadas'
        }
    ];

    overview.innerHTML = cards.map(card => `
                <div class="stat-card">
                    <div class="stat-value">${card.value}</div>
                    <div class="stat-label">${card.label}</div>
                </div>
            `).join('');
}

function crearGraficas() {
    crearGraficaSitios();
    crearGraficaContinentes();
    crearGraficaPaises();
    crearGraficaSaltos();
    crearGraficaSitiosDetallado();
    crearGraficaPaisesRendimiento();
}

function crearGraficaSitios() {
    const ctx = document.getElementById('sitiosChart').getContext('2d');
    const sitios = estadisticas.comparativas.ranking_sitios.por_velocidad;

    charts.sitios = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sitios.map(s => s.sitio),
            datasets: [{
                label: 'Tiempo Promedio (ms)',
                data: sitios.map(s => s.tiempo_promedio),
                backgroundColor: colors.gradient,
                borderColor: colors.primary,
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}

function crearGraficaSitiosDetallado() {
    const ctx = document.getElementById('sitiosDetalladoChart').getContext('2d');
    const sitios = estadisticas.comparativas.ranking_sitios.por_velocidad;

    // Preparar datos para mejor/peor tiempo por sitio
    const labels = [];
    const tiempoPromedio = [];
    const mejorTiempo = [];
    const peorTiempo = [];

    sitios.forEach(sitio => {
        const detalles = estadisticas.por_sitio_web[sitio.sitio];
        if (detalles) {
            labels.push(sitio.sitio);
            tiempoPromedio.push(sitio.tiempo_promedio);
            mejorTiempo.push(detalles.estadisticas.rendimiento.mejor_tiempo);
            peorTiempo.push(detalles.estadisticas.rendimiento.peor_tiempo);
        }
    });

    charts.sitiosDetallado = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Mejor Tiempo (ms)',
                    data: mejorTiempo,
                    backgroundColor: colors.gradient[0],
                    borderColor: colors.primary[0],
                    borderWidth: 2
                },
                {
                    label: 'Tiempo Promedio (ms)',
                    data: tiempoPromedio,
                    backgroundColor: colors.gradient[1],
                    borderColor: colors.primary[1],
                    borderWidth: 2
                },
                {
                    label: 'Peor Tiempo (ms)',
                    data: peorTiempo,
                    backgroundColor: colors.gradient[2],
                    borderColor: colors.primary[2],
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: {
                        color: '#ffffff',
                        maxRotation: 45
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}


function crearGraficaPaisesRendimiento() {
    const ctx = document.getElementById('paisesRendimientoChart').getContext('2d');
    const paises = Object.entries(estadisticas.por_pais);
    
    // Ordenar países por tiempo promedio
    paises.sort((a, b) => a[1].estadisticas.rendimiento.tiempo_promedio - b[1].estadisticas.rendimiento.tiempo_promedio);
    
    charts.paisesRendimiento = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: paises.map(p => p[0]),
            datasets: [
                {
                    label: 'Tiempo Promedio (ms)',
                    data: paises.map(p => p[1].estadisticas.rendimiento.tiempo_promedio),
                    backgroundColor: colors.gradient[0],
                    borderColor: colors.primary[0],
                    borderWidth: 2,
                    yAxisID: 'y'
                },
                {
                    label: 'Porcentaje de Éxito (%)',
                    data: paises.map(p => p[1].estadisticas.conectividad.exito_promedio),
                    backgroundColor: colors.gradient[1],
                    borderColor: colors.primary[1],
                    borderWidth: 2,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#ffffff' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const datasetLabel = context.dataset.label;
                            const value = context.parsed.y;
                            const suffix = datasetLabel.includes('Tiempo') ? 'ms' : '%';
                            return `${datasetLabel}: ${value}${suffix}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#ffffff',
                        maxRotation: 45
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Tiempo (ms)',
                        color: '#ffffff'
                    },
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Éxito (%)',
                        color: '#ffffff'
                    },
                    ticks: { color: '#ffffff' },
                    grid: {
                        drawOnChartArea: false,
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            }
        }
    });
}

function crearGraficaContinentes() {
    const ctx = document.getElementById('continentesChart').getContext('2d');
    const continentes = estadisticas.comparativas.ranking_continentes.por_velocidad;

    charts.continentes = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: continentes.map(c => c.continente),
            datasets: [{
                data: continentes.map(c => c.tiempo_promedio),
                backgroundColor: colors.gradient,
                borderColor: colors.primary,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#ffffff' }
                }
            }
        }
    });
}

function crearGraficaPaises() {
    const ctx = document.getElementById('paisesChart').getContext('2d');
    const paises = Object.entries(estadisticas.por_pais);

    // Ordenar países por tiempo promedio
    paises.sort((a, b) => a[1].estadisticas.rendimiento.tiempo_promedio - b[1].estadisticas.rendimiento.tiempo_promedio);

    charts.paises = new Chart(ctx, {
        type: 'line',
        data: {
            labels: paises.map(p => p[0]),
            datasets: [
                {
                    label: 'Tiempo Promedio (ms)',
                    data: paises.map(p => p[1].estadisticas.rendimiento.tiempo_promedio),
                    borderColor: colors.primary[0],
                    backgroundColor: colors.gradient[0],
                    tension: 0.4,
                    fill: false,
                    borderWidth: 3
                },
                {
                    label: 'Mediana (ms)',
                    data: paises.map(p => p[1].estadisticas.rendimiento.tiempo_mediana),
                    borderColor: colors.primary[1],
                    backgroundColor: colors.gradient[1],
                    tension: 0.4,
                    fill: false,
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                },
                x: {
                    ticks: {
                        color: '#ffffff',
                        maxRotation: 45
                    },
                    grid: { color: 'rgba(255, 255, 255, 0.1)' }
                }
            }
        }
    });
}

function crearGraficaSaltos() {
    const ctx = document.getElementById('saltosChart').getContext('2d');
    const generales = estadisticas.generales.saltos;

    charts.saltos = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Mínimo', 'Promedio', 'Mediana', 'Máximo'],
            datasets: [{
                label: 'Saltos de Red',
                data: [
                    generales.minimo_saltos,
                    generales.promedio_saltos,
                    generales.mediana_saltos,
                    generales.maximo_saltos
                ],
                borderColor: colors.primary[2],
                backgroundColor: colors.gradient[2],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#ffffff' }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: { color: '#ffffff' },
                    grid: { color: 'rgba(255, 255, 255, 0.2)' },
                    pointLabels: { color: '#ffffff' }
                }
            }
        }
    });
}

function crearTablas() {
    // Tabla de sitios
    const sitiosTable = document.getElementById('sitiosTable').getElementsByTagName('tbody')[0];
    const sitios = estadisticas.comparativas.ranking_sitios.por_velocidad;

    sitiosTable.innerHTML = sitios.map((sitio, index) => {
        const detalles = estadisticas.por_sitio_web[sitio.sitio];
        const mejor = detalles ? detalles.estadisticas.rendimiento.mejor_tiempo : 0;
        const peor = detalles ? detalles.estadisticas.rendimiento.peor_tiempo : 0;
        const variabilidad = detalles ? detalles.estadisticas.rendimiento.variabilidad : 0;

        return `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${sitio.sitio}</td>
                        <td>${sitio.tiempo_promedio.toFixed(2)}</td>
                        <td>${mejor.toFixed(2)}</td>
                        <td>${peor.toFixed(2)}</td>
                        <td>${variabilidad.toFixed(2)}</td>
                    </tr>
                `;
    }).join('');

    // Tabla de países
    const paisesTable = document.getElementById('paisesTable').getElementsByTagName('tbody')[0];
    const paises = Object.entries(estadisticas.por_pais);

    // Ordenar por tiempo promedio
    paises.sort((a, b) => a[1].estadisticas.rendimiento.tiempo_promedio - b[1].estadisticas.rendimiento.tiempo_promedio);

    paisesTable.innerHTML = paises.map(([pais, datos]) => `
                <tr>
                    <td>${pais}</td>
                    <td>${datos.continente}</td>
                    <td>${datos.estadisticas.rendimiento.tiempo_promedio.toFixed(2)}</td>
                    <td>${datos.estadisticas.rendimiento.tiempo_mediana.toFixed(2)}</td>
                    <td>${datos.estadisticas.conectividad.saltos_promedio.toFixed(1)}</td>
                    <td>${datos.estadisticas.conectividad.exito_promedio}%</td>
                </tr>
            `).join('');
}

function goBack() {
    window.history.back();
}

async function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');

    pdf.setFillColor(0, 0, 0);
    pdf.rect(0, 0, 210, 297, 'F');

    pdf.setTextColor(255, 255, 255);

    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('ESTADÍSTICAS DE RED', 105, 25, { align: 'center' });

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Reporte Técnico Detallado', 105, 35, { align: 'center' });

    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.5);
    pdf.line(20, 40, 190, 40);

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'italic');
    const fechaActual = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    pdf.text(`Generado el: ${fechaActual}`, 105, 50, { align: 'center' });

    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RESUMEN EJECUTIVO', 20, 70);

    pdf.line(20, 73, 100, 73);

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');

    const resumen = [
        `• Mediciones exitosas realizadas: ${estadisticas.generales.cobertura.mediciones_exitosas}`,
        `• Tiempo de respuesta promedio: ${estadisticas.generales.tiempo_respuesta.promedio_global.toFixed(2)} ms`,
        `• Alcance geográfico: ${estadisticas.metadata.continentes_analizados} continentes`,
        `• Cobertura por países: ${estadisticas.metadata.paises_analizados} países analizados`,
        `• Sitios web evaluados: ${estadisticas.metadata.sitios_analizados} sitios`
    ];

    resumen.forEach((linea, index) => {
        pdf.text(linea, 25, 85 + (index * 7));
    });

    const charts = document.querySelectorAll('canvas');
    let yPosition = 125;
    let chartIndex = 1;

    for (const chart of charts) {
        try {
            const canvas = await html2canvas(chart, {
                backgroundColor: null, // Mantener transparencia
                scale: 2, // Mayor resolución
                useCORS: true,
                allowTaint: true,
                logging: false
            });

            const imgData = canvas.toDataURL('image/png');

            if (yPosition > 220) {
                pdf.addPage();
                // Aplicar fondo negro a la nueva página
                pdf.setFillColor(0, 0, 0);
                pdf.rect(0, 0, 210, 297, 'F');
                pdf.setTextColor(255, 255, 255);
                yPosition = 20;
            }

            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`Gráfica ${chartIndex}`, 20, yPosition);
            yPosition += 10;

            const originalWidth = canvas.width;
            const originalHeight = canvas.height;
            const aspectRatio = originalHeight / originalWidth;

            const maxWidth = 170;
            const maxHeight = 100;

            let finalWidth = maxWidth;
            let finalHeight = maxWidth * aspectRatio;

            if (finalHeight > maxHeight) {
                finalHeight = maxHeight;
                finalWidth = maxHeight / aspectRatio;
            }

            const xPosition = 20 + (maxWidth - finalWidth) / 2;

            pdf.addImage(imgData, 'PNG', xPosition, yPosition, finalWidth, finalHeight);
            yPosition += finalHeight + 15; // Espacio adicional entre gráficas
            chartIndex++;

        } catch (error) {
            console.error('Error capturando gráfica:', error);
            pdf.setFontSize(10);
            pdf.setTextColor(255, 100, 100); // Rojo claro para errores
            pdf.text(`Error al capturar gráfica ${chartIndex}`, 20, yPosition);
            pdf.setTextColor(255, 255, 255); // Restaurar color blanco
            yPosition += 15;
            chartIndex++;
        }
    }

    const tablas = [
        { id: 'sitiosTable', titulo: 'Tabla de Sitios Web' },
        { id: 'paisesTable', titulo: 'Tabla de Países' }
    ];

    for (const tabla of tablas) {
        const tablaElem = document.getElementById(tabla.id);
        if (tablaElem) {
            // Si no cabe en la página actual, agrega una nueva
            if (yPosition > 200) {
                pdf.addPage();
                pdf.setFillColor(0, 0, 0);
                pdf.rect(0, 0, 210, 297, 'F');
                pdf.setTextColor(255, 255, 255);
                yPosition = 20;
            }

            pdf.setFontSize(14);
            pdf.setFont('helvetica', 'bold');
            pdf.text(tabla.titulo, 105, yPosition, { align: 'center' });
            yPosition += 10;

            try {
                const canvas = await html2canvas(tablaElem, {
                    backgroundColor: null,
                    scale: 2,
                    useCORS: true,
                    allowTaint: true,
                    logging: false
                });
                const imgData = canvas.toDataURL('image/png');

                const originalWidth = canvas.width;
                const originalHeight = canvas.height;
                const aspectRatio = originalHeight / originalWidth;

                const maxWidth = 170;
                const maxHeight = 80;

                let finalWidth = maxWidth;
                let finalHeight = maxWidth * aspectRatio;

                if (finalHeight > maxHeight) {
                    finalHeight = maxHeight;
                    finalWidth = maxHeight / aspectRatio;
                }

                const xPosition = 20 + (maxWidth - finalWidth) / 2;

                pdf.addImage(imgData, 'PNG', xPosition, yPosition, finalWidth, finalHeight);
                yPosition += finalHeight + 15;
            } catch (error) {
                console.error('Error capturando tabla:', error);
                pdf.setFontSize(10);
                pdf.setTextColor(255, 100, 100);
                pdf.text(`Error al capturar ${tabla.titulo}`, 20, yPosition);
                pdf.setTextColor(255, 255, 255);
                yPosition += 15;
            }
        }
    }

    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'italic');
        pdf.text(`Página ${i} de ${totalPages}`, 105, 290, { align: 'center' });
        pdf.text('', 105, 285, { align: 'center' });
    }



    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const filename = `estadisticas-red-${timestamp}.pdf`;



    // Guardar PDF
    pdf.save(filename);

    console.log(`PDF exportado exitosamente: ${filename}`);
}

function validateStatistics() {
    if (!estadisticas || !estadisticas.generales) {
        throw new Error('Las estadísticas no están disponibles');
    }
    return true;
}

async function exportToPDFWithValidation() {
    try {
        validateStatistics();
        await exportToPDF();
    } catch (error) {
        console.error('Error al exportar PDF:', error);
        alert('Error al generar el PDF. Por favor, verifica que los datos estén cargados correctamente.');
    }
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function () {
    cargarEstadisticas();
});