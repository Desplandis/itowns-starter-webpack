import {
    Vector2,
} from 'three';

const EDLShader = {

    defines: {
        'PERSPECTIVE_CAMERA': 1, // TODO: use isOrthographic from 3js common?
        'KERNEL_SIZE': 8.0,
    },

    uniforms: {
        'tDepth': { value: null },
        'tDiffuse': { value: null },
        'kernel': { value: null },
        'cameraNear': { value: null },
        'cameraFar': { value: null },
        'resolution': { value: new Vector2() },
    },

    vertexShader: /* glsl */`
        varying vec2 vUv;

        void main() {

            vUv = uv;

        #include <begin_vertex>
        #include <project_vertex>

        }
    `,

    fragmentShader: /* glsl */`
        #include <packing>

        uniform sampler2D tDepth;
        uniform sampler2D tDiffuse;

        uniform vec2 kernel[ KERNEL_SIZE ];

        uniform vec2 resolution;

        uniform float cameraNear;
        uniform float cameraFar;

        varying vec2 vUv;

        float getLinearDepth( const in vec2 screenPosition) {
            #if PERSPECTIVE_CAMERA == 1
                float fragCoordZ = texture2D(tDepth, screenPosition).x;
                float viewZ = perspectiveDepthToViewZ(fragCoordZ, cameraNear, cameraFar);
                return viewZToOrthographicDepth(viewZ, cameraNear, cameraFar);
            #else
                return texture2D(tDepth, screenPosition).x;
            #endif
        }

        float shadow(float depth) {
            vec2 uvRadius = 1.0 / resolution;

            float sum = 0.0;

            for ( int i = 0; i < KERNEL_SIZE; ++i ) {
                vec2 uvNeighbour = vUv + uvRadius * kernel[ i ];

                float neighbourDepth = getLinearDepth( uvNeighbour );

                sum += max( 0.0, depth - neighbourDepth );
            }

            return sum / float(KERNEL_SIZE);
        }

        void main() {
            float depth = getLinearDepth(vUv);
            float res = shadow(depth);
            float shade = exp(- 300.0 * res * 2000.);

            vec4 color = texture2D(tDiffuse, vUv);

            gl_FragColor = vec4(color.rgb * vec3(shade), 1.0);
        }
    `,

};

export { EDLShader };
