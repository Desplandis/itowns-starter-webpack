// @ts-ignore: added in 2.42
import { PNTS_MODE, PNTS_SHAPE, PNTS_SIZE_MODE } from 'itowns';
import GUI from 'lil-gui';

import type { View, PointCloudLayer } from 'itowns';

// TODO: export type or define our own gradients here
const GRADIENTS = [
    'SPECTRAL',
    'PLASMA',
    'YELLOW_GREEN',
    'VIRIDIS',
    'INFERNO',
    'GRAYSCALE',
    'TURBO',
    'RAINBOW',
    'CONTOUR',
];

interface PointCloudGUIOptions {
    autoPlace?: boolean;
    container?: HTMLElement;
    width?: number;
    title?: string;
    closeFolders?: boolean;
    injectStyles?: boolean;
    touchStyles?: number;
    parent?: GUI;
}

export class PointCloudGUI extends GUI {
    pointUI: GUI;
    attributeUI: GUI;

    constructor(view: View, layer: PointCloudLayer, options: PointCloudGUIOptions) {
        super(options);

        const material = layer.material;

        const update = () => view.notifyChange(layer, true);
        this.add(layer, 'visible')
            .name('Visible')
            .onChange(update);
        this.add(layer, 'opacity', 0, 1)
            .name('Opacity')
            .onChange(update);
        this.add(layer, 'pointBudget', 0, 12000000)
            .step(500000)
            .name('Point budget')
            .onChange(update);
        this.add(layer, 'sseThreshold')
            .name('SSE threshold')
            .onChange(update);


        // Point styling
        this.pointUI = this.addFolder('Points');
        const addPointSize = (obj: object, prop: string, name: string) =>
            this.pointUI.add(obj, prop, 0, 15)
                .step(0.1)
                .name(name)
                .onChange(update);

        this.pointUI.add(material, 'sizeMode', PNTS_SIZE_MODE)
            .name('Size mode')
            .onChange(update);
        this.pointUI.add(material, 'shape', PNTS_SHAPE)
            .name('Shape')
            .onChange(update);
        addPointSize(layer, 'pointSize', 'Size');
        addPointSize(material, 'minAttenuatedSize', 'Min size');
        addPointSize(material, 'maxAttenuatedSize', 'Max size');


        // Attribute styling
        this.attributeUI = this.addFolder('Attributes');
        const addUint16Property = (obj: object, prop: string) =>
            this.attributeUI.add(obj, prop, 0, 65535)
                .step(1)
                .onChange(update);

        const mode = this.attributeUI.add(material, 'mode', PNTS_MODE)
            .name('Mode')
            .onChange(update);

        const gradient = this.attributeUI.add(material, 'gradient', GRADIENTS)
            .name('Gradient')
            .hide()
            .onChange(update);

        const minIntensity = addUint16Property(layer, 'minIntensityRange')
            .name('Min intensity')
            .hide();

        const maxIntensity = addUint16Property(layer, 'maxIntensityRange')
            .name('Max intensity')
            .hide();

        const minScanAngle = this.attributeUI.add(layer, 'minAngleRange', 0, 90)
            .name('Min scan angle')
            .hide();

        const maxScanAngle = this.attributeUI.add(layer, 'maxAngleRange', 0, 90)
            .name('Max scan angle')
            .hide();

        mode.onFinishChange((event: PNTS_MODE) => {
            gradient.hide();
            minIntensity.hide();
            maxIntensity.hide();
            minScanAngle.hide();
            maxScanAngle.hide();
            switch (event) {
                case PNTS_MODE.INTENSITY:
                    gradient.show();
                    minIntensity.show();
                    maxIntensity.show();
                    return;
                // @ts-ignore: not released yet
                case PNTS_MODE.ELEVATION:
                    // TODO: minElevation/maxElevation when layer ready
                    gradient.show();
                    return;
                // @ts-ignore: not released yet
                case PNTS_MODE.SCAN_ANGLE:
                    minScanAngle.show();
                    maxScanAngle.show();
                    return;
            }
        });

    }
}
