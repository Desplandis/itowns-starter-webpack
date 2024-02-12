import { Vector3 } from 'three';
// @ts-ignore: COPCSource, COPCLayer not released yet
import { View, PlanarControls, CopcSource, CopcLayer, PNTS_SHAPE } from 'itowns';
import GUI from 'lil-gui';

import { PointCloudGUI } from './debug/PointCloudGUI';

import type { PerspectiveCamera } from 'three';
import type { PointCloudLayer } from 'itowns';

// TODO: Update type definitions to 2.42. A PR is currently in draft at
// DefinitelyTyped/DefinitelyTyped#68583
// TODO: Add types not officially released in this repository

const uri = new URL(window.location.href);
const gui = new GUI();

const viewerDiv = document.getElementById('viewerDiv') as HTMLDivElement;
const view = new View('EPSG:4326', viewerDiv);

// @ts-ignore: argument not in type definitions
const controls = new PlanarControls(view);
view.mainLoop.gfxEngine.renderer.setClearColor(0xdddddd);

let layer: PointCloudLayer; // COPCLayer


function onLayerReady(layer: PointCloudLayer) {
    const camera = view.camera.camera3D as PerspectiveCamera;

    const lookAt = new Vector3();
    const size = new Vector3();
    // @ts-ignore: property not in type definitions
    const root = layer.root;

    root.bbox.getSize(size);
    root.bbox.getCenter(lookAt);

    camera.far = 2.0 * size.length();

    controls.groundLevel = root.bbox.min.z;
    const position = root.bbox.min.clone().add(
        size.multiply({ x: 1, y: 1, z: size.x / size.z }),
    );

    camera.position.copy(position);
    camera.lookAt(lookAt);
    camera.updateProjectionMatrix();

    view.notifyChange(camera);
}


function setUrl(url: string) {
    if (!url) return;

    uri.searchParams.set('copc', url);
    history.replaceState(null, '', `?${uri.searchParams.toString()}`);

    load(url);
}


function load(url: string) {
    // @ts-ignore: not released yet
    const source = new CopcSource({ url });

    if (layer) {
        view.removeLayer('COPC');
        view.notifyChange();
        layer.delete();
    }

    // @ts-ignore: not released yet
    layer = new CopcLayer('COPC', {
        source,
        crs: view.referenceCrs,
        sseThreshold: 1,
        pointBudget: 3500000,
        material: {
            minAttenuatedSize: 2,
            maxAttenuatedSize: 5,
            // @ts-ignore: added in 2.42
            shape: PNTS_SHAPE.SQUARE,
        },
    });
    view.addLayer(layer).then(onLayerReady);
    new PointCloudGUI(view, layer, {
        title: layer.id,
        parent: gui
    });
}

const copcParams = uri.searchParams.get('copc');
if (copcParams) {
    setUrl(copcParams);
}
