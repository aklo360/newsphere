"use client";

import { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uMouse;
  uniform vec2 uResolution;
  varying vec2 vUv;

  #define PI 3.14159265359

  // Simplex noise
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  // Iridescent color based on angle/position - more subtle
  vec3 iridescence(float angle, float intensity) {
    // Rainbow-ish color cycle
    vec3 col;
    col.r = sin(angle * 2.0) * 0.5 + 0.5;
    col.g = sin(angle * 2.0 + 2.094) * 0.5 + 0.5;
    col.b = sin(angle * 2.0 + 4.188) * 0.5 + 0.5;
    
    // Shift towards cooler tones (purples, teals)
    col = mix(col, vec3(0.5, 0.35, 0.7), 0.4);
    col = mix(col, vec3(0.25, 0.5, 0.65), col.g * 0.25);
    
    // Darken overall to prevent blow-out
    col *= 0.6;
    
    return col * intensity;
  }

  // Metaball function
  float metaball(vec2 uv, vec2 pos, float radius) {
    float d = length(uv - pos);
    return radius / d;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 uvAspect = vec2((uv.x - 0.5) * aspect, uv.y - 0.5);
    
    // Mouse position
    vec2 mouse = vec2((uMouse.x * 0.5) * aspect, uMouse.y * 0.5);
    
    float time = uTime * 0.1;
    
    // Single large centered blob with gentle drift
    vec2 p1 = vec2(sin(time * 0.15) * 0.08, cos(time * 0.12) * 0.06);
    
    // Mouse-following blob - directly at cursor position
    vec2 pMouse = mouse;
    
    // Calculate metaball field
    float m = 0.0;
    m += metaball(uvAspect, p1, 0.45);
    m += metaball(uvAspect, pMouse, 0.1);
    
    // Add noise for organic movement - subtle
    float noise = snoise(vec3(uvAspect * 2.0, time)) * 0.08;
    m += noise;
    
    // Create soft threshold for blob shapes
    float blob = smoothstep(0.8, 1.2, m);
    float blobEdge = smoothstep(0.7, 1.0, m) - smoothstep(1.0, 1.3, m);
    
    // Base color - slightly darker off-white
    vec3 bgColor = vec3(0.92, 0.92, 0.94);
    
    // Blob interior - more visible grey
    vec3 blobColor = vec3(0.82, 0.83, 0.87);
    
    // Iridescent edge color
    float angle = atan(uvAspect.y, uvAspect.x) + time * 0.5 + m * 2.0;
    float noiseAngle = snoise(vec3(uvAspect * 2.0, time * 0.3));
    vec3 iridescentColor = iridescence(angle + noiseAngle * 2.0, 0.6);
    
    // Compose final color
    vec3 color = bgColor;
    
    // Add blob interior
    color = mix(color, blobColor, blob * 0.7);
    
    // Add iridescent edge glow - reduced intensity
    color += iridescentColor * blobEdge * 0.5;
    
    // Add subtle overall iridescence to blobs
    color += iridescentColor * blob * 0.08;
    
    // Mouse proximity glow - localized like finger on water
    float mouseDist = length(uvAspect - mouse);
    float mouseGlow = smoothstep(0.15, 0.0, mouseDist) * 0.25;
    color += iridescentColor * mouseGlow;
    
    // Subtle lighter vignette for light mode
    float vignette = 1.0 - length(uvAspect) * 0.15;
    color *= vignette;
    
    // Very subtle film grain
    float grain = snoise(vec3(uv * 500.0, time * 10.0)) * 0.01;
    color += grain;
    
    gl_FragColor = vec4(color, 1.0);
  }
`;

function LiquidPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouseRef = useRef(new THREE.Vector2(0, 0));
  const { viewport, size } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    []
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
      material.uniforms.uMouse.value.lerp(mouseRef.current, 0.15);
      material.uniforms.uResolution.value.set(size.width, size.height);
    }
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  );
}

export default function LiquidBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas 
        camera={{ position: [0, 0, 1] }}
        gl={{ antialias: true, alpha: false }}
      >
        <LiquidPlane />
      </Canvas>
    </div>
  );
}
