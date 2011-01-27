var canvas = $('#canvas')
var players = $('.player')
var canvasDom = canvas.get(0)
var ctx = canvasDom.getContext("2d")

ctx.strokeStyle = "rgba(0, 0, 200, 1.0)"
ctx.lineWidth = 5
var player
var penDown = false
var playerDown = false
var oldMouse = []

var mouseDown = canvas.toObservable('mousedown touchstart')
mouseDown.Subscribe(onDrawStart)

var mouseMove = $('#canvas, .player').toObservable('mousemove touchmove')
mouseMove.Subscribe(onMouseMove)
var mouseUp = $('#canvas, .player').toObservable('mouseup touchend')
mouseUp.Subscribe(function() {
  penDown = false
  playerDown = false
})

players.bind('mousedown touchstart', function(evt) {
  var e = getEvent(evt)
  playerDown = true
  oldMouse = point(e)
  player = $(this)
  evt.preventDefault()
  return false
})

var clear = $('#clear').toObservable('click')

clear.Subscribe(function() {
  ctx.beginPath()
  ctx.clearRect(0, 0, 400, 500)
  ctx.closePath()
})
var flip = 1

function onDrawStart(evt) {
  if (isPinch(evt))
    return true
  var e = getEvent(evt)
  penDown = true
  oldMouse = point(e)
  ctx.moveTo.apply(ctx, oldMouse)
  evt.preventDefault()
  return false
}
function onMouseMove(evt) {
  if (isPinch(evt))
    return true
  var e = getEvent(evt)
  var newMouse = point(e)

  if (playerDown) {
    var deltaX = newMouse[0] - oldMouse[0]
    var deltaY = newMouse[1] - oldMouse[1]
    player.moveRelatively([deltaX,deltaY])
  } else if (penDown) {
    ctx.beginPath()
    ctx.lineCap = "round";
    ctx.moveTo.apply(ctx, oldMouse)
    ctx.lineTo.apply(ctx, newMouse)
    ctx.stroke()
    ctx.closePath()
  }
  oldMouse = newMouse
  evt.preventDefault()
  return false
}

function point(e) {
  return [e.clientX,e.clientY]
  /*
   if (e.layerX) return [e.layerX, e.layerY]
   if (e.offsetX) return [e.offsetX, e.offsetY]
   return [e.pageX - canvasDom.offsetLeft, e.pageY - canvasDom.offsetTop]
   */
}

function isPinch(evt) {
  return ipadEvent(evt) && evt.originalEvent.touches.length > 1
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
function log(msg) {
  $('#log').prepend(msg + '\n')
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

