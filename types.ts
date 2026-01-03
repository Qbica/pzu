
export interface MeasurementRow {
  element: string;
  z: string[]; // External 1-5
  w: string[]; // Internal 6-8
}

export interface ZoneState {
  id: number;
  type: 'control' | 'repair';
  special: 'TWORZYWO' | 'SZKŁO' | null;
  values: string[];
}

export interface AppState {
  nr_szkody: string;
  marka_model: string;
  data_kontroli: string;
  nr_rej: string;
  miejsce_ogledzin: string;
  nr_vin: string;
  udostepniajacy: string;
  dane_udost: string;
  zakres_zgodny_tak: boolean;
  zakres_zgodny_nie: boolean;
  nie_naprawiono: boolean;
  nie_wymieniono: boolean;
  uzyte_uzywane: boolean;
  uzyte_zamienniki: boolean;
  naprawiono_wymienne: boolean;
  pominiecie_tech: boolean;
  zakres_lakierowania: boolean;
  uwagi_str1: string;
  uwagi_cd: string;
  nr_faktury: string;
  kwota_faktury: string;
  expert_name: string;
  sig_image_data: string | null;
  map_state: Record<number, ZoneState>;
  measurements: MeasurementRow[];
}
