function createSceneObjects(story) {


    // 灯光
    const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 5);
    light.position.y = 100;
    scene.add(light);

    // 抽象建筑
    const grid = new THREE.GridHelper(100, 10)
    grid.position.set(0, 150, 0)
    scene.add(grid);
    for (let index = 0; index < 20; index++) {
        let g = grid.clone()
        g.position.y -= 20 * (index + 1)
        if (Math.abs(g.position.y) > 40) scene.add(g)
    }

    // 元卡
    mc1 = new MetaCard({
        skyboxUrl: 'assets/images/skybox1.jpg',
        name: 'meta-card'
    });
    scene.add(mc1.init(renderer, camera));
    mc1.card.position.set(-25, 20, -120)
    createImage('assets/images/background.png', 512, 512, [0, -250, -1000], false, false, 'p1').then(p1 => mc1.add(p1))
    for (let index = -2; index < 1; index++) {
        let m = mc1.card.clone()
        m.position.x *= (index + 1)
        scene.add(m);
        story.play.push({
            time: 0.1,
            mesh: m
        });
    };

    story.play.push({
        time: 0.1,
        mesh: mc1.card
    });

    // 灯光阵列
    lightbars = new THREE.Group();
    for (let i = 0; i <= 20; i++) {
        const lightbar = new LightBar({
            uid: i
        });
        lightbars.add(lightbar.mesh)
    }
    scene.add(lightbars)
    lightbars.scale.set(10, 150, 10)
    lightbars.position.y = 0;
    lightbars.loop = (_, peak) => {
        peak = 10 * (peak || 1);
        lightbars.rotation.y += 0.001 * Math.abs(peak)
    }


    //  星球
    let plant = createPlant();
    plant.position.set(-50, 15, 0);
    plant.loop = (_, peak) => {
        // console.log(peak)
        peak = Math.max(1 + (peak || 1), 1);
        plant.scale.set(peak, peak, peak);
        for (const child of plant.children) {
            if (child.loop) child.loop()
        }
    };

    plant.visible = false;

    story.play.push({
        time: 0.03,
        mesh: plant
    });

    // 戒指


    loadGltf('assets/model/ring.glb', 'ring', [50, 15, 0], [0.3, 0.3, 0.3], [90, 45, 5]).then(mesh => {
        mesh.loop = (_, peak) => {
            //  peak = 10 * (peak || 1);
            mesh.rotation.x += 0.0001;
            mesh.rotation.y += 0.001;
            mesh.rotation.z += 0.001;
        }
        scene.add(mesh);
        mesh.visible = false;

        story.play.push({
            time: 0.05,
            mesh
        })


    });
    //模特
    loadGltf('assets/model/girl.glb', 'girl', [0, 2, 0], [1, 1, 1]).then(mesh => {
        scene.add(mesh);
        //  console.log(mesh.animations)
        mesh.mixer.stopAllAction();
        for (const a of mesh.animations) {
            if (a.name != 'stand') {
                let action = mesh.mixer.clipAction(a);
                action.setLoop(THREE.LoopRepeat);
                action.play();
            }

        };
        mesh.visible = false;
        story.play.push({
            time: 0.2,
            mesh
        })
    });


    // skybox
    let sbox = createSkyBox('assets/images/skybox1.jpg');
    scene.add(sbox)
    sbox.visible = false;
    story.play.push({
        time: 0.005,
        mesh: sbox
    });

    // 霓虹灯

    for (let index = 1; index < 12; index++) {
        createImage(`assets/images/lights/${index}.png`, false, false, [0, 0, 0], false, false, `lights_${index}`, 0.02).then(im => {
            let i = index % 2 > 0 ? 1 : -1;
            im.position.set((20 + Math.random() * 50) * i, Math.random() * 40, Math.random() * 40 * i);
            scene.add(im);
            im.loop = (_, peak) => {
                if (peak) {
                    peak = 0.1 * (peak || 1)
                } else {
                    peak = 0;
                }
                im.position.set(im.position.x + peak,
                    im.position.y + peak,
                    im.position.z + peak);
            };
            im.visible = false;
            story.play.push({
                time: 0.05 + 0.2 * Math.random(),
                mesh: im
            });

        });
    }


    // t台


    loadGltf('assets/model/scene.glb', 'scene', [7, -5, 0], [1, 1.2, 2]).then(res => {
        children = res.children;


        let b1 = children[3],
            b2 = children[4],
            b3 = b1.clone(),
            b4 = b2.clone();

        b3.position.z += 50;
        b4.position.z += 50;
        res.add(b3);
        res.add(b4);

        // road
        let road = children[0];
        road.children[0].material.color.r = 239 / 255;
        road.children[0].material.color.g = 151 / 255;
        road.children[0].material.color.b = 177 / 255;
        road.position.z = 0;
        let roadMore = road.clone();
        roadMore.position.z = -50;

        res.add(roadMore)


        //    m1
        let m1 = children[1];
        m1.scale.set(1, 1, 0.7)
        m1.position.x -= 5

        m1.children[0].material.color.r = 239 / 255;
        m1.children[0].material.color.g = 151 / 255;
        m1.children[0].material.color.b = 177 / 255;

        let m1More = m1.clone();
        m1More.position.z = -70;
        //  m1More.position.y = res.position.y;
        res.add(m1More)
        let m2 = children[2];
        m2.scale.set(1, 1, 0.7)
        m2.position.x += 5
        m2.children[0].material.color.r = 239 / 255;
        m2.children[0].material.color.g = 151 / 255;
        m2.children[0].material.color.b = 177 / 255;
        let m2More = m2.clone();

        m2More.position.z = -70;
        //  m2More.position.y = res.position.y;
        res.add(m2More)

        res.loop = (_, peak) => {
            peak = 2 * (peak || 1);

            roadMore.position.z += 0.1 * Math.abs(peak);
            road.position.z += 0.1 * Math.abs(peak);

            if (road.position.z > 40) {
                road.position.z = -50
            }
            if (roadMore.position.z > 40) {
                roadMore.position.z = -50
            }

            m1.position.z += 0.1 + Math.abs(peak);
            m1More.position.z += 0.1 + Math.abs(peak);
            if (m1.position.z > 60) {
                m1.position.z = -70
            }
            if (m1More.position.z > 60) {
                m1More.position.z = -70
            }
            m2.position.z += 0.1 + Math.abs(peak);
            m2More.position.z += 0.1 + Math.abs(peak);
            if (m2.position.z > 60) {
                m2.position.z = -70
            }
            if (m2More.position.z > 60) {
                m2More.position.z = -70
            }

            b1.position.z += 0.1 + peak;
            b2.position.z += 0.1 + peak;
            b3.position.z += 0.1 + peak;
            b4.position.z += 0.1 + peak;
            if (b1.position.z > 100) {
                b1.position.z = -50;
            }
            if (b2.position.z > 100) {
                b2.position.z = -50;
            }
            if (b3.position.z > 100) {
                b3.position.z = -50;
            }
            if (b4.position.z > 100) {
                b4.position.z = -50;
            }
        }


        scene.add(res);

        for (const child of res.children) {
            child.visible = false;

            story.play.push({
                time: 0.1 + 0.1 * Math.random(),
                mesh: child
            })
        }


    })





}



function createSun() {
    var geometry = new THREE.CylinderGeometry(18, 18, 2, 24);
    const edges = new THREE.EdgesGeometry(geometry);
    const cylinder = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x444444 }));
    cylinder.rotation.set(Math.PI / 2, 0, 0);
    scene.add(cylinder);
    return cylinder;
}

// 光环 
function createRings() {
    var g = new THREE.Group();
    g.name = 'rings'
        // scene.add(g);

    function makeRing(radius, parent) {
        var geometry = new THREE.CylinderGeometry(radius, radius, 0.1, 64);
        var edges = new THREE.EdgesGeometry(geometry);
        var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x11ee77 }));
        parent.add(line);
        return line;
    };

    var ring0 = makeRing(3, g);
    var ring1 = makeRing(3.3, ring0);
    var ring2 = makeRing(3.6, ring1);


    g.loop = (_, peak) => {

        g.rotation.x += 0.02;
        g.rotation.y += 0.02;

        ring0.rotation.x += 0.0001;
        ring0.rotation.y += 0.001;
        ring0.rotation.z += 0.001;
        ring1.rotation.z += 0.001;
        ring1.rotation.y += 0.0001;
        ring1.rotation.z += 0.001;
        ring2.rotation.x += 0.001;
        ring2.rotation.y += 0.0001;
        ring2.rotation.z += 0.001;
    }


    return g
}

// 星球
function createPlant() {
    var g = new THREE.Group();
    g.name = 'plant'
    scene.add(g);
    var geometry = new THREE.OctahedronGeometry(2, 3);
    var material = new THREE.MeshPhongMaterial({ color: 0x444444, opacity: 0.8, transparent: true });
    var cube = new THREE.Mesh(geometry, material);
    g.add(cube);
    cube.name = 'plant-child'
    var edges = new THREE.EdgesGeometry(geometry);
    var line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x1188dd }));
    line.scale.set(3, 3, 3);
    g.add(line);

    let rings = createRings();
    g.add(rings)
        // g.loop = () => rings.loop()
    return g
}


function createObject() {

    const texture = {
        matcap: "https://images.unsplash.com/photo-1626908013943-df94de54984c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2673&q=80",
        skin: "https://images.unsplash.com/photo-1560780552-ba54683cb263?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1740&q=80",
        env: "https://images.unsplash.com/photo-1536566482680-fca31930a0bd?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=987&q=80"
    };

    const o_geo = new THREE.RoundedBoxGeometry(1, 1, 1, 5, 0.05);
    const c_geo = new THREE.CircleGeometry(5, 5);
    const o_mat = new THREE.MeshMatcapMaterial({
        color: 0xffffff,
        //side: THREE.DoubleSide,
        matcap: new THREE.TextureLoader().load(texture.matcap),
        map: new THREE.TextureLoader().load(texture.env)
    });

    c_mes = new THREE.Mesh(c_geo, o_mat);
    o_mes = new THREE.Mesh(o_geo, o_mat);
    c_mes.rotateX(Math.PI / 2);
    c_mes.position.y = -1;
    scene.add(o_mes);

    o_mes.loop = t => {
        let speed = 0.01;
        o_mes.rotation.y = -t * speed;
        o_mes.rotation.z = t * speed;
        o_mes.rotation.x = t * speed;
        o_mes.position.y =
            Math.sin(t * speed) * 0.2;
    }

}