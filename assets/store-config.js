/*
 * Butikk-identitet - eneste sted disse verdiene skal stå.
 * Alt annet (header, footer, admin, produktside) leser herfra i stedet
 * for å hardkode navn/adresse/logo direkte. Når løsningen migreres til
 * Supabase (jf. MVP-planen), er dette formen på én rad i en
 * fremtidig "stores"-tabell - denne filen er en midlertidig,
 * fil-basert stedfortreder for det.
 */
var STORE_CONFIG = {
    name: "Kulør Rognan",
    legalName: "Kulør Rognan Fargehandel",
    region: "Din lokale ekspert i Saltdal",
    footerTagline: "Din lokale ekspert på maling, gulv og solskjerming i Saltdal. Vi leverer kvalitet og fagkunnskap.",
    logoPath: "img/kulor-logo-400.png",
    address: "Strandgata 11, 8250 Rognan",
    phoneDisplay: "75 69 06 50",
    phoneHref: "+4775690650",
    openingHours: [
        { label: "Man - Fre", value: "09:00 - 17:00" },
        { label: "Lørdag", value: "10:00 - 14:00" },
        { label: "Søndag", value: "Stengt", muted: true }
    ],
    supplierColorUrl: "https://www.butinoxinterior.no/vare-farger/"
};
