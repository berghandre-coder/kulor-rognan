/*
 * Tenant-specific fallback used by the local pilot demo only.
 * Production values come from Supabase at runtime. Keeping this outside
 * assets/ makes the boundary between reusable core and pilot content clear.
 */
window.STORE_FALLBACK_CONFIG = {
    slug: "kulor-rognan",
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
    supplierColorUrl: "https://www.butinoxinterior.no/vare-farger/",
    supplierColorLabel: "Butinox"
};
