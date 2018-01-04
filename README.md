# OSM Visual History

A better way to view the history of objects in [OpenStreetMap](http://www.openstreetmap.org/).

Example history views:
* [Node](https://aleung.github.io/osm-visual-history/#/node/4857559003)
* [Way](https://aleung.github.io/osm-visual-history/#/way/333067739) (The map needs a few seconds to load)

It's an enhancement base on [osmlab/osm-deep-history](https://github.com/osmlab/osm-deep-history) with below update:

Common:
* Improve map UI and fix issues
* When mouse hover on table cell, highlight corresponding version of object on map and pan to center
* In table, show version which is invisible in red (`removed`)
* Base map layer: OpenStreetMap and Mapbox Satellite Streets
* Export full data of specific version in Level0L format

Node:
* Show lat, lon in table
* Show way(s) which the node belongs to

Way:
* Show history versions of way on map

## Development

The source code has been rewritten mostly in ES6, using Promise and functional style.

To rebuild and run locally:

```
npm install
npm run build
npm start
```
