import { AxesHelper, Object3D, BoxGeometry, MeshBasicMaterial, Mesh, Color } from 'three'
import gsap, { Power3 } from 'gsap'

import AmbientLightSource from './AmbientLight'
import PointLightSource from './PointLight'
import Suzanne from './Suzanne'
import { analyze, guess } from 'web-audio-beat-detector';


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
    this.initInteractions()
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
    this.update()
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
    this.source.start();

    const offset = 100
    const duration = 5

    this.findBPM(offset, duration)
    // this.startMoving()

  }

  findBPM(offset, duration) {
    this.bpmCount = 0

    guess(this.audioBuffer, offset, duration)
      .then(({ bpm, offset, tempo }) => {
        console.log(bpm, offset, tempo)
        this.bpm = bpm
        this.addCube()

        // the tempo could be analyzed
      })
      .catch((err) => {
        console.log(err)

        // something went wrong
      });
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
    this.bpmCount += 1
      // const randomColor = Math.floor(Math.random()*16777215).toString(16);
    this.color = new Color(`hsl(${(this.bpmCount * 10) % 360}, 50%, 50%)`)
    this.randomPosition = Math.random()
    const geometry = new BoxGeometry(1, 1, -1);
    const material = new MeshBasicMaterial({ color: this.color });
    const cube = new Mesh(geometry, material);
    cube.position.set(2 + this.randomPosition, 1 , - this.bpmCount * 4)
    this.container.add(cube);

    const cube2 = new Mesh(geometry, material);
    cube2.position.set(- 2 - this.randomPosition, 1, - this.bpmCount * 4)
    this.container.add(cube2);

    const cube3 = new Mesh(geometry, material);
    cube3.position.set(0, 4, - this.bpmCount * 4)
    this.container.add(cube3);

    const cube4 = new Mesh(geometry, material);
    cube4.position.set(0, - 2, - this.bpmCount * 4)
    this.container.add(cube4);

    // setTimeout(this.createInterval, (60 / this.bpm ) * 1000 * this.speedFactor);

  }

  initInteractions() {
    // Mouse clicks
    this.start.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouseLeftDown = true
      } else if (e.button === 2) {
        this.mouseRightDown = true
      }
    })
    this.start.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouseLeftDown = false
      } else if (e.button === 2) {
        this.mouseRightDown = false
      }
    })

    // Mouse clicks
    const canvasX = window.innerWidth / 2
    const canvasY = window.innerHeight / 2
    this.start.addEventListener('mousemove', (e) => {
      this.targetPositionX = (canvasX - e.clientX) / canvasX
      this.targetPositionY = e.clientY / canvasY
    })
  }

  firstPart() {
    const timeline = new gsap.timeline({})
  }

  update() {
    this.acceleration = 0
    this.speedFactor = 1
    this.step = 0
    this.d = 2

    this.time.on('tick', () => {

      // Mouse Left
      if (this.mouseLeftDown && this.speedFactor < 3 && this.acceleration < 1) {
        this.acceleration += 0.05
        this.speedFactor += 0.05 * this.easeOutQuad(this.acceleration)
        this.source.playbackRate.value += 0.02 * this.easeOutQuad(this.acceleration)
      } else if (!this.mouseLeftDown && this.speedFactor > 1 && this.acceleration > 0.1) {
        this.acceleration -= 0.05
        this.speedFactor -= 0.05 * this.easeOutQuad(this.acceleration)
        this.source.playbackRate.value -= 0.02 * this.easeOutQuad(this.acceleration)
      }

      // Mouse Right
      if (this.mouseRightDown && this.speedFactor > 0.5 && this.acceleration < 1) {
        this.acceleration += 0.05
        this.speedFactor -= 0.05 * this.easeOutQuad(this.acceleration)
        this.source.playbackRate.value -= 0.02 * this.easeOutQuad(this.acceleration)
      } else if (!this.mouseRightDown && this.speedFactor < 1 && this.acceleration > 0.1) {
        this.acceleration -= 0.05
        this.speedFactor += 0.05 * this.easeOutQuad(this.acceleration)
        this.source.playbackRate.value += 0.02 * this.easeOutQuad(this.acceleration)
      }
      this.camera.camera.position.set(this.targetPositionX , this.targetPositionY, 0 )

      this.step = Math.floor(this.container.position.z / (this.bpmCount / 2) )
      console.log(this.step, this.bpmCount)
      if(this.step > this.bpmCount) {
        this.addCube()
      }

      // console.log(this.mouseRightDown)
      this.container.position.z += 0.0015 * this.speedFactor * this.time.delta
    })

  }

  easeOutQuad(t) {
    return 1 - (--t) * t * t * t
  }
}
