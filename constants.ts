
import { UnitKey, FormDataState } from './types';

export const UNITS: UnitKey[] = [
  'CURCULAR KNITTING UNIT',
  'CROCHET',
  'DAMAN ELASTIC',
  'DIGITAL PRINTING FABRIC',
  'DIGITAL PRINTING UNIT',
  'EMBROIDERY',
  'EYE HOOK UNIT',
  'HEKTOR',
  'MOLDING',
  'SACHIN KNITTING',
  'SUNSILK',
  'TAPE DYEING',
  'TORCHAN LACE',
  'UDHNA',
  'VALUE ADDITION',
  'WARP WEFT FABRICS',
  'APPAREL PARK',
  'AMBERNATH LINGERIES UNIT',
  'SOIE',
  'SACHIN GARMENT',
  'GINZA LIFE STYLE'
];

export const DISPLAY_UNITS: UnitKey[] = [
  'CURCULAR KNITTING UNIT',
  'SACHIN KNITTING',
  'UDHNA',
  'DAMAN ELASTIC',
  'TAPE DYEING',
  'CROCHET',
  'VALUE ADDITION',
  'MOLDING',
  'DIGITAL PRINTING FABRIC',
  'DIGITAL PRINTING UNIT',
  'EMBROIDERY',
  'EYE HOOK UNIT',
  'HEKTOR',
  'SUNSILK',
  'TORCHAN LACE',
  'WARP WEFT FABRICS',
  'APPAREL PARK',
  'AMBERNATH LINGERIES UNIT',
  'SOIE',
  'SACHIN GARMENT',
  'GINZA LIFE STYLE'
];

export const INITIAL_UNIT_DATA = { orderValue: 0, dispatchValue: 0 };

export const INITIAL_FORM_STATE: FormDataState = UNITS.reduce((acc, unit) => {
  acc[unit] = { ...INITIAL_UNIT_DATA };
  return acc;
}, {} as FormDataState);

export const GOOGLE_SHEET_ID = "1j7zhkwKZYAufxkwsEUBHnauqMowQ_IPaQT5sVYFpT2w";

export const PRODUCTION_UNITS = ["CKU", "WARP", "EMB", "HOOK & EYE", "ELASTIC", "TLU", "CROCHET", "VAU", "PRINTING", "CUP"];
export const MEASURE_UNITS = ["Kg", "Mtr", "Pkt", "Yard", "Pcs", "Roll", "Inch"];

export const SALESMEN = [
  { name: "Amit Korgaonkar", contact: "9833181414" },
  { name: "Santosh Pachratkar", contact: "9320167523" },
  { name: "Rakesh Jain", contact: "9370672000" },
  { name: "Kamlesh Sutar", contact: "9004095847" },
  { name: "Pradeep Jadhav", contact: "8976230355" },
  { name: "Nikam", contact: "9867472660" },
  { name: "Ginza_Mumbai-HO", contact: "8805796399" }
];

export const ORDER_ENTRY_GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyyM6m7LOuWzW5qUg8b9ynxP3EzMfE9zrz71eld3-r1U2pROK9-GwZ8sNBQSx-MnDe6/exec"; // Using the same script but will handle different payload
