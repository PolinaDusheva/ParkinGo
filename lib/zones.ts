/**
 * Varna Blue Zone parking boundaries.
 * Source: Official "Синя зона" KML from the Varna municipality parking authority
 *         (varnaparking.bg / Google My Maps mid=1G93nAtnOBLDu6bZehL-k0S95Rct2Ng31).
 *
 * Operating hours: 09:00–20:00, Monday–Sunday (excluding public holidays).
 * Info line: 070 070 352
 */

export interface ZonePolygon {
  id: string;
  name: string;
  subzones: string[];
  coordinates: { latitude: number; longitude: number }[];
}

// ─── Zone Център — Subzones 1–4 ──────────────────────────────────────────────

const SUBZONE_1: ZonePolygon = {
  id: 'centrum-1',
  name: 'Синя зона — Подзона 1',
  subzones: ['1'],
  coordinates: [
    { latitude: 43.2047692, longitude: 27.9106914 },
    { latitude: 43.2046519, longitude: 27.9099512 },
    { latitude: 43.2045815, longitude: 27.9092967 },
    { latitude: 43.2045111, longitude: 27.9084062 },
    { latitude: 43.2044486, longitude: 27.9073333 },
    { latitude: 43.2043391, longitude: 27.9064106 },
    { latitude: 43.2040888, longitude: 27.9053056 },
    { latitude: 43.2038386, longitude: 27.9041039 },
    { latitude: 43.2036665, longitude: 27.9023230 },
    { latitude: 43.2035492, longitude: 27.9017651 },
    { latitude: 43.2034710, longitude: 27.9011428 },
    { latitude: 43.2033928, longitude: 27.9005527 },
    { latitude: 43.2032207, longitude: 27.9004025 },
    { latitude: 43.2026264, longitude: 27.9006493 },
    { latitude: 43.2019460, longitude: 27.9003703 },
    { latitude: 43.2018521, longitude: 27.9005956 },
    { latitude: 43.2015471, longitude: 27.9026126 },
    { latitude: 43.2011717, longitude: 27.9035782 },
    { latitude: 43.2007259, longitude: 27.9045653 },
    { latitude: 43.2001472, longitude: 27.9058957 },
    { latitude: 43.1995841, longitude: 27.9073011 },
    { latitude: 43.1993103, longitude: 27.9080414 },
    { latitude: 43.1991617, longitude: 27.9088997 },
    { latitude: 43.1990679, longitude: 27.9103374 },
    { latitude: 43.1988254, longitude: 27.9114854 },
    { latitude: 43.1986690, longitude: 27.9129874 },
    { latitude: 43.1990757, longitude: 27.9129660 },
    { latitude: 43.1994511, longitude: 27.9129874 },
    { latitude: 43.1997092, longitude: 27.9129981 },
    { latitude: 43.2002332, longitude: 27.9130089 },
    { latitude: 43.2008589, longitude: 27.9129123 },
    { latitude: 43.2011444, longitude: 27.9128909 },
    { latitude: 43.2015002, longitude: 27.9128265 },
    { latitude: 43.2017231, longitude: 27.9129499 },
    { latitude: 43.2023175, longitude: 27.9133897 },
    { latitude: 43.2028493, longitude: 27.9138725 },
    { latitude: 43.2030213, longitude: 27.9135882 },
    { latitude: 43.2031895, longitude: 27.9132717 },
    { latitude: 43.2033537, longitude: 27.9129338 },
    { latitude: 43.2036782, longitude: 27.9123598 },
    { latitude: 43.2040263, longitude: 27.9117751 },
    { latitude: 43.2042374, longitude: 27.9113620 },
    { latitude: 43.2045189, longitude: 27.9108792 },
    { latitude: 43.2047692, longitude: 27.9106914 },
  ],
};

const SUBZONE_2: ZonePolygon = {
  id: 'centrum-2',
  name: 'Синя зона — Подзона 2',
  subzones: ['2'],
  coordinates: [
    { latitude: 43.2047848, longitude: 27.9107451 },
    { latitude: 43.2045345, longitude: 27.9109329 },
    { latitude: 43.2040966, longitude: 27.9117644 },
    { latitude: 43.2035805, longitude: 27.9126227 },
    { latitude: 43.2028649, longitude: 27.9139262 },
    { latitude: 43.2026654, longitude: 27.9137170 },
    { latitude: 43.2015158, longitude: 27.9128802 },
    { latitude: 43.2003270, longitude: 27.9130840 },
    { latitude: 43.1987315, longitude: 27.9130089 },
    { latitude: 43.1986220, longitude: 27.9139960 },
    { latitude: 43.1984265, longitude: 27.9144895 },
    { latitude: 43.1980824, longitude: 27.9146826 },
    { latitude: 43.1979651, longitude: 27.9171288 },
    { latitude: 43.1978243, longitude: 27.9191887 },
    { latitude: 43.1980511, longitude: 27.9198539 },
    { latitude: 43.1988645, longitude: 27.9206586 },
    { latitude: 43.1996075, longitude: 27.9212701 },
    { latitude: 43.1999438, longitude: 27.9213560 },
    { latitude: 43.2012342, longitude: 27.9208946 },
    { latitude: 43.2011404, longitude: 27.9200900 },
    { latitude: 43.2014611, longitude: 27.9176438 },
    { latitude: 43.2024308, longitude: 27.9159594 },
    { latitude: 43.2027906, longitude: 27.9156697 },
    { latitude: 43.2037447, longitude: 27.9154229 },
    { latitude: 43.2046988, longitude: 27.9151547 },
    { latitude: 43.2062628, longitude: 27.9147470 },
    { latitude: 43.2047848, longitude: 27.9107451 },
  ],
};

const SUBZONE_3: ZonePolygon = {
  id: 'centrum-3',
  name: 'Синя зона — Подзона 3',
  subzones: ['3'],
  coordinates: [
    { latitude: 43.2062628, longitude: 27.9147470 },
    { latitude: 43.2027906, longitude: 27.9156697 },
    { latitude: 43.2024308, longitude: 27.9159594 },
    { latitude: 43.2015002, longitude: 27.9175794 },
    { latitude: 43.2011639, longitude: 27.9200041 },
    { latitude: 43.2011795, longitude: 27.9202294 },
    { latitude: 43.2012812, longitude: 27.9208410 },
    { latitude: 43.2018052, longitude: 27.9207766 },
    { latitude: 43.2023448, longitude: 27.9210234 },
    { latitude: 43.2033458, longitude: 27.9215598 },
    { latitude: 43.2038855, longitude: 27.9220855 },
    { latitude: 43.2040262, longitude: 27.9218173 },
    { latitude: 43.2053635, longitude: 27.9198110 },
    { latitude: 43.2071934, longitude: 27.9172897 },
    { latitude: 43.2062628, longitude: 27.9147470 },
  ],
};

const SUBZONE_4: ZonePolygon = {
  id: 'centrum-4',
  name: 'Синя зона — Подзона 4',
  subzones: ['4'],
  coordinates: [
    { latitude: 43.2072169, longitude: 27.9172897 },
    { latitude: 43.2063802, longitude: 27.9184484 },
    { latitude: 43.2052462, longitude: 27.9200149 },
    { latitude: 43.2039090, longitude: 27.9220855 },
    { latitude: 43.2065991, longitude: 27.9255080 },
    { latitude: 43.2098131, longitude: 27.9208839 },
    { latitude: 43.2072169, longitude: 27.9172897 },
  ],
};

// ─── Zone Широк Център — Subzones 5–7 (active since 01 Aug 2020) ─────────────

const SUBZONE_5: ZonePolygon = {
  id: 'shirok-centrum-5',
  name: 'Синя зона — Подзона 5',
  subzones: ['5'],
  coordinates: [
    { latitude: 43.2078069, longitude: 27.8996077 },
    { latitude: 43.2072126, longitude: 27.9001146 },
    { latitude: 43.2062781, longitude: 27.9010319 },
    { latitude: 43.2062194, longitude: 27.9010373 },
    { latitude: 43.2059770, longitude: 27.9014772 },
    { latitude: 43.2056877, longitude: 27.9019063 },
    { latitude: 43.2044520, longitude: 27.9036337 },
    { latitude: 43.2039203, longitude: 27.9040574 },
    { latitude: 43.2044403, longitude: 27.9063159 },
    { latitude: 43.2045029, longitude: 27.9071205 },
    { latitude: 43.2110795, longitude: 27.9031079 },
    { latitude: 43.2112593, longitude: 27.9030758 },
    { latitude: 43.2112945, longitude: 27.9029041 },
    { latitude: 43.2102467, longitude: 27.9019492 },
    { latitude: 43.2092067, longitude: 27.9009407 },
    { latitude: 43.2087062, longitude: 27.9004901 },
    { latitude: 43.2078069, longitude: 27.8996077 },
  ],
};

const SUBZONE_6: ZonePolygon = {
  id: 'shirok-centrum-6',
  name: 'Синя зона — Подзона 6',
  subzones: ['6'],
  coordinates: [
    { latitude: 43.2045165, longitude: 27.9071770 },
    { latitude: 43.2048371, longitude: 27.9106961 },
    { latitude: 43.2064481, longitude: 27.9104601 },
    { latitude: 43.2097403, longitude: 27.9085289 },
    { latitude: 43.2110462, longitude: 27.9076813 },
    { latitude: 43.2112573, longitude: 27.9074828 },
    { latitude: 43.2116639, longitude: 27.9068284 },
    { latitude: 43.2125827, longitude: 27.9040120 },
    { latitude: 43.2114176, longitude: 27.9030947 },
    { latitude: 43.2110775, longitude: 27.9031430 },
    { latitude: 43.2045165, longitude: 27.9071770 },
  ],
};

const SUBZONE_7: ZonePolygon = {
  id: 'shirok-centrum-7',
  name: 'Синя зона — Подзона 7',
  subzones: ['7'],
  coordinates: [
    { latitude: 43.2105708, longitude: 27.9080394 },
    { latitude: 43.2064556, longitude: 27.9105124 },
    { latitude: 43.2048524, longitude: 27.9107511 },
    { latitude: 43.2072494, longitude: 27.9171589 },
    { latitude: 43.2083500, longitude: 27.9153350 },
    { latitude: 43.2101153, longitude: 27.9128486 },
    { latitude: 43.2100195, longitude: 27.9122075 },
    { latitude: 43.2106842, longitude: 27.9117596 },
    { latitude: 43.2113195, longitude: 27.9111427 },
    { latitude: 43.2113039, longitude: 27.9109174 },
    { latitude: 43.2112472, longitude: 27.9104104 },
    { latitude: 43.2110107, longitude: 27.9093242 },
    { latitude: 43.2108269, longitude: 27.9088145 },
    { latitude: 43.2105708, longitude: 27.9080394 },
  ],
};

// ─── Zone Широк Център — Subzones 8–10 (active since 01 Jul 2020) ────────────

const SUBZONE_8: ZonePolygon = {
  id: 'shirok-centrum-8',
  name: 'Синя зона — Подзона 8',
  subzones: ['8'],
  coordinates: [
    { latitude: 43.2113784, longitude: 27.9111051 },
    { latitude: 43.2106013, longitude: 27.9118816 },
    { latitude: 43.2100441, longitude: 27.9122169 },
    { latitude: 43.2100401, longitude: 27.9122779 },
    { latitude: 43.2101197, longitude: 27.9128479 },
    { latitude: 43.2085047, longitude: 27.9151377 },
    { latitude: 43.2083492, longitude: 27.9153630 },
    { latitude: 43.2072700, longitude: 27.9171950 },
    { latitude: 43.2098662, longitude: 27.9207677 },
    { latitude: 43.2140106, longitude: 27.9147488 },
    { latitude: 43.2124936, longitude: 27.9128069 },
    { latitude: 43.2115396, longitude: 27.9115087 },
    { latitude: 43.2113784, longitude: 27.9111051 },
  ],
};

const SUBZONE_9: ZonePolygon = {
  id: 'shirok-centrum-9',
  name: 'Синя зона — Подзона 9',
  subzones: ['9'],
  coordinates: [
    { latitude: 43.2140553, longitude: 27.9148367 },
    { latitude: 43.2098953, longitude: 27.9208341 },
    { latitude: 43.2126556, longitude: 27.9244390 },
    { latitude: 43.2135783, longitude: 27.9252973 },
    { latitude: 43.2144853, longitude: 27.9266063 },
    { latitude: 43.2158615, longitude: 27.9291168 },
    { latitude: 43.2179491, longitude: 27.9249969 },
    { latitude: 43.2174839, longitude: 27.9245088 },
    { latitude: 43.2154119, longitude: 27.9216817 },
    { latitude: 43.2148646, longitude: 27.9209897 },
    { latitude: 43.2162954, longitude: 27.9188600 },
    { latitude: 43.2170734, longitude: 27.9188332 },
    { latitude: 43.2152555, longitude: 27.9164890 },
    { latitude: 43.2140553, longitude: 27.9148367 },
  ],
};

const SUBZONE_10: ZonePolygon = {
  id: 'shirok-centrum-10',
  name: 'Синя зона — Подзона 10',
  subzones: ['10'],
  coordinates: [
    { latitude: 43.2098676, longitude: 27.9209197 },
    { latitude: 43.2081942, longitude: 27.9233122 },
    { latitude: 43.2099536, longitude: 27.9317880 },
    { latitude: 43.2110719, longitude: 27.9340196 },
    { latitude: 43.2113299, longitude: 27.9336548 },
    { latitude: 43.2115410, longitude: 27.9311872 },
    { latitude: 43.2119085, longitude: 27.9309726 },
    { latitude: 43.2138712, longitude: 27.9295671 },
    { latitude: 43.2150832, longitude: 27.9278398 },
    { latitude: 43.2144264, longitude: 27.9266167 },
    { latitude: 43.2135115, longitude: 27.9253614 },
    { latitude: 43.2126045, longitude: 27.9244816 },
    { latitude: 43.2098676, longitude: 27.9209197 },
  ],
};

/** All 10 blue zone subzone polygons in render order */
export const BLUE_ZONE_POLYGONS: ZonePolygon[] = [
  SUBZONE_5,
  SUBZONE_6,
  SUBZONE_7,
  SUBZONE_8,
  SUBZONE_9,
  SUBZONE_10,
  SUBZONE_1,
  SUBZONE_2,
  SUBZONE_3,
  SUBZONE_4,
];
