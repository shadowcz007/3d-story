class GUI {
    constructor(title = 'Parameters', story) {
        this.gui = new Tweakpane.Pane({
            title,
        });

        this.default = { duration: 1, position: { x: 0, y: 0, z: 0 }, target: { x: 0, y: 0, z: 0 } }

        this.getCamera = story.getCamera;
        this.preview = story.preview;
        this.setCamera = story.setCamera;
        this.camera = story.camera;
        this.controls = story.controls;
        this.next = story.next;
        this.goto = story.goto;
        this.story = story;

        this.init();

        this.cameras = localStorage.getItem('_cameras') || '[]';
        if (this.cameras) this.cameras = JSON.parse(this.cameras);
        this.updateCameraList()

    }
    init() {

        this.gui.addButton({
            title: 'new',
            label: '新剧本', // optional
        }).on('click', () => {
            this.cameras = [];
            window._cacheRoad = null;
            this.updateCameraList()
        });


        this.gui.addButton({
            title: 'getCamera',
            label: '快照', // optional
        }).on('click', () => {
            // console.log(this.getCamera)
            window._cacheRoad = null;
            if (!this.cameras) this.cameras = [];
            this.cameras.push({...this.getCamera({ x: 0, y: 0, z: 0 }),
                target: controls.target,
                duration: 1,
                id: 'index_' + (new Date()).getTime()
            });
            console.log(this.cameras)

            this.updateCameraList()

        })



        this.gui.addButton({
            title: 'createStory',
            label: '预览动画', // optional
        }).on('click', () => this.preview(this.cameras))

        this.gui.addButton({
            title: 'wheel',
            label: '滚轮控制', // optional
        }).on('click', () => {

            this.setCamera(this._cs[0].position, this._cs[0].target);
            // window._cacheRoad = [...this._cacheRoad];
            window._cacheRoadIndex = 0;
            window.isWheelControl = true;
            console.log(window._cacheRoad)
        })

        this.gui.addButton({
            title: 'exportStory',
            label: '导出剧本', // optional
        }).on('click', () => {
            console.log(JSON.stringify(this.cameras))
            localStorage.setItem('_cameras', JSON.stringify(this.cameras))
        });


        this.gui.addButton({
            title: 'product',
            label: '构建', // optional
        }).on('click', () => {
            let res = Array.from(window._cacheRoad, r => {
                let nr = { position: {}, target: r.target }
                nr.position.x = r.position.x;
                nr.position.y = r.position.y;
                nr.position.z = r.position.z;
                return nr
            })
            console.log(JSON.stringify(res))
            localStorage.setItem('_cacheRoad', JSON.stringify(res))
        });

        this.gui.addButton({
            title: 'delete',
            label: '删除镜头', // optional
        }).on('click', () => {
            this.cameras = this.cameras.filter(c => c.id !== this.targetCamera.id);
            this.updateCameraList()
        });

        this.gui.addInput(this.default, 'duration', {
            title: 'duration',
            label: '时长',
            min: 1,
            max: 10,
            step: 0.1
        }).on('change', e => {
            console.log(e.value)
            if (this.targetCamera && this.targetCamera.id) {
                this.targetCamera.duration = e.value;
                this.cameras = Array.from(this.cameras, c => {
                    if (c.id === this.targetCamera.id) {
                        c = {...this.targetCamera }
                    };
                    return c
                })
            }
        });

        this.gui.addInput(this.default, 'target', {
            title: 'target',
            label: '目标',
        }).on('change', e => {
            // console.log(e.value)
            this.setCamera([this.default.position.x, this.default.position.y, this.default.position.z], e.value)
        });
        this.gui.addInput(this.default, 'position', {
            title: 'position',
            label: '摄像机',
        }).on('change', e => {
            // console.log(e.value)
            this.setCamera([e.value.x, e.value.y, e.value.z], this.default.target)

        });
    }

    updateCameraList() {
        if (this.list && this.list.element) this.list.element.remove();
        if (this.cameras.length > 0) {
            let options = Array.from(this.cameras, (c, i) => {

                return { text: "camera_" + i, value: c.id, data: c }
            });
            this.targetCamera = options[options.length - 1].data;
            this.default.duration = this.targetCamera.duration;
            this.default.position = {
                x: this.targetCamera.position[0],
                y: this.targetCamera.position[1],
                z: this.targetCamera.position[2]
            };
            this.default.target = this.targetCamera.target;

            this.gui.refresh()
            this.setCamera(this.targetCamera.position, this.targetCamera.target);
            this.list = this.gui.addBlade({
                view: 'list',
                label: 'cameras',
                options,
                value: options[options.length - 1].value,
            }).on('change', e => {
                let value = options.filter(o => o.value === e.value)[0].data;
                this.targetCamera = value;
                this.default.duration = this.targetCamera.duration;
                this.default.position = {
                    x: this.targetCamera.position[0],
                    y: this.targetCamera.position[1],
                    z: this.targetCamera.position[2]
                };
                this.default.target = this.targetCamera.target;
                // console.log(this.camera.position.toArray(), this.targetCamera.position)
                this.gui.refresh()
                this.setCamera(this.targetCamera.position, this.targetCamera.target);
                // this.goto([...this.targetCamera.position], this.targetCamera.target, this.targetCamera.duration);
            })
        }

    }
}