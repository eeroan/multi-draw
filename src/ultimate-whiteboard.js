var canvas = $('#canvas')
var players = $('.player')
var canvasDom = canvas.get(0)
var ctx = $.extend(canvasDom.getContext("2d"), {strokeStyle: "rgba(0, 0, 200, 1.0)", lineWidth: 5,lineCap: "round"})

var pencilDown = startOn(canvas)
var mouseMove = $(document).toObservable('mousemove')
var touchMove = $(document).toObservable('touchmove').Where(notPinch)
mouseMove.Merge(touchMove).Subscribe(preventDefault)

var playerMoveStart = startOn(players).Select(targetElement)
movesAfter(pencilDown).Repeat().Subscribe(drawLine)
playerMoveStart.CombineLatest(movesAfter(playerMoveStart).Repeat(), argumentList).Subscribe(movePlayer)

var clear = $('#clear').toObservable('click')
clear.Subscribe(function() {
  ctx.beginPath()
  ctx.clearRect(0, 0, 400, 500)
  ctx.closePath()
})

function movesAfter(startEvent) {
  var mouseUp = $(document).toObservable('mouseup touchend')
  var move = mouseMove.Merge(touchMove.Select(touchEvent)).Select(point)
  return delta(move.SkipUntil(startEvent).TakeUntil(mouseUp))
}
function delta(moves) {
  return moves.Zip(moves.Skip(1), argumentList)

}
function startOn(container) {
  var mouseDown = container.toObservable('mousedown')
  var touchStart = container.toObservable('touchstart').Where(notPinch)
  return mouseDown.Merge(touchStart)

}
function notPinch(evt) {
  return evt.originalEvent.touches.length == 1
}
function touchEvent(evt) {
  return evt.originalEvent.touches[0]
}
function preventDefault(e) {
  e.preventDefault()
}

function targetElement(e) {
  return $(e.target)
}

function drawLine(line) {
  ctx.beginPath()
  ctx.moveTo.apply(ctx, line[0])
  ctx.lineTo.apply(ctx, line[1])
  ctx.stroke()
  ctx.closePath()
}

function movePlayer(playerAndDelta) {
  var player = playerAndDelta[0]
  var delta = playerAndDelta[1]
  var oldMouse = delta[0]
  var newMouse = delta[1]
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

function argumentList() {
  return arguments
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
players.each(function(i) {
  $(this).moveRelatively([50 * i,100])
})
