import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import * as dat from 'dat.gui'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js'

// @ts-ignore
const fileUrl = new URL('../assets/Donkey.gltf', import.meta.url)

const scene = new THREE.Scene()

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 6, 14)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

renderer.setClearColor(0xfefefe)
renderer.shadowMap.enabled = true

const controls = new OrbitControls(camera, renderer.domElement)

const ambientLight = new THREE.AmbientLight(0xffffff, 1)
scene.add(ambientLight)

const directinalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directinalLight.castShadow = true

directinalLight.shadow.mapSize.height = 1024
directinalLight.shadow.mapSize.width = 1024
directinalLight.position.set(0, 50, 0)
scene.add(directinalLight)

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshPhongMaterial({
        color: 0xffffff,
    })
)
plane.rotateX(-Math.PI / 2)
plane.receiveShadow = true
plane.visible = false
plane.name = 'ground'

scene.add(plane)

const gridHelper = new THREE.GridHelper(20, 20)
scene.add(gridHelper)

const axesHelper = new THREE.AxesHelper(4)
scene.add(axesHelper)

const hightLightMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshStandardMaterial({
        transparent: true,
        side: THREE.DoubleSide,
    })
)

hightLightMesh.rotateX(-Math.PI / 2)
hightLightMesh.position.set(0.5, 0, 0.5)
scene.add(hightLightMesh)

const assetLoader = new GLTFLoader()
let modelRep: THREE.Group
let clips: THREE.AnimationClip[]

const objects: THREE.Object3D[] = []
const mixers: THREE.AnimationMixer[] = []
assetLoader.load(
    fileUrl.href,
    function (gltf) {
        const model = gltf.scene
        model.scale.set(0.3, 0.3, 0.3)
        model.castShadow = true
        model.receiveShadow = true
        modelRep = model
        console.log(model)
        clips = model.animations
        console.log(clips)
    },
    undefined,
    function (error) {
        console.log(error.message)
    }
)

const mousePosition = new THREE.Vector2()
const raycaster = new THREE.Raycaster()

let intersects

window.addEventListener('mousemove', function (e) {
    mousePosition.x = (e.clientX / window.innerWidth) * 2 - 1
    mousePosition.y = -(e.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mousePosition, camera)
    intersects = raycaster.intersectObject(plane)
    if (intersects.length) {
        const { x, z } = new THREE.Vector3().copy(intersects[0].point).floor().addScalar(0.5)
        hightLightMesh.position.set(x, 0, z)

        const objExist = objects.find(function (obj) {
            return (
                obj.position.x === hightLightMesh.position.x &&
                obj.position.z === hightLightMesh.position.z
            )
        })

        if (!objExist) {
            hightLightMesh.material.color.setHex(0xffffff)
        } else {
            hightLightMesh.material.color.setHex(0xff0000)
        }
    }
})

window.addEventListener('mousedown', function (e) {
    const objExits = objects.find(function (obj) {
        return (
            obj.position.x === hightLightMesh.position.x &&
            obj.position.z === hightLightMesh.position.z
        )
    })

    if (objExits) return

    const stagClone = SkeletonUtils.clone(modelRep)
    stagClone.position.copy(hightLightMesh.position)
    scene.add(stagClone)
    objects.push(stagClone)
    if (clips[1]) {
        const mixer = new THREE.AnimationMixer(stagClone)
        const action = mixer.clipAction(clips[1])
        action.play()
        mixers.push(mixer)
    }
})

window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

const clock = new THREE.Clock()
function animate(time: any) {
    hightLightMesh.material.opacity = 1 + Math.sin(time / 120)

    const delta = clock.getDelta()
    mixers.forEach(function (mixer) {
        mixer.update(delta)
    })
    controls.update()

    render()
}

function render() {
    renderer.render(scene, camera)
}
renderer.setAnimationLoop(animate)
