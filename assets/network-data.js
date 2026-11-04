/* EDITABLE NETWORK DATA. All demo agencies, descriptions and cities are fictional.
   Replace confirmedMarkets with authorized commercial data; then set demoMode:false.
   Each market: {id:ISO3, country, region, center:[longitude,latitude], agencies:[{name,city,description}]}.
   An empty confirmedMarkets array is supported. No agency URLs or logos are invented. */
window.AYSEN_NETWORK_DATA = {
  demoMode: true,
  confirmedMarkets: [],
  demoMarkets: [
  {
    "id": "BRA",
    "country": "Brasil",
    "region": "Sudamérica",
    "agencies": [
      {
        "name": "Travessia Sul",
        "city": "São Paulo",
        "description": "Viajes de naturaleza para grupos pequeños, con programas adaptados al viajero brasileño."
      },
      {
        "name": "Verde Latitude",
        "city": "Curitiba",
        "description": "Experiencias a medida para viajeros que buscan paisaje, cultura local y tiempos pausados."
      }
    ],
    "center": [
      -52,
      -16
    ]
  },
  {
    "id": "ARG",
    "country": "Argentina",
    "region": "Sudamérica",
    "agencies": [
      {
        "name": "Andén Austral",
        "city": "Buenos Aires",
        "description": "Itinerarios combinados de Patagonia para viajeros independientes y grupos privados."
      }
    ],
    "center": [
      -65,
      -35
    ]
  },
  {
    "id": "ESP",
    "country": "España",
    "region": "Europa",
    "agencies": [
      {
        "name": "Horizonte Austral",
        "city": "Madrid",
        "description": "Viajes de autor por la Carretera Austral, diseñados junto a especialistas del destino."
      }
    ],
    "center": [
      -4,
      39
    ]
  },
  {
    "id": "GBR",
    "country": "Reino Unido",
    "region": "Europa",
    "agencies": [
      {
        "name": "Northbound Andes",
        "city": "Bristol",
        "description": "Travesías de naturaleza y observación de paisaje con acompañamiento local."
      }
    ],
    "center": [
      -3,
      54
    ]
  },
  {
    "id": "FRA",
    "country": "Francia",
    "region": "Europa",
    "agencies": [
      {
        "name": "Terres Lointaines Studio",
        "city": "Lyon",
        "description": "Recorridos a medida para descubrir la Patagonia con atención al territorio y sus comunidades."
      }
    ],
    "center": [
      2,
      47
    ]
  },
  {
    "id": "DEU",
    "country": "Alemania",
    "region": "Europa",
    "agencies": [
      {
        "name": "Weitland Reisen",
        "city": "Hamburgo",
        "description": "Programas activos de senderismo y naturaleza con una planificación detallada del viaje."
      }
    ],
    "center": [
      10,
      51
    ]
  }
]
};
