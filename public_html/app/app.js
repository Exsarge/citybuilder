// This will include pixijs too
let Viewport = require('pixi-viewport');
var viewport = new Viewport( 
{
    screenWidth: 1024,
    screenHeight: 768,
    worldWidth: 5616,
    worldHeight: 2704
});


/* global PIXI */

//Aliases
let Application = PIXI.Application,
        loader = PIXI.loader,
        resources = PIXI.loader.resources,
        Sprite = PIXI.Sprite;

//Create a Pixi Application
let app = new PIXI.Application({
    width: 1024, // default: 800
    height: 768, // default: 600
    antialias: true, // default: false
    transparent: false, // default: false
    backgroundColor: 0xffffff,
    resolution: 1       // default: 1
}
);
/* ResizeToWindow
 
 app.renderer.view.style.position = "absolute";
 app.renderer.view.style.display = "block";
 app.renderer.autoResize = true;
 app.renderer.resize(window.innerWidth, window.innerHeight);
 */

/* Creating a sprite via TextureCache
 
 let texture = PIXI.utils.TextureCache["images/anySpriteImage.png"];
 let sprite = new PIXI.Sprite(texture);
 */

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

// Scale mode for all textures, will retain pixelation
//PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

//load an image and run the `setup` function when it's done
// the add function works with an array as well
// 
// if you need to create a texture from an image object
//new PIXI.BaseTexture(anyImageObject),
loader
        .add("assets/R_SS_StoneAge_Residential.png")
        .add("assets/P_SS_IronAge_Tailor.png")
        .add("assets/R_SS_BronzeAge_Residential1.png")
        .add("assets/P_SS_BronzeAge_DomesticationPen.png")
        .add("assets/L_SS_AllAge_CupBonus1.png")
        .add("assets/T_SS_AllAge_EasterBonus1.png")
        .add("assets/P_SS_EarlyMiddleAge_Tannery.png")
        .add("assets/T_SS_AllAge_Expedition16.png")
        .add("assets/R_SS_MultiAge_SummerBonusSetB17b.png")
        .add("assets/R_SS_MultiAge_TourBonus17.png")
        .add("json/foe-map-64x64.json")
        .add("json/objects.json")
        .add("assets/ground.png")
        .add("assets/grid.png")
        .add("assets/S_SS_StoneAge_Street.png")
        //.on("progress", loadProgressHandler)
        .load(setup);
//let container = new PIXI.Container();
let world;
let items;
let mapLayer;
let tu = new TileUtilities(PIXI);
let scale = 1;
let t;
const RED = 0xff0000;

// create viewport

let pointer;
function download_sprite_as_png(renderer, sprite, fileName) {
	renderer.extract.canvas(sprite).toBlob(function(b){
		var a = document.createElement('a');
		document.body.append(a);
		a.download = fileName;
		a.href = URL.createObjectURL(b);
		a.click();
		a.remove();
	}, 'image/png');
}
function drawGrid() {
    //Draw Iso grid
    for (let row = 0; row < 64; row++) {
        for (let column = 0; column < 64; column++) {
            let sprite = tu.isoRectangle(world.cartTilewidth, world.cartTileheight, 0.5, 0xCCCCFF);
            sprite.x =  world.cartTileheight*column - world.cartTileheight*row;
            sprite.y = (world.cartTileheight*column + world.cartTileheight*row)/2;
            viewport.addChild(sprite);
            
        }
    }
}
function getColumn(x){
    return Math.floor((x - world.cartTilewidth / 2)/ world.cartTilewidth);
};
function getRow(y) {
    return Math.floor((y + world.cartTileheight / 2) / world.cartTileheight);
};
function getIndex(x,y) {
    return Math.floor((x - world.cartTilewidth / 2) / world.cartTilewidth) + Math.floor((y + world.cartTileheight / 2) / world.cartTileheight) * world.widthInTiles;
};

function drawRectangle(width,height, _color){
    let color = _color || 0;
    let rectangle = new PIXI.Graphics();
    rectangle.lineStyle(1, color);
    rectangle.moveTo(0, 0);
    rectangle.lineTo(width, 0);
    rectangle.lineTo(width, height);
    rectangle.lineTo(0, height);
    rectangle.lineTo(0, 0); 
    return new PIXI.Sprite(rectangle.generateCanvasTexture());       
}

//This `setup` function will run when the image has loaded
function setup() {

    
    // create the world from the map.json
    world = tu.makeIsoTiledWorld("json/foe-map-64x64.json","assets/ground.png");
    // Move viewport to center the grid
    viewport.x = 0;
    // initialize viewport plugins
    viewport
        .drag()
        .pinch()
        .wheel()
        .clampZoom({minWidth:1040, minheight:520, maxWidth:5616, maxHeight:2704})
        //.clamp()  this does not work with the iso view, because of the negative value
        .zoomPercent(0.25);


    // Get the map layer
    mapLayer = world.getObject("map");
    let objects = PIXI.loader.resources["json/objects.json"].data;
    console.log(objects);
    

    
   
   viewport.on('clicked', (data) => {

        var coordsFromIsoPoint = convertIsometricTo2d(data.world);
        var column = getColumn(coordsFromIsoPoint.x);
        var row = getRow(coordsFromIsoPoint.y); 
        var index =  getIndex(coordsFromIsoPoint.x,coordsFromIsoPoint.y);
        // Check boudaries
        if (row >= 0 && column >= 0 && row < world.heightInTiles && column < world.widthInTiles && mapLayer.data[index] === 1) {
            //console.log("row: " + row + ", col: " + column + ", ArrayIndex: " + index + ", gId: " + mapLayer.data[index]);            
            // we make a new container for our tiles
            let container = new PIXI.Container();
            let objectSize  = {
                height:4,
                width:4
            };
            // generate all tiles according to the height and width of the object, this is our "ground"
            for (let y = 0; y < objectSize.height ; y++) {
                for (let x = 0; x < objectSize.width ; x++) {
                    let tile = tu.isoRectangle(world.cartTilewidth, world.cartTileheight, 1, RED, true);
                    tile.x =  (world.cartTileheight*(column+x) - world.cartTilewidth*(row+y));
                    tile.y = ((world.cartTileheight*(column+x) + world.cartTilewidth*(row+y))/2);
                    container.addChild(tile);                
                }
            }
            world.addChild(container);
            //helper rectangle
            let rec = drawRectangle(container.width,container.height,0x0000ff);
            rec.x = (world.cartTileheight*column - world.cartTilewidth*row)- world.cartTilewidth * (objectSize.height-1);
            rec.y = ((world.cartTileheight*column + world.cartTilewidth*row)/2);
            world.addChild(rec);
            
            
            
            
            //let sprite = new PIXI.Sprite(PIXI.loader.resources["assets/R_SS_StoneAge_Residential.png"].texture);
            //let sprite = new PIXI.Sprite(PIXI.loader.resources["assets/L_SS_AllAge_CupBonus1.png"].texture);
            //let sprite = new PIXI.Sprite(PIXI.loader.resources["assets/R_SS_BronzeAge_Residential1.png"].texture);
            let sprite = new PIXI.Sprite(PIXI.loader.resources["assets/P_SS_BronzeAge_DomesticationPen.png"].texture);
            //let sprite = new PIXI.Sprite(PIXI.loader.resources["assets/P_SS_IronAge_Tailor.png"].texture);
            //let sprite = new PIXI.Sprite(PIXI.loader.resources["assets/T_SS_AllAge_Expedition16.png"].texture);
            //let sprite = new PIXI.Sprite(PIXI.loader.resources["assets/R_SS_MultiAge_SummerBonusSetB17b.png"].texture);
            //let sprite = new PIXI.Sprite(PIXI.loader.resources["assets/R_SS_MultiAge_TourBonus17.png"].texture);
            //let sprite = new PIXI.Sprite(PIXI.loader.resources["assets/P_SS_EarlyMiddleAge_Tannery.png"].texture);
            let alignY = container.height-sprite.height;
            let alignX = Math.floor((container.width-sprite.width) / 2) ;
            console.log("container w: " + container.width + ", height: "+ container.height);
            console.log("image w: " + sprite.width + ", height: "+ sprite.height + ", alignX: " +alignX + ", alignY: " + alignY);
            sprite.x = (world.cartTileheight*column - world.cartTilewidth*row)- world.cartTilewidth * (objectSize.height-1)+ alignX;
            sprite.y = ((world.cartTileheight*column + world.cartTilewidth*row)/2) + alignY;
            container.addChild(sprite);
            
            rectangle = new PIXI.Graphics();
            rectangle.lineStyle(1, 0x000000);
            rectangle.moveTo(0, 0);
            rectangle.lineTo(sprite.width, 0);
            rectangle.lineTo(sprite.width, sprite.height);
            rectangle.lineTo(0, sprite.height);
            rectangle.lineTo(0, 0);     
            rec = new PIXI.Sprite(rectangle.generateCanvasTexture());
            sprite.addChild(rec);

            
        }
      
        
    });
    //viewport.on('drag-start', () => console.log("drag-start"));
    //viewport.on('drag-end', () => console.log("drag-end"));

    
    
  
    viewport.addChild(world);
    //download_sprite_as_png(app.renderer,viewport,"world.png")
    //container.addChild(grid);
    
    app.stage.addChild(viewport);

    // start the game loop
    app.ticker.add(delta => gameLoop(delta));

}


function gameLoop(delta) {
   
}

// helper functions
// convert a 2d point to isometric
function convert2dToIsometric(point) {
    return {
        x: point.x - point.y,
        y: (point.x + point.y)/2
    };
}
 
// convert an isometric point to 2D
function convertIsometricTo2d(point)
{
    return {
        x: (2* point.y + point.x)/2,
        y: (2* point.y - point.x)/2
    };
}
