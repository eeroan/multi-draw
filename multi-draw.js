var colors = $.map([
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
], function (colorInHex) {return '#' + colorInHex})

var width = 768
var height = 1024
var penStyle = {strokeStyle: "rgba(100, 100, 200, 1.0)", lineWidth: 5, lineCap: "round"}
var $window = $(window)
$window.bind('orientationchange', preventDefault)

var $canvas = $('#canvas')
var canvasNode = $canvas.get(0)
var drawingContext = $.extend(canvasNode.getContext("2d"), penStyle)

var index = 0
var containsDrawing = false
var clearButton = $('#clear')
clearButton.onAsObservable('touchmove').subscribe(preventDefault)
var startEvents = 'click touchstart mousedown'
var clearClick = clearButton
  .onAsObservable(startEvents)
  .doAction(preventDefault)
var shake = $window.onAsObservable('shake')
clearClick.subscribe(repaint)
shake.subscribe(repaint)
$('body').append(palette(colors))
var changeColor = $('#palette').onAsObservable(startEvents, '.color')
  .doAction(preventDefault)
  .select(function (e) {return $(e.currentTarget)})
var selectedColor = null
changeColor.subscribe(function (obj) {
  obj.siblings().removeClass('selected')
  obj.addClass('selected')
  var color = obj.data('color')
  selectedColor = color == '#ffffff' ? null : color
})
var defaultSize = 10
generateBrushes()
var currentBrushSize
updateCurrentBrushSize(defaultSize)

function updateCurrentBrushSize(size) {
  currentBrushSize = +size
}

function setBrushSize(elem, size) {
  var radius = +size + 10
  elem.css({
    width       : radius,
    height      : radius,
    marginBottom: -radius / 2 + 10
  })
}
initBrowserVersion()
initTouchVersion()
restoreThumbnails()
$('#galleryLink').click(initGallery)

function generateBrushes() {
  var $brush = $('#brush')
  var map = $.map([1, 10, 20, 30, 40], brush)

  function brush(value) {
    var $div = $('<div>')
    setBrushSize($div, value)

    return $div.addClass('brushSample').toggleClass('selected', value === defaultSize).data('value', value)
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
    saveImage()
    with(drawingContext) {
      save()
      setTransform(1, 0, 0, 1, 0, 0)
      clearRect(0, 0, canvasNode.width, canvasNode.height)
      restore()
    }
    containsDrawing = false
  }
}

function saveImage() {
  var dataURL = canvasNode.toDataURL()
  var key = 'savedMultiDrawImages'
  var savedMultiDrawImages = JSON.parse(localStorage.getItem(key)) || []
  var id = uniqueId()
  var success = false
  while(!success) {
    try {
      localStorage.setItem(id, dataURL)
      success = true
    } catch(e) {
      var first = savedMultiDrawImages.shift()
      localStorage.removeItem(first)
      $('#history img:last').remove()
    }
  }
  savedMultiDrawImages.push(id)
  localStorage.setItem(key, JSON.stringify(savedMultiDrawImages))
  $('#history').prepend(thumb(dataURL))
}

function thumb(dataURL) { return '<a href="' + dataURL + '" ><img src="' + dataURL + '"/></a>'}

function restoreThumbnails() {
  var key = 'savedMultiDrawImages'
  var savedMultiDrawImages = JSON.parse(localStorage.getItem(key)) || []
  $('#history').html(savedMultiDrawImages.map(function (id) { return thumb(localStorage.getItem(id)) }).reverse().join(''))
  //.on('click', 'a', function() {document.location = $(this).attr('href')})
}

function uniqueId() { return 'img-' + String(parseInt((new Date).getTime() / 1000, 10) - 1370980000) }

function palette(colors) {
  var $palette = $('<div id="palette">')
  return $palette.append(button('#ffffff').text('?').addClass('selected'))
    .append.apply($palette, $.map(colors, button))

  function button(color) { return $('<button class="color" data-color="' + color + '" style="background:' + color + '"></button>') }
}

function hex2rgb(hex, opacity) {
  var hexes = hex.replace('#', '').match(/(.{2})/g)
  var rgb = $.map(hexes,function (x) {return parseInt(x, 16)}).join(', ')
  return typeof opacity == 'undefined' || opacity === 1 ? 'rgb(' + rgb + ')' : 'rgba(' + rgb + ', ' + opacity + ')'
}

function initGallery(e) {
  var gallery = $('#gallery')
  e.preventDefault()
  var key = 'savedMultiDrawImages'
  var savedMultiDrawImages = JSON.parse(localStorage.getItem(key)) || []
  gallery.slideDown().html('<a href="#" class="close">Close</a>' + $.map(savedMultiDrawImages,function (id) {
    var dataURL = localStorage.getItem(id)
    return '<div class="image"><a class="imageLink" href="' + dataURL + '"><img src="' + dataURL + '"/></a>' +
      idLink('remove', 'X') +
      idLink('save', 'save') +
      '</div>'
    function idLink(className, label) { return '<a class="' + className + '" href="#' + id + '">' + label + '</a>' }
  }).join(''))
  $('.close').click(function (e) {
    e.preventDefault()
    gallery.slideUp()
  })
  $('.save').click(function (e) {
    e.preventDefault()
    var id = hash(this)
    var _this = this
    var dataUrl = localStorage.getItem(id)
    dataUrl = dataUrl.substring(dataUrl.indexOf(',') + 1)
    var password = localStorage.getItem('img-pwd')
    post(password || promptPwd())
    function post(password) {
      return $.post("http://eea.kapsi.fi/draw/dataUrl.php", {
        img     : dataUrl,
        password: password,
        id      : id
      })
        .done(function () {
          remove.call(_this)
        })
        .fail(function (data, textStatus, jqXHR) {alert('Failure when saving: ' + jqXHR)})
    }

    function promptPwd() {
      var password = prompt('Enter the password for image server')
      localStorage.setItem('img-pwd', password)
      return password
    }
  })

  $('.remove').click(function (e) {
    e.preventDefault()
    remove.call(this)
  })

  function remove() {
    var id = hash(this)
    localStorage.removeItem(id)
    savedMultiDrawImages.splice(savedMultiDrawImages.indexOf(id), 1)
    localStorage.setItem(key, JSON.stringify(savedMultiDrawImages))
    $(this).parents('.image').remove()
  }

  function hash(elem) {return $(elem).attr('href').substring(1) }
}