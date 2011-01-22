var canvas = $('#canvas')
var ctx = canvas.get(0).getContext("2d");
ctx.strokeStyle = "rgba(0, 0, 200, 0.5)";
ctx.lineWidth = 3
var player
var down = false
var playerDown = false
var oldMouse = []

function log(msg) {
  $('#log').prepend(msg + '\n')
}
$('#canvas').bind('mousedown touchstart', function(evt) {
  if (isPinch(evt))
    return true
  var e = getEvent(evt)
  down = true
  ctx.moveTo(e.clientX, e.clientY)
  preventDefault(evt)
  return false
})
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
$('#canvas, .player').bind('mousemove touchmove', function(evt) {
  if (isPinch(evt))
    return true
  var e = getEvent(evt)
  if (playerDown) {
    var newMouse = point(e)
    var deltaX = newMouse[0] - oldMouse[0]
    var deltaY = newMouse[1] - oldMouse[1]
    //log('player move'+deltaX+','+deltaY)
    oldMouse = newMouse
    player.moveRelatively([deltaX,deltaY])
  } else if (down) {
    ctx.lineTo(e.clientX, e.clientY)
    ctx.stroke()
  }
  preventDefault(evt)
  return false
})
$('#canvas').bind('mouseup touchend', function(evt) {
  var e = getEvent(evt)
  ctx.stroke()
  down = false
  playerDown = false
})

$('.player').bind('mousedown touchstart', function(evt) {
  var e = getEvent(evt)
  playerDown = true
  oldMouse = point(e)
  player = $(this)
  preventDefault(evt)
  return false
})

function point(e) {
  return [e.clientX,e.clientY]
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
$('.player').bind('mouseup touchend', function(evt) {
  var e = getEvent(evt)
  playerDown = false
})

function preventDefault(evt) {
  if (evt.stopPropagation) evt.stopPropagation()
  else evt.preventDefault()
}
$('#clear').click(function() {
  canvas.get(0).width=canvas.get(0).width+(flip*=-1)
  ctx = canvas.get(0).getContext("2d");
  ctx.strokeStyle = "rgba(0, 0, 200, 0.5)";
  ctx.lineWidth = 3

})
$('.player').moveRelatively([100,100])
var flip = 1