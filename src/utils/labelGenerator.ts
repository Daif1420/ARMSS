/**
 * Label Generator for ARMS (100 x 50 mm standard Zebra / thermal labels)
 * Implements SVG Code 128 barcode rendering and Zebra ZPL-II script generation
 */

// Code 128 pattern table (patterns for characters 0-106)
// Each character is represented by 6 alternating bar/space widths (sum = 11 modules), stop is 13 modules
const CODE128_PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 100-106 (106 is STOP pattern)
];

// Start code for Code 128 Set B
const START_B = 104;
const STOP = 106;

/**
 * Encodes an ASCII string into Code 128 (Subset B) pattern bars
 */
export function encodeCode128B(text: string): string[] {
  const codes: number[] = [START_B];
  let checkSum = START_B;

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i) - 32;
    const validCode = code >= 0 && code <= 95 ? code : 0;
    codes.push(validCode);
    checkSum += validCode * (i + 1);
  }

  codes.push(checkSum % 103);
  codes.push(STOP);

  return codes.map((c) => CODE128_PATTERNS[c] || CODE128_PATTERNS[0]);
}

/**
 * Generates an SVG string representation of a Code 128 barcode
 */
export function generateBarcodeSvg(text: string, height = 40): string {
  const patterns = encodeCode128B(text);
  const moduleWidth = 1.6;
  const elements: string[] = [];
  let currentX = 10;

  for (const pattern of patterns) {
    let isBar = true;
    for (const char of pattern) {
      const width = parseInt(char, 10) * moduleWidth;
      if (isBar) {
        elements.push(`<rect x="${currentX.toFixed(1)}" y="0" width="${width.toFixed(1)}" height="${height}" fill="#000000" />`);
      }
      currentX += width;
      isBar = !isBar;
    }
  }

  const totalWidth = currentX + 10;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalWidth} ${height}" class="w-full h-full" preserveAspectRatio="none">
    ${elements.join('')}
  </svg>`;
}

export interface LabelData {
  title: string;
  type: 'box' | 'dossier';
  boxNumber: string;
  dossierNumber?: number;
  firstProject: number;
  lastProject: number;
  projectCount: number;
  barcodeValue: string;
  dateGenerated?: string;
  operator?: string;
  branchName?: string;
}

/**
 * Generates Zebra Programming Language (ZPL II) code for 100x50 mm label (approx 800x400 dots at 203 DPI)
 */
export function generateZplCode(label: LabelData): string {
  const dateStr = label.dateGenerated || new Date().toISOString().split('T')[0];
  const typeText = label.type === 'box' ? `BOX ${label.boxNumber}` : `BOX ${label.boxNumber} / DOSSIER ${label.dossierNumber}`;
  const rangeText = `${label.firstProject} - ${label.lastProject}`;

  return `^XA
^PW800
^LL400
^LH0,0
^FO40,30^A0N,28,28^FDINTERCOM ARCHIVE MANAGEMENT SYSTEM^FS
^FO40,65^GB720,2,2^FS
^FO40,85^A0N,44,44^FD${typeText}^FS
^FO40,140^A0N,24,24^FDPROJECT RANGE:^FS
^FO220,135^A0N,36,36^FD${rangeText}^FS
^FO40,185^A0N,22,22^FDTOTAL PROJECTS: ${label.projectCount}   |   DATE: ${dateStr}^FS
^FO40,225^BY2,3,80^BCN,80,Y,N,N^FD${label.barcodeValue}^FS
^FO40,345^GB720,1,1^FS
^FO40,360^A0N,20,20^FDCONFIRMED ARMS ALLOCATION   |   OPERATOR: ${label.operator || 'SYSTEM'}^FS
^XZ`;
}
