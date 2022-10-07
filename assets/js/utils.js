function createCanvasTexture() {
    let canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');
    canvas.width = 32;
    canvas.height = 32;
    ctx.strokeStyle = 'white';
    ctx.fillStyle = 'red';
    ctx.beginPath(); // draw red and white circle
    ctx.arc(10, 10, 8, 0, Math.PI * 2);
    ctx.arc(20, 10, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath(); // draw white square
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.stroke();
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture
}



// uv的相关知识 
// https://dustinpfister.github.io/2021/06/09/threejs-buffer-geometry-attributes-uv/ 

async function createImage(imageUrl, width, height, position = [0, 0, 0], isFlow = false, helper = false, name = "", scale = 1) {
    const texture1 = await loadTextureFromImage(imageUrl)

    // GEOMETRY - starting with a plane
    const geometry = new THREE.PlaneGeometry((width || texture1.source.data.width) * scale, (height || texture1.source.data.height) * scale, 1, 1);

    // use the geometry with a mesh
    var mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        map: texture1,
        transparent: true
    }));
    mesh.position.set(...position);
    isFlow ? flowMaterial(mesh, texture1) : null;
    //  scene.add(mesh);
    if (helper) {
        const box = new THREE.BoxHelper(mesh, 0xffff00);
        scene.add(box);
    }

    mesh.name = name;

    return mesh

}

// 加载图片作为材质
function loadTextureFromImage(imgurl) {
    return new Promise((res, rej) => {
        let img = new Image();
        img.src = imgurl;
        let texture = new THREE.Texture(img);
        img.onload = function() {
            texture.needsUpdate = true;
            console.log(img.naturalWidth, img.naturalHeight)
            res(texture);
        };
    })
}

function flowMaterial(mesh, texture) {
    texture.repeat.set(1, 1);
    mesh.material.map = texture;
    let offset = 0;
    mesh.loop = () => {
        mesh.material.map.wrapS = THREE.RepeatWrapping;
        mesh.material.map.offset.set(offset, 0);
        mesh.material.map.needsUpdate = true;
        offset += 0.01;
    }
}

function createWireframeGeometry(geometry) {
    const wireframe = new THREE.WireframeGeometry(geometry);

    const line = new THREE.LineSegments(wireframe);
    line.material.depthTest = false;
    line.material.opacity = 0.25;
    line.material.transparent = true;

    return line
}


function loadGltf(url, name = 'gltf', position = [0, 0, 0], scale = [1, 1, 1], rotation = [0, 0, 0]) {
    return new Promise((res, rej) => {
        const loader = new THREE.GLTFLoader();
        loader.load(
            // resource URL
            url,
            // called when the resource is loaded
            function(gltf) {
                // gltf.scene.position.set(-25, -6, -200);
                // gltf.scene.scale.set(30, 30, 30);
                // gltf.scene.rotation.set(0, 45, 0);

                gltf.scene.position.set(...position);
                gltf.scene.scale.set(...scale);
                gltf.scene.rotation.set(...rotation);
                //  scene.add(gltf.scene);
                gltf.scene.name = name;

                gltf.scene.traverse(function(child) {
                    if (child.isMesh) {
                        child.frustumCulled = false;
                        //模型阴影
                        child.castShadow = true;
                        //模型自发光
                        child.material.emissive = child.material.color;
                        child.material.emissiveMap = child.material.map;
                    }
                });

                if (gltf.animations && gltf.animations[0]) {
                    gltf.scene.mixer = new THREE.AnimationMixer(gltf.scene);

                    const action = gltf.scene.mixer.clipAction(gltf.animations[0]);
                    action.setLoop(THREE.LoopRepeat);
                    // action.clampWhenFinished=true;
                    action.play();
                    // action.paused = !pause;

                    gltf.scene.animations = gltf.animations;
                }


                gltf.scene.loop = delta => {
                    if (gltf.scene.mixer) gltf.scene.mixer.update(delta);
                }
                gltf.scene.step = e => {
                    if (gltf.scene.mixer) gltf.scene.mixer.update(e);
                }
                res(gltf.scene)
            },
            // called while loading is progressing
            function(xhr) {
                console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            },
            // called when loading has errors
            function(error) {
                console.log('An error happened');
            }
        );
    })

}


function createSkyBox(url) {
    // skybox mesh (courtesy fallout)
    let bgMesh;
    // create texture loader
    const loader = new THREE.TextureLoader();

    const texture = loader.load(url);

    // filter ...
    texture.minFilter = THREE.LinearFilter;
    // ... and shader stuff
    const shader = THREE.ShaderLib.equirect;
    const material = new THREE.ShaderMaterial({
        fragmentShader: shader.fragmentShader,
        vertexShader: shader.vertexShader,
        uniforms: shader.uniforms,
        depthWrite: false,
        side: THREE.BackSide,
    });
    // ... and a material setting
    material.uniforms.tEquirect.value = texture;
    // create a plane to project skybox on
    const plane = new THREE.BoxBufferGeometry(200, 200, 200);
    bgMesh = new THREE.Mesh(plane, material);
    return bgMesh

}

class MetaCard {
    constructor(opts = {}) {
        this.name = opts.name || "";
        this.cardtemplate = "assets/images/card/cardtemplate3.png";
        this.cardtemplateback = "assets/images/card/cardtemplateback4.png";
        this.flower = "assets/images/card/flower3.png";
        this.noise2 = "assets/images/card/noise2.png";
        this.color11 = "assets/images/card/color11.png";
        this.backtexture = "assets/images/card/color3.jpg";
        this.voronoi = "assets/images/card/rgbnoise2.png";

        this.skyboxUrl = opts.skyboxUrl || 'assets/images/skybox1.jpg';
        this.vert = `
    varying vec2 vUv;
    varying vec3 camPos;
    varying vec3 eyeVector;
    varying vec3 vNormal;
    
    void main() {
    vUv = uv;
    camPos = cameraPosition;
    vNormal = normal;
    vec4 worldPosition = modelViewMatrix * vec4( position, 1.0);
    eyeVector = normalize(worldPosition.xyz - abs(cameraPosition));
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
    `
        this.fragPlane = `
    varying vec2 vUv;
    uniform sampler2D skullrender;
    uniform sampler2D cardtemplate;
    uniform sampler2D backtexture;
    uniform sampler2D noiseTex;
    uniform sampler2D color;
    uniform sampler2D noise;
    uniform vec4 resolution;
    varying vec3 camPos;
    varying vec3 eyeVector;
    varying vec3 vNormal;
    
    float Fresnel(vec3 eyeVector, vec3 worldNormal) {
    return pow( 1.0 + dot( eyeVector, worldNormal), 1.80 );
    }
    
    void main() {
    vec2 uv = gl_FragCoord.xy/resolution.xy ;
    vec4 temptex = texture2D( cardtemplate, vUv);
    vec4 skulltex = texture2D( skullrender, uv - 0.5 );
    gl_FragColor = temptex;
    float f = Fresnel(eyeVector, vNormal);
    vec4 noisetex = texture2D( noise, mod(vUv*2.,1.));
    if(gl_FragColor.g >= .5 && gl_FragColor.r < 0.6){
    gl_FragColor = f + skulltex;
    gl_FragColor += noisetex/5.;
    
    } else {
    vec4 bactex = texture2D( backtexture, vUv);
    float tone = pow(dot(normalize(camPos), normalize(bactex.rgb)), 1.);
    vec4 colortex = texture2D( color, vec2(tone,0.));
    
    //sparkle code, dont touch this!
    vec2 uv2 = vUv;
    vec3 pixeltex = texture2D(noiseTex,mod(uv*5.,1.)).rgb;      
    float iTime = 1.*0.004;
    uv.y += iTime / 10.0;
    uv.x -= (sin(iTime/10.0)/2.0);
    uv2.y += iTime / 14.0;
    uv2.x += (sin(iTime/10.0)/9.0);
    float result = 0.0;
    result += texture2D(noiseTex, mod(uv*4.,1.) * 0.6 + vec2(iTime*-0.003)).r;
    result *= texture2D(noiseTex, mod(uv2*4.,1.) * 0.9 + vec2(iTime*+0.002)).b;
    result = pow(result, 10.0);
    gl_FragColor *= colortex;
    gl_FragColor += vec4(sin((tone + vUv.x + vUv.y/10.)*10.))/8.;
    // gl_FragColor += vec4(108.0)*result;
    
    }
    
    gl_FragColor.a = temptex.a;
    }
    `
        this.fragPlaneback = `
    varying vec2 vUv;
    uniform sampler2D skullrender;
    uniform sampler2D cardtemplate;
    uniform sampler2D backtexture;
    uniform sampler2D noiseTex;
    uniform sampler2D color;
    uniform sampler2D noise;
    uniform vec4 resolution;
    varying vec3 camPos;
    varying vec3 eyeVector;
    varying vec3 vNormal;
    
    float Fresnel(vec3 eyeVector, vec3 worldNormal) {
    return pow( 1.0 + dot( eyeVector, worldNormal), 1.80 );
    }
    
    void main() {
    vec2 uv = gl_FragCoord.xy/resolution.xy ;
    vec4 temptex = texture2D( cardtemplate, vUv);
    vec4 skulltex = texture2D( skullrender, vUv );
    gl_FragColor = temptex;
    vec4 noisetex = texture2D( noise, mod(vUv*2.,1.));
    float f = Fresnel(eyeVector, vNormal);
    
    vec2 uv2 = vUv;
    vec3 pixeltex = texture2D(noiseTex,mod(uv*5.,1.)).rgb;      
    float iTime = 1.*0.004;
    uv.y += iTime / 10.0;
    uv.x -= (sin(iTime/10.0)/2.0);
    uv2.y += iTime / 14.0;
    uv2.x += (sin(iTime/10.0)/9.0);
    float result = 0.0;
    result += texture2D(noiseTex, mod(uv*4.,1.) * 0.6 + vec2(iTime*-0.003)).r;
    result *= texture2D(noiseTex, mod(uv2*4.,1.) * 0.9 + vec2(iTime*+0.002)).b;
    result = pow(result, 10.0);
    
    
    vec4 bactex = texture2D( backtexture, vUv);
    float tone = pow(dot(normalize(camPos), normalize(bactex.rgb)), 1.);
    vec4 colortex = texture2D( color, vec2(tone,0.));
    if(gl_FragColor.g >= .5 && gl_FragColor.r < 0.6){
    float tone = pow(dot(normalize(camPos), normalize(skulltex.rgb)), 1.);
    vec4 colortex2 = texture2D( color, vec2(tone,0.));
    if(skulltex.a > 0.2){
    gl_FragColor = colortex;
    // gl_FragColor += vec4(108.0)*result;
    // gl_FragColor += vec4(sin((tone + vUv.x + vUv.y/10.)*10.))/8.;
    } else {
    gl_FragColor = vec4(0.) + f;
    gl_FragColor += noisetex/5.;
    }
    gl_FragColor += noisetex/5.;
    
    } else {
    //sparkle code, dont touch this!    
    gl_FragColor *= colortex;
    gl_FragColor += vec4(sin((tone + vUv.x + vUv.y/10.)*10.))/8.;
    }
    
    }
    `
    }

    init = (renderer, sceneCamera) => {
        this.sceneCamera = sceneCamera;
        // card
        this.camera = new THREE.PerspectiveCamera(
            30,
            1301 / 2 / window.innerHeight,
            1,
            10000
        );

        this.camera.position.z = 30;
        this.camera.position.y = -3.5;
        this.scene = new THREE.Scene();

        this.renderScene = new THREE.RenderPass(this.scene, this.camera);

        this.composer = new THREE.EffectComposer(renderer)
        this.composer.renderToScreen = false;
        this.composer.addPass(this.renderScene);
        // this.composer.addPass(bloomPass);

        // 卡本身模型
        this.card = new THREE.Group();
        this.card.add(this.planeback());
        this.card.add(this.createCard());
        this.card.name = this.name;
        for (const child of this.card.children) {
            child.name = this.name + '-child';
        }

        // card里的容器
        this.modelgroup = new THREE.Object3D();
        this.scene.add(this.modelgroup);

        // skybox
        this.createSkyBox(this.skyboxUrl);

        this.card.loop = (delta) => {
            this.modelgroup.rotation.set(-this.sceneCamera.rotation._x, -this.sceneCamera.rotation._y, 0);
            this.composer.render();
            // console.log('k')
        }
        this.card.visible = false;
        return this.card
    }

    show() {
        this.card.visible = true;
    }

    add = (mesh) => {
        this.modelgroup.add(mesh)
    }

    remove = (parent) => {
        parent.remove(this.card)
    }

    createSkyBox = (url = 'assets/images/skybox1.jpg') => {
        let sbox = createSkyBox(url);
        this.add(sbox);
    }


    planeback = () => {
        var geometry = new THREE.PlaneGeometry(20, 30);
        var backmaterial = new THREE.ShaderMaterial({
            uniforms: {
                cardtemplate: {
                    type: "t",
                    value: new THREE.TextureLoader().load(this.cardtemplateback),
                },
                backtexture: {
                    type: "t",
                    value: new THREE.TextureLoader().load(this.backtexture),
                },
                noise: {
                    type: "t",
                    value: new THREE.TextureLoader().load(this.noise2),
                },
                skullrender: {
                    type: "t",
                    value: new THREE.TextureLoader().load(this.flower),
                },
                resolution: {
                    value: new THREE.Vector2(1301 / 2, window.innerHeight),
                },
                noiseTex: {
                    type: "t",
                    value: new THREE.TextureLoader().load(this.voronoi),
                },
                color: {
                    type: "t",
                    value: new THREE.TextureLoader().load(this.color11),
                },
            },
            fragmentShader: this.fragPlaneback,
            vertexShader: this.vert,
            transparent: true,
            depthWrite: false,
        });
        var backcard = new THREE.Mesh(geometry, backmaterial);
        backcard.rotation.set(0, Math.PI, 0);
        // scene.add(backcard);
        return backcard
    }

    createCard = () => {
        var geometry = new THREE.PlaneGeometry(20, 30);
        var frontmaterial = new THREE.ShaderMaterial({
            uniforms: {
                cardtemplate: {
                    type: "t",
                    value: new THREE.TextureLoader().load(this.cardtemplate),
                },
                backtexture: {
                    type: "t",
                    value: new THREE.TextureLoader().load(this.backtexture),
                },
                noise: {
                    type: "t",
                    value: new THREE.TextureLoader().load(this.noise2),
                },
                skullrender: {
                    type: "t",
                    value: this.composer.readBuffer.texture,
                },
                resolution: {
                    value: new THREE.Vector2(1301 / 2, window.innerHeight),
                },
                noiseTex: {
                    type: "t",
                    value: new THREE.TextureLoader().load(this.voronoi),
                },
                color: {
                    type: "t",
                    value: new THREE.TextureLoader().load(this.color11),
                },
            },
            fragmentShader: this.fragPlane,
            vertexShader: this.vert,
            transparent: true,
            depthWrite: false,
        });

        var frontcard = new THREE.Mesh(geometry, frontmaterial);
        return frontcard
    }
}



class LightBar {
    constructor(props) {
        this.mesh = this.geometry(props.uid);
    }
    geometry(i) {
        const amp = 1;
        const c_mat = new THREE.MeshBasicMaterial();
        const c_geo = new THREE.CapsuleGeometry(0.02, 0.5 + Math.random(), 5, 16);
        this.c_mes = new THREE.Mesh(c_geo, c_mat);
        this.c_mes.position.y = -Math.random() * (amp / 2) + Math.random() * (amp / 2);
        this.c_mes.position.x = -Math.sin(i * 0.3) * Math.PI;
        this.c_mes.position.z = -Math.cos(i * 0.3) * Math.PI;
        // e.add(this.c_mes);
        return this.c_mes
    }

};


function exportGLTF(input, animations = []) {

    const gltfExporter = new THREE.GLTFExporter();

    const options = {
        trs: false,
        onlyVisible: true,
        binary: true,
        animations
    };
    gltfExporter.parse(
        input,
        function(result) {

            if (result instanceof ArrayBuffer) {

                saveArrayBuffer(result, 'scene.glb');

            } else {

                const output = JSON.stringify(result, null, 2);
                console.log(output);
                saveString(output, 'scene.gltf');

            }

        },
        function(error) {

            console.log('An error happened during parsing', error);

        },
        options
    );

}

function saveArrayBuffer(buffer, filename) {

    save(new Blob([buffer], { type: 'application/octet-stream' }), filename);

}

function save(blob, filename) {
    const link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link); // Firefox workaround, see #6594

    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();

    // URL.revokeObjectURL( url ); breaks Firefox...

}

// 解析url参数转换成对象
function getUrlParmas(url) {
    let reg = /([^?&=]+)=([^?&=]+)/;
    let obj = {};
    url.replace(reg, function() {
        obj[arguments[1]] = arguments[2];
    })
    return obj;
}