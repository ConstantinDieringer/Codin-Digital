(() => {
  'use strict';
  const canvas = document.querySelector('.fluid-background');
  const section = document.querySelector('.services');
  if (!canvas || !section) return;
  canvas.style.opacity = '0';
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false });
  if (!gl) return; // The CSS color fields remain available as a static fallback.
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vertex = `attribute vec2 position;
    void main() { gl_Position = vec4(position, 0., 1.); }`;
  const fragment = `precision highp float;
    uniform vec2 resolution;
    uniform float time;
    float field(vec2 p, vec2 center, vec2 stretch) {
      vec2 d = (p - center) * stretch;
      return exp(-dot(d, d) * 3.5);
    }
    float grain(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    void main() {
      vec2 uv = gl_FragCoord.xy / resolution;
      uv.y = 1. - uv.y;
      float t = time;
      vec2 p = uv + vec2(
        sin(uv.y * 4.8 + t * .24) + .35 * sin(uv.x * 7. + t * .12),
        cos(uv.x * 4.5 - t * .18) + .25 * sin(uv.y * 6. + t * .17)) * .12;
      float blue = field(p, vec2(.24 + .13*sin(t*.17), .69 + .12*cos(t*.21)), vec2(1.15,.9));
      float peach = field(p, vec2(.85 + .16*cos(t*.15), .24 + .17*sin(t*.19)), vec2(.95,1.3));
      float lilac = field(p, vec2(.73 + .16*sin(t*.13), .8 + .13*cos(t*.16)), vec2(1.1,1.));
      float pearl = field(p, vec2(.26 + .12*cos(t*.2), .08), vec2(1.,1.2));
      vec3 cream = vec3(.975,.967,.956);
      float weight = blue + peach + lilac + pearl + .12;
      vec3 color = (blue * vec3(.2,.34,.66) + peach * vec3(.98,.65,.35)
        + lilac * vec3(.61,.47,.82) + pearl * cream + .12 * cream) / weight;
      color = mix(cream, color, .76);
      // Keep a quiet, luminous area beneath the black section heading.
      float light = exp(-dot(uv * vec2(1.6,2.8), uv * vec2(1.6,2.8)) * 2.);
      color = mix(color, cream, light * .88);
      color += (grain(gl_FragCoord.xy) - .5) * .055;
      gl_FragColor = vec4(clamp(color, 0., 1.), 1.);
    }`;
  function shader(type, source) {
    const handle = gl.createShader(type);
    gl.shaderSource(handle, source); gl.compileShader(handle);
    if (!gl.getShaderParameter(handle, gl.COMPILE_STATUS)) { gl.deleteShader(handle); return null; }
    return handle;
  }
  const vs = shader(gl.VERTEX_SHADER, vertex), fs = shader(gl.FRAGMENT_SHADER, fragment);
  if (!vs || !fs) return;
  const program = gl.createProgram();
  gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  gl.useProgram(program);
  const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const resolution = gl.getUniformLocation(program, 'resolution'), clock = gl.getUniformLocation(program, 'time');
  let frameId = 0, previous = 0, phase = 0, visible = false, lost = false;
  function draw() {
    gl.uniform2f(resolution, canvas.width, canvas.height);
    gl.uniform1f(clock, phase); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    canvas.style.opacity = '1';
  }
  function resize() {
    if (lost) return;
    const bounds = canvas.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio || 1, 1.5, 2048 / Math.max(1, bounds.width));
    canvas.width = Math.max(1, Math.round(bounds.width * ratio));
    canvas.height = Math.max(1, Math.round(bounds.height * ratio));
    gl.viewport(0, 0, canvas.width, canvas.height); draw();
  }
  function stop() { cancelAnimationFrame(frameId); frameId = 0; previous = 0; }
  function frame(now) {
    frameId = 0;
    if (!visible || document.hidden || reduced || lost) { previous = 0; return; }
    if (!previous || now - previous >= 1000/30) {
      if (previous) phase += Math.min((now - previous)/1000, .1);
      previous = now; draw();
    }
    frameId = requestAnimationFrame(frame);
  }
  function resume() {
    if (visible && !document.hidden && !reduced && !lost && !frameId) {
      previous = 0; frameId = requestAnimationFrame(frame);
    }
  }
  canvas.addEventListener('webglcontextlost', () => { lost = true; stop(); canvas.style.opacity = '0'; });
  addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => document.hidden ? stop() : resume());
  resize();
  if (!reduced) {
    if (typeof IntersectionObserver !== 'undefined') {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (visible) resume(); else stop();
      }).observe(section);
    } else { visible = true; resume(); }
  }
})();
