import { customType } from 'drizzle-orm/pg-core';

/**
 * PostGIS `geography(Point,4326)` custom type.
 * Drizzle has no native PostGIS type, so we declare one. We store/read WKT
 * ("POINT(lng lat)") — note PostGIS is (longitude, latitude) order, not (lat,lng).
 * Spatial queries (ST_DWithin, ST_Distance) are written as raw SQL in the
 * search repository, not via this column mapping.
 */
export const geographyPoint = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'geography(Point,4326)';
  },
});
