var gallery = (function () {

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

  function initGallery(e) {
    var gallery = $('#gallery')
    e.preventDefault()
    var key = 'savedMultiDrawImages'
    var savedMultiDrawImages = JSON.parse(localStorage.getItem(key)) || []
    gallery.show().html('<a href="#" class="close">Close</a>' + savedMultiDrawImages.map(function (id) {
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
          img: dataUrl,
          password: password,
          id: id
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
})()
