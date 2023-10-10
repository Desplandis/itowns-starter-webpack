import { PNTS_MODE, PNTS_SHAPE, PNTS_SIZE_MODE } from 'itowns';
import GUI from 'lil-gui';

export class PointCloudGUI extends GUI {
    constructor(view, layer, options) {
        super(options);

        const update = () => view.notifyChange(layer, true);
        this.add(layer, 'visible')
            .name('Visible')
            .onChange(update);
        this.add(layer, 'pointBudget', 0, 12000000)
            .step(500000)
            .name('Point budget')
            .onChange(update);
        this.add(layer, 'sseThreshold')
            .name('SSE threshold')
            .onChange(update);
        this.add(layer, 'opacity', 0, 1)
            .name('Opacity')
            .onChange(update);


        // Point styling
        const pointUI = this.addFolder('Points');
        const addPointSize = (obj, prop, name) =>
            pointUI.add(obj, prop, 0, 15)
                .step(0.1)
                .name(name)
                .onChange(update);

        pointUI.add(layer.material, 'sizeMode', PNTS_SIZE_MODE)
            .name('Mode')
            .onChange(update);
        pointUI.add(layer.material, 'shape', PNTS_SHAPE)
            .name('Shape')
            .onChange(update);
        addPointSize(layer, 'pointSize', 'Size');
        addPointSize(layer.material, 'minAttenuatedSize', 'Min size');
        addPointSize(layer.material, 'maxAttenuatedSize', 'Max size');


        // Attribute styling
        const attributeUI = this.addFolder('Attributes');

        let maxIntensity;
        let minElevation;
        let maxElevation;
        const onAttributeChange = (event) => {
            maxIntensity?.hide();
            minElevation?.hide();
            maxElevation?.hide();
            if (event === PNTS_MODE.INTENSITY) {
                maxIntensity?.show();
            } else if (event === PNTS_MODE.ELEVATION) {
                minElevation?.show();
                maxElevation?.show();
            }
        };

        attributeUI.add(layer.material, 'mode', PNTS_MODE)
            .name('Mode')
            .onFinishChange(onAttributeChange)
            .onChange(update);

        maxIntensity = attributeUI.add(layer, 'maxIntensityRange', 0, 1)
            .name('Intensity max')
            .hide()
            .onChange('update');

        layer.whenReady.then(() => {
            const min = layer.minElevationRange;
            const max = layer.maxElevationRange;
            minElevation = attributeUI.add(layer, 'minElevationRange', min, max)
                .name('Min elevation')
                .hide()
                .onChange(update);
            maxElevation = attributeUI.add(layer, 'maxElevationRange', min, max)
                .name('Max elevation')
                .hide()
                .onChange(update);
        });
    }
}
