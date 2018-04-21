$(document).ready(function () {
    var av = new AccountValidator();
    var sc = new SignupController();

    var $accountForm = $('#account-form');
    $accountForm.ajaxForm({
        url: '/api/v2/signup',
        type: 'POST',
        beforeSubmit: function (formData, jqForm, options) {
            return av.validateForm();
        },
        success: function (responseText, status, xhr, $form) {
            if (status === 'success' && xhr.hasOwnProperty('responseJSON')
                && xhr.responseJSON && xhr.responseJSON.success === true)
                $('.modal-alert').modal('show');
            else
                av.showError('Sign up Failure', 'Failed to sign up');
        },
        error: function (xhr) {
            if (xhr.responseText) {
                if (xhr.responseText.indexOf('email-taken') >= 0) {
                    av.showInvalidEmail();
                } else if (xhr.responseText.indexOf('username-taken') >= 0) {
                    av.showInvalidUserName();
                } else if (xhr.responseText.indexOf('error-creating-account') >= 0) {
                    av.showError('Sign up Failure', 'Failed to sign up');
                }
            }
        }
    });
    $('#user-tf').focus();

    // Customize the account sign up form
    $accountForm.find('h2').text('Signup');
    $accountForm.find('#sub1').text('Please tell us a little about yourself');
    $('#account-form-btn1').html('Cancel');
    $('#account-form-btn2').html('Submit').addClass('btn-primary');

    // setup the alert that displays when an account is successfully created
    var $modalAlert = $('.modal-alert');
    $modalAlert.modal({show: false, keyboard: false, backdrop: 'static'});
    $modalAlert.find('.modal-header h4').text('Account Created!');
    $modalAlert.find('.modal-alert .modal-body p').html('Your account has been created.</br>Click OK to return to the login page.');
});