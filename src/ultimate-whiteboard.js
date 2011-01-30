var canvas = $('#canvas')
var players = $('.player')
var canvasDom = canvas.get(0)
var ctx = $.extend(canvasDom.getContext("2d"), {strokeStyle: "rgba(0, 0, 200, 1.0)", lineWidth: 5,lineCap: "round"})

var mouseDown = canvas.toObservable('mousedown')
var touchStart = canvas.toObservable('touchstart').Where(notPinch)

var pencilDown = mouseDown.Merge(touchStart)
var mouseMove = $(document).toObservable('mousemove')
var touchMove = $(document).toObservable('touchmove').Where(notPinch)

var move = mouseMove.Merge(touchMove)
move.Subscribe(preventDefault)
var mouseUp = $(document).toObservable('mouseup touchend')
var playerMoveStart = $('.player').toObservable('mousedown touchstart')
var pencilMoves = move.Select(getEvent).Select(point).SkipUntil(pencilDown).TakeUntil(mouseUp)
var curve = pencilMoves.Zip(pencilMoves.Skip(1), function(prev, cur) {
  return [prev, cur, ctx]
})

curve.Repeat().Subscribe(function(line) {
  drawLine.apply(null, line)
})


var playerMoves = move.Select(getEvent).Select(point).SkipUntil(playerMoveStart).TakeUntil(mouseUp)
var playerPos = playerMoves.Zip(playerMoves.Skip(1), function(prev, cur) {
  //TODO cur.target voi osua divin ulkopuolelle. pitää olla combine latest tai vastaava
  //TODO pelaajan siirto ei toimi ipadilla
  return [prev,cur]
})

var combined = playerMoveStart.CombineLatest(playerPos.Repeat(), function(start,pos) {
  return [start.target, pos]
})
combined.Subscribe(function(pos) {
  movePlayer($(pos[0]),pos[1][0],pos[1][1])
})

var clear = $('#clear').toObservable('click')
clear.Subscribe(function() {
  ctx.beginPath()
  ctx.clearRect(0, 0, 400, 500)
  ctx.closePath()
})

function movePlayer(player,oldMouse, newMouse) {
  var deltaX = newMouse[0] - oldMouse[0]
  var deltaY = newMouse[1] - oldMouse[1]
  player.moveRelatively([deltaX,deltaY])
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
  return evt.originalEvent.touches
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
players.each(function(i) {$(this).moveRelatively([50*i,100])})

