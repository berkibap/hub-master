$(() => {
    $('form').submit(e => {
        e.preventDefault();
        var username = $('input[type=text]').val(),
            password = $('input[type=password]').val();
        $.ajax({
            url: $('form').attr('action'),
            method: $('form').attr('method'),
            data: {
                username: username,
                password: password
            }
        }).done(data => {
            if (data.message == 'ok') {
                location.reload();
            } else if (data.message == 'discordVerification') {
                $('form').html('<i class="fas fa-spin fa-notch"></i> <h1>Verify login on Discord.')
                $.ajax({
                    url: '/api/discord',
                    method: 'POST',
                    data: {
                        username: username
                    }
                }).done(data1 => {
                    if (data1.verified == true) {
                        location.reload();
                    } else {
                        $('form').html('<div class="alert alert-danger"><b>Oh snap!</b> You didn\'t verify yourself over Discord in time. Please contact your department manager. ');
                        return;
                    }
                })
            } else if (data.message == 'invalidPassword') {
                $('form').append('<div class="alert alert-danger"> <b>Oh snap!</b> Your password doesn\'t match our records! If you forgot your password, contact your department manager. </div>');
            } else if (data.message == 'userNotFound') {
                $('form').append('<div class="alert alert-danger"><b>Oh snap!</b> We couldn\'t find your username in our records. If you forgot your username, please contact your department manager');
            } else {
                $('form').append('<div class="alert alert-danger"><b>Oh snap!</b> An error ocurred on our end, please contact to developers.</div>');
            }
        })
    })
})