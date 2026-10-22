# traceroute.live — Visualizing How Internet Traffic Travels

> 🇪🇸 Plataforma web que muestra cómo viajan los paquetes de datos desde 41 ciudades del mundo hasta 9 de los sitios web más visitados.

An interactive web platform that shows the network routes packets take from **41 cities across 6 regions** to **9 popular websites**: Amazon, Facebook, ChatGPT, Instagram, Netflix, Pinterest, Udemy, WhatsApp and YouTube. For each route it shows the hops, the per-hop latency (RTT) and the IP addresses, both on an interactive map and in a statistics dashboard.

Built as a solo project for the university research group *Grupo de Investigación II* (Universidad Distrital, 2025). Its accessibility was later evaluated and improved against WCAG in the *Human Factors* course.

## Features

- 🗺️ **Interactive world map** showing each route's origin, hops and destination, with animated packet flow.
- 📊 **Statistics dashboard**: hop counts, average and total RTT, and slow or lossy intermediate nodes, compared by region and destination.
- 📥 **Data export** to CSV and JSON.
- 📱 **Responsive UI**, designed to work on touch devices and large touch tables.
- ♿ **Accessibility improvements**: semantic HTML, screen-reader friendly navigation and W3C validation.

## Data

- **369 traceroute datasets** in `Backend/Datos/<region>/<REGION>_<City>_<Site>.csv`. Regions: AF, AS, EU, NA, OC, SA.
- The data was collected from public traceroute servers.
- `TraceRutes.py` and `Backend/ProcessRutes.py` parse the raw traces into `datos_procesados.json`.
- `ProcessStats.py` computes the aggregate statistics.

## Architecture

```
CSV traces ──► ProcessRutes / TraceRutes (parse) ──► datos_procesados.json
                                     │
                                     ▼
                       ProcessStats (aggregate metrics)
                                     │
             Flask API ──────────────┴───────────────► JS front end (map + charts)
   /api/<dataset>  /api/estadisticas  /api/report       main.js · routes.js · statsLogic.js
```

| Endpoint | Returns |
|---|---|
| `GET /` | Interactive route map |
| `GET /stats` | Statistics dashboard |
| `GET /api/<dataset_key>` | Processed hops for one origin–destination pair |
| `GET /api/estadisticas` | Aggregated statistics |
| `GET /api/report` | Summary report |

## Run it locally

```bash
pip install -r requirements.txt
python App.py            # http://localhost:10000
# production: gunicorn App:app
```

## Tech

Python · Flask · Gunicorn · JavaScript · HTML/CSS · interactive maps

## Roadmap

Live traceroutes on demand · historical storage to track route changes over time · automated tests

---
Author: **Juan Diego Murillo** · [LinkedIn](https://www.linkedin.com/in/juandiegomurillo) · 2025
