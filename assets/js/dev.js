class Dev {
    constructor(canvasParent, scene, renderer) {
        let { dev, isDev } = getUrlParmas(window.location.href);
        this.isDev = dev || isDev || false;
        this.canvasParent = canvasParent;
        this.renderer = renderer;
        this.scene = scene;
        this.init()
    }
    init() {
        if (this.isDev) {
            for (const child of this.scene) {
                if (child.type === "HemisphereLight") {
                    const hemisphereLightHelper = new THREE.HemisphereLightHelper(child, 15);
                    this.scene.add(hemisphereLightHelper);
                };
                if (child.type == 'Camera') {
                    const helper = new THREE.CameraHelper1(child);
                    this.scene.add(helper);
                }
            }

            const axesHelper = new THREE.AxesHelper(5);
            this.scene.add(axesHelper);

        }


        const minW = 200,
            minH = minW * this.canvasParent.clientHeight / this.canvasParent.clientWidth;

        const rendererMini = new THREE.WebGLRenderer();
        rendererMini.setPixelRatio(window.devicePixelRatio);
        rendererMini.setSize(minW, minH);
        this.canvasParent.appendChild(rendererMini.domElement);
        rendererMini.domElement.style = `position: absolute;
                    right: 0;
                    bottom: 0;`;
        this.rendererMini = rendererMini;

        this.isChangeCamera = true;

        this.camera2 = new PerspectiveCamera(45, this.canvasParent.clientWidth / this.canvasParent.clientHeight, 0.1, 10000)
            // camera2.position
        this.camera2.position.set(-115.8099712307579, 82.51899343706879, 165.6093906078972);
        this.camera2.rotation.set(-0.4622665328567532, -0.5592466753164187, -0.25844633836904923, 'XYZ');
        this.controls2 = new THREE.OrbitControls(this.camera2, this.renderer.domElement);
    }

    render(delta) {

        this.controls2.update();

        if (this.isChangeCamera) {

            this.rendererMini.render(this.scene, this.camera2);

        } else if (this.isDev) {
            this.renderer.render(this.scene, this.camera2);
            this.rendererMini.render(this.scene, this.camera);
        }


    }
}