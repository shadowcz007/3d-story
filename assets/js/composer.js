 class Composer {
     constructor(scene, camera, renderer) {
         this.composer = this.init(scene, camera, renderer);

         this.initAfterimagePass();
         this.initFilmPass();
         this.initRGBShiftShader();
         this.initEffectBleach();
         this.iinitEffectVignette();
     }

     init(scene, camera, renderer) {
         let composer = new THREE.EffectComposer(renderer);
         composer.addPass(new THREE.RenderPass(scene, camera));

         composer.enable = true;
         return composer

         // const effectBloom = new THREE.BloomPass(0.9);
         // composer.addPass(effectBloom);

         // const effectDotScreen = new THREE.ShaderPass(THREE.DotScreenShader);
         // effectDotScreen.uniforms['scale'].value = 6;
         // composer.addPass(effectDotScreen);




         // const glitchPass = new THREE.GlitchPass();
         // composer.addPass(glitchPass);

     }

     initAfterimagePass() {
         this.afterimagePass = new THREE.AfterimagePass();
         this.composer.addPass(this.afterimagePass);
         this.afterimagePass.uniforms['damp'].value = 0.96;
     }

     initFilmPass() {
         const effectFilm = new THREE.FilmPass(0.2, 0.3, 1024, false);
         this.composer.addPass(effectFilm);
     }
     initRGBShiftShader() {
         this.effectRGBShift = new THREE.ShaderPass(THREE.RGBShiftShader);
         this.effectRGBShift.uniforms['amount'].value = 0.0042;
         this.composer.addPass(this.effectRGBShift);
     }
     initEffectBleach() {
         const effectBleach = new THREE.ShaderPass(THREE.BleachBypassShader);
         this.composer.addPass(effectBleach);
     }
     iinitEffectVignette() {
         const effectVignette = new THREE.ShaderPass(THREE.VignetteShader);
         this.composer.addPass(effectVignette);

     }

     render() {
         if (this.composer.enable) {
             this.composer.render();
         }
     }
 }