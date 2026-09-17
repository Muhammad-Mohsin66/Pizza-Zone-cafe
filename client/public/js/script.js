(function($) {
"use strict";

$(document).ready(function () {
  $('.first-button').on('click', function () {
    $('.animated-icon1').toggleClass('open');
  });
});


$(document).ready(function() {
$(window).scroll(function() {
if ($(this).scrollTop() > 400) {
$('#toTopBtn').fadeIn();
} else {
$('#toTopBtn').fadeOut();
}
});
$('#toTopBtn').click(function() {
$("html, body").animate({
scrollTop: 0
}, 1000);
return false;
});
});


$(document).ready(function(){
  $('.nav-button').click(function(){
	$('body').toggleClass('nav-open');
  });
});


$(document).ready(function(){
$('.menu-item-has-children').on('click', function () {
    var $this = $(this);
    $this.toggleClass("dropdown");
});
});


$(document).ready(function () {
  var menu = document.getElementById('menu-menu-1');
  if (!menu) return;

  var desired = [
    { text: 'HOME', href: 'index.html' },
    { text: 'MENU', href: 'shop.html' },
    { text: 'CHECKOUT', href: 'shop.html?checkout=1' },
    { text: 'ORDERS', href: 'orders.html' }
  ];

  var navItems = Array.from(menu.querySelectorAll(':scope > li')).filter(function (li) {
    var a = li.querySelector('a');
    if (!a) return false;
    var txt = (a.textContent || '').trim().toUpperCase();
    return txt !== 'LOGIN';
  });

  for (var i = 0; i < desired.length && i < navItems.length; i++) {
    var anchor = navItems[i].querySelector('a');
    if (!anchor) continue;
    anchor.textContent = desired[i].text;
    anchor.setAttribute('href', desired[i].href);
  }

  if (navItems.length > desired.length) {
    navItems.slice(desired.length).forEach(function (li) {
      li.remove();
    });
  }
});


    jQuery( function( $ ) {
        if ( ! String.prototype.getDecimals ) {
            String.prototype.getDecimals = function() {
                var num = this,
                    match = ('' + num).match(/(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/);
                if ( ! match ) {
                    return 0;
                }
                return Math.max( 0, ( match[1] ? match[1].length : 0 ) - ( match[2] ? +match[2] : 0 ) );
            }
        }
        $( document.body ).on( 'click', '.plus, .minus', function() {
            var $qty        = $( this ).closest( '.quantity' ).find( '.qty'),
                currentVal  = parseFloat( $qty.val() ),
                max         = parseFloat( $qty.attr( 'max' ) ),
                min         = parseFloat( $qty.attr( 'min' ) ),
                step        = $qty.attr( 'step' );
            if ( ! currentVal || currentVal === '' || currentVal === 'NaN' ) currentVal = 0;
            if ( max === '' || max === 'NaN' ) max = '';
            if ( min === '' || min === 'NaN' ) min = 0;
            if ( step === 'any' || step === '' || step === undefined || parseFloat( step ) === 'NaN' ) step = 1;
            if ( $( this ).is( '.plus' ) ) {
                if ( max && ( currentVal >= max ) ) {
                    $qty.val( max );
                } else {
                    $qty.val( ( currentVal + parseFloat( step )).toFixed( step.getDecimals() ) );
                }
            } else {
                if ( min && ( currentVal <= min ) ) {
                    $qty.val( min );
                } else if ( currentVal > 0 ) {
                    $qty.val( ( currentVal - parseFloat( step )).toFixed( step.getDecimals() ) );
                }
            }
            $qty.trigger( 'change' );
        });
    });

   
  var menu = $('.navbar');
    $(window).scroll(function() {
  });
  $('.navbar a[href^="#"]').on('click', function(e) {
  e.preventDefault();
  var target = this.hash,
  $target = $(target);
  $('html, body').stop().animate({
    'scrollTop': $target.offset().top
  }, 500, 'swing', function() {
    window.location.hash = target;
  });
  }); 

window.addEventListener('beforeunload', function (e) {
    $('.navbar-collapse').removeClass('show');
});


    
})(jQuery);
