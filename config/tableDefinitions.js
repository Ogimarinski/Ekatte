const tableDefinitions = {
    regions: {
        table: "regions",
        alias: "r",
        select: "r.id, r.code, r.name, r.updated_at",
        searchCol: "r.name"
    },
    municipalities: {
        table: "municipalities",
        alias: "mu",
        select: "mu.id, mu.code, mu.name, mu.region_id, mu.updated_at, r.name AS region_name, r.code AS region_code",
        joins: "LEFT JOIN regions r ON mu.region_id = r.id",
        searchCol: "mu.name",
    },
    mayoralties: {
        table: "mayoralties",
        alias: "ma",
        select: "ma.id, ma.code, ma.name, ma.municipality_id, ma.updated_at, mu.region_id, mu.name AS municipality_name, mu.code AS municipality_code",
        joins: "LEFT JOIN municipalities mu ON ma.municipality_id = mu.id",
        searchCol: "ma.name",
    },
    settlements: {
        table: "settlements",
        alias: "s",
        select: `s.ekatte, s.name, s.mayorality_id, s.municipality_id, s.updated_at, mu.region_id, 
                 COALESCE(ma.name, mu.name) AS mayorality_name, 
                 mu.name AS municipality_name, 
                 r.name AS region_name,
                 r.code AS region_code,
                 mu.code AS municipality_code,
                 ma.code AS mayorality_code`,
        joins: `
            LEFT JOIN mayoralties ma ON s.mayorality_id = ma.id
            LEFT JOIN municipalities mu ON s.municipality_id = mu.id
            LEFT JOIN regions r ON mu.region_id = r.id
        `,
        searchCol: "s.name",
    }
};

module.exports = tableDefinitions;