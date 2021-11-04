import { Scene, sRGBEncoding, WebGLRenderer, Vector2 } from 'three'
import { Pane } from 'tweakpane'

import Sizes from '@tools/Sizes'
import Time from '@tools/Time'
import Assets from '@tools/Loader'

import Camera from './Camera'
import World from '@world/index'

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass'  

export default class App {
  constructor(options) {
    // Set options
    this.canvas = options.canvas

    // Set up
    this.time = new Time()
    this.sizes = new Sizes()
    this.assets = new Assets()

    this.config = {
      cameraSpeed: 0,
      cameraRadius: 8,
      particlesSpeed: 0,
      particlesCount: 3000,
      bloomStrength: 0.3,
      bloomThreshold: 0.70,
      bloomRadius: 0.5,
      fogColor: 0xa2dcfc,
      fogNear: 0,
      fogFar: 1,
      camZ: 3,
      afterImageValue: 0.60
  }

    this.blum = false

    this.setConfig()
    this.setRenderer()
    this.setCamera()
    this.setWorld()
    this._createPostprocess()
  }
  setRenderer() {
    // Set scene
    this.scene = new Scene()
    // Set renderer
    this.renderer = new WebGLRenderer({
      canvas: this.canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.outputEncoding = sRGBEncoding
    this.renderer.gammaFactor = 2.2
    // Set background color
    this.renderer.setClearColor(0x212121, 1)
    // Set renderer pixel ratio & sizes
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.sizes.viewport.width, this.sizes.viewport.height)
    // Resize renderer on resize event
    this.sizes.on('resize', () => {
      this.renderer.setSize(
        this.sizes.viewport.width,
        this.sizes.viewport.height
      )
    })
    // Set RequestAnimationFrame with 60fps
    this.time.on('tick', () => {
      // When tab is not visible (tab is not active or window is minimized), browser stops requesting animation frames. Thus, this does not work
      // if the window is only in the background without focus (for example, if you select another window without minimizing the browser one), 
      // which might cause some performance or batteries issues when testing on multiple browsers
      if (!(this.renderOnBlur?.activated && !document.hasFocus() ) ) {
        if(!this.world.blum) {
        this.renderer.render(this.scene, this.camera.camera)
        } else {
          this.composer.render(this.time.delta * 0.0001)
        }
      }
    })

    if (this.debug) {
      this.renderOnBlur = { activated: true }
      const folder = this.debug.addFolder({
        title: 'Renderer',
        expanded: true
      })
      folder
        .addInput(this.renderOnBlur, 'activated', {
          label: 'Render on window blur'
        })
    }
  }
  setCamera() {
    // Create camera instance
    this.camera = new Camera({
      sizes: this.sizes,
      renderer: this.renderer,
      debug: this.debug,
    })
    // Add camera to scene
    this.scene.add(this.camera.container)
  }
  setWorld() {
    // Create world instance
    this.world = new World({
      time: this.time,
      debug: this.debug,
      assets: this.assets,
      camera: this.camera
    })
    // Add world to scene
    this.scene.add(this.world.container)
  }
  setConfig() {
    if (window.location.hash === '#debug') {
      this.debug = new Pane()
    }
  }

  _createPostprocess() {
    this.renderPass = new RenderPass(this.scene, this.camera.camera)

    const resolution = new Vector2(this.canvas.clientWidth, this.canvas.clientHeight)

    this.bloomPass = new UnrealBloomPass(resolution, 0, 0, 0)
    this.bloomPass.threshold = this.config.bloomThreshold
    this.bloomPass.strength = this.config.bloomStrength
    this.bloomPass.radius = this.config.bloomRadius

    this.afterimagePass = new AfterimagePass()
    this.afterimagePass.uniforms.damp.value = this.config.afterImageValue

    this.composer = new EffectComposer(this.renderer)
    this.composer.addPass(this.renderPass)
    this.composer.addPass(this.afterimagePass)
    this.composer.addPass(this.bloomPass)
  }
}
