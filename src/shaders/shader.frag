      precision highp float;
      uniform float uTime;
      uniform vec3 uColor;
      uniform vec3 uPosition;
      varying vec2 vUv;
      void main() {
          vec3 col = vec3(0.);
          col.r = 0.5 + cos(uPosition.x / 2.) + vUv.x ;
          col.g = 0. + cos(uPosition.x / 2.) + vUv.x ;
          col.b = 0.5 + cos(uPosition.z / 2.) + vUv.y ;
          gl_FragColor = vec4(col, 1.0);
      } 