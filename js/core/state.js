/* ------------------------------ STATE ------------------------------ */
let scene, camera, renderer, clock, roomLight, sun;
const colliders = [], spots = [], rooms = [], anims = [], plaques = [], mapItems = [], crowdList = [], crowdTags = [];
const visited = new Set();
let player = { x:0, y:1.7, z:24, yaw:0, pitch:-0.13 };
let keys = {}, running=false, locked=false, near=null, panelOpen=false;
const $ = id => document.getElementById(id);
