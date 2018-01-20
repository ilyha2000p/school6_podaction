$(function(){
	$(window).scroll(function() {
 		if($(this).scrollTop() != 0) 
 		{
 			$('#to_top_button').fadeIn();
 		} else {
 					$('#to_top_button').fadeOut();
 			   }
 });
 
$('#to_top_button').click(function(){
 	$('body,html').animate({scrollTop:0},800);
 });
});
 