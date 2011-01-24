var canvas = $('#canvas')
var players = $('.player')
var canvasDom = canvas.get(0);
var ctx = canvasDom.getContext("2d");

ctx.strokeStyle = "rgba(0, 0, 200, 1.0)";
ctx.lineWidth = 5
var player
var penDown = false
var playerDown = false
var oldMouse = []
var counter = 3

$('#canvas').bind('mousedown touchstart', onDrawStart)
$('#canvas, .player')
  .bind('mousemove touchmove', onMouseMove)
  .bind('mouseup touchend', function() {
  penDown = false
  playerDown = false
})

players.bind('mousedown touchstart', function(evt) {
  var e = getEvent(evt)
  playerDown = true
  oldMouse = point(e)
  player = $(this)
  preventDefault(evt)
  return false
})

$('#clear').click(function() {
  ctx.beginPath();
  ctx.clearRect(0, 0, 300, 300);
  ctx.closePath();

  /*canvasDom.width = canvasDom.width + (flip *= -1)
   ctx = canvas.get(0).getContext("2d");
   ctx.strokeStyle = "rgba(0, 0, 200, 0.5)";
   ctx.lineWidth = 3
   */
})
var flip = 1

function onDrawStart(evt) {
  if (isPinch(evt))
    return true
  var e = getEvent(evt)
  penDown = true
  ctx.moveTo(e.clientX, e.clientY)
  preventDefault(evt)
  return false
}
function onMouseMove(evt) {
  if (isPinch(evt))
    return true
  counter--
  if (counter > 0) {
    return false
  }
  counter = 3
  var e = getEvent(evt)
  var newMouse = point(e)

  var deltaX = newMouse[0] - oldMouse[0]
  var deltaY = newMouse[1] - oldMouse[1]
  if (playerDown) {
    player.moveRelatively([deltaX,deltaY])
  } else if (penDown) {
    ctx.beginPath();
    ctx.lineCap = "round";
    ctx.moveTo.apply(ctx, oldMouse)
    ctx.lineTo.apply(ctx, newMouse)
    ctx.stroke();
    ctx.closePath();
  }
  oldMouse = newMouse
  preventDefault(evt)
  return false
}

function point(e) {
  return [e.clientX,e.clientY]
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
function preventDefault(evt) {
  if (evt.stopPropagation) evt.stopPropagation()
  else evt.preventDefault()
}

function log(msg) {
  $('#log').prepend(msg + '\n')
}

$.fn.moveRelatively = function(pos) {
  var deltaX = pos[0]
  var deltaY = pos[1]
  var oldX = parseInt(this.css('left'), 10)
  var oldY = parseInt(this.css('top'), 10)
  var css = {left:(oldX + deltaX) + 'px',top:(oldY + deltaY) + 'px'};
  this.css(css)
  return this
}
players.moveRelatively([100,100])

