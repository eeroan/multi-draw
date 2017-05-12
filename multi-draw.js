$.fn.onAsObservable = function (events, selector) {
  var subject = new Rx.Subject()
  this.on(events, selector, function (e) { subject.onNext(e) })
  return subject
}
window.isTouch = (('ontouchstart' in window) || ('onmsgesturechange' in window) || (navigator.msMaxTouchPoints > 0))
var colors = [
  'a52020',
  'ff00ff',
  '00ffff',
  'ffff00',
  '0000ff',
  'ff0000',
  '00ff00',
  '000000',
  'eeeeee',
  '00008b',
  '006400',
  'ff8c00',
  '9932cc',
  '808080',
  '2e8b57',
  'ccccff'
].map(function (colorInHex) {return '#' + colorInHex})

var penStyle = { strokeStyle: "rgba(100, 100, 200, 1.0)", lineWidth: 5, lineCap: "round" }
var $window = $(window)
$window.bind('orientationchange', preventDefault)

var $canvas = $('#canvas')
var canvasNode = $canvas.get(0)
canvasNode.width = window.innerWidth
canvasNode.height = window.innerHeight
var drawingContext = $.extend(canvasNode.getContext("2d"), penStyle)

var index = 0
var containsDrawing = false
var clearButton = $('#clear')
clearButton.onAsObservable('touchmove').subscribe(preventDefault)
var startEvents = isTouch ? 'touchstart' : 'mousedown'
var clearClick = clearButton.onAsObservable(startEvents).doAction(preventDefault)
clearClick.subscribe(repaint)
var shake = $window.onAsObservable('shake')
shake.subscribe(repaint)
$('body').append(palette(colors))
var colorChange = $('#palette').onAsObservable(startEvents, '.color')
  .doAction(preventDefault)
  .select(function (e) {return $(e.currentTarget)})
var selectedColor = null
colorChange.subscribe(function (obj) {
  obj.siblings().removeClass('selected')
  obj.addClass('selected')
  var color = obj.data('color')
  selectedColor = color == '#ffffff' ? null : color
})
var defaultBrushSize = 10
var currentBrushSize = defaultBrushSize
generateBrushes()


if(isTouch) initTouchVersion()
else initBrowserVersion()
gallery.restoreThumbnails()
$('#galleryLink').click(gallery.init)

$.get('main.manifest', function(data) {
  var version = data.split('\n').filter(function(row) {return row.indexOf('#')==0})[0].substring(1).trim()
  $('.version').html(version)
})

function updateCurrentBrushSize(size) { currentBrushSize = +size }

function setBrushSize(elem, size) {
  var radius = +size/15+1
  elem.css({
    width: radius+'vh',
    height: radius+'vh',
    marginBottom: (-radius / 2 + 1)+'vh'
  })
}

function generateBrushes() {
  var $brush = $('#brush')
  var map = [1, 10, 20, 30, 40].map(brush)

  function brush(value) {
    var $div = $('<div>')
    setBrushSize($div, value)

    return $div.addClass('brushSample').toggleClass('selected', value === defaultBrushSize).data('value', value)
  }

  $.fn.append.apply($brush, map)
  var brushSizeChangeElem = $brush.onAsObservable(startEvents, '.brushSample')
    .doAction(preventDefault)
    .select(function (e) {return $(e.currentTarget)})
  brushSizeChangeElem.subscribe(function (elem) {
    elem.siblings().removeClass('selected')
    elem.addClass('selected')
  })
  brushSizeChangeElem.select(function (elem) { return elem.data('value')}).subscribe(updateCurrentBrushSize)
}

function initTouchVersion() {
  var touchStart = $canvas.onAsObservable('touchstart')
  var touchMove = $(document).onAsObservable('touchmove')
  var touchEnd = $(document).onAsObservable('touchend')
  var path = touchStart
    .select(movedTouches)
    .selectMany(function (movedTouches) { return Rx.Observable.fromArray(movedTouches) })
    .selectMany(function (movedTouch) {
      var currentPos = coordinates(movedTouch)
      var colorIndex = index++
      setColor(colorIndex)
      drawPath([currentPos, {pageX: currentPos.pageX + 1, pageY: currentPos.pageY + 1}, colorModulo(colorIndex)])
      return touchMove
        .doAction(preventDefault)
        .select(function (e) {return e.originalEvent.touches})
        .select(function (touches) { return  findByIdentifier(touches, true)[0] || null })
        .where(function (touch) { return touch !== null })
        .takeUntil(touchEnd.select(movedTouches).where(function (touches) { return findByIdentifier(touches).length > 0 }))
        .select(function (e) {
          var previousPos = $.extend({}, currentPos)
          currentPos = coordinates(e)
          return [previousPos, currentPos, colorModulo(colorIndex)]
        })
        .where(hasChanged)
      function findByIdentifier(touches) { return $.grep(touches, function (touch) { return touch.identifier == movedTouch.identifier}) }
    })
  path.subscribe(drawPath)
}

function setColor(colorIndex) {
  drawingContext.strokeStyle = hex2rgb(selectedColor || colorModulo(colorIndex), 1)
}
function initBrowserVersion() {
  var mouseDown = $canvas.onAsObservable('mousedown')
  var mouseMove = $canvas.onAsObservable('mousemove')
  var mouseUp = $canvas.onAsObservable('mouseup')
  var mouseDraw = mouseDown.selectMany(function (e) {
    var colorIndex = index++
    var currentPos = coordinates(e)
    setColor(colorIndex)
    drawPath([coordinates(e), coordinates(e), colorModulo(colorIndex)])
    return mouseMove
      .doAction(preventDefault)
      .takeUntil(mouseUp)
      .select(function (e) {
        var previousPos = $.extend({}, currentPos)
        currentPos = coordinates(e)
        return [previousPos, currentPos, colorModulo(colorIndex)]
      })
  })
  mouseDraw.subscribe(drawPath)
}

function colorModulo(colorIndex) { return colors[colorIndex % colors.length] }

function hasChanged(line) {return line[0].pageX != line[1].pageX || line[0].pageY != line[1].pageY}

function coordinates(e) { return {pageX: e.pageX, pageY: e.pageY, timeStamp: new Date().getTime() } }

function movedTouches(e) {return e.originalEvent.changedTouches}

function preventDefault(e) { e.preventDefault() }

function drawPath(lineAndColor) {
  containsDrawing = true
  var deltaX = lineAndColor[1].pageX - lineAndColor[0].pageX
  var deltaY = lineAndColor[1].pageY - lineAndColor[0].pageY
  var color = lineAndColor[2]
  var time = lineAndColor[1].timeStamp - lineAndColor[0].timeStamp
  var length = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  var equation = +(time / length * 5 + 2) + currentBrushSize - 10
  if(equation > currentBrushSize) equation = currentBrushSize
  var opacity = 1
  with(drawingContext) {
//    lineWidth = parseInt(equation + currentBrushSize - 5,10) || 20
    lineWidth = equation

    beginPath()
    moveTo(lineAndColor[0].pageX, lineAndColor[0].pageY)
    lineTo(lineAndColor[1].pageX, lineAndColor[1].pageY)
    stroke()
    closePath()
  }
}

function repaint() {
  if(containsDrawing) {
    gallery.saveImage()
    with(drawingContext) {
      save()
      setTransform(1, 0, 0, 1, 0, 0)
      clearRect(0, 0, canvasNode.width, canvasNode.height)
      restore()
    }
    containsDrawing = false
  }
}

function palette(colors) {
  var $palette = $('<div id="palette">')
  return $palette.append(button('#ffffff').text('?').addClass('selected'))
    .append.apply($palette, colors.map(button))

  function button(color) { return $('<button class="color" data-color="' + color + '" style="background:' + color + '"></button>') }
}

function hex2rgb(hex, opacity) {
  var hexes = hex.replace('#', '').match(/(.{2})/g)
  var rgb = hexes.map(function (x) {return parseInt(x, 16)}).join(', ')
  return typeof opacity == 'undefined' || opacity === 1 ? 'rgb(' + rgb + ')' : 'rgba(' + rgb + ', ' + opacity + ')'
}
