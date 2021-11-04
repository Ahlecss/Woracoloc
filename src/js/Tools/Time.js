// Steal from https://github.com/brunosimon/folio-2019
import EventEmitter from './EventEmitter'

export default class Time extends EventEmitter {
  constructor() {
    // Get parent methods
    super()

    // Set up
    this.start = Date.now()
    this.now = this.start
    this.lastTime = this.now
    this.elapsed = 0
    this.delta = 16

    this.tick = this.tick.bind(this)
    this.tick()
  }
  // on('tick')
  tick() {
    // Call tick method on each frame
    this.ticker = requestAnimationFrame(this.tick)

    // Get now time
    this.now = Date.now()

    // delta
    this.delta = this.now - this.lastTime
    // elapsed = time between start and now
    this.elapsed = this.now - this.start
    // now = now time
    this.lastTime = this.now

    if (this.delta > 60) {
      this.delta = 60
    }
    // Add trigger event
    this.trigger('tick')
  }
  // Cancel animation frame
  stop() {
    window.cancelAnimationFrame(this.ticker)
  }
}
