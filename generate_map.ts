import { geoEquirectangular, geoPath } from 'd3-geo';
import * as topojson from 'topojson-client';

async function generate() {
  const res = await fetch("https://unpkg.com/world-atlas@2.0.2/countries-110m.json");
  const world = await res.json();
  const countries = topojson.feature(world, world.objects.countries);

  // Map is 1000x500
  // projectLon = (lon + 180) * (1000 / 360)  --> translate(500, 250), scale(1000/(2*PI))
  const projection = geoEquirectangular()
    .scale(1000 / (2 * Math.PI))
    .translate([500, 250]);

  const pathGenerator = geoPath(projection);
  const d = pathGenerator(countries);
  
  console.log("PATH_LENGTH:", d?.length || 0);
  // Write to a local file
  const fs = require('fs');
  fs.writeFileSync('world_path.txt', d || '');
}
generate();
