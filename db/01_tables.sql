CREATE TABLE IF NOT EXISTS regions (
    id SERIAL PRIMARY KEY,
    code CHAR(3) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    transliteration VARCHAR(100),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS municipalities (
    id SERIAL PRIMARY KEY,
    code CHAR(5) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    transliteration VARCHAR(100),
    region_id INTEGER NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mayoralties (
    id SERIAL PRIMARY KEY,
    code CHAR(8) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    transliteration VARCHAR(100),
    municipality_id INTEGER NOT NULL REFERENCES municipalities(id) ON DELETE CASCADE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS countries (
    code CHAR(2) PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS settlements (
    ekatte VARCHAR(5) UNIQUE,
    name VARCHAR(100) NOT NULL,
    municipality_id INTEGER REFERENCES municipalities(id) ON DELETE CASCADE,
    mayorality_id INTEGER REFERENCES mayoralties(id) ON DELETE CASCADE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    id SERIAL PRIMARY KEY,
    latitude NUMERIC(9,6),
    longitude NUMERIC(9,6),
    transliteration VARCHAR(100),
    country_code CHAR(2) NOT NULL DEFAULT 'BG' REFERENCES countries(code),
    geoname_id BIGINT UNIQUE
);

CREATE INDEX IF NOT EXISTS idx_settlements_country_code_id
    ON settlements (country_code, id);

CREATE INDEX IF NOT EXISTS idx_settlements_name
    ON settlements (name);

CREATE INDEX IF NOT EXISTS idx_settlements_country_code
    ON settlements (country_code);


-- Partitioned by year (RANGE) — each year has its own child table.
CREATE TABLE IF NOT EXISTS settlement_climate (
    settlement_id INTEGER NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    year SMALLINT NOT NULL,
    month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    avg_temperature REAL,
    min_temperature REAL,
    max_temperature REAL,
    PRIMARY KEY (settlement_id, year, month)
) PARTITION BY RANGE (year);

CREATE TABLE IF NOT EXISTS settlement_climate_1986 PARTITION OF settlement_climate
    FOR VALUES FROM ('1986') TO ('1987');

CREATE TABLE IF NOT EXISTS settlement_climate_1987 PARTITION OF settlement_climate
    FOR VALUES FROM ('1987') TO ('1988');

CREATE TABLE IF NOT EXISTS settlement_climate_1988 PARTITION OF settlement_climate
    FOR VALUES FROM ('1988') TO ('1989');

CREATE TABLE IF NOT EXISTS settlement_climate_1989 PARTITION OF settlement_climate
    FOR VALUES FROM ('1989') TO ('1990');

CREATE TABLE IF NOT EXISTS settlement_climate_1990 PARTITION OF settlement_climate
    FOR VALUES FROM ('1990') TO ('1991');

CREATE TABLE IF NOT EXISTS settlement_climate_1991 PARTITION OF settlement_climate
    FOR VALUES FROM ('1991') TO ('1992');

CREATE TABLE IF NOT EXISTS settlement_climate_1992 PARTITION OF settlement_climate
    FOR VALUES FROM ('1992') TO ('1993');

CREATE TABLE IF NOT EXISTS settlement_climate_1993 PARTITION OF settlement_climate
    FOR VALUES FROM ('1993') TO ('1994');

CREATE TABLE IF NOT EXISTS settlement_climate_1994 PARTITION OF settlement_climate
    FOR VALUES FROM ('1994') TO ('1995');

CREATE TABLE IF NOT EXISTS settlement_climate_1995 PARTITION OF settlement_climate
    FOR VALUES FROM ('1995') TO ('1996');

CREATE TABLE IF NOT EXISTS settlement_climate_1996 PARTITION OF settlement_climate
    FOR VALUES FROM ('1996') TO ('1997');

CREATE TABLE IF NOT EXISTS settlement_climate_1997 PARTITION OF settlement_climate
    FOR VALUES FROM ('1997') TO ('1998');

CREATE TABLE IF NOT EXISTS settlement_climate_1998 PARTITION OF settlement_climate
    FOR VALUES FROM ('1998') TO ('1999');

CREATE TABLE IF NOT EXISTS settlement_climate_1999 PARTITION OF settlement_climate
    FOR VALUES FROM ('1999') TO ('2000');

CREATE TABLE IF NOT EXISTS settlement_climate_2000 PARTITION OF settlement_climate
    FOR VALUES FROM ('2000') TO ('2001');

CREATE TABLE IF NOT EXISTS settlement_climate_2001 PARTITION OF settlement_climate
    FOR VALUES FROM ('2001') TO ('2002');

CREATE TABLE IF NOT EXISTS settlement_climate_2002 PARTITION OF settlement_climate
    FOR VALUES FROM ('2002') TO ('2003');

CREATE TABLE IF NOT EXISTS settlement_climate_2003 PARTITION OF settlement_climate
    FOR VALUES FROM ('2003') TO ('2004');

CREATE TABLE IF NOT EXISTS settlement_climate_2004 PARTITION OF settlement_climate
    FOR VALUES FROM ('2004') TO ('2005');

CREATE TABLE IF NOT EXISTS settlement_climate_2005 PARTITION OF settlement_climate
    FOR VALUES FROM ('2005') TO ('2006');

CREATE TABLE IF NOT EXISTS settlement_climate_2006 PARTITION OF settlement_climate
    FOR VALUES FROM ('2006') TO ('2007');

CREATE TABLE IF NOT EXISTS settlement_climate_2007 PARTITION OF settlement_climate
    FOR VALUES FROM ('2007') TO ('2008');

CREATE TABLE IF NOT EXISTS settlement_climate_2008 PARTITION OF settlement_climate
    FOR VALUES FROM ('2008') TO ('2009');

CREATE TABLE IF NOT EXISTS settlement_climate_2009 PARTITION OF settlement_climate
    FOR VALUES FROM ('2009') TO ('2010');

CREATE TABLE IF NOT EXISTS settlement_climate_2010 PARTITION OF settlement_climate
    FOR VALUES FROM ('2010') TO ('2011');

CREATE TABLE IF NOT EXISTS settlement_climate_2011 PARTITION OF settlement_climate
    FOR VALUES FROM ('2011') TO ('2012');

CREATE TABLE IF NOT EXISTS settlement_climate_2012 PARTITION OF settlement_climate
    FOR VALUES FROM ('2012') TO ('2013');

CREATE TABLE IF NOT EXISTS settlement_climate_2013 PARTITION OF settlement_climate
    FOR VALUES FROM ('2013') TO ('2014');

CREATE TABLE IF NOT EXISTS settlement_climate_2014 PARTITION OF settlement_climate
    FOR VALUES FROM ('2014') TO ('2015');

CREATE TABLE IF NOT EXISTS settlement_climate_2015 PARTITION OF settlement_climate
    FOR VALUES FROM ('2015') TO ('2016');

CREATE TABLE IF NOT EXISTS settlement_climate_2016 PARTITION OF settlement_climate
    FOR VALUES FROM ('2016') TO ('2017');

CREATE TABLE IF NOT EXISTS settlement_climate_2017 PARTITION OF settlement_climate
    FOR VALUES FROM ('2017') TO ('2018');

CREATE TABLE IF NOT EXISTS settlement_climate_2018 PARTITION OF settlement_climate
    FOR VALUES FROM ('2018') TO ('2019');

CREATE TABLE IF NOT EXISTS settlement_climate_2019 PARTITION OF settlement_climate
    FOR VALUES FROM ('2019') TO ('2020');

CREATE TABLE IF NOT EXISTS settlement_climate_2020 PARTITION OF settlement_climate
    FOR VALUES FROM ('2020') TO ('2021');

CREATE TABLE IF NOT EXISTS settlement_climate_2021 PARTITION OF settlement_climate
    FOR VALUES FROM ('2021') TO ('2022');

CREATE TABLE IF NOT EXISTS settlement_climate_2022 PARTITION OF settlement_climate
    FOR VALUES FROM ('2022') TO ('2023');

CREATE TABLE IF NOT EXISTS settlement_climate_2023 PARTITION OF settlement_climate
    FOR VALUES FROM ('2023') TO ('2024');

CREATE TABLE IF NOT EXISTS settlement_climate_2024 PARTITION OF settlement_climate
    FOR VALUES FROM ('2024') TO ('2025');

CREATE TABLE IF NOT EXISTS settlement_climate_2025 PARTITION OF settlement_climate
    FOR VALUES FROM ('2025') TO ('2026');


-- Partitioned by year (RANGE) — each year has its own child table.
CREATE TABLE IF NOT EXISTS settlement_climate_yearly (
    settlement_id INTEGER NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    year SMALLINT NOT NULL,
    avg_temperature REAL,
    min_temperature REAL,
    max_temperature REAL,
    PRIMARY KEY (settlement_id, year)
) PARTITION BY RANGE (year);

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_1986 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('1986') TO ('1987');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_1987 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('1987') TO ('1988');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_1988 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('1988') TO ('1989');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_1989 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('1989') TO ('1990');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_1990 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('1990') TO ('1991');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_1991 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('1991') TO ('1992');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_1992 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('1992') TO ('1993');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_1993 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('1993') TO ('1994');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_1994 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('1994') TO ('1995');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_1995 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('1995') TO ('1996');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_1996 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('1996') TO ('1997');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_1997 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('1997') TO ('1998');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_1998 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('1998') TO ('1999');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_1999 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('1999') TO ('2000');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2000 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2000') TO ('2001');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2001 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2001') TO ('2002');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2002 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2002') TO ('2003');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2003 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2003') TO ('2004');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2004 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2004') TO ('2005');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2005 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2005') TO ('2006');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2006 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2006') TO ('2007');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2007 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2007') TO ('2008');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2008 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2008') TO ('2009');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2009 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2009') TO ('2010');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2010 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2010') TO ('2011');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2011 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2011') TO ('2012');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2012 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2012') TO ('2013');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2013 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2013') TO ('2014');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2014 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2014') TO ('2015');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2015 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2015') TO ('2016');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2016 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2016') TO ('2017');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2017 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2017') TO ('2018');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2018 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2018') TO ('2019');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2019 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2019') TO ('2020');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2020 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2020') TO ('2021');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2021 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2021') TO ('2022');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2022 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2022') TO ('2023');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2023 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2023') TO ('2024');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2024 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2024') TO ('2025');

CREATE TABLE IF NOT EXISTS settlement_climate_yearly_2025 PARTITION OF settlement_climate_yearly
    FOR VALUES FROM ('2025') TO ('2026');

CREATE INDEX IF NOT EXISTS idx_settlement_climate_yearly_year
    ON settlement_climate_yearly (year);


CREATE TABLE IF NOT EXISTS settlement_grid_mapping (
    settlement_id integer NOT NULL,
    lat_index integer NOT NULL,
    lon_index integer NOT NULL,
    CONSTRAINT settlement_grid_mapping_pkey PRIMARY KEY (settlement_id),
    CONSTRAINT settlement_grid_mapping_settlement_id_fkey FOREIGN KEY (settlement_id)
        REFERENCES public.settlements (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS climate_country_month_rollup (
    country_code CHAR(2) NOT NULL REFERENCES countries(code),
    year SMALLINT NOT NULL,
    month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    avg_sum REAL,
    avg_max REAL,
    avg_min REAL,
    avg_count INTEGER NOT NULL DEFAULT 0,
    max_sum REAL,
    max_max REAL,
    max_min REAL,
    max_count INTEGER NOT NULL DEFAULT 0,
    min_sum REAL,
    min_max REAL,
    min_min REAL,
    min_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (country_code, year, month)
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    failed_attempts INTEGER NOT NULL DEFAULT 0,
    blocked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT INTO settings (key, value)
VALUES
('verification_token_expiration_minutes', '60'),
('max_failed_login_attempts', '5');

CREATE TABLE IF NOT EXISTS user_settings (
    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    login_block_duration_minutes INTEGER NOT NULL DEFAULT 15,
    resend_email_interval_minutes INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE settlement_climate_yearly_cumulative (
    settlement_id INTEGER NOT NULL REFERENCES settlements(id) ON DELETE CASCADE,
    year          SMALLINT NOT NULL,
    cum_sum       DOUBLE PRECISION NOT NULL,
    cum_count     INTEGER NOT NULL,
    PRIMARY KEY (year, settlement_id)
);
