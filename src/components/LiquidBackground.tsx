"use client";

import { useRef, useMemo } from "react";
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

  // Simplex noise function
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
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vec2 uv = vUv;
    
    // Mouse influence
    vec2 mouse = uMouse * 0.5 + 0.5;
    float mouseDist = length(uv - mouse);
    float mouseInfluence = smoothstep(0.5, 0.0, mouseDist) * 0.3;
    
    // Animated noise
    float time = uTime * 0.15;
    float noise1 = snoise(vec3(uv * 2.0 + mouseInfluence, time));
    float noise2 = snoise(vec3(uv * 3.0 - mouseInfluence, time * 1.3));
    float noise3 = snoise(vec3(uv * 1.5, time * 0.7));
    
    float combinedNoise = (noise1 + noise2 * 0.5 + noise3 * 0.25) / 1.75;
    combinedNoise = combinedNoise * 0.5 + 0.5;
    
    // Color gradient: purple -> pink -> orange
    vec3 purple = vec3(0.545, 0.361, 0.965);  // #8B5CF6
    vec3 pink = vec3(0.925, 0.286, 0.600);    // #EC4899
    vec3 orange = vec3(0.976, 0.451, 0.086);  // #F97316
    
    vec3 color1 = mix(purple, pink, smoothstep(0.0, 0.5, combinedNoise + uv.x * 0.3));
    vec3 color2 = mix(pink, orange, smoothstep(0.5, 1.0, combinedNoise + uv.y * 0.3));
    vec3 finalColor = mix(color1, color2, combinedNoise);
    
    // Add glow intensity based on noise
    float glow = pow(combinedNoise, 2.0) * 0.5 + 0.5;
    finalColor *= glow;
    
    // Fade to white at edges for light mode integration
    float edgeFade = smoothstep(0.0, 0.3, uv.x) * smoothstep(1.0, 0.7, uv.x);
    edgeFade *= smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.7, uv.y);
    
    // Mix with very light background
    vec3 lightBg = vec3(0.98, 0.98, 0.99);
    finalColor = mix(lightBg, finalColor, edgeFade * 0.4 + mouseInfluence * 0.3);
    
    // Add subtle opacity variation
    float alpha = 0.6 + combinedNoise * 0.3 + mouseInfluence * 0.2;
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

function LiquidPlane() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { viewport, pointer } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uResolution: { value: new THREE.Vector2(1, 1) },
    }),
    []
  );

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.uTime.value = state.clock.elapsedTime;
      material.uniforms.uMouse.value.lerp(
        new THREE.Vector2(pointer.x, pointer.y),
        0.05
      );
    }
  });

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1, 32, 32]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}

export default function LiquidBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 1] }}
        style={{ background: "linear-gradient(135deg, #fefefe 0%, #f8f9ff 50%, #fff5f5 100%)" }}
      >
        <LiquidPlane />
      </Canvas>
    </div>
  );
}
