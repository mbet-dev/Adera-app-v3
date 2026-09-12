-- This script updates the location of all shops to a random point within a 10km radius of a central point in Addis Ababa.
-- The central point is approximately at latitude 9.02497 and longitude 38.74689.
-- This is idempotent because it only updates existing rows with new random data. Running it again will just re-randomize the locations.

DO $$
DECLARE
    shop_record RECORD;
    center_lat FLOAT := 9.02497;
    center_lon FLOAT := 38.74689;
    radius_km FLOAT := 10.0;
    lat_rad FLOAT;
    lon_rad FLOAT;
    random_angle FLOAT;
    random_radius FLOAT;
    new_lat FLOAT;
    new_lon FLOAT;
BEGIN
    FOR shop_record IN SELECT id FROM public.shops LOOP
        -- Convert radius from km to degrees (approximate)
        lat_rad := radius_km / 111.32;
        lon_rad := radius_km / (111.32 * COS(center_lat * PI() / 180));

        -- Generate a random angle and radius
        random_angle := 2 * PI() * RANDOM();
        random_radius := SQRT(RANDOM());

        -- Calculate new coordinates
        new_lat := center_lat + (random_radius * lat_rad * COS(random_angle));
        new_lon := center_lon + (random_radius * lon_rad * SIN(random_angle));

        -- Update the shop's location
        UPDATE public.shops
        SET location = ST_SetSRID(ST_MakePoint(new_lon, new_lat), 4326)
        WHERE id = shop_record.id;
    END LOOP;
END $$;
