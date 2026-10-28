/* ------------------------------ WIND ------------------------------
   Still vegetation is the single clearest tell that a frame is rendered.
   This bends it in the vertex shader, on instanced meshes, for the price of
   one uniform update per material per frame. */
const WINDS=[];
function windify(mat, amp, base){
  mat.onBeforeCompile=(sh)=>{
    sh.uniforms.uTime={value:0};
    sh.uniforms.uAmp={value:amp};
    sh.uniforms.uBase={value:base};
    sh.vertexShader='uniform float uTime;\nuniform float uAmp;\nuniform float uBase;\n'+sh.vertexShader;
    sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\n'+
      '#ifdef USE_INSTANCING\n'+
      '  vec3 wOrg = instanceMatrix[3].xyz;\n'+
      '#else\n'+
      '  vec3 wOrg = vec3(0.0);\n'+
      '#endif\n'+
      // only the part of the plant above uBase moves; the trunk stays put
      '  float lift = max(transformed.y - uBase, 0.0);\n'+
      '  float ph = uTime * 1.15 + wOrg.x * 0.085 + wOrg.z * 0.062;\n'+
      // two frequencies so the motion never settles into a visible beat
      '  float gust = 0.72 + 0.28 * sin(uTime * 0.31 + wOrg.x * 0.013);\n'+
      '  transformed.x += sin(ph) * lift * uAmp * gust;\n'+
      '  transformed.z += cos(ph * 0.83 + 1.3) * lift * uAmp * 0.7 * gust;\n');
    WINDS.push(sh);
  };
  /* without this the patched program would be shared with an unpatched
     material that happens to have the same settings */
  mat.customProgramCacheKey=()=>'wind'+amp+'_'+base;
  return mat;
}
function windTick(t){
  for(let i=0;i<WINDS.length;i++) WINDS[i].uniforms.uTime.value=t;
}
