'use strict';

var app = angular.module('oneApp');

app.factory('Common', function() {
    var service = {}

    function reset() {
    }

    function resize(scene) {
        if (scene) {
            var canvas = {};
            canvas.width = $(".canvas").width();
            canvas.height = $(".canvas").height();
            canvas.ratio = canvas.width / canvas.height;

            var area = {}
            area.width = 1024;
            area.height = 1024;
            area.ratio = area.width / area.height;

            console.log(canvas.width + 'x' + canvas.height);

            var w1 = canvas.width;
            var w2 = canvas.height * area.ratio;
            var h1 = canvas.width / area.ratio;
            var h2 = canvas.height;

            var width;
            var height;

            if (area.ratio > canvas.ratio) {
                width = w1;
                height = h1;
            } else {
                width = w2;
                height = h2;
            }

            scene.width = width;
            scene.height = height;
            scene.x = (canvas.width - scene.width) * 0.5;
            scene.y = (canvas.height - scene.height) * 0.5;

            $('canvas').width(canvas.width);
            $('canvas').height(canvas.height);
            $('canvas').attr('width', canvas.width);
            $('canvas').attr('height', canvas.height);
        }
    }

    function roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(- 0.5 * width, - 0.5 * height);
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    service.reset = reset;
    service.resize = resize;
    service.roundRect = roundRect;

    return service;
});
