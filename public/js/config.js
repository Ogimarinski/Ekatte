export const tableConfigs = {
    regions: [
        { key: "code", label: "Код" },
        { key: "name", label: "Област" },
        { key: "updated_at", label: "Последна промяна" }
    ],
    municipalities: [
        { key: "code", label: "Код" },
        { key: "name", label: "Община" },
        { key: "region_name", label: "Област" },
        { key: "updated_at", label: "Последна промяна" }
    ],
    mayoralties: [
        { key: "code", label: "Код" },
        { key: "name", label: "Кметство" },
        { key: "municipality_name", label: "Община" },
        { key: "updated_at", label: "Последна промяна" }
    ],
    settlements: [
        { key: "id_display", label: "Ekatte/Geonames ID" },
        { key: "country_code", label: "Държава" },
        { key: "name", label: "Селище" },
        { key: "region_name", label: "Област" },
        { key: "municipality_name", label: "Община" },
        { key: "mayorality_name", label: "Кметство" },
        { key: "updated_at", label: "Последна промяна" },
    ]
};

export const countryLabels = {
    BG: "България",
    CN: "Китай"
};

export const viewTranslations = {
    regions: { title: "Търсене на области", placeholder: "Търси област по име/код..." },
    municipalities: { title: "Търсене на общини", placeholder: "Търси община по име/код..." },
    mayoralties: { title: "Търсене на кметства", placeholder: "Търси кметство по име/код..." },
    settlements: {
        title: "Търсене на населено място",
        placeholder: "Търси по име, ЕКАТТЕ или GeoNames ID..."
    }
};

export const modalConfigs = {
    regions: {
        title: "Добави нова Област",
        fields: []
    },
    municipalities: {
        title: "Добави нова Община",
        fields: ["region_id"]
    },
    mayoralties: {
        title: "Добави ново Кметство",
        fields: ["municipality_id"],
        uiOnly: ["region_id"]
    },
    settlements: {
        title: "Добави ново Селище",
        fields: ["municipality_id", "mayorality_id"],
        uiOnly: ["region_id"]
    }
};

export const filterConfigs = {
    regions: [
        { key: "updated_at", type: "date", label: "Последна промяна" }
    ],

    municipalities: [
        { key: "region_id", type: "select", placeholder: "Област", label: "Област" },
        { key: "updated_at", type: "date", label: "Последна промяна" }
    ],

    mayoralties: [
        { key: "municipality_id", type: "select", placeholder: "Община", label: "Община" },
        { key: "updated_at", type: "date", label: "Последна промяна" }
    ],

    settlements: [
        {
            key: "country_code",
            type: "select",
            placeholder: "Държава",
            label: "Държава",
            options: Object.entries(countryLabels).map(([value, text]) => ({ value, text }))
        },
        { key: "region_id", type: "select", placeholder: "Област", label: "Област" },
        { key: "municipality_id", type: "select", placeholder: "Община", label: "Община" },
        { key: "mayorality_id", type: "select", placeholder: "Кметство", label: "Кметство" },
        { key: "updated_at", type: "date", label: "Последна промяна" },
        //{ key: "year", type: "", label: "Година" },
        { key: "avg_temperature", type: "numberRange", label: "Средна температура" },
        { key: "min_temperature", type: "numberRange", label: "Минимална температура" },
        { key: "max_temperature", type: "numberRange", label: "Максимална температура" }
    ]
};

export const dropdownPlaceholders = {
    region: "-- Избери област --",
    municipality: "-- Избери община --",
    municipalityFirst: "-- Първо избери област --",
    mayorality: "-- Избери кметство --",
    mayoralityFirst: "-- Първо избери община --",
    default: "-- Избери --"
};