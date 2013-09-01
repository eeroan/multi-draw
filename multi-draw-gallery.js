window.gallery = (function () {
  return {
    init: initGallery,
    restoreThumbnails: restoreThumbnails,
    saveImage: saveImage
  }

  function restoreThumbnails() {
    var key = 'savedMultiDrawImages'
    var savedMultiDrawImages = JSON.parse(localStorage.getItem(key)) || []
    $('#history').html(savedMultiDrawImages.map(function (id) { return thumb(localStorage.getItem(id)) }).reverse().join(''))
    //.on('click', 'a', function() {document.location = $(this).attr('href')})
  }

  function thumb(dataURL) { return '<a href="' + dataURL + '" ><img src="' + dataURL + '"/></a>'}

  function uniqueId() { return 'img-' + String(parseInt((new Date).getTime() / 1000, 10) - 1370980000) }

  function saveImage() {
    var dataURL = canvasNode.toDataURL()
    var key = 'savedMultiDrawImages'
    var savedMultiDrawImages = JSON.parse(localStorage.getItem(key)) || []
    var id = uniqueId()
    var success = false
    var $history = $('#history')
    while(!success) {
      try {
        localStorage.setItem(id, dataURL)
        success = true
      } catch(e) {
        var first = savedMultiDrawImages.shift()
        localStorage.removeItem(first)
        $history.find('img:last').remove()
      }
    }
    savedMultiDrawImages.push(id)
    localStorage.setItem(key, JSON.stringify(savedMultiDrawImages))
    $history.prepend(thumb(dataURL))
  }

  function initGallery(e) {
    var $gallery = $('#gallery')
    e.preventDefault()
    var key = 'savedMultiDrawImages'
    var savedMultiDrawImages = JSON.parse(localStorage.getItem(key)) || []
    $gallery.show().html('<aside><a href="#" class="close">Close</a><button id="save">Save selected</button><button id="remove">Remove selected</button></aside>' +
      '<div class="local">' + savedMultiDrawImages.map(function (id) {
      var dataURL = localStorage.getItem(id)
      return '<div class="image" id="' + id + '"><img src="' + dataURL + '"/>' + '</div>'
    }).join('') + '</div><h2>Saved ones</h2><div class="server"></div> ')
    $.getJSON('uploadDir.php', function (data) {
      $('.server', $gallery).append(data.map(function(img) {return '<div class="image"><img src="' + img + '"/></div> '}).join(''))
    })
    $('.close').click(function (e) {
      e.preventDefault()
      $gallery.slideUp()
    })
    $('.image').click(function () { $(this).toggleClass('selected') })
    $('#save').on('click touchstart', function (e) {
      e.preventDefault()
      var password = localStorage.getItem('img-pwd') || promptPwd()
      selectedIds().forEach(function(id) { post(id, password) })
    })

    $('#remove').on('click touchstart', function (e) {
      e.preventDefault()
      selectedIds().forEach(remove)
    })

    return false

    function post(id, password) {
      var dataUrl = localStorage.getItem(id)
      dataUrl = dataUrl.substring(dataUrl.indexOf(',') + 1)
      return $.post("http://eea.kapsi.fi/draw/dataUrl.php", {
        img: dataUrl,
        password: password,
        id: id
      })
        .done(function () {
          remove(id)
        })
        .fail(function (data, textStatus, jqXHR) {alert('Failure when saving: ' + jqXHR)})
    }

    function selectedIds() { return $('.image.selected', $gallery).map(function () {return this.id}).toArray()}

    function remove(id) {
      localStorage.removeItem(id)
      savedMultiDrawImages.splice(savedMultiDrawImages.indexOf(id), 1)
      localStorage.setItem(key, JSON.stringify(savedMultiDrawImages))
      $('#' + id).remove()
    }

    function promptPwd() {
      var password = prompt('Enter the password for image server')
      localStorage.setItem('img-pwd', password)
      return password
    }
  }
})()
