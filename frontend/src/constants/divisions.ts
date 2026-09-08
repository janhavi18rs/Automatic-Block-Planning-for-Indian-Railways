export interface DivisionConfig {
  id: string;
  name: string;
  railway: string;
  bbox: string;
  corridorName: string;
  center: [number, number];
  zoom: number;
  sections: string[];
  corridors: {
    section_id: string;
    name: string;
    score: number;
    stations: { name: string; lat: number; lng: number }[];
    coords: [number, number][];
  }[];
}

export const DIVISIONS: Record<string, DivisionConfig> = {
  PRYJ: {
    id: 'PRYJ',
    name: 'Prayagraj',
    railway: 'NCR',
    bbox: 'NCR / DLI',
    corridorName: 'New Delhi - Kanpur - Prayagraj Line',
    center: [26.8, 79.5],
    zoom: 7,
    sections: ['SEC-NDLS-CNB', 'SEC-CNB-PRYJ', 'SEC-ALD-DDU'],
    corridors: [
      {
        section_id: 'SEC-NDLS-CNB',
        name: 'New Delhi - Kanpur Central (NCR/PRYJ)',
        score: 78,
        stations: [
          { name: 'New Delhi (NDLS)', lat: 28.6143, lng: 77.2197 },
          { name: 'Ghaziabad (GZB)', lat: 28.6692, lng: 77.4538 },
          { name: 'Aligarh (ALJN)', lat: 27.8821, lng: 78.0776 },
          { name: 'Tundla (TDL)', lat: 27.2066, lng: 78.1402 },
          { name: 'Etawah (ETW)', lat: 26.7769, lng: 79.0305 },
          { name: 'Kanpur Central (CNB)', lat: 26.4499, lng: 80.3319 },
        ],
        coords: [
          [28.6143, 77.2197],
          [28.6692, 77.4538],
          [27.8821, 78.0776],
          [27.2066, 78.1402],
          [26.7769, 79.0305],
          [26.4499, 80.3319],
        ],
      },
      {
        section_id: 'SEC-CNB-PRYJ',
        name: 'Kanpur - Prayagraj Junction (NCR/PRYJ)',
        score: 45,
        stations: [
          { name: 'Kanpur Central (CNB)', lat: 26.4499, lng: 80.3319 },
          { name: 'Fatehpur (FTP)', lat: 25.9221, lng: 80.8322 },
          { name: 'Sirathu (SRO)', lat: 25.6482, lng: 81.3142 },
          { name: 'Prayagraj Junction (PRYJ)', lat: 25.4358, lng: 81.8344 },
        ],
        coords: [
          [26.4499, 80.3319],
          [25.9221, 80.8322],
          [25.6482, 81.3142],
          [25.4358, 81.8344],
        ],
      },
      {
        section_id: 'SEC-ALD-DDU',
        name: 'Prayagraj - Pt. Deen Dayal Upadhyaya (NCR/PRYJ)',
        score: 64,
        stations: [
          { name: 'Prayagraj Junction (PRYJ)', lat: 25.4358, lng: 81.8344 },
          { name: 'Mirzapur (MZP)', lat: 25.1462, lng: 82.5698 },
          { name: 'Pt. Deen Dayal Upadhyaya (DDU)', lat: 25.2820, lng: 83.0080 },
        ],
        coords: [
          [25.4358, 81.8344],
          [25.1462, 82.5698],
          [25.2820, 83.0080],
        ],
      },
    ],
  },
  BB: {
    id: 'BB',
    name: 'Mumbai Central',
    railway: 'CR',
    bbox: 'CR / BB',
    corridorName: 'Mumbai Central - Pune & Igatpuri Corridors',
    center: [19.10, 73.20],
    zoom: 9,
    sections: ['SEC-BCT-PUNE', 'SEC-CSMT-IGP'],
    corridors: [
      {
        section_id: 'SEC-BCT-PUNE',
        name: 'Mumbai Central - Pune Junction (CR/BB)',
        score: 88,
        stations: [
          { name: 'Mumbai Central (MMCT)', lat: 18.9696, lng: 72.8205 },
          { name: 'Dadar (DR)', lat: 19.0178, lng: 72.8478 },
          { name: 'Thane (TNA)', lat: 19.1970, lng: 72.9726 },
          { name: 'Kalyan Junction (KYN)', lat: 19.2437, lng: 73.1355 },
          { name: 'Karjat Junction (KJT)', lat: 18.9102, lng: 73.3283 },
          { name: 'Lonavala (LNL)', lat: 18.7557, lng: 73.4070 },
          { name: 'Chinchwad (CCH)', lat: 18.6657, lng: 73.7431 },
          { name: 'Pune Junction (PUNE)', lat: 18.5204, lng: 73.8567 },
        ],
        coords: [
          [18.9696, 72.8205],
          [19.0178, 72.8478],
          [19.1970, 72.9726],
          [19.2437, 73.1355],
          [18.9102, 73.3283],
          [18.7557, 73.4070],
          [18.6657, 73.7431],
          [18.5204, 73.8567],
        ],
      },
      {
        section_id: 'SEC-CSMT-IGP',
        name: 'Mumbai CSMT - Igatpuri Corridor (CR/BB)',
        score: 72,
        stations: [
          { name: 'Mumbai CSMT (CSMT)', lat: 18.9402, lng: 72.8356 },
          { name: 'Dadar (DR)', lat: 19.0178, lng: 72.8478 },
          { name: 'Thane (TNA)', lat: 19.1970, lng: 72.9726 },
          { name: 'Kalyan Junction (KYN)', lat: 19.2437, lng: 73.1355 },
          { name: 'Kasara (KSRA)', lat: 19.6385, lng: 73.4834 },
          { name: 'Igatpuri (IGP)', lat: 19.6961, lng: 73.5594 },
        ],
        coords: [
          [18.9402, 72.8356],
          [19.0178, 72.8478],
          [19.1970, 72.9726],
          [19.2437, 73.1355],
          [19.6385, 73.4834],
          [19.6961, 73.5594],
        ],
      },
    ],
  },
  HWH: {
    id: 'HWH',
    name: 'Howrah',
    railway: 'ER',
    bbox: 'ER / HWH',
    corridorName: 'Howrah - Asansol Trunk Line',
    center: [23.1, 87.6],
    zoom: 8,
    sections: ['SEC-HWH-ASN'],
    corridors: [
      {
        section_id: 'SEC-HWH-ASN',
        name: 'Howrah - Asansol Corridor (ER/HWH)',
        score: 32,
        stations: [
          { name: 'Howrah Junction (HWH)', lat: 22.5839, lng: 88.3426 },
          { name: 'Bandel Junction (BDC)', lat: 22.9100, lng: 88.3700 },
          { name: 'Bardhaman Junction (BWN)', lat: 23.2324, lng: 87.8615 },
          { name: 'Panagarh (PAN)', lat: 23.4721, lng: 87.5218 },
          { name: 'Durgapur (DGR)', lat: 23.5204, lng: 87.3119 },
          { name: 'Raniganj (RNG)', lat: 23.6062, lng: 87.1235 },
          { name: 'Asansol Junction (ASN)', lat: 23.6889, lng: 86.9839 },
        ],
        coords: [
          [22.5839, 88.3426],
          [22.9100, 88.3700],
          [23.2324, 87.8615],
          [23.4721, 87.5218],
          [23.5204, 87.3119],
          [23.6062, 87.1235],
          [23.6889, 86.9839],
        ],
      },
    ],
  },
  SBC: {
    id: 'SBC',
    name: 'Bengaluru',
    railway: 'SWR',
    bbox: 'SWR / SBC',
    corridorName: 'Bengaluru - Mysuru & Chennai Corridors',
    center: [12.6, 77.1],
    zoom: 9,
    sections: ['SEC-SBC-MYS', 'SEC-SBC-MAS'],
    corridors: [
      {
        section_id: 'SEC-SBC-MYS',
        name: 'Bengaluru City - Mysuru Junction (SWR/SBC)',
        score: 55,
        stations: [
          { name: 'Bengaluru City (SBC)', lat: 12.9716, lng: 77.5946 },
          { name: 'Kengeri (KGI)', lat: 12.9081, lng: 77.4784 },
          { name: 'Bidadi (BID)', lat: 12.7958, lng: 77.3852 },
          { name: 'Ramanagara (RMGM)', lat: 12.7226, lng: 77.2946 },
          { name: 'Channapatna (CPT)', lat: 12.6517, lng: 77.2089 },
          { name: 'Mandya (MYA)', lat: 12.5239, lng: 76.8972 },
          { name: 'Srirangapatna (S)', lat: 12.4239, lng: 76.6923 },
          { name: 'Mysuru Junction (MYS)', lat: 12.2958, lng: 76.6394 },
        ],
        coords: [
          [12.9716, 77.5946],
          [12.9081, 77.4784],
          [12.7958, 77.3852],
          [12.7226, 77.2946],
          [12.6517, 77.2089],
          [12.5239, 76.8972],
          [12.4239, 76.6923],
          [12.2958, 76.6394],
        ],
      },
      {
        section_id: 'SEC-SBC-MAS',
        name: 'Bengaluru - Chennai Central Corridor (SWR/SBC)',
        score: 62,
        stations: [
          { name: 'Bengaluru City (SBC)', lat: 12.9716, lng: 77.5946 },
          { name: 'Bangarapet (BWT)', lat: 12.9800, lng: 78.1300 },
          { name: 'Jolarpettai (JTJ)', lat: 12.5600, lng: 78.5800 },
          { name: 'Katpadi (KPD)', lat: 12.9200, lng: 79.1300 },
          { name: 'Chennai Central (MAS)', lat: 13.0800, lng: 80.2700 },
        ],
        coords: [
          [12.9716, 77.5946],
          [12.9800, 78.1300],
          [12.5600, 78.5800],
          [12.9200, 79.1300],
          [13.0800, 80.2700],
        ],
      },
    ],
  },
};
