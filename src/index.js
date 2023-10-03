import * as itowns from 'itowns';
import * as THREE from 'three';

// Get our `<div id="viewerId">` element. A canvas will be appended to this
// element when instanting a itowns' `View`.
const viewerDiv = document.getElementById('viewerDiv');

// Define an initial camera position
const placement = {
    coord: new itowns.Coordinates('EPSG:4326', 2.351323, 48.856712),
    range: 25000000,
};

// Create an empty globe View
const view = new itowns.GlobeView(viewerDiv, placement);

// Declare your source configuration, in this case the WMTS parameters of your
// requested resources.
const orthoConfig = {
    'url': 'https://wxs.ign.fr/decouverte/geoportail/wmts',
    'crs': 'EPSG:3857',
    'format': 'image/jpeg',
    'name': 'ORTHOIMAGERY.ORTHOPHOTOS',
    'tileMatrixSet': 'PM',
};

// Instantiate the WMTS source of your layer
const imagerySource = new itowns.WMTSSource(orthoConfig);

// Create your imagery layer
const imageryLayer = new itowns.ColorLayer('imagery', {
    source: imagerySource,
});

// Add it to source view!
view.addLayer(imageryLayer);

// TODO: Use THREE module (maybe traveling with camera)
const todo = THREE.Object3D.DEFAULT_UP;
console.log(todo);
