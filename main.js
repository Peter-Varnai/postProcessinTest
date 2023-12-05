import * as THREE from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {ShaderPass, EffectComposer} from 'postprocessing';
import {ShaderMaterial} from "three";


const WIDTH = window.innerWidth
const HEIGHT = window.innerHeight


// DEFINING SCENE, SCENE2, CAMERA and RENDERER
const scene = new THREE.Scene();
//const sceneSecond = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, WIDTH / HEIGHT, 0.1, 1000);
camera.position.set(0, 0, 5);
const renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize(WIDTH, HEIGHT);
document.body.appendChild(renderer.domElement);


// LIGHTS
const light = new THREE.HemisphereLight(0xffffff, 0x080820, 5);
scene.add(light);
const lightSecond = new THREE.HemisphereLight(0xffffff, 0x080820, 5);
//sceneSecond.add(lightSecond);

const promisifiedLoad = (loader, file) => new Promise(resolve => loader.load(file, resolve))

// DEFINING THE SANDWITCH
const loader = new GLTFLoader()
const model = await promisifiedLoad(loader,'3d files/sandwitch.gltf')
const sandwitch = model.scene;
sandwitch.scale.set(2, 2, 2);
scene.add(sandwitch);


//PLANE, CATPIC
const imageLoader = new THREE.TextureLoader();
const catPic = imageLoader.load('cat.jpg');

const geometry = new THREE.BoxGeometry(9, 6, 2);
const material = new THREE.MeshStandardMaterial({map: catPic});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);


// SHADER SETUP
const vertexShader = `
            varying vec2 vUv;
			void main()	{
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`;
const fragShader = `
            varying vec2 vUv;
			uniform sampler2D input1;
			uniform sampler2D input2;
			void main()	{
                vec2 pixelatedUV = floor(vUv * 50.0) / 50.0;
			
				vec4 texel1 = texture2D(input1, pixelatedUV);
                vec4 texel2 = texture2D(input2, vUv);
                float overlapFactor = (1.0 - texel1.a) * texel2.a;
                vec4 overlappedTexel = texel1 + texel2 * overlapFactor;
                gl_FragColor = overlappedTexel;
			}`;


// POST PROCESSES
const compositRenderTarget1 = new THREE.WebGLRenderTarget(WIDTH, HEIGHT);
const compositRenderTarget2 = new THREE.WebGLRenderTarget(WIDTH, HEIGHT);


let compShaderUniforms = {
    input1: {value: compositRenderTarget1.texture},
    input2: {value: compositRenderTarget2.texture},
    time: {value: 1.0}
};


const compositShader = new ShaderMaterial({
    uniforms: compShaderUniforms,
    vertexShader: vertexShader,
    fragmentShader: fragShader,
});


const composer = new EffectComposer(renderer);
const compositPass = new ShaderPass(compositShader);
composer.addPass(compositPass);


// RENDERING
function animate() {
    requestAnimationFrame(animate);
    sandwitch.rotation.y += 0.01;
    cube.visible = false
    sandwitch.visible = true
    renderer.setRenderTarget(compositRenderTarget1);
    renderer.render(scene, camera);
    cube.visible = true
    sandwitch.visible = false
    renderer.setRenderTarget(null);
    renderer.setRenderTarget(compositRenderTarget2);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);

    composer.render();

    compositRenderTarget2.dispose()
    compositRenderTarget1.dispose()
}

animate();

