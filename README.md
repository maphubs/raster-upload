# MapHubs Raster Uploader

Uploads RGB GeoTiffs and MBTile packages to Local storage and returns TileJSON for easy loading in mapbox-gl-js

Intended for smaller files, we currently limit uploads to ~100mb

## Details

Uses tus https://tus.io/ to better handle slow bandwidth including pause/retry/restart if the connection is interupted

uses `@mapbox/tilelive`, `tilelive-raster`, and `tilelive-file` to create and copy tiles which ultimately use Mapnik and GDAL to render GeoTiffs into tiles.