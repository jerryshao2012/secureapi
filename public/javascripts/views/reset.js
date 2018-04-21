$(document).ready(function () {
    var rv = new ResetValidator();
    $('#set-password-form').ajaxForm({
        beforeSubmit: function (formData, jqForm, options) {
            rv.hideAlert();
            return rv.validatePassword($('#pass-tf').val());
        },
        success: function (responseText, status, xhr, $form) {
            rv.showSuccess("Your password has been reset.");
            setTimeout(function () {
                window.location.href = '/';
            }, 3000);
        },
        error: function () {
            rv.showAlert("I'm sorry something went wrong, please try again.");
        }
    });

    var $setPassword = $('#set-password');
    $setPassword.modal('show');
    $setPassword.on('shown', function () {
        $('#pass-tf').focus();
    })
});