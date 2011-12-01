document.addEventListener('readystatechange', function(readyEvent) {
    if (document.readyState == 'complete') {
        var updateLink = function(selector) {
            var parent = selector.children[0].value;
            var link = selector.children[1];
            var branch = selector.children[2].value;
            link.href = '/review/' + repository + '/' + parent + '/to/' + branch;
        };

        var selectors = document.getElementsByClassName('branchselector');
        for (var i = 0; i < selectors.length; i++) {
            var dropdown = selectors[i].children[0];
            dropdown.addEventListener('change', function(changeEvent) {
                updateLink(changeEvent.target.parentNode);;
            });
            updateLink(selectors[i]);;
        }
    }
});