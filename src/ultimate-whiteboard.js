var canvas = $('#canvas')
var players = $('.player')
var canvasDom = canvas.get(0)
var ctx = $.extend(canvasDom.getContext("2d"), {strokeStyle: "rgba(0, 0, 200, 1.0)", lineWidth: 5})

var player
var penDown = false
var playerDown = false
var oldMouse = []

var mouseDown = canvas.toObservable('mousedown')
var touchStart = canvas.toObservable('touchstart').Where(notPinch)
mouseDown.Merge(touchStart).Subscribe(onDrawStart)

var mouseMove = $('#canvas, .player').toObservable('mousemove')
var touchMove = $('#canvas, .player').toObservable('touchmove').Where(notPinch)
var move = mouseMove.Merge(touchMove)
move.Select(getEvent).Subscribe(onMouseMove)
move.Subscribe(preventDefault)
var mouseUp = $('#canvas, .player').toObservable('mouseup touchend')
mouseUp.Subscribe(function() {
  penDown = false
  playerDown = false
})
var playerMoveStart = $('.player').toObservable('mousedown touchstart')
playerMoveStart.Subscribe(function(e) {
  playerDown = true
  oldMouse = point(e)
  player = $(e.target)
})

var clear = $('#clear').toObservable('click')
clear.Subscribe(function() {
  ctx.beginPath()
  ctx.clearRect(0, 0, 400, 500)
  ctx.closePath()
})

function onDrawStart(e) {
  penDown = true
  oldMouse = point(e)
}
function onMouseMove(e) {
  var newMouse = point(e)

  if (playerDown) {
    var deltaX = newMouse[0] - oldMouse[0]
    var deltaY = newMouse[1] - oldMouse[1]
    player.moveRelatively([deltaX,deltaY])
  } else if (penDown) {
    drawLine(oldMouse, newMouse, ctx)
  }
  oldMouse = newMouse
}

function point(e) {
  return [e.clientX,e.clientY]
  /*
   if (e.layerX) return [e.layerX, e.layerY]
   if (e.offsetX) return [e.offsetX, e.offsetY]
   return [e.pageX - canvasDom.offsetLeft, e.pageY - canvasDom.offsetTop]
   */
}

function notPinch(evt) {
  return evt.originalEvent.touches.length == 1
}
function ipadEvent(evt) {
  return evt && evt.originalEvent && evt.originalEvent.touches && evt.originalEvent.touches[0];
}
function getEvent(evt) {
  if (ipadEvent(evt)) {
    return evt.originalEvent.touches[0]
  } else {
    return evt
  }
}
function preventDefault(e) {
  e.preventDefault()
}
function drawLine(start, end, ctx) {
  ctx.beginPath()
  ctx.lineCap = "round";
  ctx.moveTo.apply(ctx, start)
  ctx.lineTo.apply(ctx, end)
  ctx.stroke()
  ctx.closePath()
}
$.fn.moveRelatively = function(pos) {
  var deltaX = pos[0]
  var deltaY = pos[1]
  var oldX = parseInt(this.css('left'), 10)
  var oldY = parseInt(this.css('top'), 10)
  var css = {left:(oldX + deltaX) + 'px',top:(oldY + deltaY) + 'px'}
  this.css(css)
  return this
}
players.moveRelatively([100,100])

