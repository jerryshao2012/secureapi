$(document).ready(function () {
    var hc = new HomeController();
    var av = new AccountValidator();

    var $accountForm = $('#account-form');
    $accountForm.ajaxForm({
        type: 'PUT',
        beforeSubmit: function (formData, jqForm, options) {
            if (av.validateForm() === false){
                return false;
            } 	else{
                // Push the disabled username field onto the form data array
                formData.push({name:'userBame', value:$('#user-tf').val()});
                return true;
            }
        },
        success: function (responseText, status, xhr, $form) {
            if (status === 'success' && xhr.hasOwnProperty('responseJSON')
                && xhr.responseJSON && xhr.responseJSON.success === true) {
                hc.onUpdateSuccess();
                $('#pass-tf').val('');
            } else if (xhr.hasOwnProperty('responseJSON')
                && xhr.responseJSON && xhr.responseJSON.error === "error-updating-account") {
                av.showError('Update Failure', 'Failed to update user profile');
            }
        },
        error: function (xhr) {
            if (xhr.responseText) {
                if (xhr.responseText.indexOf('email-taken') >= 0) {
                    av.showInvalidEmail();
                } else if (xhr.responseText.indexOf('username-taken') >= 0) {
                    av.showInvalidUserName();
                } else if (xhr.responseText.indexOf('error-updating-account') >= 0) {
                    av.showError('Update Failure', 'Failed to update user profile');
                }
            }
        }
    });
    $('#email').focus();

    // Customize the account settings form
    $accountForm.find('h2').text('Account Settings');
    $accountForm.find('#sub1').text('Here are the current settings for your account.');
    $('#user-tf').attr('disabled', 'disabled');
    var $accountFormBtn1 = $('#account-form-btn1');
    $accountFormBtn1.html('Delete');
    $accountFormBtn1.addClass('btn-danger');
    $('#account-form-btn2').html('Update');

    // Setup the confirm window that displays when the user chooses to delete their account
    var $modalConfirm = $('.modal-confirm');
    $modalConfirm.modal({show: false, keyboard: true, backdrop: true});
    $modalConfirm.find('.modal-header h4').text('Delete Account');
    $modalConfirm.find('.modal-body p').html('Are you sure you want to delete your account?');
    $modalConfirm.find('.cancel').html('Cancel');
    $modalConfirm.find('.submit').html('Delete').addClass('btn-danger');
});
