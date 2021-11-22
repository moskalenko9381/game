import {MapManager} from "./MapManager.js";
import {SpriteManager} from "./SpriteManager.js";
import {EventsManager} from "./EventsManager.js";
import {Player} from "../entities/Player.js";
import {Enemy} from "../entities/Enemy.js";
import {Bullet} from "../entities/Bullet.js";
import {SoundManager} from "./SoundManager.js";
import {Bonus} from "../entities/Bonus.js";
import {PhysicManager} from "./PhysicManager.js";

export class GameManager {
    constructor(canvas, context, HPpanelContext, width, height) {
        this.canvas = canvas;
        this.context = context;
        this.HPpanelContext = HPpanelContext;
        this.widthMap = width;
        this.heightMap = height;
        this.objects = [];
        this.player = null;
        this.factory = {}; // фабрика объектов на карте (используются для создания обхектов на карте)
        this.laterKill = [];  // отложенное уничтожение объекта
        this.currentLevel = 1;
        this.countBullet = 0;  // идентификатор выстрела
        this.countEffect = 0;
        this.score = 0;    //  текущий счет
        this.isStartSound = false;

        this.factory['player'] = new Player();
        this.factory['enemy'] = new Enemy();
        this.factory['bullet'] = new Bullet();
        this.factory['bonus'] = new Bonus();

        this.spriteManager = new SpriteManager();
        this.eventsManager = new EventsManager();
        this.soundManager = new SoundManager();
        this.mapManager = new MapManager();
        this.physicManager = new PhysicManager(this, this.soundManager, this.mapManager);

        this.initRecord();
        this.nextLevel();

        this.spriteManager.loadAtlas('./public/sprites/atlas.json', './public/spritesSource/objects.png');
        this.eventsManager.setup(this.canvas);
        this.soundManager.init();

        let sound = document.getElementById('sound');

        if (localStorage["isSoundPlay"] === "no"){
            sound.src = "./public/images/soundOff.png";
        }
        else{
            sound.src = "./public/images/soundOn.png";
            this.isStartSound = !this.isStartSound;
            this.soundManager.loadArray(['./public/sound/background.mp3', './public/sound/bullet.mp3', './public/sound/bonus.mp3', './public/sound/failTailset.mp3', './public/sound/gameOver.mp3', './public/sound/nextLevel.mp3']);
            this.soundManager.play("./public/sound/background.mp3", {looping: true, volume: 0.1});
        }

        sound.addEventListener('click', () => {
            console.log(localStorage["isSoundPlay"])
            if (!this.isStartSound){
                this.isStartSound = !this.isStartSound;
                localStorage["isSoundPlay"] = "yes";
                this.soundManager.loadArray(['./public/sound/background.mp3', './public/sound/bullet.mp3', './public/sound/bonus.mp3', './public/sound/failTailset.mp3', './public/sound/gameOver.mp3', './public/sound/nextLevel.mp3']);
                this.soundManager.play("./public/sound/background.mp3", {looping: true, volume: 0.1});
                sound.src = "./public/images/soundOn.png";
                return;
            }
            if (localStorage["isSoundPlay"] === "yes") {
                sound.src = "./public/images/soundOff.png";
                localStorage["isSoundPlay"] = "no";
            }
            else {
                sound.src = "./public/images/soundOn.png";
                localStorage["isSoundPlay"] = "yes";
            }
            this.soundManager.toggleMute();
        });

        this.drawMap();

        this.updateAll = this.updateAll.bind(this);
        this.recordTable = this.recordTable.bind(this);

        this.intervalGame = setInterval(this.updateAll, 50);
    }



    drawMap() {
        if (!this.mapManager.isAllImgLoad || !this.mapManager.isMapLoad) {
            console.log(this.mapManager)
            setTimeout(() => {
                this.drawMap();
                }, 100);
        } else {
            this.mapManager.draw(this.context);
        }
    }

    parseEntities() {
        if (!this.spriteManager.isImgLoad || !this.spriteManager.isJsonLoad || !this.mapManager.isAllImgLoad || !this.mapManager.isMapLoad) {
            setTimeout(() => { this.parseEntities(); }, 100);
        }
        else {
            let mapJSON = this.mapManager.getMapJson();  // получаем карту
            for (let i = 0; i < mapJSON.layers.length; i++) {
                // проходимся по слоям
                if (mapJSON.layers[i].type === 'objectgroup') {
                    let entities = mapJSON.layers[i];
                    for (let j = 0; j < entities.objects.length; j++) {
                        let element = entities.objects[j];
                        try {
                            let obj = {};
                            // в соответствии с типом
                            let objectType = element.type.split('_');
                            console.log(element.type.split('_'))
                            if (objectType[0] === "enemy1" || objectType[0] === "enemy2")
                                obj = Object.create(this.factory['enemy']);
                            else if (objectType[0] === "coin1" || objectType[0] === "coin2" ||
                                objectType[0] === "coin3" || objectType[0] === "coin4")
                                obj = Object.create(this.factory['bonus']);
                            else
                                obj = Object.create(this.factory[objectType[0]]);

                            if (objectType[0] === 'enemy1' || objectType[0] === 'player' || objectType[0] === 'enemy2') {
                                switch (objectType[1]) {
                                    case 'left':
                                        obj.direction = '_left';
                                        obj.move_x = -1;
                                        break;
                                    case  'right':
                                        obj.direction = '_right';
                                        obj.move_x = 1;
                                        break;
                                    case  'up':
                                        obj.direction = '_up';
                                        obj.move_y = -1;
                                        break;
                                    case  'down':
                                        obj.direction = '_down';
                                        obj.move_y = 1;
                                        break;
                                    default:
                                        return;
                                }
                            }

                            obj.name = element.name;
                            obj.type = objectType[0];
                            obj.pos_x = element.x;
                            obj.pos_y = element.y;
                            obj.size_x = element.width;
                            obj.size_y = element.height;
                            this.objects.push(obj);
                            if (obj.type === 'player')
                                // параметры игрока
                                this.player = obj;
                            console.log('created ' + objectType)
                        } catch (e) {
                            console.log('Error creating object' + element.gid +
                                ', type of ' + element.type + '. Error: ' + e);
                        }
                    }
                }
            }
        }
    }

    draw() {
        for (let i = 0; i < this.objects.length; i++) {
            this.spriteManager.drawSprite(this.context, this.objects[i].type,
                this.objects[i].direction, this.objects[i].pos_x, this.objects[i].pos_y, this.mapManager.view);
        }
    }

    kill(obj) {
        this.laterKill.push(obj);
    }

    drawHP(heath){
        this.HPpanelContext.fillStyle = "green";
        this.HPpanelContext.fillRect(0, 0, heath * 3, 50);
        this.HPpanelContext.fillStyle = "red";
        this.HPpanelContext.fillRect(heath*3, 0, (100-heath)*3, 50);
    }

    fire(obj) {
        if (obj.isReady) {
            let bullet = Object.create(this.factory['bullet']);
            bullet.size_x = obj.size_x;
            bullet.size_y = obj.size_y;
            bullet.name = 'bullet' + (++this.countBullet);  // счетчик выстрелов
            bullet.type = 'bullet';
            switch (obj.direction) {
                case '_left': // влево
                    bullet.pos_x = obj.pos_x - bullet.size_x;
                    bullet.pos_y = obj.pos_y;
                    bullet.move_x = -1;
                    break;
                case '_right': // вправо
                    bullet.pos_x = obj.pos_x + bullet.size_x;
                    bullet.pos_y = obj.pos_y;
                    bullet.move_x = 1;
                    break;
                case '_up': // вверх
                    bullet.pos_x = obj.pos_x;
                    bullet.pos_y = obj.pos_y - bullet.size_y;
                    bullet.move_y = -1;
                    break;
                case '_down': // вниз
                    bullet.pos_x = obj.pos_x;
                    bullet.pos_y = obj.pos_y + bullet.size_y;
                    bullet.move_y = 1;
                    break;
                default: return;
            }
            this.objects.push(bullet);  // в объекты добавляем пулю
            this.soundManager.play("./public/sound/bullet.mp3", {looping: false, volume: 0.1});
            this.spriteManager.drawSprite(this.context, bullet.type, bullet.direction, bullet.pos_x, bullet.pos_y, this.mapManager.view);

            obj.isReady = false;
            setTimeout(() => {obj.isReady = true; }, obj.cooldown)
        }
    }

    updateAll() {
        if (this.player === null || this.player === undefined)
            return;
        // по умолчанию стоим на месте
        this.player.move_x = 0;
        this.player.move_y = 0;
        if (this.eventsManager.action['up']) {this.player.move_y = -1; this.player.direction = '_up';}
        if (this.eventsManager.action['down']) {this.player.move_y = 1; this.player.direction = '_down';}
        if (this.eventsManager.action['left']) {this.player.move_x = -1; this.player.direction = '_left';}
        if (this.eventsManager.action['right']) {this.player.move_x = 1; this.player.direction = '_right';}
        // стреляем
        if (this.eventsManager.action['fire'])
            this.fire(this.player);

        for (let i = 0; i < this.objects.length; i++) {
            try {
                this.physicManager.update(this.objects[i]);
            } catch (e) {
                console.log(e);
            }
        }
        for (let i = 0; i < this.laterKill.length; i++) {     // удаляем убитые объекты
            let index = this.objects.indexOf(this.laterKill[i]);
            if (index > -1)
                this.objects.splice(index, 1);
        }

        if (this.laterKill.length > 0)
            this.laterKill.length = 0;
        this.mapManager.centerAt(this.player.pos_x, this.player.pos_y);
        this.drawMap();

        this.draw();

       /* console.log('OBJECTS:')
        for (let i of this.objects)
            console.log(i) */
    }

    nextLevel() {
        if (this.currentLevel === 1 || this.currentLevel === 2) {
            console.log('level' + this.currentLevel);
            document.getElementById('levelNew').style.visibility = 'visible';
            setTimeout(() => {
                document.getElementById('levelNew').style.visibility = 'hidden';
            }, 3000);
        }
        if (this.currentLevel > 2) {
            document.getElementById("gameOver").innerText = "YOU WON!";
            document.getElementById("gameOverBlock").style.visibility = 'visible';
            setTimeout(() => {
                document.getElementById("gameOverBlock").style.visibility = 'hidden';
            }, 3000)
            setTimeout(this.recordTable, 3000);
            return;
        }

        if (this.currentLevel > 1) {
            this.changeScore(this.score);
        }


        this.objects.length = 0;
        this.mapManager = new MapManager(this.widthMap, this.heightMap);
        this.mapManager.loadMap("./public/maps/level" + this.currentLevel + ".json");
        this.parseEntities();
        this.physicManager = new PhysicManager(this, this.soundManager, this.mapManager);
        document.getElementById('level').innerHTML = "Level: " + this.currentLevel;
    }

    recordTable() {
        for(let i = 1; i < 6; i++) {
            if(localStorage["result" + i] <= this.score) {
                let j = 4;
                while(j+1 !== i) {
                    let temp1 = localStorage["result" + j];
                    let temp2 = localStorage["gamer" + j];
                    localStorage["result" + (j+1)] = temp1;
                    localStorage["gamer" + (j+1)] = temp2;
                    j--;
                }
                localStorage["result" + i] = this.score;
                localStorage["gamer" + i] = localStorage["gamerName"];
                break;
            }
        }

        localStorage["score"] = this.score;
        window.location = "records.html";
    }

    initRecord() {
        if(localStorage["gamer1"] === undefined) {
            localStorage["gamer1"] = "-";
            localStorage["result1"] = 0;
            localStorage["gamer2"] = "-";
            localStorage["result2"] = 0;
            localStorage["gamer3"] = "-";
            localStorage["result3"] = 0;
            localStorage["gamer4"] = "-";
            localStorage["result4"] = 0;
            localStorage["gamer5"] = "-";
            localStorage["result5"] = 0;
        }
    }

    changeScore(value) {
        this.score += value;
        document.getElementById('score').innerHTML = 'Score:' + this.score;
    }

    changeHP(value) {
        this.player.hp = (this.player.hp + value < 0) ? 0 : this.player.hp + value;
        this.player.hp = (this.player.hp > 100) ? 100 : this.player.hp;
        document.getElementById('hp').innerHTML = this.player.hp + '%';
        document.getElementById('coins').innerHTML = 'Coins: ' + this.player.coins + (this.currentLevel === 1 ? '/2' : '/4');
        this.drawHP(this.player.hp);
        if (this.player.hp === 0) {
            clearInterval(this.intervalGame);
            document.getElementById("gameOver").innerText = "YOU LOST :(";
            setTimeout(() => {
                document.getElementById("gameOverBlock").style.visibility = 'visible';
            }, 100)
            setTimeout(() => {
                document.getElementById("gameOverBlock").style.visibility = 'hidden';
            }, 3000)
            setTimeout(this.recordTable, 3000);
        }
    }

    createEffect(x, y){
        let effect = {};
        effect.name = 'effect' + (this.countEffect++);
        effect.type = 'effect';
        effect.pos_x = x;
        effect.pos_y = y;
        effect.size_x = 32;
        effect.size_y = 32;
        this.objects.push(effect);
        setTimeout(() => {
            this.kill(effect)
        }, 120);
    }
}
