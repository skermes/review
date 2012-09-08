 $(document).ready(function() {                
    //Reset starting color
    //TODO: use cookies to remember last theme
    $("#ToggleThemeBtn").attr('rel','/css/reviewthemes/light.css');

    $("#ToggleThemeBtn").click(function() {
    var oldRel = $("link").attr('href');
    $("link").attr("href",$(this).attr('rel'));
    $(this).attr('rel',oldRel);
        return false;
    });
});