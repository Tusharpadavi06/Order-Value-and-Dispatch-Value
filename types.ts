
export type UnitKey = 
  | 'CURCULAR KNITTING UNIT'
  | 'CROCHET'
  | 'DAMAN ELASTIC'
  | 'DIGITAL PRINTING FABRIC'
  | 'DIGITAL PRINTING UNIT'
  | 'EMBROIDERY'
  | 'EYE HOOK UNIT'
  | 'HEKTOR'
  | 'MOLDING'
  | 'SACHIN KNITTING'
  | 'SUNSILK'
  | 'TAPE DYEING'
  | 'TORCHAN LACE'
  | 'UDHNA'
  | 'VALUE ADDITION'
  | 'WARP WEFT FABRICS'
  | 'APPAREL PARK'
  | 'AMBERNATH LINGERIES UNIT'
  | 'SOIE'
  | 'SACHIN GARMENT'
  | 'GINZA LIFE STYLE';

export interface UnitData {
  orderValue: number;
  dispatchValue: number;
}

export type FormDataState = Record<UnitKey, UnitData>;

export interface SubmissionPayload {
  id: string; 
  date: string;
  units: FormDataState;
  totalOrder: number;
  totalDispatch: number;
}

export type TimeFilter = 'day' | 'month' | 'year' | 'all' | 'range';

export interface OrderItem {
  id: string;
  productionUnit: string;
  department: string;
  itemName: string;
  color: string;
  width: string;
  unit: string;
  quantity: number;
  rate: number;
  discount: number;
  deliveryDate: string;
  remark: string;
  preview?: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerNo: string;
  billingAddress: string;
  deliveryAddress: string;
  orderDate: string;
  items: OrderItem[];
  salesman: string;
  salesmanContact: string;
  orderRemarks: string;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  customerNo: string;
  billingAddress: string;
  deliveryAddress: string;
}

export interface DashboardFilters {
  unit: UnitKey | 'ALL';
  range: TimeFilter;
  selectedDate?: string;
  startDate?: string;
  endDate?: string;
  selectedMonth?: number;
  selectedYear?: number;
}
