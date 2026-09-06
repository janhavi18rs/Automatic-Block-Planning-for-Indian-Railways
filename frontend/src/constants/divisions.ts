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
    sections: ['SEC-NDLS-CNB', 'SEC-CNB-PRYJ'],
    corridors: [
      {
        section_id: 'SEC-NDLS-CNB',
        name: 'New Delhi - Kanpur Central (NCR/PRYJ)',
        score: 78,
        coords: [
          [28.6143, 77.2197],
          [28.4523, 77.6732],
          [27.8821, 78.0776],
          [26.4499, 80.3319],
        ],
      },
      {
        section_id: 'SEC-CNB-PRYJ',
        name: 'Kanpur - Prayagraj Junction (NCR/PRYJ)',
        score: 45,
        coords: [
          [26.4499, 80.3319],
          [25.9221, 80.8322],
          [25.4358, 81.8344],
        ],
      },
    ],
  },
  BB: {
    id: 'BB',
    name: 'Mumbai Central',
    railway: 'CR',
    bbox: 'CR / BB',
    corridorName: 'Mumbai Central - Pune Junction Line',
    center: [18.75, 73.3],
    zoom: 8,
    sections: ['SEC-BCT-PUNE'],
    corridors: [
      {
        section_id: 'SEC-BCT-PUNE',
        name: 'Mumbai Central - Pune Junction (CR/BB)',
        score: 88,
        coords: [
          [18.9696, 72.8205],
          [19.033, 73.0158],
          [18.7557, 73.407],
          [18.5204, 73.8567],
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
        coords: [
          [22.5839, 88.3426],
          [22.8963, 88.0825],
          [23.5204, 87.3119],
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
    corridorName: 'Bengaluru - Mysuru Main Line',
    center: [12.6, 77.0],
    zoom: 9,
    sections: ['SEC-SBC-MYS'],
    corridors: [
      {
        section_id: 'SEC-SBC-MYS',
        name: 'Bengaluru City - Mysuru Junction (SWR/SBC)',
        score: 55,
        coords: [
          [12.9716, 77.5946],
          [12.7226, 77.2946],
          [12.4239, 76.8423],
          [12.2958, 76.6394],
        ],
      },
    ],
  },
};
