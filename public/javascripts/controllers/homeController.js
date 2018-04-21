function HomeController() {
    // bind event listeners to button clicks
    var that = this;

    // handle user logout
    $('#btn-logout').click(function () {
        that.attemptLogout();
    });

    // confirm account deletion
    $('#account-form-btn1').click(function () {
        $('.modal-confirm').modal('show')
    });

    // handle account deletion
    $('.modal-confirm .submit').click(function () {
        that.deleteAccount();
    });

    this.deleteAccount = function () {
        $('.modal-confirm').modal('hide');
        var that = this;
        $.ajax({
            url: '/api/v2/user',
            type: 'DELETE',
            data: {id: $('#userId').val()},
            success: function (data) {
                that.showLockedAlert('Your account has been deleted.<br>Redirecting you back to the homepage.');
            },
            error: function (jqXHR) {
                console.log(jqXHR.responseText + ' :: ' + jqXHR.statusText);
            }
        });
    };

    this.attemptLogout = function () {
        var that = this;
        $.ajax({
            url: "/api/v2/logout",
            type: "POST",
            data: {logout: true},
            success: function (data) {
                that.showLockedAlert('You are now logged out.<br>Redirecting you back to the homepage.');
            },
            error: function (jqXHR) {
                console.log(jqXHR.responseText + ' :: ' + jqXHR.statusText);
            }
        });
    };

    this.showLockedAlert = function (msg) {
        var $modalAlert = $('.modal-alert');
        $modalAlert.modal({show: false, keyboard: false, backdrop: 'static'});
        $modalAlert.find('.modal-header h4').text('Success!');
        $modalAlert.find('.modal-body p').html(msg);
        $modalAlert.modal('show');
        $modalAlert.find('button').click(function () {
            window.location.href = '/';
        });
        setTimeout(function () {
            window.location.href = '/';
        }, 3000);
    };

    // bind a simple alert window to this controller to display any errors
    this.showError = function (t, m) {
        var $modalAlert = $('.modal-alert');
        $modalAlert.modal({show: false, keyboard: false, backdrop: 'static'});
        $modalAlert.find('.modal-header h4').text(t);
        $modalAlert.find('.modal-body p').html(m);
        $modalAlert.modal('show');
    };
}

HomeController.prototype.onUpdateSuccess = function () {
    var $modalAlert = $('.modal-alert');
    $modalAlert.modal({show: false, keyboard: true, backdrop: true});
    $modalAlert.find('.modal-header h4').text('Success!');
    $modalAlert.find('.modal-body p').html('Your account has been updated.');
    $modalAlert.modal('show');
    $modalAlert.find('button').off('click');
};
