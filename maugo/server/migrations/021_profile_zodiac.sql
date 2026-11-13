ALTER TABLE users ADD COLUMN IF NOT EXISTS zodiac TEXT CHECK (zodiac IN ('Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'));
