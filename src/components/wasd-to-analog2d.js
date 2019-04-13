/**
 * Converts WASD keyboard inputs to simulated analog inputs.
 * @namespace user-input
 * @component wasd-to-analog2d
 */
AFRAME.registerComponent("wasd-to-analog2d", {
  schema: {
    analog2dOutputAction: { default: "wasd_analog2d" }
  },

  init: function() {
    this.output = [0, 0];
    this.vectors = {
      w: [0, 1],
      a: [-1, 0],
      s: [0, -1],
      d: [1, 0]
    };
    this.keys = {};

    this.onWasd = this.onWasd.bind(this);
    this.move = this.move.bind(this);
    this.onBlur = this.onBlur.bind(this);
    this.target = [0, 0];
    this.output = [0, 0];
  },

  play: function() {
    const eventNames = ["w_down", "w_up", "a_down", "a_up", "s_down", "s_up", "d_down", "d_up"];
    for (const name of eventNames) {
      this.el.sceneEl.addEventListener(name, this.onWasd);
    }
    // I listen to events that this component generates instead of emitting "move"
    // directly because ideally this would live as an input mapping, but the events
    // generated by this component won't actually get mapped.
    this.el.sceneEl.addEventListener(this.data.analog2dOutputAction, this.move);
    window.addEventListener("blur", this.onBlur);
  },

  pause: function() {
    this.el.sceneEl.removeEventListener("wasd", this.onWasd);
    this.el.sceneEl.removeEventListener(this.data.analog2dOutputAction, this.move);
    window.removeEventListener("blur", this.onBlur);
    this.keys = {};
  },

  onBlur: function() {
    this.keys = {};
  },

  move: function(event) {
    this.el.emit("move", { axis: event.detail.axis });
  },

  onWasd: function(event) {
    const keyEvent = event.type;
    const down = keyEvent.indexOf("down") !== -1;
    const key = keyEvent[0].toLowerCase();
    this.keys[key] = down;
  },

  tick: function() {
    this.target[0] = 0;
    this.target[1] = 0;

    for (let i = 0; i < this.keys.length; i++) {
      const key = this.keys[i];
      if (this.keys[key] && this.vectors[key]) {
        this.target[0] = this.target[0] + this.vectors[key][0];
        this.target[1] = this.target[1] + this.vectors[key][1];
      }
    }

    const targetMagnitude = Math.sqrt(this.target[0] * this.target[0] + this.target[1] * this.target[1]);
    if (targetMagnitude !== 0) {
      this.target[0] = this.target[0] / targetMagnitude;
      this.target[1] = this.target[1] / targetMagnitude;
    }

    const epsilon = 0.01;
    if (
      Math.abs(this.output[0]) < epsilon &&
      Math.abs(this.output[1]) < epsilon &&
      this.target[0] === 0 &&
      this.target[1] === 0
    ) {
      return; // Staying at [0,0] doesn't require new events.
    }

    const easeInSpeed = 0.25;
    this.output[0] = this.output[0] + easeInSpeed * (this.target[0] - this.output[0]);
    this.output[1] = this.output[1] + easeInSpeed * (this.target[1] - this.output[1]);

    if (this.output[0] !== 0 || this.output[1] !== 0) {
      this.el.emit(this.data.analog2dOutputAction, {
        axis: this.output
      });
    }
  }
});
