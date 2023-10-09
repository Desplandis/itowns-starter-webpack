import * as itowns from 'itowns';
import * as THREE from 'three';
import GUI from 'lil-gui';

import { PointCloudGUI } from './debug/PointCloudGui.js';

let layer; // COPCLayer

const uri = new URL(location);

const gui = new GUI();

const viewerDiv = document.getElementById('viewerDiv');
const view = new itowns.View('EPSG:4326', viewerDiv);
const controls = new itowns.PlanarControls(view);
view.mainLoop.gfxEngine.renderer.setClearColor(0xdddddd);

function onLayerReady(layer) {
    const camera = view.camera.camera3D;

    const lookAt = new THREE.Vector3();
    const size = new THREE.Vector3();
    layer.root.bbox.getSize(size);
    layer.root.bbox.getCenter(lookAt);

    camera.far = 2.0 * size.length();

    controls.groundLevel = layer.root.bbox.min.z;
    const position = layer.root.bbox.min.clone().add(
        size.multiply({ x: 1, y: 1, z: size.x / size.z }),
    );

    camera.position.copy(position);
    camera.lookAt(lookAt);
    camera.updateProjectionMatrix();

    view.notifyChange(camera);
}


// function readURL() {
//     const url = document.getElementById('url').value;
// 
//     if (url) {
//         setUrl(url);
//     }
// }

function setUrl(url) {
    if (!url) return;

    // const input_url = document.getElementById('url');
    // if (!input_url) return;

    uri.searchParams.set('copc', url);
    history.replaceState(null, null, `?${uri.searchParams.toString()}`);

    // input_url.value = url;
    load(url);
}


function load(url) {
    const source = new itowns.CopcSource({ url });

    console.log('test');
    if (layer) {
        // gui.removeFolder(layer.debugUI);
        view.removeLayer('COPC');
        view.notifyChange();
        layer.delete();
    }

    layer = new itowns.CopcLayer('COPC', {
        source,
        crs: view.referenceCrs,
        sseThreshold: 2,
        pointBudget: 3000000,
    });
    view.addLayer(layer).then(onLayerReady);
    new PointCloudGUI(view, layer, { parent: gui } );
    // debug.PotreeDebug.initTools(view, layer, gui);
}

setUrl(uri.searchParams.get('copc'));
