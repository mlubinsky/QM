import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { Vec3 } from '../utils/spinMath'

interface BlochSphereProps {
  theta: number
  phi: number
  trajectory: Vec3[]
  playing: boolean
  measureAxis?: Vec3
}

const AXIS_COLOR  = { x: 0xe74c3c, y: 0x2ecc71, z: 0x3498db }
const ARROW_COLOR = 0xffffff
const TRAJ_COLOR  = 0xf39c12
const SPHERE_COLOR = 0x444466

export function BlochSphere({ theta, phi, trajectory, measureAxis }: BlochSphereProps) {
  const mountRef   = useRef<HTMLDivElement>(null)
  const sceneRef   = useRef<THREE.Scene | null>(null)
  const arrowRef   = useRef<THREE.ArrowHelper | null>(null)
  const trajRef    = useRef<THREE.Line | null>(null)
  const mAxisRef   = useRef<THREE.Line | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef  = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const frameIdRef = useRef<number>(0)

  // ── Scene init (runs once) ──────────────────────────────────────────────────
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const width  = mount.clientWidth
    const height = mount.clientHeight

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(window.devicePixelRatio)
    mount.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Scene
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 100)
    camera.position.set(2.2, 1.4, 2.2)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dir = new THREE.DirectionalLight(0xffffff, 0.8)
    dir.position.set(3, 5, 3)
    scene.add(dir)

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controlsRef.current = controls

    // Sphere (semi-transparent)
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1, 48, 48),
      new THREE.MeshStandardMaterial({
        color: SPHERE_COLOR,
        transparent: true,
        opacity: 0.13,
        side: THREE.DoubleSide,
      })
    )
    scene.add(sphere)

    // Wireframe equator + meridians
    const wireframe = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 16),
      new THREE.MeshBasicMaterial({ color: 0x888888, wireframe: true, transparent: true, opacity: 0.12 })
    )
    scene.add(wireframe)

    // Axes
    const axisLen = 1.35
    const headLen = 0.12
    const headW   = 0.06
    scene.add(new THREE.ArrowHelper(new THREE.Vector3(1,0,0), new THREE.Vector3(-axisLen,0,0), axisLen*2, AXIS_COLOR.x, headLen, headW))
    scene.add(new THREE.ArrowHelper(new THREE.Vector3(0,1,0), new THREE.Vector3(0,-axisLen,0), axisLen*2, AXIS_COLOR.z, headLen, headW))
    scene.add(new THREE.ArrowHelper(new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,-axisLen), axisLen*2, AXIS_COLOR.y, headLen, headW))

    // Axis labels (HTML overlay)
    const labels: [string, THREE.Vector3, string][] = [
      ['x', new THREE.Vector3(1.55, 0,    0),    '#e74c3c'],
      ['y', new THREE.Vector3(0,    0,    1.55), '#2ecc71'],
      ['z', new THREE.Vector3(0,    1.55, 0),    '#3498db'],
      ['|↑⟩', new THREE.Vector3(0, 1.2,  0),    '#aaaaff'],
      ['|↓⟩', new THREE.Vector3(0, -1.2, 0),    '#aaaaff'],
    ]

    const labelEls: HTMLElement[] = []
    for (const [text, , color] of labels) {
      const el = document.createElement('div')
      el.textContent = text
      el.style.cssText = `position:absolute;color:${color};font-size:0.78rem;
        font-family:Georgia,serif;pointer-events:none;user-select:none;
        text-shadow:0 1px 3px #000;`
      mount.appendChild(el)
      labelEls.push(el)
    }

    // State arrow (initial direction up)
    const arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(0, 0, 0),
      1.0,
      ARROW_COLOR, 0.15, 0.08
    )
    scene.add(arrow)
    arrowRef.current = arrow

    // Trajectory line (empty geometry, filled later)
    const trajGeo = new THREE.BufferGeometry()
    const trajLine = new THREE.Line(
      trajGeo,
      new THREE.LineBasicMaterial({ color: TRAJ_COLOR, transparent: true, opacity: 0.7 })
    )
    scene.add(trajLine)
    trajRef.current = trajLine

    // Measurement axis indicator (dashed, hidden by default)
    const mAxisGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -1.3, 0),
      new THREE.Vector3(0,  1.3, 0),
    ])
    const mAxisLine = new THREE.Line(
      mAxisGeo,
      new THREE.LineDashedMaterial({ color: 0xffff00, dashSize: 0.08, gapSize: 0.05, transparent: true, opacity: 0.8 })
    )
    mAxisLine.computeLineDistances()
    mAxisLine.visible = false
    scene.add(mAxisLine)
    mAxisRef.current = mAxisLine

    // Render loop
    function animate() {
      frameIdRef.current = requestAnimationFrame(animate)
      controls.update()

      // Project label positions to screen
      labels.forEach(([, worldPos], i) => {
        const pos = worldPos.clone().project(camera)
        const x = (pos.x *  0.5 + 0.5) * width
        const y = (pos.y * -0.5 + 0.5) * height
        labelEls[i].style.left = `${x - 10}px`
        labelEls[i].style.top  = `${y - 10}px`
      })

      renderer.render(scene, camera)
    }
    animate()

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (!mount) return
      const w = mount.clientWidth, h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    ro.observe(mount)

    return () => {
      cancelAnimationFrame(frameIdRef.current)
      ro.disconnect()
      controls.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
      labelEls.forEach(el => mount.removeChild(el))
    }
  }, [])

  // ── Update state arrow when (theta, phi) change ───────────────────────────
  useEffect(() => {
    const arrow = arrowRef.current
    if (!arrow) return
    // Three.js: y is up; Bloch: z is up → map (rx,ry,rz) → Three(rx, rz, ry)
    const rx = Math.sin(theta) * Math.cos(phi)
    const ry = Math.sin(theta) * Math.sin(phi)
    const rz = Math.cos(theta)
    arrow.setDirection(new THREE.Vector3(rx, rz, ry).normalize())
  }, [theta, phi])

  // ── Update trajectory arc ─────────────────────────────────────────────────
  useEffect(() => {
    const line = trajRef.current
    if (!line) return
    if (trajectory.length < 2) {
      line.geometry.setFromPoints([])
      return
    }
    const points = trajectory.map(([rx, ry, rz]) => new THREE.Vector3(rx, rz, ry))
    line.geometry.setFromPoints(points)
  }, [trajectory])

  // ── Update measurement axis indicator ─────────────────────────────────────
  useEffect(() => {
    const mAxis = mAxisRef.current
    if (!mAxis) return
    if (!measureAxis) {
      mAxis.visible = false
      return
    }
    const [nx, ny, nz] = measureAxis
    const pts = [new THREE.Vector3(-nx*1.3, -nz*1.3, -ny*1.3),
                 new THREE.Vector3( nx*1.3,  nz*1.3,  ny*1.3)]
    mAxis.geometry.setFromPoints(pts)
    mAxis.computeLineDistances()
    mAxis.visible = true
  }, [measureAxis])

  return (
    <div
      ref={mountRef}
      style={{ width: '100%', height: '100%', position: 'relative', background: '#1a1a2e', borderRadius: 8 }}
    />
  )
}
