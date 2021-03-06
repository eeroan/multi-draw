window.gallery = (function () {
  return {
    init: initGallery,
    restoreThumbnails: restoreThumbnails,
    saveImage: saveImage
  }

    function handleError(error) {
        alert(error)
    }

    function restoreThumbnails() {
    var key = 'savedMultiDrawImages'
    var savedMultiDrawImages = JSON.parse(localStorage.getItem(key)) || []
    $('#history').html(savedMultiDrawImages.map(function (id) { return thumb(localStorage.getItem(id)) }).reverse().join(''))
    //.on('click', 'a', function() {document.location = $(this).attr('href')})
  }

  function thumb(dataURL) { return `<a href="javascript:window.open('${dataURL}')" ><img src="${dataURL}"/></a>`}

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
    $gallery.show().html('<aside><button class="close">Close</button> <button id="save">Save selected</button> <button id="remove">Remove selected</button></aside>' +
      '<div class="local">' + savedMultiDrawImages.map(function (id) {
      var dataURL = localStorage.getItem(id)
      return '<div class="image" id="' + id + '"><img src="' + dataURL + '"/>' + '</div>'
    }).join('') + '</div><h2>Saved ones</h2><div class="server"></div> ')
    $.getJSON('uploadDir.php', function (data) {
      $('.server', $gallery).append(data.map(function(img) {return '<div class="image"><img src="' + img + '"/></div> '}).join(''))
    })
    $('.close').on(startEvent, function (e) {
      e.preventDefault()
      $gallery.slideUp()
    })
    $('.image').on(startEvent, function () { $(this).toggleClass('selected') })
    $('#save').on(startEvent, function (e) {
      e.preventDefault()
      //var password = localStorage.getItem('img-pwd') || promptPwd()
      selectedIds().forEach(function(id) { post(id) })
    })

    $('#remove').on(startEvent, function (e) {
      e.preventDefault()
      selectedIds().forEach(remove)
    })

    return false

    function getToken() {
      return document.location.hash.replace(/^#/,'')
        .split('&')
        .map(x=>x.split('='))
        .find(x=>x[0]=='access_token')[1]
    }

    function hasToken() {
      return document.location.hash.indexOf('access_token') !== -1
    }

    function post(id) {
      if (hasToken()) {
        const client = new Dropbox({accessToken: getToken()})
        const dataUrl = localStorage.getItem(id)
        saveToDropbox(client, dataUrl, id)
      } else {
        const client = new Dropbox({clientId: "no52ogxc7kgv3jw"})
        document.location.assign(client.getAuthenticationUrl(document.location.href))
      }
    }

    function selectedIds() { return $('.image.selected', $gallery).map(function () {return this.id}).toArray()}

    function remove(id) {
      localStorage.removeItem(id)
      savedMultiDrawImages.splice(savedMultiDrawImages.indexOf(id), 1)
      localStorage.setItem(key, JSON.stringify(savedMultiDrawImages))
      $('#' + id).remove()
    }

    function saveToDropbox(client, dataUrl, id) {
      client.filesUpload({
        path: '/'+ id + ".png",
        contents: dataURItoBlob(dataUrl, 'image/png')
      })
        .then(function () {remove(id)})
        .catch(function (err) {
          console.log(err)
        })
    }

    function dataURItoBlob(dataURI, dataTYPE) {
      var binary = atob(dataURI.split(',')[1]), array = []
      for (var i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i))
      return new Blob([new Uint8Array(array)], {type: dataTYPE})
    }
  }
})()
