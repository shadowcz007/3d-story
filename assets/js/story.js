class Story {
    constructor(scene, camera, controls) {
        this.scene = scene;
        this.camera = camera;
        this.controls = controls;


        // 用来控制场景加载
        this.play = [];

        // 联动的其他元素
        this.storyElements = {
            0: [{
                startTime: 0.00001,
                endTime: 0.3,
                id: "hello-1",
                startRun: () => console.log('startRun'),
                endRun: () => console.log('endRun'),
            }, {
                startTime: 0.1,
                endTime: 0.3,
                id: "hello-2",
                startRun: () => {
                    console.log('startRun');
                    lightbars.scale.set(10, 80, 10)
                },
                endRun: () => {
                    console.log('endRun');
                    // lightbars.scale.set(10, 150, 10)
                },
            }, {
                startTime: 0.95,
                endTime: 2,
                id: "start",
                startRun: () => {
                    console.log('startRun');
                    lightbars.scale.set(10, 10, 10)
                },
                endRun: () => {
                    console.log('endRun');
                    // lightbars.scale.set(10, 80, 10)
                },
            }],
            1: [{
                startTime: 0.01,
                endTime: 2,
                id: "hello-2-1",
                startRun: () => {
                    console.log('startRun');

                },
                endRun: () => {
                    console.log('endRun');

                },
            }]
        };

        // musi
        this._musicIndex = 0;
        this._musicMaxIndex = 1;

        let that = this;
        document.body.addEventListener('wheel', e => {
            that.handleMouseWheel(e)
        });
    }

    initMusic(id = 'waveform', waveColor = '#9f3e5a', progressColor = '#ef97b1') {
        this.isPlayMusic = true;

        this.musicId = this.musicId || id;
        this.waveColor = this.waveColor || waveColor;
        this.progressColor = this.progressColor || progressColor;

        if (this.wavesurfer) this.wavesurfer.destroy();

        this.wavesurfer = WaveSurfer.create({
            container: '#' + this.musicId,
            waveColor: this.waveColor,
            progressColor: this.progressColor,
            backend: 'MediaElement'
        });

        this.wavesurfer.load(`assets/music/${this._musicIndex}.m4a`);
        this.wavesurfer.on('ready', () => this.wavesurfer.play());
        this.wavesurfer.on('finish', () => this.wavesurfer.play());

        this.wavesurfer.on('audioprocess', () => {
            if (this.wavesurfer.backend && this.wavesurfer.backend.buffer) {
                this.time = this.wavesurfer.getCurrentTime() / this.wavesurfer.backend.buffer.duration;
                this.peak = this.getMusicPeaks(this.time);
                window.peak = this.peak;
                for (const p of this.play) {
                    if (p) {
                        if (this.time >= p.time) p.mesh.visible = true;
                    }
                };
            }
        });
    }

    playMusic() {
        this.wavesurfer.play();
    }

    nextMusic() {
        this._musicIndex++;
        if (this._musicIndex > this._musicMaxIndex) this._musicIndex = 0;
        this.initMusic();
        this.playMusic();
    }
    getMusicPeaks(time) {
            if (this.wavesurfer.backend.buffer) {
                let peaks = this.wavesurfer.backend.mergedPeaks;
                if (time && peaks) {
                    let index = ~~(peaks.length * time)
                    return peaks[index]
                }
            }
        }
        // story 编辑模式
    getCamera(target) {

        let radius = this.camera.position.distanceTo(target || this.controls.target);

        return {
            radius,
            position: this.camera.position.toArray(),
            duration: 1
        }
    }




    setCamera(position = [], target = {
        x: 0,
        y: 0,
        z: 0
    }) {
        this.camera.position.set(...position)
        this.camera.lookAt(target);
    }

    goto(position = [], target, duration = 3) {
        let road = [];

        return new Promise((res, rej) => {
            gsap.to(this.camera.position, {
                x: position[0],
                y: position[1],
                z: position[2],
                duration,
                onStart: () => {

                    console.log('onStart', duration, this.camera.position.toArray())
                },
                onUpdate: () => {
                    // console.log(this.camera.position.toArray())
                    this.camera.lookAt(target || this.controls.target);
                    road.push({
                        position: {...this.camera.position },
                        target
                    })
                },
                onComplete: () => {
                    res(road)
                }
            })
        })
    }

    initStory(index, data, auto = false) {
        window._storyIndex = index;
        window._cacheRoad = data || JSON.parse(localStorage.getItem('_cacheRoad') || '[]');
        window._cacheRoadIndex = 0;
        window.isWheelControl = !auto;
        if (window._cacheRoad && window._cacheRoad.length > 0) {
            let position = window._cacheRoad[0].position;
            this.setCamera([position.x, position.y, position.z], window._cacheRoad[0].target);
        }
        if (auto) {
            let g = new THREE.Group();
            g.name = 'auto';
            g.loop = (_, peak) => {
                // console.log(peak)
                window._cacheRoadIndex += 0.4;
                // window._cacheRoadIndex = Math.round(window._cacheRoadIndex)
                this.playCurrentFrame();
                // gui的显示逻辑
                this.playGui()
            }
            this.scene.add(g);
        }
    }

    playCurrentFrame() {
        if (!window._cacheRoad) return
        if (window._cacheRoadIndex < 0) window._cacheRoadIndex = 0;
        if (window._cacheRoadIndex >= window._cacheRoad.length) {
            window._cacheRoadIndex = window._cacheRoad.length - 1;
        };
        let index = Math.round(window._cacheRoadIndex);
        if (!window._cacheRoad[index]) return
        let position = window._cacheRoad[index].position;
        this.camera.position.set(position.x, position.y, position.z);
        this.camera.lookAt(window._cacheRoad[index].target);

    }

    playGui() {
        // gui的显示逻辑
        const displayElement = function(id, display = 'block') {
            if (id) document.getElementById(id).style.display = display;
        }
        for (const element of this.storyElements[window._storyIndex]) {
            let p = window._cacheRoadIndex / (window._cacheRoad.length - 1);
            // console.log(p, element.startTime, element.endTime)
            if (element.startTime) {
                // 大于开始时间，显示
                if (element.startTime <= p && !element.play) {
                    displayElement(element.id, 'block')
                    if (element.startRun) element.startRun();
                    element.play = true;
                    // 小于开始时间，需要隐藏
                } else if (element.startTime > p && element.play) {
                    displayElement(element.id, 'none');
                    if (element.endRun) element.endRun();
                    element.play = false;
                }
            }
            // 大于结束时间，隐藏
            if (element.endTime && element.play) {
                if (element.endTime <= p) {
                    displayElement(element.id, 'none');
                    if (element.endRun) element.endRun();
                    element.play = false;
                }
            }
        }
    }

    handleMouseWheel(event) {
        // 播音乐的时候，不控制进度
        if (this.isPlayMusic) return
        console.log(window._cacheRoadIndex)
        if (window._cacheRoadIndex == null || window._cacheRoadIndex == undefined || !window._cacheRoad || !window.isWheelControl) return


        if (event.deltaY < 0) {
            // back
            window._cacheRoadIndex -= 10;
        } else if (event.deltaY > 0) {
            // forward
            window._cacheRoadIndex += 10;
        }

        this.playCurrentFrame();


        // gui的显示逻辑
        this.playGui()

    }

    preview(cameras) {
        this._cs = [...cameras];
        this._index = 1;
        window._cacheRoad = [];
        window._cacheRoadIndex = 0;
        this.setCamera(this._cs[0].position, this._cs[0].target)
        this.next()
    }
    next() {
        if (this._cs.length <= this._index) return


        this.goto(this._cs[this._index].position, this._cs[this._index].target, this._cs[this._index].duration).then(r => {
            this._index++;
            window._cacheRoad = [...window._cacheRoad, ...r]
            this.next()
        })

    }

}







// function flyto(position, target, radius, duration = 3) {
//     radius = radius || camera.position.distanceTo(target || controls.target);
//     let road = [];
//     return new Promise((res, rej) => {
//         gsap.to(camera.position, {
//             x: position[0],
//             y: position[1],
//             z: position[2],
//             duration: duration,
//             // ease: "elastic",
//             onUpdate: () => {
//                 camera.lookAt(target || controls.target);
//                 //move camera in a circular path
//                 camera.position.normalize().multiplyScalar(radius);
//                 road.push({
//                     position: camera.position.toArray(),
//                     radius,
//                     target
//                 })
//             },
//             onComplete: () => {
//                 res(road)
//             }
//         });
//     })

// }








function startStory() {
    window._cs = [{
        "radius": 927,
        "position": [14.006457039635075, 42.79750762110822, 925.9824376203399],
        "target":  {
            x: -25,
            y: 20,
            z: -120
        },
        "duration": 1
    }, {
        "radius": 198.9866056035844,
        "position": [-116.62379861932071, -29.326821118713607, 170.9247694211790],
        "target":  {
            x: -25,
            y: 20,
            z: -120
        },
        "duration": 2
    }, {
        "radius": 198.88051397418624,
        "position": [-10.896579286963165, -139.99267735795954, 139.45107305564],
        "target":  {
            x: -25,
            y: 20,
            z: -120
        },
        "duration": 3
    }, {
        "radius": 199.8617326869594,
        "position": [-140.27646357687075, 132.16992791089908, 82.37304141795818],
        "target":   {
            x: -25,
            y: 20,
            z: -120
        },
        "duration": 5
    }, {
        "radius": 317.1153032484231,
        "position": [225.32992034608301, 134.44031450998162, 161.9232372145524],
        "target":   {
            x: -25,
            y: 20,
            z: -120
        },
        "duration": 5
    }, {
        "radius": 55.4395607134264,
        "position": [-2.4880282206763233, 22.030313504786907, -12.91559594985246],
        "target":  {
            x: -25,
            y: 20,
            z: -120
        },
        "duration": 5
    }];
    window._index = 1;
    window._cacheRoad = [];
    window._cacheRoadIndex = 0;
    setCamera(window._cs[0].position, window._cs[0].target)
    nextStory()
}



function createStory2() {
    window._cacheRoad = null;
    window._cs = [{
        "radius": 184,
        "position": [-125.92965800000002, 101.990089, 88.70236700000001],
        "target":  {
            x: 0,
            y: 0,
            z: 0
        },
        "duration": 3
    }, {

        "radius": 184,
        "position": [56.86801230530218, 13.400733058855018, 175.2564305797566],
        "target":  {
            x: 0,
            y: 0,
            z: 0
        },
        "duration": 2
    }, {

        "radius": 109,
        "position": [-48.66349999029162, 7.213980876609973, 96.5416634253377],
        "target":  {
            x: 0,
            y: 0,
            z: 0
        },
        "duration": 2


    }, {

        "radius": 102,
        "position": [-97.18740110893357, 10.756933918136356, -1.958284624194453],
        "target":  {
            x: 0,
            y: 0,
            z: 0
        },
        "duration": 2


    }];
    window._index = 1;
    window._cacheRoad = [];
    window._cacheRoadIndex = 0;
    // setCamera(window._cs[0].position, window._cs[0].target)
    nextStory()

}