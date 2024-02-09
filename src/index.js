import * as itowns from 'itowns';

// Get our `<div id="viewerId">` element. When creating a `View`, a canvas will
// be appended to this element.
const viewerDiv = document.getElementById('viewerDiv');

// Define an initial camera position
const placement = {
    coord: new itowns.Coordinates('EPSG:4326', 2.351323, 48.856712),
    range: 25000000,
};

// Create an empty Globe View
const view = new itowns.GlobeView(viewerDiv, placement);

// Declare your data source configuration. In this context, those are the
// parameters used in the WMTS requests.
const orthoConfig = {
    'url': 'https://data.geopf.fr/wmts',
    'crs': 'EPSG:3857',
    'format': 'image/jpeg',
    'name': 'ORTHOIMAGERY.ORTHOPHOTOS',
    'tileMatrixSet': 'PM',
};

// Instantiate the WMTS source of your imagery layer.
const imagerySource = new itowns.WMTSSource(orthoConfig);

// Create your imagery layer
const imageryLayer = new itowns.ColorLayer('imagery', {
    source: imagerySource,
});

// Add it to source view!
view.addLayer(imageryLayer);
