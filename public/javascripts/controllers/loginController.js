function LoginController() {
    // Bind event listeners to button clicks
    $('#retrieve-password-submit').click(function () {
        $('#get-credentials-form').submit();
    });
    var $login = $('#login');
    $login.find('#forgot-password').click(function () {
        $('#cancel').html('Cancel');
        $('#retrieve-password-submit').show();
        $('#get-credentials').modal('show');
    });
    $login.find('.button-rememember-me').click(function (e) {
        var span = $(this).find('span');
        if (span.hasClass('glyphicon-unchecked')) {
            span.addClass('glyphicon-ok');
            span.removeClass('glyphicon-unchecked');
        } else {
            span.removeClass('glyphicon-ok');
            span.addClass('glyphicon-unchecked');
        }
    });

    // Automatically toggle focus between the email modal window and the login form
    var $getCredentials = $('#get-credentials');
    $getCredentials.on('shown.bs.modal', function () {
        $('#email-tf').focus();
    });
    $getCredentials.on('hidden.bs.modal', function () {
        $('#user-tf').focus();
    });
}