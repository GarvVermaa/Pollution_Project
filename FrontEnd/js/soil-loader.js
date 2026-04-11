"use strict";
// ════════════════════════════════════════════
// SOIL-LOADER.JS
// Uses same .node system as AQI popups
// ════════════════════════════════════════════

const SOIL_API =
  window.VAYU_CONFIG?.API_BASE ||
  window.VAYU_API_BASE ||
  "/api";

const SOIL_PARAM_ICONS = {
  Nitrogen: "🌿",
  Phosphorus: "⚗️",
  Potassium: "🧪",
  "Organic Carbon": "🍂",
  pH: "💧",
  Sulphur: "🔥",
  Zinc: "⚡",
  Boron: "🔬",
  Iron: "🧲",
  Copper: "🟤",
  Manganese: "🪨",
  "Electrical Conductivity": "📡",
};
const SOIL_PARAM_UNITS = {
  Nitrogen: "kg/ha",
  Phosphorus: "kg/ha",
  Potassium: "kg/ha",
  "Organic Carbon": "%",
  pH: "",
  Sulphur: "ppm",
  Zinc: "ppm",
  Boron: "ppm",
  Iron: "ppm",
  Copper: "ppm",
  Manganese: "ppm",
  "Electrical Conductivity": "dS/m",
};
const CYCLES = ["2024-25", "2023-24", "2017-19", "2015-17"];

// ── Real district centroids ──────────────────────────────────────────
const DISTRICT_COORDS = {
  NICOBARS: [7.0, 93.7],
  "NORTH AND MIDDLE ANDAMAN": [12.5, 92.8],
  "SOUTH ANDAMAN": [11.6, 92.7],
  "ALLURI SITHARAMA RAJU": [18.1, 82.5],
  ANAKAPALLI: [17.7, 83.0],
  ANANTHAPURAMU: [14.7, 77.6],
  ANNAMAYYA: [13.9, 79.0],
  BAPATLA: [15.9, 80.5],
  CHITTOOR: [13.2, 79.1],
  "DR. B.R. AMBEDKAR KONASEEMA": [16.9, 82.0],
  "EAST GODAVARI": [17.2, 82.2],
  ELURU: [16.7, 81.1],
  GUNTUR: [16.3, 80.4],
  KAKINADA: [16.9, 82.2],
  KRISHNA: [16.6, 81.0],
  KURNOOL: [15.8, 78.0],
  NANDYAL: [15.5, 78.5],
  NTR: [16.5, 80.6],
  PALNADU: [16.2, 79.6],
  "PARVATHIPURAM MANYAM": [18.8, 83.4],
  PRAKASAM: [15.3, 79.6],
  "SPSR NELLORE": [14.4, 80.0],
  "SRI SATHYA SAI": [14.1, 77.8],
  SRIKAKULAM: [18.3, 83.9],
  TIRUPATI: [13.6, 79.4],
  VISAKHAPATNAM: [17.7, 83.2],
  VIZIANAGARAM: [18.1, 83.4],
  "WEST GODAVARI": [16.9, 81.3],
  YSR: [14.5, 78.8],
  ANJAW: [28.1, 97.1],
  "CAPITAL COMPLEX ITANAGAR": [27.1, 93.6],
  CHANGLANG: [27.1, 96.2],
  "DIBANG VALLEY": [28.6, 95.7],
  "EAST KAMENG": [27.3, 92.8],
  "EAST SIANG": [28.0, 95.2],
  KAMLE: [27.8, 93.7],
  "KRA DAADI": [28.4, 94.3],
  "KURUNG KUMEY": [28.2, 94.0],
  "LEPA RADA": [27.9, 94.7],
  LOHIT: [27.9, 96.2],
  LONGDING: [27.0, 95.8],
  "LOWER DIBANG VALLEY": [28.0, 95.5],
  "LOWER SIANG": [27.7, 94.6],
  "LOWER SUBANSIRI": [27.6, 93.9],
  NAMSAI: [27.7, 95.8],
  "PAKKE KESSANG": [27.2, 93.0],
  "PAPUM PARE": [27.2, 93.8],
  "SHI YOMI": [28.5, 94.8],
  SIANG: [28.2, 94.9],
  TAWANG: [27.6, 91.9],
  TIRAP: [27.0, 95.5],
  "UPPER DIBANG VALLEY": [28.6, 96.0],
  "UPPER SIANG": [28.8, 95.5],
  "UPPER SUBANSIRI": [28.0, 94.4],
  "WEST KAMENG": [27.2, 92.4],
  "WEST SIANG": [28.1, 94.5],
  BAKSA: [26.7, 91.2],
  BARPETA: [26.3, 91.0],
  BISWANATH: [26.7, 93.2],
  BONGAIGAON: [26.5, 90.6],
  CACHAR: [24.8, 92.9],
  CHARAIDEO: [27.0, 94.8],
  CHIRANG: [26.5, 90.5],
  DARRANG: [26.5, 92.2],
  DHEMAJI: [27.5, 94.6],
  DHUBRI: [26.0, 89.9],
  DIBRUGARH: [27.5, 95.0],
  "DIMA HASAO": [25.5, 93.0],
  GOALPARA: [26.2, 90.6],
  GOLAGHAT: [26.5, 93.9],
  HAILAKANDI: [24.7, 92.6],
  HOJAI: [26.0, 92.9],
  JORHAT: [26.7, 94.2],
  KAMRUP: [26.3, 91.4],
  "KAMRUP METROPOLITAN": [26.2, 91.7],
  "KARBI ANGLONG": [26.1, 93.7],
  KARIMGANJ: [24.9, 92.4],
  KOKRAJHAR: [26.4, 90.3],
  LAKHIMPUR: [27.2, 94.1],
  MAJULI: [27.0, 94.2],
  MORIGAON: [26.2, 92.3],
  NAGAON: [26.4, 92.7],
  NALBARI: [26.4, 91.4],
  SIVASAGAR: [26.9, 94.6],
  SONITPUR: [26.6, 93.0],
  "SOUTH SALMARA-MANKACHAR": [25.8, 89.9],
  TINSUKIA: [27.5, 95.4],
  UDALGURI: [26.8, 92.1],
  "WEST KARBI ANGLONG": [25.8, 92.8],
  ARARIA: [26.1, 87.5],
  ARWAL: [25.3, 84.7],
  AURANGABAD: [19.9, 75.3],
  BANKA: [24.9, 86.9],
  BEGUSARAI: [25.4, 86.1],
  BHAGALPUR: [25.2, 87.0],
  BHOJPUR: [25.6, 84.4],
  BUXAR: [25.6, 84.0],
  DARBHANGA: [26.2, 85.9],
  "EAST CHAMPARAN": [26.7, 84.9],
  GAYA: [24.8, 85.0],
  GOPALGANJ: [26.5, 84.4],
  JAMUI: [24.9, 86.2],
  JEHANABAD: [25.2, 84.9],
  KAIMUR: [25.0, 83.6],
  KATIHAR: [25.5, 87.6],
  KHAGARIA: [25.5, 86.5],
  KISHANGANJ: [26.1, 87.9],
  LAKHISARAI: [25.2, 86.1],
  MADHEPURA: [26.0, 86.8],
  MADHUBANI: [26.4, 86.1],
  MUNGER: [25.4, 86.5],
  MUZAFFARPUR: [26.1, 85.4],
  NALANDA: [25.1, 85.4],
  NAWADA: [24.9, 85.5],
  PATNA: [25.6, 85.1],
  PURNIA: [25.8, 87.5],
  ROHTAS: [24.9, 84.0],
  SAHARSA: [25.9, 86.6],
  SAMASTIPUR: [25.9, 85.8],
  SARAN: [25.9, 84.7],
  SHEIKHPURA: [25.1, 85.9],
  SHEOHAR: [26.5, 85.3],
  SITAMARHI: [26.6, 85.5],
  SIWAN: [26.2, 84.4],
  SUPAUL: [26.1, 86.6],
  VAISHALI: [25.7, 85.2],
  "WEST CHAMPARAN": [27.2, 84.4],
  BALOD: [20.7, 81.2],
  "BALODA BAZAR": [21.7, 82.2],
  BALRAMPUR: [27.4, 82.2],
  BASTAR: [19.1, 82.0],
  BEMETARA: [21.7, 81.5],
  BIJAPUR: [18.8, 80.8],
  BILASPUR: [31.3, 76.8],
  DANTEWADA: [18.9, 81.3],
  DHAMTARI: [20.7, 81.5],
  DURG: [21.2, 81.3],
  GARIABAND: [20.6, 82.1],
  "GAURELA-PENDRA-MARWAHI": [22.7, 81.7],
  "JANJGIR-CHAMPA": [22.0, 82.6],
  JASHPUR: [22.9, 84.1],
  KABIRDHAM: [22.1, 81.3],
  KANKER: [20.3, 81.5],
  KONDAGAON: [19.6, 81.7],
  KORBA: [22.4, 82.7],
  KORIYA: [23.1, 82.7],
  MAHASAMUND: [21.1, 82.1],
  MUNGELI: [22.1, 81.7],
  NARAYANPUR: [19.7, 81.2],
  RAIGARH: [21.9, 83.4],
  RAIPUR: [21.2, 81.6],
  RAJNANDGAON: [21.1, 81.0],
  SUKMA: [18.4, 81.7],
  SURAJPUR: [23.2, 82.9],
  SURGUJA: [23.1, 83.2],
  "NORTH GOA": [15.5, 74.0],
  "SOUTH GOA": [15.2, 74.1],
  AHMEDABAD: [23.0, 72.6],
  AMRELI: [21.6, 71.2],
  ANAND: [22.6, 72.9],
  ARAVALLI: [23.7, 73.1],
  BANASKANTHA: [24.2, 72.4],
  BHARUCH: [21.7, 73.0],
  BHAVNAGAR: [21.8, 72.2],
  BOTAD: [22.2, 71.7],
  "CHHOTA UDAIPUR": [22.3, 74.0],
  DAHOD: [22.8, 74.3],
  "DEVBHOOMI DWARKA": [22.2, 69.1],
  GANDHINAGAR: [23.2, 72.7],
  "GIR SOMNATH": [20.9, 70.4],
  JAMNAGAR: [22.5, 70.1],
  JUNAGADH: [21.5, 70.5],
  KHEDA: [22.7, 72.7],
  KUTCH: [23.7, 70.0],
  MAHISAGAR: [23.1, 73.5],
  MEHSANA: [23.6, 72.4],
  MORBI: [22.8, 70.8],
  NARMADA: [21.9, 73.5],
  NAVSARI: [20.9, 73.1],
  PANCHMAHAL: [22.7, 73.5],
  PATAN: [23.8, 72.1],
  PORBANDAR: [21.6, 69.6],
  RAJKOT: [22.3, 70.8],
  SABARKANTHA: [23.4, 73.0],
  SURAT: [21.2, 72.8],
  SURENDRANAGAR: [22.7, 71.6],
  TAPI: [21.1, 73.5],
  VADODARA: [22.3, 73.2],
  VALSAD: [20.6, 73.0],
  AMBALA: [30.4, 76.8],
  BHIWANI: [28.8, 76.1],
  "CHARKHI DADRI": [28.6, 76.3],
  FARIDABAD: [28.4, 77.3],
  FATEHABAD: [29.5, 75.5],
  GURUGRAM: [28.5, 77.0],
  HISAR: [29.2, 75.7],
  JHAJJAR: [28.6, 76.7],
  JIND: [29.3, 76.3],
  KAITHAL: [29.8, 76.4],
  KARNAL: [29.7, 77.0],
  KURUKSHETRA: [29.9, 76.8],
  MAHENDRAGARH: [28.3, 76.2],
  NUH: [28.1, 77.0],
  PALWAL: [28.1, 77.3],
  PANCHKULA: [30.7, 77.0],
  PANIPAT: [29.4, 77.0],
  REWARI: [28.2, 76.6],
  ROHTAK: [28.9, 76.6],
  SIRSA: [29.5, 75.0],
  SONIPAT: [29.0, 77.0],
  YAMUNANAGAR: [30.1, 77.3],
  CHAMBA: [32.6, 76.1],
  HAMIRPUR: [25.9, 80.1],
  KANGRA: [32.1, 76.3],
  KINNAUR: [31.6, 78.5],
  KULLU: [31.9, 77.1],
  "LAHAUL AND SPITI": [32.5, 77.6],
  MANDI: [31.7, 76.9],
  SHIMLA: [31.1, 77.2],
  SIRMAUR: [30.6, 77.5],
  SOLAN: [30.9, 77.1],
  UNA: [31.5, 76.3],
  ANANTNAG: [33.7, 75.2],
  BANDIPORA: [34.4, 74.6],
  BARAMULLA: [34.2, 74.4],
  BUDGAM: [34.0, 74.8],
  DODA: [33.1, 75.5],
  GANDERBAL: [34.2, 74.8],
  JAMMU: [32.7, 74.9],
  KATHUA: [32.4, 75.5],
  KISHTWAR: [33.3, 75.8],
  KULGAM: [33.6, 75.0],
  KUPWARA: [34.5, 74.3],
  POONCH: [33.8, 74.1],
  PULWAMA: [33.9, 75.0],
  RAJOURI: [33.4, 74.3],
  RAMBAN: [33.3, 75.2],
  REASI: [33.1, 74.8],
  SAMBA: [32.6, 75.1],
  SHOPIAN: [33.7, 74.8],
  SRINAGAR: [34.1, 74.8],
  UDHAMPUR: [32.9, 75.1],
  LEH: [34.2, 77.6],
  KARGIL: [34.6, 76.1],
  BOKARO: [23.8, 85.9],
  CHATRA: [24.2, 84.9],
  DEOGHAR: [24.5, 86.7],
  DHANBAD: [23.8, 86.4],
  DUMKA: [24.3, 87.2],
  "EAST SINGHBHUM": [22.8, 86.2],
  GARHWA: [24.2, 83.8],
  GIRIDIH: [24.2, 86.3],
  GODDA: [24.8, 87.2],
  GUMLA: [23.0, 84.5],
  HAZARIBAGH: [24.0, 85.4],
  JAMTARA: [23.9, 86.8],
  KHUNTI: [23.1, 85.3],
  KODERMA: [24.5, 85.6],
  LATEHAR: [23.7, 84.5],
  LOHARDAGA: [23.4, 84.7],
  PAKUR: [24.6, 87.8],
  PALAMU: [24.0, 84.1],
  RAMGARH: [23.6, 85.5],
  RANCHI: [23.4, 85.3],
  SAHEBGANJ: [25.2, 87.6],
  "SERAIKELA KHARSAWAN": [22.7, 85.9],
  SIMDEGA: [22.6, 84.5],
  "WEST SINGHBHUM": [22.4, 85.4],
  BAGALKOT: [16.2, 75.7],
  BALLARI: [15.1, 76.9],
  BELAGAVI: [15.8, 74.5],
  "BENGALURU RURAL": [13.2, 77.6],
  "BENGALURU URBAN": [12.9, 77.6],
  BIDAR: [17.9, 77.5],
  CHAMARAJANAGARA: [11.9, 76.9],
  CHIKKABALLAPURA: [13.4, 77.7],
  CHIKKAMAGALURU: [13.3, 75.8],
  CHITRADURGA: [14.2, 76.4],
  "DAKSHINA KANNADA": [12.9, 75.2],
  DAVANAGERE: [14.5, 75.9],
  DHARWAD: [15.5, 75.0],
  GADAG: [15.4, 75.6],
  HASSAN: [13.0, 76.1],
  HAVERI: [14.8, 75.4],
  KALABURAGI: [17.3, 76.8],
  KODAGU: [12.4, 75.7],
  KOLAR: [13.1, 78.1],
  KOPPAL: [15.4, 76.2],
  MANDYA: [12.5, 76.9],
  MYSURU: [12.3, 76.7],
  RAICHUR: [16.2, 77.4],
  RAMANAGARA: [12.7, 77.3],
  SHIVAMOGGA: [13.9, 75.6],
  TUMAKURU: [13.3, 77.1],
  UDUPI: [13.3, 74.7],
  "UTTARA KANNADA": [14.8, 74.7],
  VIJAYANAGARA: [15.0, 76.4],
  VIJAYAPURA: [16.8, 75.7],
  YADGIR: [16.8, 77.1],
  ALAPPUZHA: [9.5, 76.3],
  ERNAKULAM: [10.0, 76.4],
  IDUKKI: [9.9, 77.1],
  KANNUR: [11.9, 75.4],
  KASARAGOD: [12.5, 75.0],
  KOLLAM: [9.0, 76.6],
  KOTTAYAM: [9.6, 76.5],
  KOZHIKODE: [11.3, 75.8],
  MALAPPURAM: [11.1, 76.1],
  PALAKKAD: [10.8, 76.7],
  PATHANAMTHITTA: [9.3, 76.8],
  THIRUVANANTHAPURAM: [8.5, 77.0],
  THRISSUR: [10.5, 76.2],
  WAYANAD: [11.6, 76.1],
  "AGAR MALWA": [23.7, 76.0],
  ALIRAJPUR: [22.3, 74.4],
  ANUPPUR: [23.1, 81.7],
  ASHOKNAGAR: [24.6, 77.7],
  BALAGHAT: [21.8, 80.2],
  BARWANI: [22.0, 74.9],
  BETUL: [21.9, 77.9],
  BHIND: [26.6, 78.8],
  BHOPAL: [23.3, 77.4],
  BURHANPUR: [21.3, 76.2],
  CHHATARPUR: [24.9, 79.6],
  CHHINDWARA: [22.1, 78.9],
  DAMOH: [23.8, 79.4],
  DATIA: [25.7, 78.5],
  DEWAS: [22.9, 76.1],
  DHAR: [22.6, 75.3],
  DINDORI: [22.9, 81.1],
  GUNA: [24.6, 77.3],
  GWALIOR: [26.2, 78.2],
  HARDA: [22.3, 77.1],
  HOSHANGABAD: [22.8, 77.7],
  INDORE: [22.7, 75.9],
  JABALPUR: [23.2, 80.0],
  JHABUA: [22.8, 74.6],
  KATNI: [23.8, 80.4],
  KHANDWA: [21.8, 76.4],
  KHARGONE: [21.8, 75.6],
  MANDLA: [22.6, 80.4],
  MANDSAUR: [24.1, 75.1],
  MORENA: [26.5, 78.0],
  NARSINGHPUR: [22.9, 79.2],
  NEEMUCH: [24.5, 74.9],
  NIWARI: [25.0, 78.6],
  PANNA: [24.7, 80.2],
  RAISEN: [23.3, 77.8],
  RAJGARH: [24.0, 76.7],
  RATLAM: [23.3, 75.0],
  REWA: [24.5, 81.3],
  SAGAR: [23.8, 78.7],
  SATNA: [24.6, 80.8],
  SEHORE: [23.2, 77.1],
  SEONI: [22.1, 79.5],
  SHAHDOL: [23.3, 81.3],
  SHAJAPUR: [23.4, 76.3],
  SHEOPUR: [25.7, 76.7],
  SHIVPURI: [25.4, 77.7],
  SIDHI: [24.4, 81.9],
  SINGRAULI: [24.2, 82.7],
  TIKAMGARH: [24.7, 78.8],
  UJJAIN: [23.2, 75.8],
  UMARIA: [23.5, 80.8],
  VIDISHA: [23.5, 77.8],
  AHMADNAGAR: [19.1, 74.7],
  AKOLA: [20.7, 77.0],
  AMRAVATI: [20.9, 77.8],
  BEED: [18.9, 75.8],
  BHANDARA: [21.2, 79.7],
  BULDHANA: [20.5, 76.2],
  CHANDRAPUR: [20.0, 79.3],
  DHULE: [20.9, 74.8],
  GADCHIROLI: [20.2, 80.0],
  GONDIA: [21.5, 80.2],
  HINGOLI: [19.7, 77.2],
  JALGAON: [21.0, 75.6],
  JALNA: [19.8, 75.9],
  KOLHAPUR: [16.7, 74.2],
  LATUR: [18.4, 76.6],
  "MUMBAI CITY": [18.9, 72.8],
  "MUMBAI SUBURBAN": [19.1, 72.9],
  NAGPUR: [21.1, 79.1],
  NANDED: [19.2, 77.3],
  NANDURBAR: [21.4, 74.2],
  NASHIK: [20.0, 73.8],
  OSMANABAD: [18.2, 76.1],
  PALGHAR: [19.7, 72.8],
  PARBHANI: [19.3, 76.8],
  PUNE: [18.5, 73.9],
  RAIGAD: [18.5, 73.2],
  RATNAGIRI: [17.0, 73.3],
  SANGLI: [16.9, 74.6],
  SATARA: [17.7, 74.0],
  SINDHUDURG: [16.4, 73.7],
  SOLAPUR: [17.7, 75.9],
  THANE: [19.2, 73.0],
  WARDHA: [20.7, 78.6],
  WASHIM: [20.1, 77.1],
  YAVATMAL: [20.4, 78.1],
  BISHNUPUR: [24.6, 93.8],
  CHANDEL: [24.4, 94.0],
  CHURACHANDPUR: [24.3, 93.7],
  "IMPHAL EAST": [24.8, 94.0],
  "IMPHAL WEST": [24.8, 93.9],
  JIRIBAM: [24.8, 93.1],
  KAKCHING: [24.5, 93.9],
  KAMJONG: [25.1, 94.4],
  KANGPOKPI: [25.1, 93.9],
  NONEY: [25.0, 93.7],
  PHERZAWL: [24.0, 93.5],
  SENAPATI: [25.3, 94.0],
  TAMENGLONG: [25.0, 93.5],
  TENGNOUPAL: [24.4, 94.1],
  THOUBAL: [24.6, 94.0],
  UKHRUL: [25.1, 94.4],
  "EAST GARO HILLS": [25.5, 90.5],
  "EAST JAINTIA HILLS": [25.4, 92.4],
  "EAST KHASI HILLS": [25.6, 91.9],
  "EASTERN WEST KHASI HILLS": [25.5, 91.4],
  "NORTH GARO HILLS": [26.0, 90.7],
  "RI BHOI": [25.8, 91.8],
  "SOUTH GARO HILLS": [25.1, 90.4],
  "SOUTH WEST GARO HILLS": [25.2, 89.9],
  "SOUTH WEST KHASI HILLS": [25.2, 91.1],
  "WEST GARO HILLS": [25.6, 90.2],
  "WEST JAINTIA HILLS": [25.3, 92.1],
  "WEST KHASI HILLS": [25.4, 91.4],
  AIZAWL: [23.7, 92.7],
  CHAMPHAI: [23.5, 93.3],
  HNAHTHIAL: [23.0, 92.8],
  KHAWZAWL: [23.3, 93.1],
  KOLASIB: [24.2, 92.7],
  LAWNGTLAI: [22.5, 92.9],
  LUNGLEI: [22.9, 92.7],
  MAMIT: [23.9, 92.5],
  SAIHA: [22.5, 92.9],
  SAITUAL: [23.7, 92.9],
  SERCHHIP: [23.3, 92.8],
  CHUMOUKEDIMA: [25.7, 94.1],
  DIMAPUR: [25.9, 93.7],
  KIPHIRE: [26.0, 94.9],
  KOHIMA: [25.7, 94.1],
  LONGLENG: [26.6, 95.1],
  MOKOKCHUNG: [26.3, 94.5],
  MON: [26.7, 95.0],
  NIULAND: [25.8, 94.0],
  NOKLAK: [26.5, 95.5],
  PEREN: [25.5, 93.7],
  PHEK: [25.7, 94.5],
  SHAMATOR: [26.5, 94.9],
  TSEMINYU: [25.9, 94.2],
  TUENSANG: [26.3, 94.8],
  WOKHA: [26.1, 94.3],
  ZUNHEBOTO: [26.0, 94.5],
  ANGUL: [20.8, 85.1],
  BALANGIR: [20.7, 83.5],
  BALASORE: [21.5, 86.9],
  BARGARH: [21.3, 83.6],
  BHADRAK: [21.1, 86.5],
  BOUDH: [20.8, 84.3],
  CUTTACK: [20.5, 85.9],
  DEOGARH: [21.5, 84.7],
  DHENKANAL: [20.7, 85.6],
  GAJAPATI: [19.0, 84.1],
  GANJAM: [19.4, 84.7],
  JAGATSINGHPUR: [20.3, 86.2],
  JAJPUR: [20.9, 86.3],
  JHARSUGUDA: [21.9, 84.0],
  KALAHANDI: [19.9, 83.2],
  KANDHAMAL: [20.1, 84.2],
  KENDRAPARA: [20.5, 86.4],
  KENDUJHAR: [21.6, 85.6],
  KHORDHA: [20.2, 85.8],
  KORAPUT: [18.8, 82.7],
  MALKANGIRI: [18.4, 82.1],
  MAYURBHANJ: [22.1, 86.3],
  NABARANGPUR: [19.2, 82.5],
  NAYAGARH: [20.1, 85.1],
  NUAPADA: [20.6, 82.5],
  PURI: [19.8, 85.8],
  RAYAGADA: [19.2, 83.4],
  SAMBALPUR: [21.5, 83.9],
  SUBARNAPUR: [20.8, 83.9],
  SUNDERGARH: [22.1, 84.0],
  AMRITSAR: [31.6, 74.9],
  BARNALA: [30.4, 75.5],
  BATHINDA: [30.2, 74.9],
  FARIDKOT: [30.7, 74.8],
  "FATEHGARH SAHIB": [30.6, 76.4],
  FAZILKA: [30.4, 74.0],
  FEROZEPUR: [30.9, 74.6],
  GURDASPUR: [32.0, 75.4],
  HOSHIARPUR: [31.5, 75.9],
  JALANDHAR: [31.3, 75.6],
  KAPURTHALA: [31.4, 75.4],
  LUDHIANA: [30.9, 75.9],
  MALERKOTLA: [30.5, 75.9],
  MANSA: [29.9, 75.4],
  MOGA: [30.8, 75.2],
  MUKTSAR: [30.5, 74.5],
  NAWANSHAHR: [31.1, 76.1],
  PATHANKOT: [32.3, 75.7],
  PATIALA: [30.3, 76.4],
  RUPNAGAR: [31.0, 76.5],
  "SAS NAGAR": [30.7, 76.7],
  "SBS NAGAR": [31.1, 76.1],
  SANGRUR: [30.2, 75.8],
  "TARN TARAN": [31.5, 74.9],
  AJMER: [26.5, 74.6],
  ALWAR: [27.6, 76.6],
  BANSWARA: [23.5, 74.4],
  BARAN: [25.1, 76.5],
  BARMER: [25.7, 71.4],
  BHARATPUR: [27.2, 77.5],
  BHILWARA: [25.3, 74.6],
  BIKANER: [28.0, 73.3],
  BUNDI: [25.4, 75.6],
  CHITTORGARH: [24.9, 74.6],
  CHURU: [28.3, 74.9],
  DAUSA: [26.9, 76.3],
  DHOLPUR: [26.7, 77.9],
  DUNGARPUR: [23.8, 73.7],
  GANGANAGAR: [29.9, 73.9],
  HANUMANGARH: [29.6, 74.3],
  JAIPUR: [26.9, 75.8],
  JAISALMER: [26.9, 70.9],
  JALORE: [25.3, 72.6],
  JHALAWAR: [24.6, 76.2],
  JHUNJHUNU: [28.1, 75.4],
  JODHPUR: [26.3, 73.0],
  KARAULI: [26.5, 77.0],
  KOTA: [25.2, 75.9],
  NAGAUR: [27.2, 73.7],
  PALI: [25.8, 73.3],
  PRATAPGARH: [25.9, 81.9],
  RAJSAMAND: [25.1, 73.9],
  "SAWAI MADHOPUR": [26.0, 76.4],
  SIKAR: [27.6, 75.1],
  SIROHI: [24.9, 72.9],
  "SRI GANGANAGAR": [29.9, 73.9],
  TONK: [26.2, 75.8],
  UDAIPUR: [24.6, 73.7],
  "EAST SIKKIM": [27.3, 88.6],
  "NORTH SIKKIM": [27.7, 88.4],
  PAKYONG: [27.2, 88.6],
  SORENG: [27.2, 88.2],
  "SOUTH SIKKIM": [27.1, 88.4],
  "WEST SIKKIM": [27.3, 88.2],
  ARIYALUR: [11.1, 79.1],
  CHENGALPATTU: [12.7, 80.0],
  CHENNAI: [13.1, 80.3],
  COIMBATORE: [11.0, 76.9],
  CUDDALORE: [11.8, 79.8],
  DHARMAPURI: [12.1, 78.2],
  DINDIGUL: [10.4, 77.9],
  ERODE: [11.3, 77.7],
  KALLAKURICHI: [11.7, 78.9],
  KANCHIPURAM: [12.8, 79.7],
  KANYAKUMARI: [8.1, 77.5],
  KARUR: [10.9, 78.1],
  KRISHNAGIRI: [12.5, 78.2],
  MADURAI: [9.9, 78.1],
  MAYILADUTHURAI: [11.1, 79.7],
  NAGAPATTINAM: [10.8, 79.8],
  NAMAKKAL: [11.2, 78.2],
  NILGIRIS: [11.4, 76.7],
  PERAMBALUR: [11.2, 78.9],
  PUDUKKOTTAI: [10.4, 78.8],
  RAMANATHAPURAM: [9.4, 78.8],
  RANIPET: [12.9, 79.3],
  SALEM: [11.7, 78.1],
  SIVAGANGA: [9.8, 78.5],
  TENKASI: [8.9, 77.3],
  THANJAVUR: [10.8, 79.1],
  THENI: [10.0, 77.5],
  THOOTHUKUDI: [8.8, 78.1],
  TIRUCHIRAPPALLI: [10.8, 78.7],
  TIRUNELVELI: [8.7, 77.7],
  TIRUPATHUR: [12.5, 78.6],
  TIRUPPUR: [11.1, 77.3],
  TIRUVALLUR: [13.1, 79.9],
  TIRUVANNAMALAI: [12.2, 79.1],
  TIRUVARUR: [10.8, 79.6],
  VELLORE: [12.9, 79.1],
  VILUPPURAM: [11.9, 79.5],
  VIRUDHUNAGAR: [9.6, 77.9],
  ADILABAD: [19.7, 78.5],
  "BHADRADRI KOTHAGUDEM": [17.6, 80.6],
  HANUMAKONDA: [18.0, 79.6],
  HYDERABAD: [17.4, 78.5],
  JAGTIAL: [18.8, 79.0],
  JANGAON: [17.7, 79.2],
  "JAYASHANKAR BHUPALPALLY": [18.4, 80.0],
  "JOGULAMBA GADWAL": [16.2, 77.8],
  KAMAREDDY: [18.3, 78.3],
  KARIMNAGAR: [18.4, 79.1],
  KHAMMAM: [17.2, 80.1],
  "KUMURAM BHEEM": [19.5, 79.5],
  MAHABUBABAD: [17.6, 80.0],
  MAHABUBNAGAR: [16.7, 78.0],
  MANCHERIAL: [18.9, 79.5],
  MEDAK: [18.1, 78.3],
  "MEDCHAL MALKAJGIRI": [17.5, 78.5],
  MULUGU: [18.2, 80.1],
  NAGARKURNOOL: [16.5, 78.3],
  NALGONDA: [17.1, 79.3],
  NARAYANPET: [16.7, 77.5],
  NIRMAL: [19.1, 78.4],
  NIZAMABAD: [18.7, 78.1],
  PEDDAPALLI: [18.6, 79.4],
  "RAJANNA SIRCILLA": [18.4, 78.8],
  "RANGA REDDY": [17.3, 78.4],
  SANGAREDDY: [17.6, 78.1],
  SIDDIPET: [18.1, 78.9],
  SURYAPET: [17.1, 79.6],
  VIKARABAD: [17.3, 77.9],
  WANAPARTHY: [16.4, 78.1],
  WARANGAL: [18.0, 79.6],
  "YADADRI BHUVANAGIRI": [17.6, 79.0],
  DHALAI: [24.0, 92.1],
  GOMATI: [23.5, 91.7],
  KHOWAI: [24.1, 91.6],
  "NORTH TRIPURA": [24.4, 92.0],
  SEPAHIJALA: [23.6, 91.5],
  SIPAHIJALA: [23.6, 91.5],
  "SOUTH TRIPURA": [23.2, 91.7],
  UNOKOTI: [24.3, 92.1],
  "WEST TRIPURA": [23.8, 91.3],
  AGRA: [27.2, 78.0],
  ALIGARH: [27.9, 78.1],
  "AMBEDKAR NAGAR": [26.4, 82.5],
  AMETHI: [26.2, 81.9],
  AMROHA: [28.9, 78.5],
  AURAIYA: [26.5, 79.5],
  AYODHYA: [26.8, 82.2],
  AZAMGARH: [26.1, 83.2],
  BAGHPAT: [28.9, 77.2],
  BAHRAICH: [27.6, 81.6],
  BALLIA: [25.8, 84.1],
  BANDA: [25.5, 80.3],
  BARABANKI: [26.9, 81.2],
  BAREILLY: [28.4, 79.4],
  BASTI: [26.8, 82.7],
  BIJNOR: [29.4, 78.1],
  BUDAUN: [28.0, 79.1],
  BULANDSHAHR: [28.4, 77.9],
  CHANDAULI: [25.3, 83.3],
  CHITRAKOOT: [25.2, 80.9],
  DEORIA: [26.5, 83.8],
  ETAH: [27.6, 78.7],
  ETAWAH: [26.8, 79.0],
  FARRUKHABAD: [27.4, 79.6],
  FATEHPUR: [25.9, 80.8],
  FIROZABAD: [27.2, 78.4],
  "GAUTAM BUDDH NAGAR": [28.5, 77.4],
  GHAZIABAD: [28.7, 77.4],
  GHAZIPUR: [25.6, 83.6],
  GONDA: [27.1, 82.0],
  GORAKHPUR: [26.7, 83.4],
  HAPUR: [28.7, 77.8],
  HARDOI: [27.4, 80.1],
  HATHRAS: [27.6, 78.1],
  JALAUN: [26.1, 79.4],
  JAUNPUR: [25.7, 82.7],
  JHANSI: [25.4, 78.6],
  KANNAUJ: [27.1, 79.9],
  "KANPUR DEHAT": [26.4, 79.9],
  "KANPUR NAGAR": [26.5, 80.3],
  KASGANJ: [27.8, 78.6],
  KAUSHAMBI: [25.5, 81.4],
  KUSHINAGAR: [26.7, 83.9],
  "LAKHIMPUR KHERI": [27.9, 80.8],
  LALITPUR: [24.7, 78.4],
  LUCKNOW: [26.8, 80.9],
  MAHARAJGANJ: [27.1, 83.6],
  MAHOBA: [25.3, 79.9],
  MAINPURI: [27.2, 79.0],
  MATHURA: [27.5, 77.7],
  MAU: [25.9, 83.6],
  MEERUT: [29.0, 77.7],
  MIRZAPUR: [25.1, 82.6],
  MORADABAD: [28.8, 78.8],
  MUZAFFARNAGAR: [29.5, 77.7],
  PILIBHIT: [28.6, 79.8],
  PRAYAGRAJ: [25.4, 81.8],
  "RAE BARELI": [26.2, 81.2],
  RAMPUR: [28.8, 79.0],
  SAHARANPUR: [29.9, 77.5],
  SAMBHAL: [28.6, 78.6],
  "SANT KABIR NAGAR": [26.8, 83.1],
  SHAHJAHANPUR: [27.9, 79.9],
  SHAMLI: [29.5, 77.3],
  SHRAVASTI: [27.6, 81.9],
  SIDDHARTHNAGAR: [27.3, 83.1],
  SITAPUR: [27.6, 80.7],
  SONBHADRA: [24.7, 83.0],
  SULTANPUR: [26.3, 82.1],
  UNNAO: [26.5, 80.5],
  VARANASI: [25.3, 83.0],
  ALMORA: [29.6, 79.7],
  BAGESHWAR: [29.8, 79.8],
  CHAMOLI: [30.4, 79.3],
  CHAMPAWAT: [29.3, 80.1],
  DEHRADUN: [30.3, 78.0],
  HARIDWAR: [29.9, 78.2],
  NAINITAL: [29.4, 79.5],
  "PAURI GARHWAL": [29.7, 78.8],
  PITHORAGARH: [29.6, 80.2],
  RUDRAPRAYAG: [30.3, 79.0],
  "TEHRI GARHWAL": [30.4, 78.5],
  "UDHAM SINGH NAGAR": [29.0, 79.5],
  UTTARKASHI: [30.7, 78.5],
  ALIPURDUAR: [26.5, 89.5],
  BANKURA: [23.2, 87.1],
  BIRBHUM: [23.9, 87.5],
  "COOCH BEHAR": [26.3, 89.4],
  COOCHBEHAR: [26.3, 89.4],
  "DAKSHIN DINAJPUR": [25.6, 88.8],
  DARJEELING: [27.0, 88.3],
  HOOGHLY: [22.9, 88.4],
  HOWRAH: [22.6, 88.3],
  JALPAIGURI: [26.5, 88.7],
  JHARGRAM: [22.5, 86.9],
  KALIMPONG: [27.1, 88.5],
  KOLKATA: [22.6, 88.4],
  MALDA: [25.0, 88.1],
  MURSHIDABAD: [24.2, 88.3],
  NADIA: [23.5, 88.6],
  "NORTH 24 PARGANAS": [22.9, 88.5],
  "PASCHIM BARDHAMAN": [23.2, 87.1],
  "PASCHIM MEDINIPUR": [22.4, 87.3],
  "PURBA BARDHAMAN": [23.3, 87.9],
  "PURBA MEDINIPUR": [22.0, 87.9],
  PURULIA: [23.3, 86.4],
  "SOUTH 24 PARGANAS": [22.0, 88.3],
  "UTTAR DINAJPUR": [26.1, 88.2],
};

const STATE_CENTROIDS = {
  35: [11.6, 92.7],
  28: [15.9, 79.7],
  12: [28.2, 94.7],
  18: [26.2, 92.9],
  10: [25.3, 85.3],
  22: [21.2, 81.6],
  30: [15.3, 74.0],
  24: [22.2, 71.6],
  6: [29.0, 76.0],
  2: [32.0, 77.1],
  1: [33.7, 76.5],
  20: [23.6, 85.2],
  29: [15.3, 75.7],
  32: [10.8, 76.2],
  23: [22.9, 78.6],
  17: [25.4, 91.3],
  14: [24.6, 93.9],
  15: [23.7, 92.7],
  16: [23.9, 91.9],
  13: [26.1, 94.5],
  27: [19.7, 75.7],
  11: [27.5, 88.5],
  21: [20.9, 84.2],
  34: [11.9, 79.8],
  36: [17.3, 78.4],
  33: [11.1, 78.6],
  9: [26.8, 80.9],
  5: [30.3, 78.9],
  8: [27.0, 74.2],
  3: [31.1, 75.3],
  7: [28.6, 77.2],
  19: [22.9, 87.8],
  37: [34.1, 77.5],
  38: [20.1, 73.0],
};

function getDistrictCoords(district) {
  const name = district.district?.toUpperCase().trim();
  if (name && DISTRICT_COORDS[name]) return DISTRICT_COORDS[name];
  const sc = String(district.state_code);
  const dc = parseInt(district.district_code) || 0;
  const base = STATE_CENTROIDS[sc] || [20.5, 78.9];
  const s1 = ((dc * 7919) % 500) / 500;
  const s2 = ((dc * 6271) % 500) / 500;
  return [base[0] + (s1 - 0.5) * 2.5, base[1] + (s2 - 0.5) * 2.5];
}

// ── Scoring ──────────────────────────────────────────────────────────
function getSoilScore(cycleData) {
  if (!cycleData) return null;
  const vals = Object.values(cycleData).filter(Boolean);
  if (!vals.length) return null;
  const s = vals.map((v) =>
    v.status === "High" ? 3 : v.status === "Medium" ? 2 : 1,
  );
  return s.reduce((a, b) => a + b, 0) / s.length;
}
function scoreToColor(score) {
  if (score === null) return "#607d8b";
  if (score >= 2.5) return "#4caf50";
  if (score >= 1.8) return "#fdd835";
  if (score >= 1.3) return "#ff7c00";
  return "#f50057";
}
function scoreToLabel(score) {
  if (score === null) return "No Data";
  if (score >= 2.5) return "Healthy";
  if (score >= 1.8) return "Moderate";
  if (score >= 1.3) return "Degraded";
  return "Poor";
}

// ── Spawn soil node (mirrors spawnChildNode from popups.js) ──────────
function spawnSoilNode(markerEl, district, lat, lng) {
  const { map } = window.VAYU;
  const svg = document.getElementById("canvas-svg");
  const app = document.getElementById("app");

  // Remove existing node for this district if open (toggle)
  const existingId = `soil-district-node-${district.district_code}`;
  const existing = document.getElementById(existingId);
  if (existing) {
    removeNodeAndChildren(existingId);
    existing.remove();
    return;
  }

  const newId = "node-" + window.VAYU.nodeCount++;
  const newNode = document.createElement("div");
  newNode.className = "node";
  newNode.id = existingId; // use stable ID so toggle works
  // Also register under newId for removeNodeAndChildren
  newNode.dataset.stableId = existingId;

  // Position to the right of the marker
  const p = map.latLngToContainerPoint([lat, lng]);
  const cLL = map.containerPointToLatLng([p.x + 260, p.y]);
  newNode.dataset.lat = cLL.lat;
  newNode.dataset.lng = cLL.lng;
  newNode.style.left = p.x + 260 + "px";
  newNode.style.top = p.y + "px";

  const score = getSoilScore((district.cycles || {})["2024-25"]);
  const color = scoreToColor(score);
  const label = scoreToLabel(score);

  newNode.innerHTML = `
    <div class="np-header">
      <span class="np-badge" style="background:${color}22;color:${color};
            border:1px solid ${color};font-size:9px;padding:2px 8px;
            border-radius:4px;letter-spacing:1px;">SOIL</span>
      <span class="close-btn">&times;</span>
    </div>
    <div class="np-subline">${district.district} &bull; ${district.state_name}</div>
    <div style="padding:6px 14px 10px;">
      <span style="display:inline-block;padding:3px 12px;border-radius:20px;
                   background:${color}22;border:1px solid ${color};
                   color:${color};font-size:11px;font-weight:700;">${label}</span>
    </div>

    <!-- Tab bar — identical layout to AQI nodes -->
    <div style="display:flex;border-top:1px solid #1e3a4a;border-bottom:1px solid #1e3a4a;">
      <button class="ppf-btn soil-tab-btn" data-tab="PAST"
              style="flex:1;padding:9px 4px;border:none;cursor:pointer;
                     font-size:10px;font-weight:700;letter-spacing:0.5px;
                     background:#1a2e3d;color:#4fc3f7;
                     border-bottom:2px solid #4fc3f7;">⏮ PAST</button>
      <button class="ppf-btn soil-tab-btn" data-tab="PRESENT"
              style="flex:1;padding:9px 4px;border:none;cursor:pointer;
                     font-size:10px;font-weight:600;letter-spacing:0.5px;
                     background:#0d1b2a;color:#555;
                     border-bottom:2px solid transparent;">● NOW</button>
      <button class="ppf-btn soil-tab-btn" data-tab="FUTURE"
              style="flex:1;padding:9px 4px;border:none;cursor:pointer;
                     font-size:10px;font-weight:600;letter-spacing:0.5px;
                     background:#0d1b2a;color:#555;
                     border-bottom:2px solid transparent;">FUTURE ↗</button>
    </div>

    <div class="soil-tab-content" style="max-height:52vh;overflow-y:auto;
         scrollbar-width:thin;scrollbar-color:#1e3a4a transparent;">
      ${buildPastContent(district)}
    </div>`;

  app.appendChild(newNode);

  // Wire tab buttons
  newNode.querySelectorAll(".soil-tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      // Update tab styles
      newNode.querySelectorAll(".soil-tab-btn").forEach((b) => {
        b.style.background = "#0d1b2a";
        b.style.color = "#555";
        b.style.borderBottom = "2px solid transparent";
      });
      btn.style.background = "#1a2e3d";
      btn.style.color = "#4fc3f7";
      btn.style.borderBottom = "2px solid #4fc3f7";
      // Render content
      const content = newNode.querySelector(".soil-tab-content");
      const tab = btn.dataset.tab;
      if (tab === "PAST") content.innerHTML = buildPastContent(district);
      if (tab === "PRESENT") content.innerHTML = buildPresentContent(district);
      if (tab === "FUTURE") content.innerHTML = buildFutureContent(district);
    });
  });

  // Connect to marker with SVG line (same as AQI)
  const markerId = `soil-marker-line-${district.district_code}`;
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("class", "connector");
  svg.appendChild(path);

  // Register in VAYU connections using marker element as "from"
  window.VAYU.paths[markerId + "-" + existingId] = path;
  window.VAYU.connections.push({ from: markerId, to: existingId });

  // Create a tiny invisible anchor div at marker position for the connector
  let anchor = document.getElementById(markerId);
  if (!anchor) {
    anchor = document.createElement("div");
    anchor.id = markerId;
    anchor.style.cssText = `position:absolute;width:0;height:0;pointer-events:none;`;
    app.appendChild(anchor);
  }
  anchor.dataset.lat = lat;
  anchor.dataset.lng = lng;

  setupNode(newNode);
  syncNodes();
}

// ── PAST content ─────────────────────────────────────────────────────
function buildPastContent(district) {
  const cycles = district.cycles || {};
  const avail = CYCLES.filter((c) => cycles[c]);
  if (!avail.length)
    return `<div style="padding:16px;color:#555;font-size:12px;">No historical data.</div>`;

  const tabs = avail
    .map(
      (c, i) => `
    <button onclick="switchSoilCycle_${district.district_code}(this,'${c}')"
            class="soil-cycle-btn-${district.district_code}"
            style="padding:4px 11px;border-radius:6px;border:none;cursor:pointer;
                   font-size:11px;font-weight:600;
                   background:${i === 0 ? "#0e3d2a" : "#162535"};
                   color:${i === 0 ? "#4caf50" : "#778"};">${c}</button>
  `,
    )
    .join("");

  // Register cycle switcher on window
  window[`switchSoilCycle_${district.district_code}`] = function (btn, cycle) {
    document
      .querySelectorAll(`.soil-cycle-btn-${district.district_code}`)
      .forEach((b) => {
        b.style.background = "#162535";
        b.style.color = "#778";
      });
    btn.style.background = "#0e3d2a";
    btn.style.color = "#4caf50";
    const grid = document.getElementById(`soil-grid-${district.district_code}`);
    if (grid) grid.innerHTML = buildParamGrid((district.cycles || {})[cycle]);
  };

  return `
    <div style="padding:12px 14px 6px;">
      <div style="font-size:10px;color:#446;text-transform:uppercase;
                  letter-spacing:1px;margin-bottom:7px;">📅 Cycle Year</div>
      <div style="display:flex;flex-wrap:wrap;gap:5px;">${tabs}</div>
    </div>
    <div id="soil-grid-${district.district_code}" style="padding:4px 14px 14px;">
      ${buildParamGrid(cycles[avail[0]])}
    </div>`;
}

function buildParamGrid(cycleData) {
  if (!cycleData)
    return `<div style="color:#444;font-size:12px;padding:8px 0;">No data.</div>`;

  const sections = [
    {
      label: "🌱 Macronutrients",
      params: ["Nitrogen", "Phosphorus", "Potassium", "Organic Carbon", "pH"],
    },
    {
      label: "⚗️ Micronutrients",
      params: ["Zinc", "Boron", "Iron", "Copper", "Manganese", "Sulphur"],
    },
    { label: "📊 Other", params: ["Electrical Conductivity"] },
  ];

  return sections
    .map((s) => {
      const cards = s.params
        .map((name) => {
          const d = cycleData[name];
          if (!d) return "";
          const c =
            d.status === "High"
              ? "#4caf50"
              : d.status === "Medium"
                ? "#fdd835"
                : "#f50057";
          const b = d.status === "High" ? 88 : d.status === "Medium" ? 54 : 22;
          const u = SOIL_PARAM_UNITS[name] || "";
          return `
        <div style="background:#0a1620;border-radius:8px;padding:8px 10px;margin-bottom:5px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span style="font-size:11px;color:#aac;">${SOIL_PARAM_ICONS[name] || "🔬"} ${name}</span>
            <span style="font-size:11px;font-weight:700;color:${c};">${d.value}${u ? " " + u : ""}</span>
          </div>
          <div style="background:#162535;border-radius:3px;height:4px;overflow:hidden;">
            <div style="width:${b}%;height:100%;background:${c};border-radius:3px;"></div>
          </div>
          <div style="font-size:10px;color:${c};margin-top:2px;text-align:right;">${d.status}</div>
        </div>`;
        })
        .filter(Boolean)
        .join("");
      if (!cards) return "";
      return `
      <div style="margin-bottom:6px;">
        <div style="font-size:10px;color:#3a6a5a;font-weight:700;text-transform:uppercase;
                    letter-spacing:1px;margin:8px 0 5px;">${s.label}</div>
        ${cards}
      </div>`;
    })
    .join("");
}

// ── PRESENT ───────────────────────────────────────────────────────────
function buildPresentContent(district) {
  const latest = (district.cycles || {})["2024-25"];
  if (!latest)
    return `<div style="padding:16px;color:#555;font-size:12px;">No current data.</div>`;
  const score = getSoilScore(latest);
  const color = scoreToColor(score);
  const label = scoreToLabel(score);
  const pct = Math.round(((score - 1) / 2) * 100);
  const counts = { Low: 0, Medium: 0, High: 0 };
  Object.values(latest)
    .filter(Boolean)
    .forEach((v) => counts[v.status]++);
  const total = counts.Low + counts.Medium + counts.High;
  return `
    <div style="padding:20px 16px;text-align:center;">
      <div style="font-size:10px;color:#446;text-transform:uppercase;letter-spacing:1px;
                  margin-bottom:10px;">Overall Soil Health · 2024-25</div>
      <div style="font-size:40px;font-weight:900;color:${color};line-height:1;
                  text-shadow:0 0 16px ${color}44;">${label}</div>
      <div style="background:#162535;border-radius:8px;height:7px;margin:14px 0;overflow:hidden;">
        <div style="width:${pct}%;height:100%;background:${color};border-radius:8px;
                    box-shadow:0 0 8px ${color}88;"></div>
      </div>
      <div style="display:flex;justify-content:space-around;margin-top:4px;">
        <div><div style="font-size:22px;font-weight:800;color:#f50057;">${counts.Low}</div>
             <div style="font-size:10px;color:#667;margin-top:2px;">Low</div></div>
        <div><div style="font-size:22px;font-weight:800;color:#fdd835;">${counts.Medium}</div>
             <div style="font-size:10px;color:#667;margin-top:2px;">Medium</div></div>
        <div><div style="font-size:22px;font-weight:800;color:#4caf50;">${counts.High}</div>
             <div style="font-size:10px;color:#667;margin-top:2px;">High</div></div>
      </div>
      <div style="font-size:10px;color:#445;margin-top:12px;">${total} parameters analysed</div>
    </div>`;
}

// ── FUTURE ────────────────────────────────────────────────────────────
function buildFutureContent(district) {
  const c1 = (district.cycles || {})["2024-25"];
  const c2 = (district.cycles || {})["2015-17"];
  if (!c1)
    return `<div style="padding:16px;color:#555;font-size:12px;">Insufficient data.</div>`;
  const s1 = getSoilScore(c1);
  const s2 = c2 ? getSoilScore(c2) : null;
  const trend = s2 ? s1 - s2 : 0;
  const proj = Math.max(1, Math.min(3, s1 + trend * 0.5));
  const pc = scoreToColor(proj);
  const ac = trend > 0.1 ? "#4caf50" : trend < -0.1 ? "#f50057" : "#fdd835";
  const arrow =
    trend > 0.1 ? "↑ Improving" : trend < -0.1 ? "↓ Declining" : "→ Stable";
  return `
    <div style="padding:20px 16px;text-align:center;">
      <div style="font-size:10px;color:#446;text-transform:uppercase;letter-spacing:1px;
                  margin-bottom:10px;">📈 10-Year Projection</div>
      <div style="font-size:36px;font-weight:900;color:${pc};line-height:1;">${scoreToLabel(proj)}</div>
      <div style="font-size:13px;font-weight:700;color:${ac};margin:10px 0;">${arrow}</div>
      <div style="background:#0a1620;border-radius:10px;padding:14px;margin-top:10px;text-align:left;">
        <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #1a2c3d;">
          <span style="font-size:11px;color:#667;">2015-17 baseline</span>
          <span style="font-size:11px;color:#aac;">${s2 ? scoreToLabel(s2) : "N/A"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #1a2c3d;">
          <span style="font-size:11px;color:#667;">2024-25 current</span>
          <span style="font-size:11px;color:${scoreToColor(s1)};font-weight:700;">${scoreToLabel(s1)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:5px 0;">
          <span style="font-size:11px;color:#667;">~2035 projected</span>
          <span style="font-size:11px;color:${pc};font-weight:800;">${scoreToLabel(proj)}</span>
        </div>
      </div>
      <div style="font-size:10px;color:#445;margin-top:10px;font-style:italic;">
        ⚠️ Based on observed cycle trends only
      </div>
    </div>`;
}

// ── Toggle layer ──────────────────────────────────────────────────────
window.toggleSoilMarkers = function (show) {
  const map = window.VAYU.map;
  const lg = window.VAYU.soilLayerGroup;
  if (!lg) return;
  if (show) {
    if (!map.hasLayer(lg)) lg.addTo(map);
  } else {
    // Close all open soil nodes
    document.querySelectorAll("[id^='soil-district-node-']").forEach((el) => {
      removeNodeAndChildren(el.id);
      el.remove();
    });
    document
      .querySelectorAll("[id^='soil-marker-line-']")
      .forEach((el) => el.remove());
    if (map.hasLayer(lg)) map.removeLayer(lg);
  }
};

// ── Fetch ─────────────────────────────────────────────────────────────
window.fetchSoilData = async function () {
  try {
    console.log("[SOIL] Fetching from", `${SOIL_API}/soil/all`);
    const res = await fetch(`${SOIL_API}/soil/all`);
    const json = await res.json();
    if (!json.data?.length) {
      console.warn("[SOIL] No data");
      return;
    }
    console.log(`[SOIL] Loaded ${json.data.length} districts`);
    window.VAYU.allSoilDistricts = json.data;
    renderSoilMarkers();
  } catch (err) {
    console.error("[SOIL] Fetch failed:", err);
  }
};

// ── Render dot markers ────────────────────────────────────────────────
function renderSoilMarkers() {
  const map = window.VAYU.map;
  if (window.VAYU.soilLayerGroup) map.removeLayer(window.VAYU.soilLayerGroup);
  const lg = L.layerGroup();
  window.VAYU.soilLayerGroup = lg;
  window.VAYU.soilMarkers = {};

  window.VAYU.allSoilDistricts.forEach((district) => {
    const score = getSoilScore((district.cycles || {})["2024-25"]);
    const color = scoreToColor(score);
    const [lat, lng] = getDistrictCoords(district);

    // Skip coords outside India bounding box
    if (lat < 6 || lat > 37.5 || lng < 67 || lng > 98) return;

    const icon = L.divIcon({
      className: "",
      html: `<div style="width:9px;height:9px;border-radius:50%;
               background:${color};box-shadow:0 0 5px ${color}99;
               border:1px solid ${color}dd;cursor:pointer;"></div>`,
      iconSize: [9, 9],
      iconAnchor: [4, 4],
    });

    const marker = L.marker([lat, lng], { icon });
    marker.on("click", () => {
      if (window.VAYU.activeMetric !== "SOIL") return;
      spawnSoilNode(marker, district, lat, lng);
    });

    lg.addLayer(marker);
    window.VAYU.soilMarkers[district.district_code] = marker;
  });

  if (window.VAYU.activeMetric === "SOIL") lg.addTo(map);
  console.log(
    `[SOIL] ${Object.keys(window.VAYU.soilMarkers).length} markers ready`,
  );
}
