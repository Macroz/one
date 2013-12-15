'use strict';

var app = angular.module('oneApp');

app.factory('GameScene', function(Common) {
    var scene = {};

    function draw() {
        var canvas = $('canvas');
        if (canvas.length > 0) {
            var ctx = canvas[0].getContext("2d");
            if (ctx && scene) {
                var t = scene.tick;
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas[0].width, canvas[0].height);

                ctx.font = "32px Georgia";
                ctx.fillStyle = '#e5e5e5';
                ctx.fillText((scene.level + 1), 20, 20);

                for (var i = 0 ;i < scene.objects.length; ++i) {
                    var object = scene.objects[i];
                    object.draw(ctx);
                }
            }
        }
    }

    function resize() {
        Common.resize(scene);
    }

    function addBlock(gx, gy) {
        var size = 1024 / (scene.size * 2 + 1) / 1.2;
        var block = {};
        block.gx = gx;
        block.gy = gy;
        block.x = gx * size * 1.2;
        block.y = gy * size * 1.2;
        block.width = size;
        block.height = size;
        block.accessible = function(x, y) {
            if (x == gx - 1 && y == gy) return true;
            if (x == gx + 1 && y == gy) return true;
            if (x == gx && y == gy - 1) return true;
            if (x == gx && y == gy + 1) return true;
            return false;
        }
        block.draw = function(ctx) {
            if (block.visible) {
                ctx.fillStyle = '#e5e5e5';
                if (block.expanded) {
                    //ctx.fillStyle = '#1ea6e6';
                    ctx.fillStyle = '#ffffff';
                    if (block.onesmell) {
                        //ctx.fillStyle = '#e5e544';
                        if (scene.win) {
                            ctx.fillStyle = '#c0e5c0';
                        } else {
                            ctx.fillStyle = '#e5c0c0';
                        }
                    } else if (block.othersmell) {
                        ctx.fillStyle = '#a6b6e6';
                    }
                    if (block.one) {
                        ctx.fillStyle = '#e54444';
                        if (block.chosen) {
                            ctx.fillStyle = '#44e544';
                        }
                    }
                    if (block.other) {
                        ctx.fillStyle = '#4444e6';
                    }
                }

                var dt = scene.choosing ? (scene.tick - scene.choosing.tick) * 0.5 : 0;
                var s = block.choosing ? (1 + 0.1 * Math.sin(dt)) : 1;
                var x = scene.x + scene.width * 0.5 + (block.x - s * block.width * 0.5) / 1024 *  scene.width;
                var y = scene.y + scene.height * 0.5 + (block.y - s * block.height * 0.5) / 1024 * scene.height;
                var w = s * block.width / 1024 * scene.width;
                var h =  s * block.height / 1024 * scene.height;
                var r =  s * block.width / 10;
                Common.roundRect(ctx, x, y, w, h, r);
                ctx.fill();
            }
        }
        block.choose = function () {
            if (block.one) {
                block.expanded = true;
                block.chosen = true;
                win();
            } else {
                miss();
            }
        }
        block.expand = function() {
            if (block.visible && !block.expanded) {
                block.expanded = true;
                playSound('expand');
                if (block.one) {
                    fail();
                    return;
                } else if (block.other) {
                    setback();
                    return;
                }
                var gx = block.gx;
                var gy = block.gy;
                forRange(gx, gy, 1, function (block) {
                    if (block.gx != gx || block.gy != gy) {
                        block.visible = true;
                    }
                });
            }
        }
        block.contains = function(x, y) {
            return x > block.x - block.width * 0.5 &&
                x < block.x + block.width * 0.5 &&
                y > block.y - block.height * 0.5 &&
                y < block.y + block.height * 0.5;
        }
        block.click = function() {
            block.expand();
        }
        scene.objects.push(block);
        return block;
    };

    function forRange(gx, gy, r, fn) {
        for (var y = -r; y <= r; ++y) {
            for (var x = -r; x <= r; ++x) {
                var bx = gx + x;
                var by = gy + y;
                if (bx >= -scene.size && bx <= scene.size && by >= -scene.size && by <= scene.size) {
                    fn(scene.grid[bx + '_' + by]);
                }
            }
        }
    }

    function win() {
        scene.interactive = false;
        delete scene.choosing.block.choosing;
        scene.win = true;
        playSound('win');
        setTimeout(function() {
            ++scene.level;
            setup();
        }, 2000);
    }

    function miss() {
        scene.interactive = false;
        playSound('miss');
        setTimeout(function() {
            if (scene.level > 1) {
                --scene.level;
            } else if (scene.level < 0) {
                scene.level = 0;
            }
            setup();
        }, 2000);
    }

    function setback() {
        scene.interactive = false;
        playSound('other');
        setTimeout(function() {
            setup();
        }, 2000);
    }

    function fail() {
        scene.interactive = false;
        playSound('fail');
        setTimeout(function() {
            if (scene.level > 1) {
                --scene.level;
            } else if (scene.level < 0) {
                scene.level = 0;
            }
            setup();
        }, 2000);
    }

    function setup() {
        scene.tick = 0;
        scene.objects = [];
        scene.grid = {};
        scene.size = scene.level;
        scene.win = false;
        scene.interactive = true;
        delete scene.choosing;
        scene.block = function (x, y) {
            if (x >= -scene.size && x <= scene.size && y >= -scene.size && y <= scene.size) {
                return scene.grid[x + '_' + y];
            }
        }
        for (var y = -scene.size; y <= scene.size; ++y) {
            for (var x = -scene.size; x <= scene.size; ++x) {
                var block = addBlock(x, y);
                scene.grid[x + '_' + y] = block;
                if (x == 0 && y == 0) {
                    block.visible = true;
                }
            }
        }
        var one = false;
        while (!one) {
            var x = Math.round(Math.random() * (2 * scene.size)) - scene.size;
            var y = Math.round(Math.random() * (2 * scene.size)) - scene.size;
            if ((x != 0 || y != 0) || scene.level == 0) {
                one = true;
                var block = scene.block(x, y);
                block.one = true;
                forRange(x, y, 1, function(block) { block.onesmell = true; });
            }
        }
        var others = []
        while (others.length < Math.floor((scene.level - 2) / 2) && scene.level > 3) {
            var x = Math.round(Math.random() * (2 * scene.size)) - scene.size;
            var y = Math.round(Math.random() * (2 * scene.size)) - scene.size;
            if ((x != 0 || y != 0) && !scene.block(x, y).one) {
                var block = scene.block(x, y);
                block.other = true;
                forRange(x, y, 2, function(block) { block.othersmell = true; });
                others.push(block);
            }
        }
        if (others.length > 0) {
            $('.others').show();
        } else {
            $('.others').hide();
        }
    }

    function loadSound(path) {
        var a = new Audio(path);
        a.volume = 0.1;
        return a;
    }

    function reset(level) {
        scene = {};
        scene.level = level || 0;
        scene.sounds = {};
        scene.sounds.expand = loadSound('/sounds/expand.wav');
        scene.sounds.choose = loadSound('/sounds/choose.wav');
        scene.sounds.fail = loadSound('/sounds/fail.wav');
        scene.sounds.miss = loadSound('/sounds/miss.wav');
        scene.sounds.win = loadSound('/sounds/win.wav');
        scene.sounds.other = loadSound('/sounds/other.wav');

        setup();
        $(window).resize(resize);
    }

    function simulate() {
        scene.tick++;
        draw();
        var t = Math.round(scene.tick / 12) % 10;
        $('.one').removeClass('red').removeClass('green');
        if (t == 7) {
            $('.one').addClass('red');
        } else if (t == 8) {
            $('.one').addClass('green');
        }
        if (scene.mousedown) {
            if (scene.tick - scene.mousedown.tick >= 25) {
                var block = scene.mousedown.block;
                if (block && !scene.choosing) {
                    scene.choosing = {block: block, tick: scene.tick};
                    block.choosing = true;
                }
                playSound('choose');
            }
        }
    }

    function activate() {
        scene.simulation = setInterval(simulate, 20);
    }

    function passivate() {
        if (scene.simulation) {
            clearInterval(scene.simulation);
        }
    }

    function playSound(id) {
        scene.sounds[id].play();
    }

    function mousedown(e) {
        if (scene.interactive) {
            var parentOffset = $(this).offset();
            var x = e.pageX - parentOffset.left;
            var y = e.pageY - parentOffset.top;

            var wx = (x - scene.x) / scene.width * 1024 - 512;
            var wy = (y - scene.y) / scene.height * 1024 - 512;

            var block = findObject(wx, wy);

            if (block) {
                scene.mousedown = {};
                scene.mousedown.tick = scene.tick;
                scene.mousedown.x = wx;
                scene.mousedown.y = wy;
                scene.mousedown.block = block;
            }
        }
    }

    function mouseup(e) {
        if (scene.interactive) {
            if (scene.mousedown) {
                var block = findObject(scene.mousedown.x, scene.mousedown.y);
                if (block) {
                    if (scene.tick - scene.mousedown.tick < 25) {
                        block.click();
                    } else {
                        block.choose();
                    }
                    delete scene.mousedown;
                }
            }
        }
    }

    function findObject(wx, wy) {
        for (var i = 0; i < scene.objects.length; ++i) {
            var object = scene.objects[i];
            if (object.visible && object.contains(wx, wy)) {
                return object;
            }
        }
    }

    function click(e) {
    }

    var service = {};
    service.resize = resize;
    service.reset = reset;
    service.draw = draw;
    service.activate = activate;
    service.passivate = passivate;
    service.simulate = simulate;
    service.click = click;
    service.mousedown = mousedown;
    service.mouseup = mouseup;
    scene.win = win;
    scene.fail = fail;
    scene.setup = setup;
    return service;
});

app.controller('MainCtrl', function ($scope, $routeParams, GameScene) {
    GameScene.reset($routeParams.level);
    GameScene.resize();
    GameScene.activate();
    $scope.$on("$destroy", GameScene.passivate);
    $('canvas').mousedown(GameScene.mousedown);
    $('canvas').mouseup(GameScene.mouseup);
});
