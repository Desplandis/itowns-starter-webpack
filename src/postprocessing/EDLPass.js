import {
    AddEquation,
    Color,
    DepthStencilFormat,
    DepthTexture,
    DstAlphaFactor,
    DstColorFactor,
    HalfFloatType,
    NoBlending,
    ShaderMaterial,
    UniformsUtils,
    UnsignedInt248Type,
    WebGLRenderTarget,
    ZeroFactor,
} from 'three';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { SSAODepthShader } from 'three/addons/shaders/SSAOShader.js';
import { CopyShader } from 'three/addons/shaders/CopyShader.js';
import { EDLShader } from './EDLShader.js';

const _clearColor = new Color();

function generateVectors( kernelSize ) {

    const kernel = new Float32Array( kernelSize * 2 );
    for ( let i = 0; i < kernelSize; i ++ ) {

        const rotation = 2 * i + Math.PI / kernelSize;
        kernel[ i * 2 + 0 ] = Math.cos( rotation );
        kernel[ i * 2 + 1 ] = Math.sin( rotation );

    }

    return kernel;

}

// Algorithm by Christian Boucheny. See:
// - Phd thesis (page 115-127, french):
//   https://tel.archives-ouvertes.fr/tel-00438464/document
// - Implementation in Cloud Compare (last update 2022):
//   https://github.com/CloudCompare/CloudCompare/tree/master/plugins/core/GL/qEDL/shaders/EDL
// Parameters by Markus Schuetz (Potree). See:
// - Master thesis (pages 38-41):
//   https://www.cg.tuwien.ac.at/research/publications/2016/SCHUETZ-2016-POT/SCHUETZ-2016-POT-thesis.pdf
// - Implementation in Potree (last update 2019):
//   https://github.com/potree/potree/blob/develop/src/materials/shaders/edl.fs

class EDLPass extends Pass {

    constructor( scene, camera, width, height, kernelSize = 16 ) {

        super();

        this.width = ( width !== undefined ) ? width : 512;
        this.height = ( height !== undefined ) ? height : 512;

        this.clear = true;

        this.camera = camera;

        this.kernelRadius = 8;
        this.kernel = generateVectors( kernelSize );

        // Depth texture
        const depthTexture = new DepthTexture();
        depthTexture.format = DepthStencilFormat;
        depthTexture.type = UnsignedInt248Type;

        this.edlRenderTarget = new WebGLRenderTarget( this.width, this.height, {
            type: HalfFloatType,
        } );

        // edl material
        this.edlMaterial = new ShaderMaterial( {
            defines: Object.assign( {}, EDLShader.defines ),
            uniforms: UniformsUtils.clone( EDLShader.uniforms ),
            vertexShader: EDLShader.vertexShader,
            fragmentShader: EDLShader.fragmentShader,
            blending: NoBlending,
        } );

        this.edlMaterial.defines[ 'KERNEL_SIZE' ] = kernelSize;

        this.edlMaterial.uniforms[ 'kernel' ].value = this.kernel;
        this.edlMaterial.uniforms[ 'resolution' ].value.set( this.width, this.height );
        this.edlMaterial.uniforms[ 'cameraNear' ].value = this.camera.near;
        this.edlMaterial.uniforms[ 'cameraFar' ].value = this.camera.far;

        // Depth material
        this.depthRenderMaterial = new ShaderMaterial( {
            defines: Object.assign( {}, SSAODepthShader.defines ),
            uniforms: UniformsUtils.clone( SSAODepthShader.uniforms ),
            vertexShader: SSAODepthShader.vertexShader,
            fragmentShader: SSAODepthShader.fragmentShader,
            blending: NoBlending,
        } );
        this.depthRenderMaterial.uniforms[ 'cameraNear' ].value = this.camera.near;
        this.depthRenderMaterial.uniforms[ 'cameraFar' ].value = this.camera.far;

        // Copy material
        this.copyMaterial = new ShaderMaterial( {
            uniforms: UniformsUtils.clone( CopyShader.uniforms ),
            vertexShader: CopyShader.vertexShader,
            fragmentShader: CopyShader.fragmentShader,
            transparent: true,
            depthTest: false,
            depthWrite: false,
            blendSrc: DstColorFactor,
            blendDst: ZeroFactor,
            blendEquation: AddEquation,
            blendSrcAlpha: DstAlphaFactor,
            blendDstAlpha: ZeroFactor,
            blendEquationAlpha: AddEquation
        } );

        this._fsQuad = new FullScreenQuad( null );

    }

    setSize( width, height ) {

        this.width = width;
        this.height = height;

        this.edlRenderTarget.setSize( width, height );

        this.edlMaterial.uniforms[ 'resolution' ].value.set( width, height );

    }

    render(
        renderer /*: WebGLRenderer */,
        writeBuffer /*: WebGLRenderTarget */,
        readBuffer /*: WebGLRenderTarget */ ) {

        // writeBuffer: WebGLRenderTarget
        //   + texture: Texture // the texture instance holds the rendered
        //   pixels. Use it as input as further processing.
        //   + depthBuffer: boolean // Renders to the depth buffer. Default is
        //   true
        //   + stencilBuffer: boolean // Renders to the stencil buffer. Default
        //   is false
        //   + depthTexture: DepthTexture // If set, the scene depth will be
        //   rendered to this texture. Default is null

        this.edlMaterial.uniforms[ 'tDepth' ].value = readBuffer.depthTexture;
        this.edlMaterial.uniforms[ 'tDiffuse' ].value = readBuffer.texture;
        this.depthRenderMaterial.uniforms[ 'tDepth' ].value = writeBuffer.depthTexture;


        this.renderPass( renderer, this.edlMaterial, this.edlRenderTarget );

        // FINAL RENDER
        // -- Only render depth
        // this.renderPass( renderer, this.depthRenderMaterial, this.renderToScreen ? null : writeBuffer );

        // -- Only render EDL
        this.copyMaterial.uniforms[ 'tDiffuse' ].value = this.edlRenderTarget.texture;
        this.copyMaterial.blending = NoBlending;
        this.renderPass( renderer, this.copyMaterial, this.renderToScreen ? null : writeBuffer );

    }

    renderPass( renderer, material, renderTarget, clearColor, clearAlpha ) {

        // save original state
        renderer.getClearColor( _clearColor );
        const originalClearAlpha = renderer.getClearAlpha();
        const originalAutoClear = renderer.autoClear;

        renderer.setRenderTarget( renderTarget );

        // setup pass state
        renderer.autoClear = false;
        if ( ( clearColor !== undefined ) && ( clearColor !== null ) ) {

            renderer.setClearColor( clearColor );
            renderer.setClearAlpha( clearAlpha || 0.0 );
            renderer.clear();

        }

        this._fsQuad.material = material;
        this._fsQuad.render( renderer );

        // restore original state
        renderer.autoClear = originalAutoClear;
        renderer.setClearColor( _clearColor );
        renderer.setClearAlpha( originalClearAlpha );

    }

    dispose() {

        // dispose render targets
        this.edlRenderTarget();

        // dispose materials
        this.depthRenderMaterial.dispose();
        this.copyMaterial.dispose();

        // dispose full screen quad
        this._fsQuad.dispose();

    }

}

export { EDLPass };
