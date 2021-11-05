import { AxesHelper, Object3D, BoxGeometry, MeshBasicMaterial, Mesh, Color, ShaderMaterial, PlaneGeometry } from 'three'
import gsap, { Power3, Linear } from 'gsap'

import AmbientLightSource from './AmbientLight'
import PointLightSource from './PointLight'
import Suzanne from './Suzanne'
import { analyze, guess } from 'web-audio-beat-detector';

import fragment from '@shaders/shader.frag'
import vertex from '@shaders/shader.vert'

export default class World {
  constructor(options) {
    // Set options
    this.time = options.time
    this.debug = options.debug
    this.assets = options.assets
    this.camera = options.camera

    // Set up
    this.container = new Object3D()
    this.container.name = 'World'

    this.currentTunnelLength = 0
    this.spaceBetween = 2
    this.cameraZ = 8
    this.rotateContainerZ = 0

    this.allCubes = []

    this.blum = false
    this.afterImageValue = 0.60

    if (this.debug) {
      this.container.add(new AxesHelper(5))
      this.debugFolder = this.debug.addFolder({
        title: 'World',
        expanded: true
      })
    }

    this.setLoader()
  }
  init() {
    this.setAmbientLight()
    this.setPointLight()
    this.initSound()
    this.initShader()
    this.initMouseMove()
  }
  setLoader() {
    this.loadDiv = document.querySelector('.loadScreen')
    this.loadModels = this.loadDiv.querySelector('.load')
    this.progress = this.loadDiv.querySelector('.progress')

    this.start = document.querySelector('.start--screen')

    if (this.assets.total === 0) {
      this.init()
      this.loadDiv.remove()
    } else {
      this.assets.on('ressourceLoad', () => {
        this.progress.style.width = this.loadModels.innerHTML = `${Math.floor((this.assets.done / this.assets.total) * 100) +
          Math.floor((1 / this.assets.total) * this.assets.currentPercent)
          }%`
      })

      this.assets.on('ressourcesReady', () => {
        setTimeout(() => {
          this.loadDiv.style.opacity = 0
          setTimeout(() => {
            this.loadDiv.remove()
            this.start.style.opacity = 1
            this.start.addEventListener('click', this.coolFunction)
          }, 550)
        }, 1000)
      })
    }
  }

  coolFunction = () => {
    this.init()
    this.start.style.opacity = 0
    this.start.removeEventListener('click', this.coolFunction)
  }


  setAmbientLight() {
    this.ambientlight = new AmbientLightSource({
      debug: this.debugFolder,
    })
    this.container.add(this.ambientlight.container)
  }
  setPointLight() {
    this.light = new PointLightSource({
      debug: this.debugFolder,
    })
    this.container.add(this.light.container)
  }
  initSound() {
    console.log('init sounds')

    this.audioBuffer = this.assets.sounds.sounds

    const audioCtx = new AudioContext();

    this.source = audioCtx.createBufferSource();
    this.source.buffer = this.audioBuffer;
    this.source.connect(audioCtx.destination);
    this.source.currentTime = 50.00
    this.source.start(0, 55);

    const offset = 15
    const duration = 5

    this.findBPM(offset, duration)
    // this.startMoving()

  }

  findBPM(offset, duration) {
    this.bpmCount = 0

    guess(this.audioBuffer, offset, duration)
      .then(({ bpm, offset, tempo }) => {
        console.log(bpm, offset, tempo)
        this.bpm = 126// bpm

        setTimeout(() => {
          this.addCube()
          this.update()
        }, 6000)


        // the tempo could be analyzed
      })
      .catch((err) => {
        console.log(err)

        // something went wrong
      });
  }

  initMouseMove() {
    // Mouse clicks
    const canvasX = window.innerWidth / 2
    const canvasY = window.innerHeight / 2
    this.start.addEventListener('mousemove', (e) => {
      this.targetPositionX = (canvasX - e.clientX) / canvasX
      this.targetPositionY = e.clientY / canvasY
    })
  }
  startMoving() {
    const geometry = new BoxGeometry(1, 1, -1);
    for (let i = 0; i < 360; i++) {
      // const randomColor = Math.floor(Math.random()*16777215).toString(16);
      const color = new Color(`hsl(${(i * 10) % 360}, 50%, 50%)`)
      const material = new MeshBasicMaterial({ color });
      const cube = new Mesh(geometry, material);
      cube.position.set(1, 1, - i * 2)
      this.container.add(cube);

      const cube2 = new Mesh(geometry, material);
      cube2.position.set(- 1, 1, - i * 2)
      this.container.add(cube2);

      const cube3 = new Mesh(geometry, material);
      cube3.position.set(0, 4, - i * 2)
      this.container.add(cube3);

      const cube4 = new Mesh(geometry, material);
      cube4.position.set(0, - 2, - i * 2)
      this.container.add(cube4);
    }
  }

  addCube = () => {
    this.currentTunnelLength += this.spaceBetween
    // const randomColor = Math.floor(Math.random()*16777215).toString(16);
    this.color = new Color(`hsl(${(this.currentTunnelLength * 10) % 360}, 50%, 50%)`)
    this.randomPosition = Math.random()

    const geometry = new BoxGeometry(1, 1, -1);
    this.randomAppear = Math.ceil(Math.random()) * (Math.round(Math.random()) ? 1 : -1)
    const material = new MeshBasicMaterial({ color: this.color });

    this.cube = new Mesh(geometry, material);
    this.cube.position.set(2 + this.randomPosition, this.randomAppear * -5, - this.currentTunnelLength + this.spaceBetween)
    this.container.add(this.cube);

    gsap.to(this.cube.position, {
      y: 1,
      duration: 0.5,
      ease: Power3.easeOut
    })

    this.cube2 = new Mesh(geometry, material);
    this.cube2.position.set(- 2 - this.randomPosition, this.randomAppear * 5, - this.currentTunnelLength + this.spaceBetween)
    this.container.add(this.cube2);

    gsap.to(this.cube2.position, {
      y: 1,
      duration: 0.5,
      ease: Power3.easeOut
    })

    this.cube3 = new Mesh(geometry, material);
    this.cube3.position.set(this.randomAppear * 5, 4, - this.currentTunnelLength + this.spaceBetween)
    this.container.add(this.cube3);

    gsap.to(this.cube3.position, {
      x: 0,
      duration: 0.5,
      ease: Power3.easeOut
    })

    this.cube4 = new Mesh(geometry, material);
    this.cube4.position.set(this.randomAppear * -5, - 2, - this.currentTunnelLength + this.spaceBetween)
    this.container.add(this.cube4);

    gsap.to(this.cube4.position, {
      x: 0,
      duration: 0.5,
      ease: Power3.easeOut
    })

    this.timeout = setTimeout(this.createInterval, (60 / this.bpm) * 1000 * (1 / this.speedFactor));

    this.allCubes.push(this.cube)
    this.allCubes.push(this.cube2)
    this.allCubes.push(this.cube3)
    this.allCubes.push(this.cube4)
  }

  addMoreCube() {
    const geometry = new BoxGeometry(0.5, 0.5, -0.5);
    const material = new MeshBasicMaterial({ color: this.color });

    this.moreCube = new Mesh(geometry, material);
    this.moreCube.position.set(0.5, this.randomAppear * -5, - this.currentTunnelLength + this.spaceBetween)
    this.container.add(this.moreCube);

    gsap.to(this.moreCube.position, {
      y: 2,
      duration: 0.5,
      ease: Power3.easeOut
    })

    this.moreCube2 = new Mesh(geometry, material);
    this.moreCube2.position.set(- 0.5, this.randomAppear * 5, - this.currentTunnelLength + this.spaceBetween)
    this.container.add(this.moreCube2);

    gsap.to(this.moreCube2.position, {
      y: 2,
      duration: 0.5,
      ease: Power3.easeOut
    })

    this.moreCube3 = new Mesh(geometry, material);
    this.moreCube3.position.set(this.randomAppear * 5, 0, - this.currentTunnelLength + this.spaceBetween)
    this.container.add(this.moreCube3);

    gsap.to(this.moreCube3.position, {
      x: 0.5,
      duration: 0.5,
      ease: Power3.easeOut
    })

    this.moreCube4 = new Mesh(geometry, material);
    this.moreCube4.position.set(this.randomAppear * -5, 0, - this.currentTunnelLength + this.spaceBetween)
    this.container.add(this.moreCube4);

    gsap.to(this.moreCube4.position, {
      x: -0.5,
      duration: 0.5,
      ease: Power3.easeOut
    })

    this.allCubes.push(this.moreCube)
    this.allCubes.push(this.moreCube2)
    this.allCubes.push(this.moreCube3)
    this.allCubes.push(this.moreCube4)
  }

  bounce() {
    this.allCubes.forEach((cube) => {
      gsap.to(cube.scale, {
        x: 1.2,
        y: 1.2,
        z: 1.2,
        duration: 0.1,
        ease: Power3.easeOut
      })

      gsap.to(cube.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.1,
        delay: 0.1,
        ease: Power3.easeOut
      })
    })
  }

  rotateCubes() {
   this.allCubes.forEach((cube) => {
      gsap.to(cube.rotation, {
        z: this.currentTunnelLength % 4 * (Math.PI /2),
        duration: 0.2,
        ease: Power3.easeOut
      })
    })
  }

  rotateContainer() {
    this.rotateContainerZ += this.currentTunnelLength % 4 * (Math.PI /8)
    console.log(this.rotateContainerZ)
    gsap.to(this.container.rotation, {
      z: this.rotateContainerZ,
      duration: 0.1,
      ease: Power3.easeOut
    })
  }
  initInteractions() {
    // Mouse clicks
    this.start.addEventListener('mousedown', (e) => {
      console.log(e)
      if (e.button === 0) {
        this.mouseLeftDown = true
      } else if (e.button === 2) {
        this.mouseRightDown = true
      }
    })
    this.start.addEventListener('mouseup', (e) => {
      console.log(e)
      if (e.button === 0) {
        this.mouseLeftDown = false
      } else if (e.button === 2) {
        this.mouseRightDown = false
      }
    })
    document.addEventListener('keydown', (e) => {
      console.log(e)
      if (e.code === 'KeyQ' && !this.hasMoreCubes) {
        this.hasMoreCubes = true
      } else if (e.code === 'KeyQ' && this.hasMoreCubes) {
        this.hasBounce = false
      }

      if (e.code === 'KeyW' && !this.hasBounce) {
        this.hasBounce = true
      } else if (e.code === 'KeyW' && this.hasBounce) {
        this.hasBounce = false
      }

      if (e.code === 'KeyE' && !this.hasRotateCubes) {
        this.hasRotateCubes = true
      } else if (e.code === 'KeyE' && this.hasRotateCubes) {
        this.hasRotateCubes = false
      }

      if (e.code === 'KeyR' && !this.hasRotateContainer) {
        this.hasRotateContainer = true
      } else if (e.code === 'KeyR' && this.hasRotateContainer) {
        this.hasRotateContainer = false
      }

      if (e.code === 'KeyT' && !this.hasChangeMaterial) {
        this.hasChangeMaterial = true
      } else if (e.code === 'KeyT' && this.hasChangeMaterial) {
        this.hasChangeMaterial = false
      }

      if (e.code === 'KeyY' && !this.hasPlane) {
        this.hasPlane = true
      } else if (e.code === 'KeyY' && this.hasPlane) {
        this.hasPlane = false
      }
    })
  }

  update() {
    this.acceleration = 0
    this.speedFactor = 1

    this.time.on('tick', () => {

      // Mouse Left
      if (this.mouseLeftDown && !this.mouseRightDown && this.speedFactor < 1.98 && this.acceleration < 0.98) {
        this.speedFactor += 0.051 * this.easeOutQuad(this.acceleration)
        this.source.playbackRate.value += 0.05 * this.easeOutQuad(this.acceleration)
        this.acceleration += 0.051
        console.log('1')
      } else if (!this.mouseLeftDown && !this.mouseRightDown && this.speedFactor > 0.02 && this.acceleration > 0.04) {
        this.speedFactor -= 0.051 * this.easeOutQuad(this.acceleration)
        console.log('2')
        this.source.playbackRate.value -= 0.05 * this.easeOutQuad(this.acceleration)
        this.acceleration -= 0.051
      }


      // console.log(this.mouseRightDown, this.mouseLeftDown, this.speedFactor, this.acceleration)
      // Mouse Right
      if (this.mouseRightDown && !this.mouseLeftDown &&  this.speedFactor > 0.49 && this.acceleration < 1) {
        this.speedFactor -= 0.051 * this.easeOutQuad(this.acceleration)
        this.source.playbackRate.value -= 0.05 * this.easeOutQuad(this.acceleration)
        this.acceleration += 0.051
        console.log('3')
      } else if (!this.mouseRightDown && !this.mouseLeftDown && this.speedFactor < 1 && this.acceleration > 0.1) {
        this.speedFactor += 0.051 * this.easeOutQuad(this.acceleration)
        this.source.playbackRate.value += 0.05 * this.easeOutQuad(this.acceleration)
        this.acceleration -= 0.051
        console.log('4')
      }

      this.cameraZ -= (this.spaceBetween * (this.time.delta) / (60 / this.bpm) * this.speedFactor) / 1000
      this.camera.camera.position.set(this.targetPositionX, this.targetPositionY, this.cameraZ)

      // console.log(this.mouseRightDown)
      // console.log(this.time.delta)


      //Shader

      if (this.cube2 && this.cube2.material.uniforms) {
        // console.log(this.cube2)
        this.cube2.material.uniforms.uTime.value = this.time.elapsed * 0.001;
        // this.cube2.material.uniforms.uPosition.value = this.cube.position.z / 1000
        //this.cube2.material.uniforms.uPosition.value = this.cube2.position.z;
      }

      if(this.plane) {
        this.plane.position.set(0, 0, this.cameraZ- 20)
        console.log(this.plane.position.z)
      }

    })

  }

  createInterval = () => {
    clearTimeout(this.timeout)
    if(this.currentTunnelLength !== (32) ) {
      this.addCube()
    } else {
      this.currentTunnelLength += this.spaceBetween
    }
    // Timeline
    console.log(this.currentTunnelLength)

    if(this.currentTunnelLength < 520) {
      if(this.currentTunnelLength > 34) {
        this.addMoreCube()
      }  
      if(this.currentTunnelLength > 66) {
        this.bounce()
      }
      if(this.currentTunnelLength > 98) {
        this.rotateCubes()
      }
      if(this.currentTunnelLength > 130) {
        this.rotateContainer()
      }
      if(this.currentTunnelLength > 160 && this.currentTunnelLength < 252) {
        this.changeMaterial()
      }

      if(this.currentTunnelLength === 250) {
        this.hideCanvas()
      }

      if(this.currentTunnelLength === 290) {
        this.shiet()
      }

      if(this.currentTunnelLength  === 376) {
        this.thomas()
      }

      if(this.currentTunnelLength === 388) {
        this.showCanvas()
        this.createPlane()
        this.blum = true
      }
      if(this.currentTunnelLength === 412) {
        this.afterImageValue = 0.90
      }
  }
    if(this.currentTunnelLength === 520) {
      this.removePlane()
      this.showTuto()
      this.initInteractions()
    }

    if(this.currentTunnelLength > 520) {
      if(this.hasMoreCubes) {
        this.addMoreCube()
      }
      if(this.hasBounce) {
        this.bounce()
      }
      if(this.hasRotateCubes) {
        this.rotateCubes()
      }
      if(this.hasRotateContainer) {
        this.rotateContainer()
      }
      if(this.hasChangeMaterial) {
        this.changeMaterial()
      }
      if(this.hasPlane) {
        this.createPlane()
        this.blum = true
      } else {
        this.removePlane()
        this.blum = false
      }
    }


    // 250

    // 320

    // 328

    /*
    if(this.currentTunnelLength > 110) {
      this.changeMaterial()
    }
    if(this.currentTunnelLength > 130) {
      this.createPlane()
    }
    if(this.currentTunnelLength > 130) {
      this.blum = true
    }
    */
    this.timeout = setTimeout(this.createInterval, (60 / this.bpm) * 1000 * (1 / this.speedFactor));

  }

  initShader() {
    this.shaderMaterial = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPosition: { value: new Color(0, 0, 0) },
        uColor: { value: new Color(0.3, 0.2, 0.5) },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    })
    this.shaderPlaneMaterial = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(0.3, 0.2, 0.5) },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    })
  }

  changeMaterial() {
    console.log(Math.abs(this.camera.camera.position.z % 1))
    this.allCubes.forEach((cube) => {
      cube.material = this.shaderMaterial
      cube.material.uniforms.uPosition.value.x = Math.abs(cube.position.x / 2)
      cube.material.uniforms.uPosition.value.y = Math.abs(cube.position.y / 2)
      cube.material.uniforms.uPosition.value.z = Math.abs(cube.position.z / 2)
    })
    /*  gsap.to(this.cube.material.uniforms.uPosition, {
      value: this.cube.position.z,
      duration: 2,
      ease: Power3.easeOut
    })
    */
  }

  createPlane() {
    const geometry = new PlaneGeometry( 100, 100 );
    const material = this.shaderPlaneMaterial
    this.plane = new Mesh( geometry, material );
    this.container.add( this.plane );
  }

  removePlane() {
    this.container.remove( this.plane );
  }


  shiet () {
    gsap.to("h1", {
      opacity: 1,
      stagger: { // wrap advanced options in an object
        each: 0.45,
        from: "top",
      }
    }).then(() => {
      gsap.to("h1", {
        opacity: 0,
        stagger: { // wrap advanced options in an object
          each: 0.45,
          from: "top",
          delay: 10
        }
      })
    });
  }

  thomas() {
    gsap.to('#thomas', {
      opacity: 1,
    }).then(() => {
      gsap.to('#thomas', {
        opacity: 0,
        delay: 3
      })
    })
  }

  hideCanvas() {
    gsap.to('canvas', {
      opacity: 0,
    })
  }
  showCanvas() {
    gsap.to('canvas', {
      opacity: 1,
    })
  }

  showTuto() {
    gsap.to('.tuto', {
      opacity: 0.6,
    }).then(() => {
      gsap.to('.tuto', {
        opacity: 0,
        delay: 8
      })
    })
  }

  lerp (start, end, amt){
    return (1-amt)*start+amt*end
  }
  easeOutQuad(t) {
    return 1 - (--t) * t * t * t
  }
}
